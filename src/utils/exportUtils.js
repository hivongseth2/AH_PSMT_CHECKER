// import ExcelJS from "exceljs";
// import * as XLSX from "xlsx";

// // Giới hạn cột tối đa của Excel
// const MAX_EXCEL_COLUMNS = 16384;

// // Hàm chuyển đổi ngày từ định dạng Excel serial hoặc string sang Date (UTC)
// const parseDate = (dateRaw) => {
//   let auditDate;
//   if (typeof dateRaw === "number") {
//     // Excel serial date
//     const epoch = new Date(1899, 11, 30);
//     auditDate = new Date(epoch.getTime() + dateRaw * 86400 * 1000);
//   } else if (typeof dateRaw === "string") {
//     if (dateRaw.includes("-")) {
//       // Định dạng "YYYY-MM-DD"
//       const [year, month, day] = dateRaw.split("-");
//       auditDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
//     } else if (dateRaw.includes("/")) {
//       // Định dạng "DD/MM/YYYY"
//       const [day, month, year] = dateRaw.split("/");
//       auditDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
//     }
//   } else if (dateRaw instanceof Date) {
//     auditDate = new Date(dateRaw);
//   }

//   if (!auditDate || isNaN(auditDate.getTime())) {
//     throw new Error(`Ngày không hợp lệ: ${dateRaw}`);
//   }

//   // Đảm bảo ngày ở múi giờ UTC
//   return new Date(Date.UTC(auditDate.getUTCFullYear(), auditDate.getUTCMonth(), auditDate.getUTCDate()));
// };

// // Hàm xuất file Excel với tô đỏ các dòng sai và thêm cột "Lý Do Sai"
// export const exportRawDataWithErrors = async (rawWorkbook, bigPromotionResults) => {
//   if (!bigPromotionResults || !rawWorkbook) {
//     throw new Error("Không có dữ liệu đã xử lý hoặc workbook gốc để xuất. Vui lòng chạy kiểm tra trước.");
//   }

//   try {
//     // Tạo workbook mới với ExcelJS
//     const workbook = new ExcelJS.Workbook();

//     // Process sheet "PROMS" (MS) hoặc "PROOL_Dup" (OL)
//     const processSheet = (sheetName, results, promotionIdColumn) => {
//       const sheet = workbook.addWorksheet(sheetName);
//       const sheetData = XLSX.utils.sheet_to_json(rawWorkbook.Sheets[sheetName], { header: 1 });
//       const headers = sheetData[0];
//       console.log(`Sheet ${sheetName}: Số cột trong header: ${headers.length}`);

//       // Kiểm tra số cột
//       if (headers.length >= MAX_EXCEL_COLUMNS) {
//         throw new Error(
//           `Sheet ${sheetName} có ${headers.length} cột, vượt quá giới hạn ${MAX_EXCEL_COLUMNS}. Không thể thêm cột "Lý Do Sai".`
//         );
//       }

//       // Thêm cột "Lý Do Sai" vào header
//       headers.push("Lý Do Sai");
//       sheet.addRow(headers);

//       // Tìm vị trí cột "Lý Do Sai"
//       const reasonColumnIndex = headers.indexOf("Lý Do Sai") + 1; // +1 vì ExcelJS đếm cột từ 1
//       console.log(`Cột "Lý Do Sai" nằm ở vị trí: ${reasonColumnIndex} trong sheet ${sheetName}`);

//       // Ánh xạ dữ liệu
//       const storeDateMap = {};
//       sheetData.slice(1).forEach((row, index) => {
//         const storeId = row[headers.indexOf("Store ID - Unilever")];
//         const dateRaw = row[headers.indexOf("Date")];
//         const promotionId = row[headers.indexOf(promotionIdColumn)];

//         if (!storeId || !dateRaw || !promotionId) {
//           console.warn(
//             `Dòng ${index + 2}: Thiếu dữ liệu - StoreID=${storeId}, Date=${dateRaw}, PromotionID=${promotionId}`
//           );
//           return;
//         }

//         const auditDate = parseDate(dateRaw);
//         if (!auditDate || isNaN(auditDate.getTime())) {
//           console.warn(`Dòng ${index + 2}: Ngày không hợp lệ - Date=${dateRaw}`);
//           return;
//         }

//         const dateKey = auditDate.toISOString().split("T")[0]; // Ví dụ: "2025-03-01"
//         const storeDateKey = `${storeId}_${dateKey}`;

//         if (!storeDateMap[storeDateKey]) {
//           storeDateMap[storeDateKey] = {
//             storeId,
//             date: dateKey,
//             rowNumbers: [],
//             promotionIds: new Set(),
//           };
//         }

//         storeDateMap[storeDateKey].rowNumbers.push(index + 2); // +2 để điều chỉnh cho header và chỉ số bắt đầu từ 1
//         storeDateMap[storeDateKey].promotionIds.add(promotionId);

//         // Log chi tiết để kiểm tra
//         console.log(
//           `Dòng ${index + 2} (${sheetName}): StoreID=${storeId}, DateRaw=${dateRaw}, ParsedDate=${auditDate.toISOString()}, DateKey=${dateKey}, PromotionID=${promotionId}`
//         );
//       });

//       // Log để kiểm tra storeDateMap
//       console.log(`storeDateMap (${sheetName}):`, storeDateMap);

//       // Tìm các dòng có sai sót
//       const rowsWithErrors = new Set();
//       const reasons = new Array(sheetData.length - 1).fill("");

//       results?.dateResults?.forEach((dateResult) => {
//         // Parse ngày từ giao diện (định dạng "DD/MM/YYYY") sang Date (UTC)
//         const [day, month, year] = dateResult.date.split("/");
//         const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
//         const dateKey = date.toISOString().split("T")[0]; // Ví dụ: "2025-03-14"
//         console.log(`Kiểm tra ngày trên giao diện: ${dateResult.date} (dateKey: ${dateKey})`);

//         dateResult.customers.forEach((customerResult) => {
//           customerResult.stores.forEach((store) => {
//             const storeDateKey = `${store.storeId}_${dateKey}`;
//             const storeData = storeDateMap[storeDateKey];

//             if (!storeData) {
//               console.warn(`Không tìm thấy store_date: ${storeDateKey}`);
//               return;
//             }

//             let reason = "";
//             if (store.message) {
//               reason = store.message;
//             } else if (store.missingPromotions.length > 0 || store.extraPromotions.length > 0) {
//               if (store.missingPromotions.length > 0) {
//                 reason += `Thiếu khuyến mãi: ${store.missingPromotions.join(", ")}. `;
//               }
//               if (store.extraPromotions.length > 0) {
//                 reason += `Thừa khuyến mãi: ${store.extraPromotions.join(", ")}.`;
//               }
//             }

//             if (reason) {
//               console.log(`Tìm thấy sai sót tại ${storeDateKey}: ${reason}`);
//               storeData.rowNumbers.forEach((rowNumber) => {
//                 rowsWithErrors.add(rowNumber);
//                 reasons[rowNumber - 2] = reason.trim();
//               });
//             }
//           });
//         });
//       });

//       // Log để kiểm tra các dòng có sai sót
//       console.log(`rowsWithErrors (${sheetName}):`, Array.from(rowsWithErrors));
//       console.log(`reasons (${sheetName}):`, reasons.filter((r) => r !== ""));

//       // Ghi từng dòng vào sheet
//       sheetData.slice(1).forEach((row, index) => {
//         const excelRow = sheet.addRow(row);
//         // Ghi lý do sai sót vào cột "Lý Do Sai"
//         excelRow.getCell(reasonColumnIndex).value = reasons[index] || "";
//         if (rowsWithErrors.has(index + 2)) {
//           excelRow.eachCell({ includeEmpty: true }, (cell) => {
//             cell.fill = {
//               type: "pattern",
//               pattern: "solid",
//               fgColor: { argb: "FFFF0000" }, // Màu đỏ
//             };
//           });
//         }
//       });
//     };

//     // Process "PROMS" for MS
//     if (rawWorkbook.Sheets["PROMS"] && bigPromotionResults.msResults) {
//       processSheet("PROMS", bigPromotionResults.msResults, "PromotionID");
//     }

//     // Process "PROOL_Dup" for OL
//     if (rawWorkbook.Sheets["PROOL_Dup"] && bigPromotionResults.olResults) {
//       processSheet("PROOL_Dup", bigPromotionResults.olResults, "Promotion_id");
//     }

//     // Sao chép các sheet khác
//     for (const sheetName of rawWorkbook.SheetNames) {
//       if (sheetName === "PROMS" || sheetName === "PROOL_Dup") continue;
//       const sheet = workbook.addWorksheet(sheetName);
//       const wsData = XLSX.utils.sheet_to_json(rawWorkbook.Sheets[sheetName], { header: 1 });
//       console.log(`Sheet ${sheetName}: Số cột trong header: ${wsData[0]?.length || 0}`);

//       // Kiểm tra số cột
//       if (wsData[0]?.length >= MAX_EXCEL_COLUMNS) {
//         throw new Error(
//           `Sheet ${sheetName} có ${wsData[0].length} cột, vượt quá giới hạn ${MAX_EXCEL_COLUMNS}.`
//         );
//       }

//       wsData.forEach((row) => sheet.addRow(row));
//     }

//     // Xuất file và tải xuống
//     const buffer = await workbook.xlsx.writeBuffer();
//     const blob = new Blob([buffer], { type: "application/octet-stream" });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "Raw_Data_Export_With_Errors.xlsx";
//     a.click();
//     window.URL.revokeObjectURL(url);
//   } catch (error) {
//     console.error("Lỗi khi xuất file Excel:", error);
//     throw new Error(`Có lỗi xảy ra khi xuất file Excel: ${error.message}`);
//   }
// };




import ExcelJS from "exceljs";
import * as XLSX from "xlsx";

// Giới hạn cột tối đa của Excel
const MAX_EXCEL_COLUMNS = 16384;

// Hàm chuyển đổi ngày từ định dạng Excel serial hoặc string sang Date (UTC)
const parseDate = (dateRaw) => {
  let auditDate;
  if (typeof dateRaw === "number") {
    // Excel serial date
    const epoch = new Date(1899, 11, 30);
    auditDate = new Date(epoch.getTime() + dateRaw * 86400 * 1000);
  } else if (typeof dateRaw === "string") {
    if (dateRaw.includes("-")) {
      // Định dạng "YYYY-MM-DD"
      const [year, month, day] = dateRaw.split("-");
      auditDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    } else if (dateRaw.includes("/")) {
      // Định dạng "DD/MM/YYYY"
      const [day, month, year] = dateRaw.split("/");
      auditDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    }
  } else if (dateRaw instanceof Date) {
    auditDate = new Date(dateRaw);
  }

  if (!auditDate || isNaN(auditDate.getTime())) {
    throw new Error(`Ngày không hợp lệ: ${dateRaw}`);
  }

  // Đảm bảo ngày ở múi giờ UTC
  return new Date(Date.UTC(auditDate.getUTCFullYear(), auditDate.getUTCMonth(), auditDate.getUTCDate()));
};

// Hàm xuất file Excel với tô đỏ các dòng sai và thêm cột "Lý Do Sai"
export const exportRawDataWithErrors = async (rawWorkbook, bigPromotionResults) => {
  if (!bigPromotionResults || !rawWorkbook) {
    throw new Error("Không có dữ liệu đã xử lý hoặc workbook gốc để xuất. Vui lòng chạy kiểm tra trước.");
  }

  try {
    // Tạo workbook mới với ExcelJS
    const workbook = new ExcelJS.Workbook();

    // Process sheet "PROMS" (MS) hoặc "PROOL_Dup" (OL)
    const processSheet = (sheetName, results, promotionIdColumn) => {
      const sheet = workbook.addWorksheet(sheetName);
      const sheetData = XLSX.utils.sheet_to_json(rawWorkbook.Sheets[sheetName], { header: 1 });
      const headers = sheetData[0];
      // console.log(`Sheet ${sheetName}: Số cột trong header: ${headers.length}`);

      // Kiểm tra số cột
      if (headers.length >= MAX_EXCEL_COLUMNS) {
        throw new Error(
          `Sheet ${sheetName} có ${headers.length} cột, vượt quá giới hạn ${MAX_EXCEL_COLUMNS}. Không thể thêm cột "Lý Do Sai".`
        );
      }

      // Thêm cột "Lý Do Sai" vào header
      headers.push("Lý Do Sai");
      sheet.addRow(headers);

      // Tìm vị trí cột "Lý Do Sai"
      const reasonColumnIndex = headers.indexOf("Lý Do Sai") + 1; // +1 vì ExcelJS đếm cột từ 1

      // Ánh xạ dữ liệu
      const storeDateMap = {};
      sheetData.slice(1).forEach((row, index) => {
        const storeId = row[headers.indexOf("Store ID - Unilever")];
        const dateRaw = row[headers.indexOf("Date")];
        const promotionId = row[headers.indexOf(promotionIdColumn)];

        if (!storeId || !dateRaw || !promotionId) {
          // console.warn(
          //   `Dòng ${index + 2}: Thiếu dữ liệu - StoreID=${storeId}, Date=${dateRaw}, PromotionID=${promotionId}`
          // );
          return;
        }

        const auditDate = parseDate(dateRaw);

        console.log(auditDate,'02020202')
        if (!auditDate || isNaN(auditDate.getTime())) {
          // console.warn(`Dòng ${index + 2}: Ngày không hợp lệ - Date=${dateRaw}`);
          return;
        }

        const dateKey = auditDate.toISOString().split("T")[0]; // Ví dụ: "2025-03-01"
        const storeDateKey = `${storeId}_${dateKey}`;

        if (!storeDateMap[storeDateKey]) {
          storeDateMap[storeDateKey] = {
            storeId,
            date: dateKey,
            rowNumbers: [],
            promotionIds: new Set(),
          };
        }

        storeDateMap[storeDateKey].rowNumbers.push(index + 2); // +2 để điều chỉnh cho header và chỉ số bắt đầu từ 1
        storeDateMap[storeDateKey].promotionIds.add(promotionId);

     
      });

      // Log để kiểm tra storeDateMap

      // Tìm các dòng có sai sót
      const rowsWithErrors = new Set();
      const reasons = new Array(sheetData.length - 1).fill("");

      results?.dateResults?.forEach((dateResult) => {
        // Parse ngày từ giao diện (định dạng "DD/MM/YYYY") sang Date (UTC)
        const [day, month, year] = dateResult.date.split("/");
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
        const dateKey = date.toISOString().split("T")[0]; // Ví dụ: "2025-03-14"

        dateResult.customers.forEach((customerResult) => {
          customerResult.stores.forEach((store) => {
            const storeDateKey = `${store.storeId}_${dateKey}`;
            const storeData = storeDateMap[storeDateKey];

            if (!storeData) {
              console.warn(`Không tìm thấy store_date: ${storeDateKey}`);
              return;
            }

            let reason = "";
            if (store.message) {
              reason = store.message;
            } else if (store.missingPromotions.length > 0 || store.extraPromotions.length > 0) {
              if (store.missingPromotions.length > 0) {
                reason += `Thiếu khuyến mãi: ${store.missingPromotions.join(", ")}. `;
              }
              if (store.extraPromotions.length > 0) {
                reason += `Thừa khuyến mãi: ${store.extraPromotions.join(", ")}.`;
              }
            }

            if (reason) {
              storeData.rowNumbers.forEach((rowNumber) => {
                rowsWithErrors.add(rowNumber);
                reasons[rowNumber - 2] = reason.trim();
              });
            }
          });
        });
      });



      // Ghi từng dòng vào sheet
      sheetData.slice(1).forEach((row, index) => {
        const excelRow = sheet.addRow(row);
        // Ghi lý do sai sót vào cột "Lý Do Sai"
        excelRow.getCell(reasonColumnIndex).value = reasons[index] || "";
        if (rowsWithErrors.has(index + 2)) {
          excelRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFF0000" }, // Màu đỏ
            };
          });
        }
      });
    };

    // Process sheet "OSA"
    const processOSASheet = (sheetName, osaResults) => {
      const sheet = workbook.addWorksheet(sheetName);
      const sheetData = XLSX.utils.sheet_to_json(rawWorkbook.Sheets[sheetName], { header: 1 });
      const headers = sheetData[0];

      // Kiểm tra số cột
      if (headers.length >= MAX_EXCEL_COLUMNS) {
        throw new Error(
          `Sheet ${sheetName} có ${headers.length} cột, vượt quá giới hạn ${MAX_EXCEL_COLUMNS}. Không thể thêm cột "Lý Do Sai".`
        );
      }

      // Thêm cột "Lý Do Sai" vào header
      headers.push("Lý Do Sai");
      sheet.addRow(headers);

      // Tìm vị trí cột "Lý Do Sai"
      const reasonColumnIndex = headers.indexOf("Lý Do Sai") + 1; // +1 vì ExcelJS đếm cột từ 1

      // Tìm các dòng có sai sót
      const rowsWithErrors = new Set();
      const reasons = new Array(sheetData.length - 1).fill("");

      // Duyệt qua tất cả các dòng trong raw data và ghi vào sheet
      sheetData.slice(1).forEach((row, index) => {
        const storeId = row[headers.indexOf("Store ID - Unilever")];
        const itemCode = row[headers.indexOf("Product_id")]; // Sử dụng "Product_id" thay vì "ITEM CODE"

        // Log tất cả các dòng, bao gồm cả dòng không sai


        if (!storeId) {
          // console.warn(`Dòng ${index + 2}: Thiếu dữ liệu - StoreID=${storeId}`);
          // Vẫn ghi dòng này vào sheet, nhưng không xử lý sai sót
          const excelRow = sheet.addRow(row);
          excelRow.getCell(reasonColumnIndex).value = reasons[index] || "";
          return;
        }

        // Tìm cửa hàng trong osaResults (bao gồm cả fullyChecked, overdue, và discrepancies)
        const storeWithDiscrepancy = (osaResults?.discrepancies || []).find(
          (store) => store.storeCode === storeId
        );
        const storeInOverdue = (osaResults?.overdue || []).find(
          (store) => store.storeCode === storeId
        );
        const storeInFullyChecked = (osaResults?.fullyChecked || []).find(
          (store) => store.storeCode === storeId
        );

        let reason = "";
        if (storeWithDiscrepancy) {
          const missingItemCodes = storeWithDiscrepancy.missingItemCodes || [];
          const extraItemCodes = storeWithDiscrepancy.extraItemCodes || [];

          // Kiểm tra xem itemCode có nằm trong extraItemCodes không
          const isExtra = itemCode && extraItemCodes.map(String).includes(String(itemCode));

          if (isExtra) {
            if (missingItemCodes.length > 0) {
              reason += `Thiếu item: ${missingItemCodes.join(", ")}. `;
            }
            if (extraItemCodes.length > 0) {
              reason += `Thừa item: ${extraItemCodes.join(", ")}.`;
            }

            rowsWithErrors.add(index + 2);
            reasons[index] = reason.trim();
       
          } else {
            // Nếu không phải extraItemCodes, vẫn ghi lý do sai sót nếu có missingItemCodes
            if (missingItemCodes.length > 0) {
              reason += `Thiếu item: ${missingItemCodes.join(", ")}. `;
            }
            if (extraItemCodes.length > 0) {
              reason += `Thừa item: ${extraItemCodes.join(", ")}.`;
            }
            reasons[index] = reason.trim();
          
          }
        } else if (storeInOverdue) {
          const missingItemCodes = storeInOverdue.missingItemCodes || [];
          const extraItemCodes = storeInOverdue.extraItemCodes || [];

          if (missingItemCodes.length > 0) {
            reason += `Thiếu item: ${missingItemCodes.join(", ")}. `;
          }
          if (extraItemCodes.length > 0) {
            reason += `Thừa item: ${extraItemCodes.join(", ")}.`;
          }
          reasons[index] = reason.trim();
       
        } else if (storeInFullyChecked) {
          // console.log(
          //   `Dòng ${index + 2} (${sheetName}): StoreID=${storeId}, Product_id=${itemCode || "Không có Product_id"}, Reason=Không có sai sót (FullyChecked)`
          // );
        } else {
          // console.log(
          //   `Dòng ${index + 2} (${sheetName}): StoreID=${storeId}, Product_id=${itemCode || "Không có Product_id"}, Reason=Không tìm thấy cửa hàng trong osaResults`
          // );
        }

        // Ghi dòng vào sheet
        const excelRow = sheet.addRow(row);
        excelRow.getCell(reasonColumnIndex).value = reasons[index] || "";
        if (rowsWithErrors.has(index + 2)) {
          excelRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFF0000" }, // Màu đỏ
            };
          });
        }
      });

      // Thêm các dòng cho missingItemCodes
      (osaResults?.discrepancies || []).forEach((store) => {
        const storeId = store.storeCode;
        const missingItemCodes = store.missingItemCodes || [];
        const extraItemCodes = store.extraItemCodes || [];

        if (missingItemCodes.length > 0) {
          // Tìm thông tin ngày từ rawData
          const rawEntry = (osaResults?.rawData || []).find(
            (entry) => entry.storeId === storeId
          );
          const date = rawEntry?.date
            ? new Date(rawEntry.date).toISOString().split("T")[0]
            : "Không xác định";

          // Tạo dòng mới cho mỗi itemCode bị thiếu
          missingItemCodes.forEach((itemCode) => {
            const newRow = new Array(headers.length).fill("");
            newRow[headers.indexOf("Store ID - Unilever")] = storeId;
            newRow[headers.indexOf("Date")] = date;
            newRow[headers.indexOf("Product_id")] = itemCode; // Sử dụng "Product_id" thay vì "ITEM CODE"

            let reason = "";
            if (missingItemCodes.length > 0) {
              reason += `Thiếu item: ${missingItemCodes.join(", ")}. `;
            }
            if (extraItemCodes.length > 0) {
              reason += `Thừa item: ${extraItemCodes.join(", ")}.`;
            }

            const excelRow = sheet.addRow(newRow);
            excelRow.getCell(reasonColumnIndex).value = reason.trim();

            // Tô đỏ dòng này
            excelRow.eachCell({ includeEmpty: true }, (cell) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFF0000" }, // Màu đỏ
              };
            });

     
          });
        }
      });

  
    };

    // Process "PROMS" for MS
    if (rawWorkbook.Sheets["PROMS"] && bigPromotionResults.msResults) {
      processSheet("PROMS", bigPromotionResults.msResults, "PromotionID");
    }

    // Process "PROOL_Dup" for OL
    if (rawWorkbook.Sheets["PROOL_Dup"] && bigPromotionResults.olResults) {
      processSheet("PROOL_Dup", bigPromotionResults.olResults, "Promotion_id");
    }

    // Process "OSA" for OSA
    if (rawWorkbook.Sheets["OSA"] && bigPromotionResults.osaResults) {
      processOSASheet("OSA", bigPromotionResults.osaResults);
    }

    // Sao chép các sheet khác
    for (const sheetName of rawWorkbook.SheetNames) {
      if (sheetName === "PROMS" || sheetName === "PROOL_Dup" || sheetName === "OSA") continue;
      const sheet = workbook.addWorksheet(sheetName);
      const wsData = XLSX.utils.sheet_to_json(rawWorkbook.Sheets[sheetName], { header: 1 });

      // Kiểm tra số cột
      if (wsData[0]?.length >= MAX_EXCEL_COLUMNS) {
        throw new Error(
          `Sheet ${sheetName} có ${wsData[0].length} cột, vượt quá giới hạn ${MAX_EXCEL_COLUMNS}.`
        );
      }

      wsData.forEach((row) => sheet.addRow(row));
    }

    // Xuất file và tải xuống
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Raw_Data_Export_With_Errors.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Lỗi khi xuất file Excel:", error);
    throw new Error(`Có lỗi xảy ra khi xuất file Excel: ${error.message}`);
  }
};