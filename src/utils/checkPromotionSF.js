import { isWithinInterval, parseISO } from "date-fns";
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
  };

  const totalItems = rawData.length;

  const processItem = (row, index) => {
    // console.log(row);

    const {
      Date: rawDate,
      "Store ID - Unilever": storeId,
      Customer: customerName,
      "Promotion ID": promotionId,
      "Product ID": productId,
    } = row;

    if (!rawDate || rawDate.trim() === "") {
      results.invalidRows.push({
        index: index + 2,
        reason: "Dữ liệu cột Date rỗng hoặc không xác định",
        data: row,
      });
      return null;
    }

    const rowDate = parseDate(rawDate);

    if (isNaN(rowDate.getTime())) {
      results.invalidRows.push({
        index: index + 2,
        reason: "Invalid date format",
        data: row,
      });
      return null;
    }

    // console.log(checklist, "checklist");

    // console.log(customerName, "customerName");
    // console.log(promotionId, "promotionId");
    // console.log(productId, "productId");

    const checklistItem = checklist.find((item, index) => {
      if (item["Promotion ID"] === undefined) {
        return false;
      }
      const startDate = new Date(item["START DATE"]);

      const endDate = new Date(item["END DATE"]);
      const date = new Date(rowDate);

      console.log(startDate, date, endDate);

      return (
        item["Customer ID"] === customerName &&
        item["Promotion ID"] === promotionId &&
        item["Item code"] == productId &&
        item.stores[storeId] === "Y" &&
        isWithinInterval(date, {
          start: startDate,
          end: endDate,
        })
      );
    });
    console.error("Customer ID:", customerName);
    console.error("Promotion ID:", promotionId);
    console.error("Item code:", productId);
    console.error("Store ID:", storeId);
    console.error("Row Date:", rowDate);

    console.log("checklistItem", checklistItem);

    if (checklistItem) {
      results.validCount++;
      return { isValid: true, error: null };
    } else {
      results.invalidCount++;
      const error = {
        row: index + 2,
        message: ERROR_MESSAGES.INVALID_PROMOTION(
          productId,
          rawDate,
          storeId,
          promotionId
        ),
      };
      results.errors.push(error);
      return { isValid: false, error };
    }
  };

  for (let i = 0; i < rawData.length; i++) {
    processItem(rawData[i], i);

    if (i % 100 === 0) {
      const progress = Math.round((i / totalItems) * 100);
      setBatchProgress(progress);
      addProgressUpdate({
        productId: `Batch ${Math.floor(i / 100)}`,
        status: `Processed (${progress}% complete)`,
        progress: progress,
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  console.log(results);

  return results;
};
