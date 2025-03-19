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

  const calculateExpectedSKUs = (date, storeId, checklistBatch) => {
    let expectedCount = 0;
    let expectedSKUs = [];
    checklistBatch.forEach((item, index) => {
      if (index > 10) {
        const startDate = new Date(item["START DATE"]);
        const endDate = new Date(item["END DATE"]);
        const itemDate = new Date(date);
        const flexStartDate = new Date(
          item["Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới"]
        );
        const flexEndDate = new Date(
          item["Ngày Kết Thúc Linh Động Đo Hàng Cũ & Mới"]
        );

        if (Number(item.stores[storeId]) > 0) {
          if (startDate && endDate) {
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
                if (
                  isWithinInterval(normalizedItemDate, {
                    start: flexStartDate.setHours(0, 0, 0, 0),
                    end: flexEndDate.setHours(0, 0, 0, 0),
                  })
                ) {
                  expectedCount += 2;
                  expectedSKUs.push(ItemCode);
                  expectedSKUs.push(NewCode || OldCode);
                } else if (
                  normalizedItemDate > flexEndDate.setHours(0, 0, 0, 0)
                ) {
                  expectedCount += 1;
                  expectedSKUs.push(NewCode || ItemCode);
                } else if (
                  normalizedItemDate < flexStartDate.setHours(0, 0, 0, 0)
                ) {
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
      }
    });
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

    if (!results.skuCounts[rowDate]) {
      results.skuCounts[rowDate] = {};
    }
    if (!results.skuCounts[rowDate][storeId]) {
      results.skuCounts[rowDate][storeId] = {
        actual: 0,
        actualSKUs: [],
        expected: 0,
        expectedSKUs: [],
        rowIndices: [], // Thêm để lưu index của các dòng
      };
    }

    results.skuCounts[rowDate][storeId].actual++;
    results.skuCounts[rowDate][storeId].actualSKUs.push(productId);
    results.skuCounts[rowDate][storeId].rowIndices.push(index + 2);

    return { isValid: true, isOutOfRange: false, error: null };
  };

  const processRawDataBatch = async (batch, startIndex) => {
    const chunkResults = [];
    for (let i = 0; i < batch.length; i++) {
      chunkResults.push(processItem(batch[i], startIndex + i));
    }
    return chunkResults;
  };

  const rawDataGenerator = batchGenerator(rawData, batchSize);
  let processedItems = 0;

  for (const batch of rawDataGenerator) {
    const chunkResults = await processRawDataBatch(batch, processedItems);
    chunkResults.forEach((result) => {
      if (result === null) return;
      if (result.isValid) results.validCount++;
      else if (result.isOutOfRange) results.outOfRangeCount++;
      else results.invalidCount++;
      if (result.error) results.errors.push(result.error);
    });

    processedItems += batch.length;
    const progress = Math.round((processedItems / totalItems) * 100);
    setBatchProgress(progress);
    addProgressUpdate({
      productId: `Batch ${Math.floor(processedItems / batchSize)}`,
      status: `Processed (${progress}% complete)`,
      progress: progress,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const checklistGenerator = batchGenerator(checklist, batchSize);

  for (const checklistBatch of checklistGenerator) {
    await Promise.all(
      Object.entries(results.skuCounts).map(async ([date, stores]) => {
        await Promise.all(
          Object.keys(stores).map(async (storeId) => {
            const { expectedCount, expectedSKUs } = await calculateExpectedSKUs(
              date,
              storeId,
              checklistBatch
            );
            results.skuCounts[date][storeId].expected += expectedCount;
            results.skuCounts[date][storeId].expectedSKUs = [
              ...results.skuCounts[date][storeId].expectedSKUs,
              ...expectedSKUs,
            ];
          })
        );
      })
    );
  }

  // Calculate missing and extra SKUs and mark invalid rows
  Object.entries(results.skuCounts).forEach(([date, stores]) => {
    Object.entries(stores).forEach(([storeId, data]) => {
      const actualSKUs = data.actualSKUs.map(String);
      const expectedSKUs = data.expectedSKUs.map(String);

      const actualSet = new Set(actualSKUs);
      const expectedSet = new Set(expectedSKUs);

      data.missingSKUs = expectedSKUs.filter((sku) => !actualSet.has(sku));
      data.extraSKUs = actualSKUs.filter((sku) => !expectedSet.has(sku));

      // Ghi nhận lỗi nếu có SKU thiếu hoặc thừa
      if (data.missingSKUs.length > 0 || data.extraSKUs.length > 0) {
        data.rowIndices.forEach((rowIndex) => {
          const row = rawData[rowIndex - 2]; // Điều chỉnh index về 0-based
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
    });
  });

  return results;
};