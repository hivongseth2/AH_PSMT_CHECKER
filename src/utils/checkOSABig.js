import { getDateOnly } from "./dateUtils";

export const checkBigOSA = async (storeItems, rawData, addProgressUpdate, setBatchProgress) => {
 
  
    if (!storeItems || !rawData) {
      return {
        message: "Không có dữ liệu để kiểm tra OSA.",
      };
    }
  
    const results = {
      fullyChecked: [],
      overdue: [],
      discrepancies: [],
      totalExpectedItems: 0,
      totalActualItems: 0,
      totalDiscrepancies: 0,
      message: "",
    };
  
    // Step 1: Create a map of raw data by StoreID
    const rawDataMap = new Map();
    rawData.forEach((entry) => {
      rawDataMap.set(entry.storeId, entry);
    });
  
    // Step 2: Process each store from checklist
    const currentDate = new Date();
  
    storeItems.forEach((storeEntry, index) => {
      const storeCode = storeEntry.storeCode;
      const expectedItems = storeEntry.itemCodes; // Mảng các { itemCode, startDate, endDate }
  
      // Tính tổng số item dự kiến (chỉ tính các item có startDate và endDate hợp lệ)
      const validExpectedItems = expectedItems.filter(
        (item) => item.startDate && item.endDate && !isNaN(item.startDate.getTime()) && !isNaN(item.endDate.getTime())
      );
      results.totalExpectedItems += validExpectedItems.length;
  
      // Tìm dữ liệu raw tương ứng với cửa hàng
      const rawEntry = rawDataMap.get(storeCode);
      const rawDate = rawEntry ? rawEntry.date : null;
      const rawItemCodes = rawEntry ? new Set(rawEntry.itemCodes) : new Set();
  
      if (rawEntry) {
        results.totalActualItems += rawItemCodes.size;
      }
  
      // Lọc các expected items có rawDate nằm trong khoảng startDate và endDate
      const applicableExpectedItems = rawDate
        ? validExpectedItems.filter((item) => {
            // Đảm bảo rawDate nằm trong khoảng [startDate, endDate] (bao gồm cả cận biên)
            const start = getDateOnly(item.startDate);
            const end = getDateOnly(item.endDate);
            const raw = getDateOnly(rawDate);
  
            // Đặt thời gian của các ngày về 00:00:00 để so sánh chính xác
            // start.setHours(0, 0, 0, 0);
            // end.setHours(23, 59, 59, 999);
            // raw.setHours(0, 0, 0, 0);
  
            // return raw >= start && raw <= end;

            return raw.getTime() >= start.getTime() && raw.getTime() <= end.getTime();
          })
        : [];
  
      const applicableExpectedItemCodes = new Set(applicableExpectedItems.map((item) => item.itemCode));
  
      // Kiểm tra trạng thái
      const storeResult = {
        storeCode,
        expectedItemCodes: Array.from(applicableExpectedItemCodes),
        actualItemCodes: rawEntry ? Array.from(rawItemCodes) : [],
        missingItemCodes: [],
        extraItemCodes: [],
        isOverdue: false,
      };
  
      // Tính các ITEM CODE thiếu và thừa
      storeResult.missingItemCodes = Array.from(applicableExpectedItemCodes).filter(
        (itemCode) => !rawItemCodes.has(itemCode)
      );
      storeResult.extraItemCodes = Array.from(rawItemCodes).filter(
        (itemCode) => !applicableExpectedItemCodes.has(itemCode)
      );
  
      // Kiểm tra trạng thái cửa hàng
      if (!rawEntry) {
        // Chưa chấm
        if (currentDate > new Date(validExpectedItems[0]?.endDate || 0)) {
          storeResult.isOverdue = true;
          results.overdue.push(storeResult);
          results.totalDiscrepancies += applicableExpectedItemCodes.size;
        }
      } else {
        // Đã chấm, kiểm tra thiếu/thừa
        if (storeResult.missingItemCodes.length > 0 || storeResult.extraItemCodes.length > 0) {
          results.discrepancies.push(storeResult);
          results.totalDiscrepancies += storeResult.missingItemCodes.length + storeResult.extraItemCodes.length;
        } else {
          results.fullyChecked.push(storeResult);
        }
      }
  
      // Update progress
      addProgressUpdate({
        progress: Math.round(((index + 1) / storeItems.length) * 100),
        message: `Đang kiểm tra OSA tại cửa hàng: ${storeCode}`,
      });
    });
  
    // Step 3: Set final message
    if (results.totalDiscrepancies > 0) {
      results.message = `Tìm thấy ${results.totalDiscrepancies} sự không khớp (thiếu/thừa) trong dữ liệu OSA.`;
    } else {
      results.message = "Không tìm thấy sự không khớp nào trong dữ liệu OSA.";
    }
  
    setBatchProgress(100);
    return results;
  };