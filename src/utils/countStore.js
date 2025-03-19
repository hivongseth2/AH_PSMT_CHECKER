import { isWithinInterval } from "date-fns";
import { parseDate } from "./dateUtils";
import { ERROR_MESSAGES } from "../config/message";

function* batchGenerator(array, batchSize) {
  for (let i = 0; i < array.length; i += batchSize) {
    yield array.slice(i, i + batchSize);
  }
}

export const countStore = async (
  checklist,
  rawData,
  addProgressUpdate,
  setBatchProgress
) => {
  const results = {
    validCount: 0,
    invalidCount: 0,
    outOfRangeCount: 0,
    errors: [],
    skuCounts: {},
    invalidRows: [],
  };

  const batchSize = 1000;
  const totalItems = rawData.length;

  // Tạo map cho checklist để tra cứu nhanh hơn
  const checklistMap = new Map();
  checklist.forEach((item, index) => {
    if (index > 10) {
      checklistMap.set(item["Item Code"], item);
    }
  });

  const calculateExpectedSKUs = (date, storeId, checklistBatch) => {
    let expectedCount = 0;
    let expectedSKUs = [];
    const itemDate = new Date(date);

    for (const item of checklistBatch) {
      const startDate = new Date(item["START DATE"]);
      const endDate = new Date(item["END DATE"]);
      const flexStartDate = new Date(item["Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới"]);
      const flexEndDate = new Date(item["Ngày Kết Thúc Linh Động Đo Hàng Cũ & Mới"]);
      const storeCount = Number(item.stores[storeId]);

      if (storeCount > 0 && startDate && endDate) {
        const normalizedStartDate = startDate.setHours(0, 0, 0, 0);
        const normalizedEndDate = endDate.setHours(0, 0, 0, 0);
        const normalizedItemDate = itemDate.setHours(0, 0, 0, 0);

        const ItemCode = item["Item Code"];
        const OldCode = item["Old code"];
        const NewCode = item["New code"];
        const isValidPair =
          (ItemCode && NewCode && ItemCode !== NewCode) ||
          (ItemCode && OldCode && ItemCode !== OldCode);

        if (
          normalizedItemDate >= normalizedStartDate &&
          normalizedItemDate <= normalizedEndDate
        ) {
          if (flexStartDate && flexEndDate && isValidPair) {
            const normalizedFlexStart = flexStartDate.setHours(0, 0, 0, 0);
            const normalizedFlexEnd = flexEndDate.setHours(0, 0, 0, 0);
            if (isWithinInterval(normalizedItemDate, {
              start: normalizedFlexStart,
              end: normalizedFlexEnd,
            })) {
              expectedCount += 2;
              expectedSKUs.push(ItemCode, NewCode || OldCode);
            } else if (normalizedItemDate > normalizedFlexEnd) {
              expectedCount += 1;
              expectedSKUs.push(NewCode || ItemCode);
            } else if (normalizedItemDate < normalizedFlexStart) {
              expectedCount += 1;
              expectedSKUs.push(OldCode || ItemCode);
            } else {
              expectedCount += 1;
              expectedSKUs.push(ItemCode);
            }
          } else {
            expectedCount += 1;
            expectedSKUs.push(ItemCode);
          }
        }
      }
    }
    return { expectedCount, expectedSKUs };
  };

  const processItem = (row, index) => {
    const productId = row["Product ID"];
    if (productId === undefined) {
      results.invalidRows.push({
        index: index + 2,
        reason: "Product ID không xác định",
        data: row,
      });
      return null;
    }
    if (!row.Date || row.Date.trim() === "") {
      results.invalidRows.push({
        index: index + 2,
        reason: "Dữ liệu cột Date rỗng hoặc không xác định",
        data: row,
      });
      return null;
    }

    const rowDate = parseDate(row.Date);
    if (!rowDate) {
      results.invalidRows.push({
        index: index + 2,
        reason: "Định dạng ngày không hợp lệ",
        data: row,
      });
      return null;
    }

    const storeId = row["Store ID - Unilever"];
    if (!storeId) {
      results.invalidRows.push({
        index: index + 2,
        reason: "Store ID không xác định",
        data: row,
      });
      return null;
    }

    const dateKey = rowDate.toISOString().split("T")[0];
    if (!results.skuCounts[dateKey]) {
      results.skuCounts[dateKey] = {};
    }
    if (!results.skuCounts[dateKey][storeId]) {
      results.skuCounts[dateKey][storeId] = {
        actual: 0,
        actualSKUs: [],
        expected: 0,
        expectedSKUs: [],
        rowIndices: [],
      };
    }

    results.skuCounts[dateKey][storeId].actual++;
    results.skuCounts[dateKey][storeId].actualSKUs.push(productId);
    results.skuCounts[dateKey][storeId].rowIndices.push(index + 2);

    return { isValid: true, isOutOfRange: false, error: null };
  };

  const rawDataGenerator = batchGenerator(rawData, batchSize);
  let processedItems = 0;

  for (const batch of rawDataGenerator) {
    for (const [index, row] of batch.entries()) {
      const result = processItem(row, processedItems + index);
      if (result === null) continue;
      if (result.isValid) results.validCount++;
      else if (result.isOutOfRange) results.outOfRangeCount++;
      else results.invalidCount++;
      if (result.error) results.errors.push(result.error);
    }

    processedItems += batch.length;
    const progress = Math.round((processedItems / totalItems) * 100);
    setBatchProgress(progress);
    addProgressUpdate({
      productId: `Batch ${Math.floor(processedItems / batchSize)}`,
      status: `Processed (${progress}% complete)`,
      progress: progress,
    });
    await new Promise((resolve) => setTimeout(resolve, 0)); // Giảm tải main thread
  }

  const checklistGenerator = batchGenerator(checklist, batchSize);
  for (const checklistBatch of checklistGenerator) {
    for (const [date, stores] of Object.entries(results.skuCounts)) {
      for (const storeId of Object.keys(stores)) {
        const { expectedCount, expectedSKUs } = calculateExpectedSKUs(date, storeId, checklistBatch);
        results.skuCounts[date][storeId].expected += expectedCount;
        results.skuCounts[date][storeId].expectedSKUs.push(...expectedSKUs);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Tính toán missing và extra SKUs
  for (const [date, stores] of Object.entries(results.skuCounts)) {
    for (const [storeId, data] of Object.entries(stores)) {
      const actualSKUs = data.actualSKUs.map(String);
      const expectedSKUs = data.expectedSKUs.map(String);

      const actualSet = new Set(actualSKUs);
      const expectedSet = new Set(expectedSKUs);

      data.missingSKUs = expectedSKUs.filter((sku) => !actualSet.has(sku));
      data.extraSKUs = actualSKUs.filter((sku) => !expectedSet.has(sku));

      if (data.missingSKUs.length > 0 || data.extraSKUs.length > 0) {
        data.rowIndices.forEach((rowIndex) => {
          const row = rawData[rowIndex - 2];
          let reason = "";
          if (data.missingSKUs.length > 0) {
            reason += `Thiếu SKU: ${data.missingSKUs.join(", ")}. `;
          }
          if (data.extraSKUs.length > 0) {
            reason += `Thừa SKU: ${data.extraSKUs.join(", ")}. `;
          }
          results.invalidRows.push({
            index: rowIndex,
            reason: reason.trim(),
            data: row,
          });
        });
      }
    }
  }

  return results;
};