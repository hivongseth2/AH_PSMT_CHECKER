/* eslint-disable no-undef, no-restricted-globals */

// excelWorker.js
importScripts("https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js");

self.onmessage = async (e) => {
  const { rawWorkbookData, scoringResults, promotionResults } = e.data;

  const workbook = new ExcelJS.Workbook();

  // Tải workbook từ ArrayBuffer
  await workbook.xlsx.load(rawWorkbookData);

  const processSheet = (sheet, invalidRows) => {
    const headerRow = sheet.getRow(1);
    const originalHeaders = headerRow.values.filter(Boolean);
    const errorColumnIndex = originalHeaders.length + 1;
    headerRow.getCell(errorColumnIndex).value = "Lỗi";

    // Định dạng header
    headerRow.eachCell({ includeEmpty: false }, (cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    // Tạo map cho các hàng lỗi
    const invalidRowMap = new Map(
      invalidRows
        .filter(row => row.index > 1 && row.index <= sheet.rowCount)
        .map(row => [row.index, row.reason || row.message || ""])
    );

    // Xử lý từng hàng lỗi mà không duyệt toàn bộ sheet
    invalidRowMap.forEach((reason, index) => {
      const row = sheet.getRow(index);
      row.eachCell({ includeEmpty: false }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFCCCC" } };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      });
      row.getCell(errorColumnIndex).value = reason;
    });

    // Tối ưu chiều rộng cột
    const columnCount = sheet.columnCount;
    for (let i = 0; i < columnCount; i++) {
      sheet.getColumn(i + 1).width = (i + 1 === errorColumnIndex) ? 50 : 20;
    }
  };

  // Xử lý sheet "OSA_RAW"
  const osaSheet = workbook.getWorksheet("OSA_RAW");
  if (osaSheet && scoringResults?.invalidRows?.length > 0) {
    processSheet(osaSheet, scoringResults.invalidRows);
  }

  // Xử lý sheet "PROOL"
  const proolSheet = workbook.getWorksheet("PROOL");
  if (proolSheet && (promotionResults?.invalidRows?.length > 0 || promotionResults?.errors?.length > 0)) {
    const allInvalidRows = [
      ...(promotionResults.invalidRows || []),
      ...(promotionResults.errors || []).map(e => ({ index: e.row || 0, message: e.message })),
    ].filter(row => row.index > 1);
    processSheet(proolSheet, allInvalidRows);
  }

  // Xuất buffer với tối ưu hóa bộ nhớ
  const buffer = await workbook.xlsx.writeBuffer({ useSharedStrings: true });
  self.postMessage(buffer);

  // Giải phóng bộ nhớ
  workbook.clear();
};