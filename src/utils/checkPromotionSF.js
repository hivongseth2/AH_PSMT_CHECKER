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
    storeVisits: {},
  };

  const totalItems = rawData.length;

  // Group store visits by date and store type
  const storeVisitsMap = new Map();

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
        storeMap.set(storeId, (storeMap.get(storeId) || 0) + 1);
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

  console.log(results.storeVisits, "result storeVisitsMap");

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

    if (!storeId) {
      results.invalidRows.push({
        index: index + 2,
        reason: "Store ID không xác định",
        data: row,
      });
      return;
    }

    if (!promotionId) {
      results.invalidRows.push({
        index: index + 2,
        reason: "Promotion ID không xác định",
        data: row,
      });
      return;
    }

    const dateKey = format(rowDate, "yyyy-MM-dd");
    const groupKey = `${promotionId}_${customerName}_${dateKey}`;

    if (!results.groupedData[groupKey]) {
      results.groupedData[groupKey] = [];
    }
    results.groupedData[groupKey].push({ ...row, index: index + 2 });
  });

  console.log(results.groupedData, "groupedData");

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
      actualStores.set(storeId, (actualStores.get(storeId) || 0) + 1);
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
        storeTypesVisited.forEach((storeType) => {
          if (
            item.stores[storeType] === "Y" &&
            results.storeVisits[dateKey]?.[storeType]
          ) {
            expectedCount += results.storeVisits[dateKey][storeType].length;
            results.storeVisits[dateKey][storeType].forEach((store) =>
              expectedStores.add(store)
            );
          }
        });
      }
    });

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

      // Check for duplicates within this group
      const duplicateStores = [];
      actualStores.forEach((count, storeId) => {
        if (count > 1) {
          duplicateStores.push(storeId);
        }
      });

      if (duplicateStores.length > 0) {
        excessStores = [...excessStores, ...duplicateStores];
      }

      // Ghi nhận lỗi vào invalidRows
      if (missingStores.length > 0) {
        rows.forEach((row) => {
          results.invalidRows.push({
            index: row.index,
            reason: `Cửa hàng kỳ vọng bị thiếu: ${missingStores.join(", ")}`,
            data: row,
          });
        });
      }

      if (excessStores.length > 0) {
        rows.forEach((row) => {
          const storeId = row["Store ID - Unilever"];
          if (excessStores.includes(storeId)) {
            const isDuplicate = duplicateStores.includes(storeId);
            results.invalidRows.push({
              index: row.index,
              reason: isDuplicate
                ? `Cửa hàng ${storeId} bị trùng lặp`
                : `Cửa hàng thừa: ${storeId}`,
              data: row,
            });
          }
        });
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

    // Update daily summary
    const duplicateStores = []; // Khai báo lại trong phạm vi này
    actualStores.forEach((count, storeId) => {
      if (count > 1) {
        duplicateStores.push(storeId);
      }
    });

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
        ...duplicateStores,
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