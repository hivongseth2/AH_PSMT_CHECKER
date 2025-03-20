import ExcelJS from "exceljs";
import * as XLSX from "xlsx";

export const exportResults = async (rawData, results, fileType) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Kết quả");

  // Lấy headers từ raw data
  const headers = Object.keys(rawData[0] || {});
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: 20,
  }));

  // Thêm cột ghi chú lỗi
  worksheet.columns.push({
    header: "Ghi chú lỗi",
    key: "errorNote",
    width: 50
  });

  // Style header
  const headerRow = worksheet.getRow(1);
  headerRow.font = {
    bold: true,
    color: {
      argb: "FFFFFFFF"
    }
  };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: {
      argb: "FF0070C0"
    },
  };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: {
        style: "thin"
      },
      bottom: {
        style: "thin"
      },
      left: {
        style: "thin"
      },
      right: {
        style: "thin"
      },
    };
  });

  // Thêm dữ liệu
  rawData.forEach((row, index) => {
    const resultRow = worksheet.addRow({
      ...row
    });
    const errorInfo = fileType === "OSA" ?
      results.invalidRows.find(r => r.index === index + 2) :
      results.invalidRows.find(r => r.index === index + 2) ||
      results.errors.find(e => e.row === index + 2);

    if (errorInfo) {
      // Tô đỏ dòng sai
      resultRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FFFFCCCC"
          }, // Màu đỏ nhạt
        };
        cell.border = {
          top: {
            style: "thin"
          },
          bottom: {
            style: "thin"
          },
          left: {
            style: "thin"
          },
          right: {
            style: "thin"
          },
        };
      });
      // Ghi chú lỗi
      resultRow.getCell("errorNote").value = errorInfo.reason || errorInfo.message;
    }
  });

  // Xuất file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ket_qua_${fileType}_${new Date().toISOString()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


const MAX_EXCEL_COLUMNS = 16384;

// Hàm chuyển đổi ngày từ định dạng Excel serial hoặc string sang Date
const parseDate = (dateRaw) => {
  let auditDate;
  if (typeof dateRaw === "number") {
    const epoch = new Date(1899, 11, 30);
    auditDate = new Date(epoch.getTime() + dateRaw * 86400 * 1000);
  } else if (typeof dateRaw === "string") {
    if (dateRaw.includes("-")) {
      const [year, month, day] = dateRaw.split("-");
      auditDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    } else if (dateRaw.includes("/")) {
      const [day, month, year] = dateRaw.split("/");
      auditDate = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    }
  } else if (dateRaw instanceof Date) {
    auditDate = dateRaw;
  }
  return auditDate;
};

// Hàm xuất file Excel với tô đỏ các dòng sai và thêm cột "Lý Do Sai"
export const exportResultsBig = async (rawWorkbook, bigPromotionResults) => {
  if (!bigPromotionResults || !rawWorkbook) {
    throw new Error("Không có dữ liệu đã xử lý hoặc workbook gốc để xuất. Vui lòng chạy kiểm tra trước.");
  }

  try {
    // Tạo workbook mới với ExcelJS
    const workbook = new ExcelJS.Workbook();

    // Bước 1: Xử lý sheet "PROMS"
    const promsSheet = workbook.addWorksheet("PROMS");
    const promsData = XLSX.utils.sheet_to_json(rawWorkbook.Sheets["PROMS"], { header: 1 });
    const headers = promsData[0];
    console.log(`Sheet PROMS: Số cột trong header: ${headers.length}`);

    // Kiểm tra số cột
    if (headers.length >= MAX_EXCEL_COLUMNS) {
      throw new Error(
        `Sheet PROMS có ${headers.length} cột, vượt quá giới hạn ${MAX_EXCEL_COLUMNS}. Không thể thêm cột "Lý Do Sai".`
      );
    }

    // Thêm cột "Lý Do Sai" vào header
    headers.push("Lý Do Sai");
    promsSheet.addRow(headers);

    // Tìm vị trí cột "Lý Do Sai"
    const reasonColumnIndex = headers.indexOf("Lý Do Sai") + 1; // +1 vì ExcelJS đếm cột từ 1
    console.log(`Cột "Lý Do Sai" nằm ở vị trí: ${reasonColumnIndex}`);

    // Ánh xạ dữ liệu
    const storeDateMap = {};
    promsData.slice(1).forEach((row, index) => {
      const storeId = row[headers.indexOf("Store ID - Unilever")];
      const dateRaw = row[headers.indexOf("Date")];
      const promotionId = row[headers.indexOf("PromotionID")];

      if (!storeId || !dateRaw || !promotionId) {
        console.warn(`Dòng ${index + 2}: Thiếu dữ liệu - StoreID=${storeId}, Date=${dateRaw}, PromotionID=${promotionId}`);
        return;
      }

      const auditDate = parseDate(dateRaw);
      if (!auditDate || isNaN(auditDate.getTime())) {
        console.warn(`Dòng ${index + 2}: Ngày không hợp lệ - Date=${dateRaw}`);
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
    console.log("storeDateMap:", Object.keys(storeDateMap));

    // Tìm các dòng có sai sót
    const rowsWithErrors = new Set();
    const reasons = new Array(promsData.length - 1).fill("");

    bigPromotionResults.msResults?.dateResults?.forEach((dateResult) => {
      // Parse ngày từ msResults (định dạng "DD/MM/YYYY") theo UTC
      const [day, month, year] = dateResult.date.split("/");
      const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
      const dateKey = date.toISOString().split("T")[0];
      console.log(`Kiểm tra ngày: ${dateResult.date} (dateKey: ${dateKey})`);

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
            console.log(`Tìm thấy sai sót tại ${storeDateKey}: ${reason}`);
            storeData.rowNumbers.forEach((rowNumber) => {
              rowsWithErrors.add(rowNumber);
              reasons[rowNumber - 2] = reason.trim();
            });
          }
        });
      });
    });

    // Log để kiểm tra các dòng có sai sót
    console.log("rowsWithErrors:", Array.from(rowsWithErrors));
    console.log("reasons:", reasons.filter((r) => r !== ""));

    // Ghi từng dòng vào sheet "PROMS"
    promsData.slice(1).forEach((row, index) => {
      const excelRow = promsSheet.addRow(row);
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

    // Bước 2: Sao chép các sheet khác
    for (const sheetName of rawWorkbook.SheetNames) {
      if (sheetName === "PROMS") continue;
      const sheet = workbook.addWorksheet(sheetName);
      const wsData = XLSX.utils.sheet_to_json(rawWorkbook.Sheets[sheetName], { header: 1 });
      console.log(`Sheet ${sheetName}: Số cột trong header: ${wsData[0]?.length || 0}`);

      // Kiểm tra số cột
      if (wsData[0]?.length >= MAX_EXCEL_COLUMNS) {
        throw new Error(
          `Sheet ${sheetName} có ${wsData[0].length} cột, vượt quá giới hạn ${MAX_EXCEL_COLUMNS}.`
        );
      }

      wsData.forEach((row) => sheet.addRow(row));
    }

    // Bước 3: Xuất file và tải xuống
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