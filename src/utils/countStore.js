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
    invalidRows: [], // Thêm trường này
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
              (ItemCode && NewCode && ItemCode !== NewCode) || // Cặp ItemCode - NewCode hợp lệ
              (ItemCode && OldCode && ItemCode !== OldCode); // Cặp ItemCode - OldCode hợp lệ4

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
                  // sau flexable

                  expectedCount += 1;
                  if (NewCode) {
                    expectedSKUs.push(NewCode);
                  } else {
                    expectedSKUs.push(ItemCode);
                  }
                } else if (
                  normalizedItemDate < flexStartDate.setHours(0, 0, 0, 0)
                ) {
                  //trước flexable

                  expectedCount += 1;
                  if (OldCode) {
                    expectedSKUs.push(OldCode);
                  } else {
                    expectedSKUs.push(ItemCode);
                  }
                }

                // sai chỗ này
                else {
                  expectedCount += 1;

                  expectedSKUs.push(ItemCode);
                }
              }

              // sai chỗ này
              else {
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
      console.log(`Skipping row ${index + 2}: Product_id is undefined`);
      return null;
    }
    if (!row.Date || row.Date.trim() === "") {
      console.log(
        `Skipping row ${index + 2}: Dữ liệu cột Date rỗng hoặc không xác định`
      );
      results.invalidRows.push({
        index: index + 2,
        reason: "Dữ liệu cột Date rỗng hoặc không xác định",
        data: row,
      });
      return null;
    }

    const rowDate = parseDate(row.Date);
    if (!rowDate) {
      console.log(`Skipping row ${index + 2}: Invalid date format`);
      results.invalidRows.push({
        index: index + 2,
        reason: "Invalid date format",
        data: row,
      });
      return null;
    }

    const storeId = row["Store ID - Unilever"];

    if (!results.skuCounts[rowDate]) {
      results.skuCounts[rowDate] = {};
    }
    if (!results.skuCounts[rowDate][storeId]) {
      results.skuCounts[rowDate][storeId] = {
        actual: 0,
        actualSKUs: [],
        expected: 0,
        expectedSKUs: [],
      };
    }

    results.skuCounts[rowDate][storeId].actual++;
    results.skuCounts[rowDate][storeId].actualSKUs.push(productId);

    return { isValid: true, isOutOfRange: false, error: null };
  };

  const processRawDataBatch = async (batch, startIndex) => {
    const chunkResults = [];
    for (let i = 0; i < batch.length; i++) {
      chunkResults.push(processItem(batch[i], startIndex + i));
    }

    return chunkResults;
  };

  const rawDataGenerator = await batchGenerator(rawData, batchSize);
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

  // Calculate missing and extra SKUs
  Object.entries(results.skuCounts).forEach(([date, stores]) => {
    Object.entries(stores).forEach(([storeId, data]) => {
      // Ensure all SKUs are parsed as strings for consistent comparison
      const actualSKUs = data.actualSKUs.map(String);
      const expectedSKUs = data.expectedSKUs.map(String);

      const actualSet = new Set(actualSKUs);
      const expectedSet = new Set(expectedSKUs);

      data.missingSKUs = expectedSKUs.filter((sku) => !actualSet.has(sku));
      data.extraSKUs = actualSKUs.filter((sku) => !expectedSet.has(sku));

      // Parse the sets to strings
    });
  });

  return results;
};
