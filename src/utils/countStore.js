import { isWithinInterval } from "date-fns";
import { parseDate } from "./dateUtils";
import { ERROR_MESSAGES } from "../config/message";

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
  const calculateExpectedSKUs = (date, storeId) => {
    let expectedCount = 0;
    checklist.forEach((item, index) => {
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

        console.log(
          "flexStartDate:",
          flexStartDate,
          "flexEndDate:",
          flexEndDate
        );
        console.log("startDate:", startDate, "endDate:", endDate);
        console.log("itemDate:", itemDate);

        // Check if the store value is greater than 0
        if (Number(item.stores[storeId]) > 0) {
          if (startDate && endDate) {
            const normalizedStartDate = startDate.setHours(0, 0, 0, 0);
            const normalizedEndDate = endDate.setHours(0, 0, 0, 0);
            const normalizedItemDate = itemDate.setHours(0, 0, 0, 0);

            console.log("normalizedStartDate:", normalizedStartDate);
            console.log("normalizedEndDate:", normalizedEndDate);
            console.log("normalizedItemDate:", normalizedItemDate);

            if (
              normalizedItemDate >= normalizedStartDate &&
              normalizedItemDate <= normalizedEndDate
            ) {
              if (
                flexStartDate &&
                flexEndDate &&
                isWithinInterval(normalizedItemDate, {
                  start: flexStartDate.setHours(0, 0, 0, 0),
                  end: flexEndDate.setHours(0, 0, 0, 0),
                })
              ) {
                console.log("Inside flexible date range, adding 2");
                expectedCount += 2; // Add 2 if itemDate is within the flexible range
              } else {
                console.log("Outside flexible date range, adding 1");
                expectedCount += 1; // Add 1 if itemDate is outside the flexible range
              }
            } else {
              console.log("Outside date range, adding 0");
            }
          }
        }
      }
    });
    console.log("Final expectedCount:", expectedCount);
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

  const processChunk = async (startIndex) => {
    const endIndex = Math.min(startIndex + batchSize, totalItems);
    const chunkResults = [];

    for (let i = startIndex; i < endIndex; i++) {
      chunkResults.push(processItem(rawData[i], i));
    }

    return chunkResults;
  };

  for (let i = 0; i < totalItems; i += batchSize) {
    const chunkResults = await processChunk(i);
    chunkResults.forEach((result) => {
      if (result === null) return;
      if (result.isValid) results.validCount++;
      else if (result.isOutOfRange) results.outOfRangeCount++;
      else results.invalidCount++;
      if (result.error) results.errors.push(result.error);
    });

    const progress = Math.round(((i + batchSize) / totalItems) * 100);
    setBatchProgress(progress);
    addProgressUpdate({
      productId: `Batch ${Math.floor(i / batchSize) + 1}`,
      date: new Date().toLocaleString(),
      store: "N/A",
      status: `Processed (${progress}% complete)`,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  // calculateExpectedSKUs(results.skuCounts.key, storeId);

  await Promise.all(
    Object.entries(results.skuCounts).map(async ([date, stores]) => {
      await Promise.all(
        Object.keys(stores).map(async (storeId) => {
          const expected = await calculateExpectedSKUs(date, storeId);

          results.skuCounts[date][storeId].expected = expected;
        })
      );
    })
  );

  console.log(results);

  return results;
};
