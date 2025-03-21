export const checkPromotionBigOL = async (
  checklistData,
  rawData,
  addProgressUpdate,
  setBatchProgress
) => {
  const results = {
    dateResults: [], // Kết quả theo ngày
    totalExpectedPromotions: 0,
    totalActualPromotions: 0,
    totalDiscrepancies: 0,
  };

  try {
    // Step 1: Use checklistData directly (already filtered by processChecklistBigFormatData)
    if (checklistData.length === 0) {
      return {
        ...results,
        message: "Không có mục nào cần kiểm tra OL (không có promotion nào có 'Y' trong các cột store).",
      };
    }

    // Step 2: Group checklist items by customer and date ranges (chặng), and track expected promotions per store
    const checklistByCustomer = checklistData.reduce((acc, item) => {
      const customer = item["CUSTOMER"] || "Unknown";
      if (!acc[customer]) {
        acc[customer] = [];
      }
      acc[customer].push(item);
      return acc;
    }, {});

    const dateRangesByCustomer = {};
    for (const customer in checklistByCustomer) {
      const customerItems = checklistByCustomer[customer];
      const dateRanges = [];
      customerItems.forEach((item) => {
        const startDate = new Date(item["START DATE"]);
        const endDate = new Date(item["END DATE"]);
        const promotionId = item["PROMOTION ID"];

        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error(`Ngày không hợp lệ trong checklist cho khách hàng ${customer}: START DATE=${item["START DATE"]}, END DATE=${item["END DATE"]}`);
        }

        let range = dateRanges.find(
          (r) =>
            r.startDate.getTime() === startDate.getTime() &&
            r.endDate.getTime() === endDate.getTime()
        );

        if (!range) {
          range = {
            startDate,
            endDate,
            expectedPromotionsByStore: {}, // Lưu expected promotions theo store
          };
          dateRanges.push(range);
        }

        // Thêm promotionId vào expectedPromotionsByStore cho các store có "Y"
        if (item.stores) {
          Object.entries(item.stores).forEach(([storeId, isAudited]) => {
            if (isAudited) { // Nếu store có "Y"
              if (!range.expectedPromotionsByStore[storeId]) {
                range.expectedPromotionsByStore[storeId] = new Set();
              }
              range.expectedPromotionsByStore[storeId].add(promotionId);
            }
          });
        }
      });

      dateRanges.sort((a, b) => a.startDate - b.startDate);
      dateRangesByCustomer[customer] = dateRanges;
    }

    // Step 3: Group raw data by date, customer, and store
    const dateMap = {};

    // Log toàn bộ rawData để kiểm tra
    console.log("Raw Data (OL) trước khi xử lý:", rawData);

    rawData.forEach((raw, index) => {
      const storeId = raw["StoreID"];
      const dateRaw = raw["Date"];
      const promotionId = raw["PromotionID"];
      const customer = raw["Customer"] || "Unknown";
      const storeName = raw["StoreName"] || storeId;

      // Log chi tiết từng dòng trong rawData
      console.log(`Dòng ${index}: StoreID=${storeId}, Date=${dateRaw}, PromotionID=${promotionId}, Customer=${customer}`);

      // Parse ngày theo UTC để tránh lệch múi giờ
      let auditDate;
      if (typeof dateRaw === "string") {
        if (dateRaw.includes("-")) {
          const [year, month, day] = dateRaw.split("-");
          auditDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        } else if (dateRaw.includes("/")) {
          const [day, month, year] = dateRaw.split("/");
          auditDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        }
      } else if (typeof dateRaw === "number") {
        const epoch = new Date(1899, 11, 30);
        auditDate = new Date(epoch.getTime() + dateRaw * 86400 * 1000);
      } else if (dateRaw instanceof Date) {
        auditDate = dateRaw;
      }

      if (!storeId || !auditDate || isNaN(auditDate.getTime()) || !promotionId) {
        console.warn(`Dữ liệu raw không hợp lệ tại dòng ${index}: StoreID=${storeId}, Date=${dateRaw}, PromotionID=${promotionId}`);
        return;
      }

      const dateKey = auditDate.toISOString().split("T")[0]; // e.g., "2025-03-01"

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {};
      }

      if (!dateMap[dateKey][customer]) {
        dateMap[dateKey][customer] = {};
      }

      if (!dateMap[dateKey][customer][storeId]) {
        dateMap[dateKey][customer][storeId] = {
          storeId,
          storeName,
          actualPromotions: new Set(),
        };
      }

      dateMap[dateKey][customer][storeId].actualPromotions.add(promotionId);
    });

    // Step 4: Process each date, customer, and store
    const totalDates = Object.keys(dateMap).length;
    let processedDates = 0;

    for (const dateKey in dateMap) {
      const date = new Date(dateKey);
      const dateResult = {
        date: date.toLocaleDateString("vi-VN"),
        customers: [],
        hasDiscrepancies: false,
      };

      const customers = dateMap[dateKey];
      for (const customer in customers) {
        const customerResult = {
          customer,
          stores: [],
        };

        const stores = customers[customer];
        for (const storeId in stores) {
          const storeData = stores[storeId];
          const storeResult = {
            storeId,
            storeName: storeData.storeName,
            expectedPromotions: [],
            actualPromotions: Array.from(storeData.actualPromotions),
            missingPromotions: [],
            extraPromotions: [],
          };

          // Find the date range (chặng) in the checklist for this customer and date
          const customerDateRanges = dateRangesByCustomer[customer];
          if (!customerDateRanges) {
            storeResult.message = `Không tìm thấy khách hàng ${customer} trong checklist.`;
            customerResult.stores.push(storeResult);
            continue;
          }

          const matchingRange = customerDateRanges.find(
            (range) => date >= range.startDate && date <= range.endDate
          );

          if (!matchingRange) {
            storeResult.message = `Không tìm thấy chặng nào cho ngày ${date.toLocaleDateString("vi-VN")} của khách hàng ${customer}.`;
            customerResult.stores.push(storeResult);
            continue;
          }

          // Lấy expected promotions cho store này
          const expectedPromotionsForStore = matchingRange.expectedPromotionsByStore[storeId] || new Set();
          storeResult.expectedPromotions = Array.from(expectedPromotionsForStore);

          // So sánh expected và actual
          storeResult.missingPromotions = storeResult.expectedPromotions.filter(
            (id) => !storeResult.actualPromotions.includes(id)
          );
          storeResult.extraPromotions = storeResult.actualPromotions.filter(
            (id) => !storeResult.expectedPromotions.includes(id)
          );

          // Update totals
          results.totalExpectedPromotions += storeResult.expectedPromotions.length;
          results.totalActualPromotions += storeResult.actualPromotions.length;
          if (storeResult.missingPromotions.length > 0 || storeResult.extraPromotions.length > 0) {
            results.totalDiscrepancies += 1;
            dateResult.hasDiscrepancies = true;
          }

          customerResult.stores.push(storeResult);
        }

        // Sort stores by discrepancies (stores with discrepancies first)
        customerResult.stores.sort((a, b) => {
          const aHasDiscrepancies = a.missingPromotions.length > 0 || a.extraPromotions.length > 0;
          const bHasDiscrepancies = b.missingPromotions.length > 0 || b.extraPromotions.length > 0;
          return bHasDiscrepancies - aHasDiscrepancies;
        });

        dateResult.customers.push(customerResult);
      }

      // Sort customers by discrepancies (customers with discrepancies first)
      dateResult.customers.sort((a, b) => {
        const aHasDiscrepancies = a.stores.some(
          (store) => store.missingPromotions.length > 0 || store.extraPromotions.length > 0
        );
        const bHasDiscrepancies = b.stores.some(
          (store) => store.missingPromotions.length > 0 || store.extraPromotions.length > 0
        );
        return bHasDiscrepancies - aHasDiscrepancies;
      });

      results.dateResults.push(dateResult);

      // Update progress
      processedDates += 1;
      const progress = totalDates > 0 ? Math.round((processedDates / totalDates) * 100) : 100;
      setBatchProgress(progress);
      addProgressUpdate({
        message: `Đã xử lý ${processedDates}/${totalDates} ngày cho kiểm tra OL.`,
        progress,
      });
    }

    // Step 5: Sort dates by discrepancies (dates with discrepancies first)
    results.dateResults.sort((a, b) => b.hasDiscrepancies - a.hasDiscrepancies);

    // Step 6: Finalize results
    if (results.totalDiscrepancies === 0) {
      results.message = "Tất cả chương trình khuyến mãi OL khớp với kỳ vọng cho tất cả cửa hàng.";
    } else {
      results.message = `Tìm thấy ${results.totalDiscrepancies} sự không khớp trong chương trình khuyến mãi OL tại các cửa hàng.`;
    }

    return results;
  } catch (error) {
    throw new Error(`Lỗi trong kiểm tra khuyến mãi OL: ${error.message}`);
  }
}