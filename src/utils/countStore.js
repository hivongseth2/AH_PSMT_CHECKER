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
  };

  const batchSize = 1000;
  const totalItems = rawData.length;

  const calculateExpectedSKUs = (date, storeId, checklistBatch) => {
    let expectedCount = 0;
    checklistBatch.forEach((item, index) => {
      if (index > 11) {
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
              (ItemCode && OldCode && ItemCode !== OldCode); // Cặp ItemCode - OldCode hợp lệ

            // Đảm bảo có ít nhất một cặp hợp lệ
            const hasValidPair =
              ItemCode && (NewCode || OldCode) && isValidPair;
            if (
              normalizedItemDate >= normalizedStartDate &&
              normalizedItemDate <= normalizedEndDate
            ) {
              if (
                flexStartDate &&
                flexEndDate &&
                isValidPair &&
                isWithinInterval(normalizedItemDate, {
                  start: flexStartDate.setHours(0, 0, 0, 0),
                  end: flexEndDate.setHours(0, 0, 0, 0),
                })
              ) {
                expectedCount += 2;
              } else {
                expectedCount += 1;
              }
            }
          }
        }
      }
    });
    return expectedCount;
  };

  const processItem = (row, index) => {
    addProgressUpdate({
      productId: row["Product_id"],
      date: row.Date,
      store: row["Store ID - Unilever"],
      status: "Đang kiểm tra",
    });

    if (row["Product_id"] === undefined) {
      console.log(`Skipping row ${index + 2}: Product_id is undefined`);
      return null;
    }

    const rowDate = parseDate(row.Date);
    const storeId = row["Store ID - Unilever"];

    if (!results.skuCounts[rowDate]) {
      results.skuCounts[rowDate] = {};
    }
    if (!results.skuCounts[rowDate][storeId]) {
      results.skuCounts[rowDate][storeId] = {
        actual: 0,
      };
    }

    results.skuCounts[rowDate][storeId].actual++;

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
      date: new Date().toLocaleString(),
      store: "N/A",
      status: `Processed (${progress}% complete)`,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const checklistGenerator = batchGenerator(checklist, batchSize);

  for (const checklistBatch of checklistGenerator) {
    await Promise.all(
      Object.entries(results.skuCounts).map(async ([date, stores]) => {
        await Promise.all(
          Object.keys(stores).map(async (storeId) => {
            const expected = await calculateExpectedSKUs(
              date,
              storeId,
              checklistBatch
            );
            if (!results.skuCounts[date][storeId].expected) {
              results.skuCounts[date][storeId].expected = 0;
            }
            results.skuCounts[date][storeId].expected += expected;
          })
        );
      })
    );
  }

  console.log(results);

  return results;
};
