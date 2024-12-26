import { isWithinInterval } from "date-fns";
import { parseDate } from "./dateUtils";
import { processBatch } from "./bathProcessor";
import { ERROR_MESSAGES } from "../config/message";

export const validateData = async (
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
  };

  const batchSize = 1000;
  const totalItems = rawData.length;

  const processItem = (row, index) => {

    // Update current progress
    addProgressUpdate({
      productId: row["Product_id"] || row["Product ID"],
      date: row.Date,
      store: row["Store ID - Unilever"],
      status: "Đang kiểm tra",
    });

    if (processItem.skipNext) {
      processItem.skipNext = false;
      return null;
    }

    if (row["Product_id"] === undefined) {
      console.log(`Skipping row ${index + 2}: Product_id is undefined`);
      return null; // Return null to indicate this row should be skipped
    }

    const checklistItem = checklist.find((item) => {
      const isMatchingProduct =
        item["Item Code"] == row["Product_id"] ||
        item["Old code"] == row["Product_id"] ||
        (item["New code"] && item["New code"] == row["Product_id"]);

      const rowStore = row["Store ID - Unilever"];
      const storeValue = Number(item.stores[rowStore]);

      return isMatchingProduct && storeValue > 0;
    });

    if (!checklistItem) {
      return {
        isValid: false,
        isOutOfRange: false,
        error: {
          row: index + 2,
          message: ERROR_MESSAGES.PRODUCT_NOT_FOUND(
            row["Product_id"],
            row.Date,
            row["Store ID - Unilever"]
          ),
        },
      };
    }

    if (row.Date === undefined) {
      return {
        isValid: false,
        isOutOfRange: false,
        error: {
          row: index + 1,
          message: ERROR_MESSAGES.ROW_DATE_UNDEFINED(
            row["Product_id"],
            row.Date,
            row["Store ID - Unilever"]
          ),
        },
      };
    }

    const rowDate = parseDate(row.Date);

    const flexStartDate =
      checklistItem["Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới"] !== undefined
        ? checklistItem["Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới"]
        : null;

    const flexEndDate =
      checklistItem["Ngày Kết Thúc Linh Động Đo Hàng Cũ & Mới"] !== undefined
        ? checklistItem["Ngày Kết Thúc Linh Động Đo Hàng Cũ & Mới"]
        : null;

    let inFlexibleRange = false;
    if (flexStartDate && flexEndDate) {
      inFlexibleRange = isWithinInterval(rowDate, {
        start: flexStartDate,
        end: flexEndDate,
      });
    }

    const itemCode = String(checklistItem["Item Code"]);
    const newCode = checklistItem["New code"]
      ? String(checklistItem["New code"])
      : null;
    const oldCode = checklistItem["Old code"]
      ? String(checklistItem["Old code"])
      : null;
    const productId = String(row["Product_id"]);

    if (flexStartDate && rowDate < flexStartDate) {
      if (productId === itemCode) {
        return { isValid: true, isOutOfRange: false, error: null };
      } else {
        return {
          isValid: false,
          isOutOfRange: false,
          error: {
            row: index + 2,
            message: ERROR_MESSAGES.INVALID_PRODUCT_BEFORE_FLEX(
              productId,
              row.Date
            ),
          },
        };
      }
    } else if (flexStartDate && rowDate > flexEndDate) {
      if (newCode) {
        if (productId == newCode) {
          return { isValid: true, isOutOfRange: false, error: null };
        } else {
          return {
            isValid: false,
            isOutOfRange: true,
            error: {
              row: index + 2,
              message: ERROR_MESSAGES.INVALID_NEW_CODE_AFTER_FLEX(
                productId,
                row.Date
              ),
            },
          };
        }
      } else if (oldCode) {
        if (productId == itemCode) {
          return { isValid: true, isOutOfRange: false, error: null };
        } else {
          return {
            isValid: false,
            isOutOfRange: true,
            error: {
              row: index + 2,
              message: ERROR_MESSAGES.INVALID_ITEM_CODE_AFTER_FLEX(
                productId,
                row.Date
              ),
            },
          };
        }
      } else {
        if (productId == itemCode) {
          return { isValid: true, isOutOfRange: false, error: null };
        } else {
          return {
            isValid: false,
            isOutOfRange: true,
            error: {
              row: index + 2,
              message: ERROR_MESSAGES.INVALID_PRODUCT_AFTER_FLEX(
                productId,
                row.Date
              ),
            },
          };
        }
      }
    }

    if (inFlexibleRange) {
      const validCombinations = [
        [itemCode, newCode].filter(Boolean),
        [oldCode, itemCode].filter(Boolean),
      ];

      const currentProductId = String(row["Product_id"]);

      const comboWithLengthGreaterThan2 = validCombinations.find(
        (combo) => combo.length === 2 && combo[0] !== combo[1]
      );

      let isValid = false;

      if (comboWithLengthGreaterThan2) {
        // Nếu có combo với độ dài == 2, kiểm tra sự khớp của các mã
        const nextRow = rawData[index + 1];
        const nextProductId = nextRow ? String(nextRow["Product_id"]) : null;

        isValid =
          (currentProductId === comboWithLengthGreaterThan2[0] &&
            nextProductId === comboWithLengthGreaterThan2[1]) ||
          (currentProductId === comboWithLengthGreaterThan2[1] &&
            nextProductId === comboWithLengthGreaterThan2[0]);
      } else {
        // Nếu không có combo với độ dài > 2, kiểm tra combo có độ dài 1
        const validCombo = validCombinations.find(
          (combo) => combo.length === 1
        );
        if (validCombo) {
          isValid = currentProductId === validCombo[0];
        }
      }

      if (isValid) {
        if (validCombinations.some((combo) => combo.length === 2)) {
          // nếu khớp không cần kiểm tra dòng tiếp theo nữa
          processItem.skipNext = true;
        }
        return { isValid: true, isOutOfRange: false, error: null };
      } else {
        if (validCombinations.some((combo) => combo.length === 2)) {
          // nếu khớp không cần kiểm tra dòng tiếp theo nữa
          processItem.skipNext = true;
        }
        return {
          isValid: false,
          isOutOfRange: false,
          error: {
            row: index + 2,
            message: ERROR_MESSAGES.INVALID_PRODUCT_DURING_FLEX(
              currentProductId,
              row.Date
            ),
          },
        };
      }
    } else {
      //có cái newCode thì phải hiện thị new code
      if (newCode) {
        if (productId == newCode) {
          return { isValid: true, isOutOfRange: false, error: null };
        } else {
          return {
            isValid: false,
            isOutOfRange: true,
            error: {
              row: index + 2,
              message: ERROR_MESSAGES.INVALID_PRODUCT_AFTER_FLEX_NEW(
                productId,
                row.Date
              ),
            },
          };
        }
      } else if (oldCode) {
        if (productId == itemCode) {
          return { isValid: true, isOutOfRange: false, error: null };
        } else {
          return {
            isValid: false,
            isOutOfRange: true,
            error: {
              row: index + 2,
              message: ERROR_MESSAGES.INVALID_PRODUCT_AFTER_FLEX_OLD(
                productId,
                row.Date
              ),
            },
          };
        }
      } else {
        if (productId == itemCode) {
          return { isValid: true, isOutOfRange: false, error: null };
        } else {
          return {
            isValid: false,
            isOutOfRange: true,
            error: {
              row: index + 2,
              message: ERROR_MESSAGES.INVALID_PRODUCT_AFTER_FLEX(
                productId,
                row.Date
              ),
            },
          };
        }
      }
    }
  };
  // ==========

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

    // Allow UI to update
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
};
