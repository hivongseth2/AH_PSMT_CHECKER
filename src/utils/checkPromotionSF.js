import { isWithinInterval, parseISO, format } from "date-fns";
import { ERROR_MESSAGES } from "../config/message";
import { parseDate } from "./dateUtils";

function* batchGenerator(array, batchSize) {
  for (let i = 0; i < array.length; i += batchSize) {
    yield array.slice(i, i + batchSize);
  }
}

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

  console.log("checklist", checklist);
  

  const batchSize = 1000;
  const totalItems = rawData.length;

  // Tạo map cho checklist để tra cứu nhanh hơn
  const checklistMap = new Map();
  checklist.forEach((item) => {
    const key = `${item["Promotion ID"]}_${item["Customer ID"]}`;
    checklistMap.set(key, item);
  });



  console.log("checklistmap", checklistMap);
  
  // Group store visits
  const storeVisitsMap = new Map();
  for (const row of rawData) {
    const { Date: rawDate, "Store ID - Unilever": storeId, TYPESTORE: typeStore } = row;
    if (rawDate && rawDate.trim() !== "") {
      const rowDate = parseDate(rawDate);
      if (!isNaN(rowDate.getTime())) {
        const dateKey = format(rowDate, "yyyy-MM-dd");
        const visitKey = `${dateKey}_${typeStore}`;
        if (!storeVisitsMap.has(visitKey)) {
          storeVisitsMap.set(visitKey, new Set());
        }
        storeVisitsMap.get(visitKey).add(storeId);
      }
    }
  }

  for (const [visitKey, storeSet] of storeVisitsMap) {
    const [dateKey, typeStore] = visitKey.split("_");
    if (!results.storeVisits[dateKey]) {
      results.storeVisits[dateKey] = {};
    }
    results.storeVisits[dateKey][typeStore] = Array.from(storeSet);
  }

  // Group raw data
  const rawDataGenerator = batchGenerator(rawData, batchSize);
  let processedItems = 0;

  for (const batch of rawDataGenerator) {
    for (const [index, row] of batch.entries()) {
      const {
        Date: rawDate,
        "Store ID - Unilever": storeId,
        Customer: CustomerID,
        "Promotion ID": promotionId,
        TYPESTORE: typeStore,
      } = row;

      if (!rawDate || rawDate.trim() === "") {
        results.invalidRows.push({
          index: processedItems + index + 2,
          reason: "Dữ liệu cột Date rỗng hoặc không xác định",
          data: row,
        });
        continue;
      }

      const rowDate = parseDate(rawDate);
      if (isNaN(rowDate.getTime())) {
        results.invalidRows.push({
          index: processedItems + index + 2,
          reason: "Invalid date format",
          data: row,
        });
        continue;
      }

      if (!storeId) {
        results.invalidRows.push({
          index: processedItems + index + 2,
          reason: "Store ID không xác định",
          data: row,
        });
        continue;
      }

      if (!promotionId) {
        results.invalidRows.push({
          index: processedItems + index + 2,
          reason: "Promotion ID không xác định",
          data: row,
        });
        continue;
      }

      const dateKey = format(rowDate, "yyyy-MM-dd");
      const groupKey = `${promotionId}_${CustomerID}_${dateKey}`;
      if (!results.groupedData[groupKey]) {
        results.groupedData[groupKey] = [];
      }
      results.groupedData[groupKey].push({ ...row, index: processedItems + index + 2 });
    }

    processedItems += batch.length;
    const progress = Math.round((processedItems / totalItems) * 50); // 50% cho bước này
    setBatchProgress(progress);
    addProgressUpdate({
      productId: `Batch ${Math.floor(processedItems / batchSize)}`,
      status: `Grouping (${progress}% complete)`,
      progress: progress,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  // Process grouped data
  const groupKeys = Object.keys(results.groupedData);


  
  const groupGenerator = batchGenerator(groupKeys, batchSize);
  let processedGroups = 0;

  for (const groupBatch of groupGenerator) {
    for (const groupKey of groupBatch) {
      const rows = results.groupedData[groupKey];
      const [promotionId, customerName, dateKey] = groupKey.split("_");
      const date = parseISO(dateKey);

      let actualCount = rows.length;
      let expectedCount = 0;

      const storeTypesVisited = new Set(rows.map((row) => row.TYPESTORE));
      const expectedStores = new Set();
      const actualStores = new Map();

      rows.forEach((row) => {
        const storeId = row["Store ID - Unilever"];
        actualStores.set(storeId, (actualStores.get(storeId) || 0) + 1);
      });

      const checklistItem = checklistMap.get(`${promotionId}_${customerName}`);
      if (checklistItem) {
        const startDate = new Date(checklistItem["START DATE"]);
        const endDate = new Date(checklistItem["END DATE"]);
        const normalizedStartDate = startDate.setHours(0, 0, 0, 0);
        const normalizedEndDate = endDate.setHours(0, 0, 0, 0);
        const normalizedItemDate = date.setHours(0, 0, 0, 0);

        if (
          isWithinInterval(normalizedItemDate, {
            start: normalizedStartDate,
            end: normalizedEndDate,
          })
        ) {
                    
          storeTypesVisited.forEach((storeType) => {
            
            console.log("storevisit",storeTypesVisited);
            
            if (
              checklistItem.stores[storeType] === "Y" &&
              results.storeVisits[dateKey]?.[storeType]
            ) {

              
              
              expectedCount += results.storeVisits[dateKey][storeType].length;
              results.storeVisits[dateKey][storeType].forEach((store) =>
              {
                expectedStores.add(store)

                  
                
              }
              );
            }
          });
        }
      }
      
      

      results.validCount += actualCount;

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
            duplicateStores.push(storeId);
          }
        });

        if (duplicateStores.length > 0) {
          excessStores = [...excessStores, ...duplicateStores];
        }

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

        results.errors.push({
          date: dateKey,
          promotionId,
          customerName,
          message: `Mismatch in promotion count. Expected: ${expectedCount}, Actual: ${actualCount}`,
          difference: actualCount - expectedCount,
          storeVisits: results.storeVisits[dateKey],
          missingStores,
          excessStores,
        });
      }

      const duplicateStores = [];
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
    }

    processedGroups += groupBatch.length;
    const progress = 50 + Math.round((processedGroups / groupKeys.length) * 50); // 50% còn lại
    setBatchProgress(progress);
    addProgressUpdate({
      productId: `Group Batch ${Math.floor(processedGroups / batchSize)}`,
      status: `Processed (${progress}% complete)`,
      progress: progress,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return results;
};