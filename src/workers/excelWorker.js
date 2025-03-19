// excelWorker.js
/* eslint-disable no-undef, no-restricted-globals */
importScripts("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
importScripts("https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js");

self.onmessage = async (e) => {
  const { rawWorkbookData, scoringResults, promotionResults, sheetNames } = e.data;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(rawWorkbookData);

  const processSheet = (sheet, invalidRows, sheetIndex) => {
    const headerRow = sheet.getRow(1);
    const originalHeaders = Array.isArray(headerRow.values) ? headerRow.values.slice(1) : [];
    headerRow.values = [...originalHeaders, "Lỗi"];

    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    invalidRows.forEach((errorInfo) => {
      if (errorInfo.index > 1) { // Bỏ qua header
        const row = sheet.getRow(errorInfo.index);
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFCCCC" } };
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        });
        row.getCell(originalHeaders.length + 1).value = errorInfo.reason || errorInfo.message || "";
      }
    });

    sheet.columns.forEach((column, i) => {
      column.width = i === originalHeaders.length ? 50 : 20;
    });
  };

  if (scoringResults?.invalidRows?.length > 0) {
    processSheet(workbook.getWorksheet(sheetNames[1]), scoringResults.invalidRows);
  }

  console.log(promotionResults);
  
  if (promotionResults?.invalidRows?.length > 0 || promotionResults?.errors?.length > 0) {
    const allInvalidRows = [
      ...(promotionResults.invalidRows || []),
      ...(promotionResults.errors || []).map((e) => ({
        index: e.row || 0,
        reason: e.message,
      })),
    ].filter((row) => row.index > 1);
    processSheet(workbook.getWorksheet(sheetNames[5]), allInvalidRows);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  self.postMessage(buffer);
};