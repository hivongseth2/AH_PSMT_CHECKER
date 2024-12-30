/* eslint-disable no-loop-func */
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
  };

  const totalItems = rawData.length;

  // Group raw data by date and storeType
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
    const groupKey = `${dateKey}_${typeStore}`;

    if (!results.groupedData[groupKey]) {
      results.groupedData[groupKey] = [];
    }
    results.groupedData[groupKey].push(row);
  });

  // Process grouped data
  let processedCount = 0;
  for (const [groupKey, rows] of Object.entries(results.groupedData)) {
    console.log(groupKey, "groupKey");

    const [dateKey, typeStore] = groupKey.split("_");
    const date = parseISO(dateKey);
    const validPromotions = new Map();
    const invalidPromotions = new Map();

    rows.forEach((row, rowIndex) => {
      const {
        "Promotion ID": promotionId,
        "Product ID": productId,
        "Customer ID": customerId,
        TYPESTORE: typeStore,
        "Store ID - Unilever": storeId,
      } = row;

      const checklistItem = checklist.find((item) => {
        if (item["Promotion ID"] === undefined) {
          return false;
        }
        const startDate = new Date(item["START DATE"]);
        const endDate = new Date(item["END DATE"]);
        return (
          item["Customer ID"] == customerId &&
          item["Promotion ID"] == promotionId &&
          String(item["Item code"]) == String(productId) &&
          // eslint-disable-next-line eqeqeq
          item.stores[typeStore] == "Y" &&
          isWithinInterval(date, { start: startDate, end: endDate })
        );
      });

      if (checklistItem) {
        if (!validPromotions.has(promotionId)) {
          validPromotions.set(promotionId, []);
        }
        validPromotions.get(promotionId).push({
          productId,
          customerId,
          typeStore,
          storeId,
        });
        results.validCount++;
      } else {
        if (!invalidPromotions.has(promotionId)) {
          invalidPromotions.set(promotionId, []);
        }
        invalidPromotions.get(promotionId).push({
          productId,
          customerId,
          typeStore,
          storeId,
        });
        results.invalidCount++;
        const error = {
          row: processedCount + rowIndex + 2,
          message: ERROR_MESSAGES.INVALID_PROMOTION(
            productId,
            dateKey,
            storeId,
            promotionId
          ),
        };
        results.errors.push(error);
      }
    });
    console.log(typeStore);

    console.log(rows);

    // Compare with expected count
    const expectedPromotions = new Map();
    checklist.forEach((item) => {
      if (
        item.stores[typeStore] === "Y" &&
        isWithinInterval(date, {
          start: new Date(item["START DATE"]),
          end: new Date(item["END DATE"]),
        })
      ) {
        expectedPromotions.set(item["Promotion ID"], {
          productId: item["Item code"],
          customerId: item["Customer ID"],
          typeStore: typeStore,
        });
      }
    });

    console.log("expectedPromotions", expectedPromotions);

    const missingPromotions = [...expectedPromotions].filter(
      ([id, data]) => !validPromotions.has(id)
    );
    const extraPromotions = [...validPromotions].filter(
      ([id, data]) => !expectedPromotions.has(id)
    );

    if (!results.dailySummary[dateKey]) {
      results.dailySummary[dateKey] = {};
    }
    results.dailySummary[dateKey][typeStore] = {
      actualCount: validPromotions.size,
      expectedCount: expectedPromotions.size,
      missingPromotions,
      extraPromotions,
      validPromotions: Object.fromEntries(validPromotions),
      invalidPromotions: Object.fromEntries(invalidPromotions),
    };

    if (missingPromotions.length > 0 || extraPromotions.length > 0) {
      results.errors.push({
        date: dateKey,
        storeType: typeStore,
        message: `Mismatch in promotion count for ${typeStore}. Expected: ${expectedPromotions.size}, Actual: ${validPromotions.size}`,
        missingPromotions,
        extraPromotions,
      });
    }

    processedCount += rows.length;
    const progress = Math.round((processedCount / totalItems) * 100);
    setBatchProgress(progress);
    addProgressUpdate({
      productId: `Date ${dateKey}, Store Type ${typeStore}`,
      status: `Processed (${progress}% complete)`,
      progress: progress,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  console.log(results);

  return results;
};
