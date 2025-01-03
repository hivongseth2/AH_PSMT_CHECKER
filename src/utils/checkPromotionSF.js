import { isWithinInterval, parseISO, format } from "date-fns";
import { ERROR_MESSAGES } from "../config/message";
import { parseDate } from "./dateUtils";

export const checkPromotion = async (
  checklist,
  rawData,
  addProgressUpdate,
  setBatchProgress
) => {
  const results = {
    validCount: 0,
    invalidCount: 0,
    errors: [],
    invalidRows: [],
    groupedData: {},
    dailySummary: {},
    storeVisits: {}, // Track store visits by date
  };

  const totalItems = rawData.length;

  // First, group store visits by date and store type
  const storeVisitsMap = new Map();
  console.log(rawData);

  rawData.forEach((row) => {
    const {
      Date: rawDate,
      "Store ID - Unilever": storeId,
      TYPESTORE: typeStore,
    } = row;

    if (rawDate && rawDate.trim() !== "") {
      const rowDate = parseDate(rawDate);
      if (!isNaN(rowDate.getTime())) {
        const dateKey = format(rowDate, "yyyy-MM-dd");
        const visitKey = `${dateKey}_${typeStore}`;

        if (!storeVisitsMap.has(visitKey)) {
          storeVisitsMap.set(visitKey, new Map());
        }
        const storeMap = storeVisitsMap.get(visitKey);
        storeMap.set(storeId, (storeMap.get(storeId) || 0) + 1); // Count each store visit
      }
    }
  });


  // Convert store visits map to results structure
  for (const [visitKey, storeMap] of storeVisitsMap) {
    const [dateKey, typeStore] = visitKey.split("_");
    if (!results.storeVisits[dateKey]) {
      results.storeVisits[dateKey] = {};
    }
    results.storeVisits[dateKey][typeStore] = Array.from(storeMap.keys());
  }


  // Group raw data by promotion, customer, and date
  rawData.forEach((row, index) => {
    const {
      Date: rawDate,
      "Store ID - Unilever": storeId,
      Customer: customerName,
     "Promotion ID": promotionId,
      "Product ID": productId,
      "Customer ID": customerId,
      TYPESTORE: typeStore,
    } = row;

    if (!rawDate || rawDate.trim() === "") {
      results.invalidRows.push({
        index: index + 2,
        reason: "Dữ liệu cột Date rỗng hoặc không xác định",
        data: row,
      });
      return;
    }

    const rowDate = parseDate(rawDate);

    if (isNaN(rowDate.getTime())) {
      results.invalidRows.push({
        index: index + 2,
        reason: "Invalid date format",
        data: row,
      });
      return;
    }

    const dateKey = format(rowDate, "yyyy-MM-dd");
    const groupKey = `${promotionId}_${customerName}_${dateKey}`;

    if (!results.groupedData[groupKey]) {
      results.groupedData[groupKey] = [];
    }
    results.groupedData[groupKey].push(row);
  });

  // Process grouped data
  let processedCount = 0;
  for (const [groupKey, rows] of Object.entries(results.groupedData)) {
    const [promotionId, customerName, dateKey] = groupKey.split("_");
    const date = parseISO(dateKey);

    let actualCount = rows.length;

    let expectedCount = 0;

    // Get unique store types visited on this date
    const storeTypesVisited = new Set(rows.map((row) => row.TYPESTORE));

    // Calculate expected count based on store visits
    const expectedStores = new Set();
    const actualStores = new Map(); // Use Map to count stores and detect duplicates

    rows.forEach((row) => {
      const storeId = row["Store ID - Unilever"];
      actualStores.set(storeId, (actualStores.get(storeId) || 0) + 1); // Track store visit counts
    });

    checklist.forEach((item) => {
      const startDate = new Date(item["START DATE"]);
      const endDate = new Date(item["END DATE"]);
      const normalizedStartDate = startDate.setHours(0, 0, 0, 0);
      const normalizedEndDate = endDate.setHours(0, 0, 0, 0);
      const normalizedItemDate = date.setHours(0, 0, 0, 0);
      if (
        item["Promotion ID"] === promotionId &&
        item["Customer"] === customerName &&
        isWithinInterval(normalizedItemDate, {
          start: normalizedStartDate,
          end: normalizedEndDate,
        })
      ) {
        // For each store type that was visited
        storeTypesVisited.forEach((storeType) => {
          if (
            item.stores[storeType] === "Y" &&
            results.storeVisits[dateKey]?.[storeType]
          ) {
            // Add the number of unique stores visited for this store type
            expectedCount += results.storeVisits[dateKey][storeType].length;
            results.storeVisits[dateKey][storeType].forEach((store) =>
              expectedStores.add(store)
            );
          }
        });
      }
    });

    // Check for duplicates

    results.validCount += actualCount;

    // Compare actual and expected counts
    if (
      actualCount !== expectedCount ||
      actualStores.size !== expectedStores.size
    ) {
      const missingStores = [...expectedStores].filter(
        (x) => !actualStores.has(x)
      );
      let excessStores = [...actualStores.keys()].filter(
        (x) => !expectedStores.has(x)
      );

      const duplicateStores = [];
      actualStores.forEach((count, storeId) => {
        if (count > 1) {
          duplicateStores.push(storeId); // Store IDs with more than 1 visit
        }
      });

      if (duplicateStores.length > 0) {
        console.log(duplicateStores);

        excessStores = [...excessStores, ...duplicateStores];
      }

      const error = {
        date: dateKey,
        promotionId,
        customerName,
        message: `Mismatch in promotion count. Expected: ${expectedCount}, Actual: ${actualCount}`,
        difference: actualCount - expectedCount,
        storeVisits: results.storeVisits[dateKey],
        missingStores,
        excessStores,
      };
      results.errors.push(error);
    }
    const duplicateStores = [];
    actualStores.forEach((count, storeId) => {
      if (count > 1) {
        duplicateStores.push(storeId); // Store IDs with more than 1 visit
      }
    });

    // Update daily summary
    if (!results.dailySummary[dateKey]) {
      results.dailySummary[dateKey] = {};
    }
    results.dailySummary[dateKey][promotionId] = {
      customerName,
      actualCount,
      expectedCount,
      difference: actualCount - expectedCount,
      storeVisits: results.storeVisits[dateKey],
      storeTypesVisited: Array.from(storeTypesVisited),
      missingStores: [...expectedStores].filter((x) => !actualStores.has(x)),
      excessStores: [
        ...actualStores.keys().filter((x) => !expectedStores.has(x)),
        ...duplicateStores, // Add duplicate stores to excess stores
      ],
    };

    processedCount += rows.length;
    const progress = Math.round((processedCount / totalItems) * 100);
    setBatchProgress(progress);
    addProgressUpdate({
      productId: `${promotionId} - ${customerName}`,
      status: `Processed (${progress}% complete)`,
      progress: progress,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  console.log(results);

  return results;
};
