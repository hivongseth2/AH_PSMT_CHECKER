import React from "react";
import { Button } from "./button";
import { Download } from "lucide-react";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const ExportButton = ({ results, rawData }) => {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Raw Data Kết Quả");

    // Thêm headers từ rawData
    const headers = Object.keys(rawData[0] || {});
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: 20,
    }));
    worksheet.columns.push({ header: "Lỗi", key: "error", width: 50 });

    // Định dạng header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Thêm toàn bộ rawData và đánh dấu dòng sai
    rawData.forEach((row, index) => {
      const errorInfo = results.invalidRows?.find(r => r.index === index + 2);
      const newRow = worksheet.addRow({ ...row, error: errorInfo?.reason || "" });

      if (errorInfo) {
        // Tô đỏ dòng sai
        newRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFCCCC" }, // Màu đỏ nhạt
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }
    });

    // Tạo và lưu tệp
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `ket_qua_raw_data_${new Date().toISOString()}.xlsx`);
  };

  return (
    <Button
      onClick={exportToExcel}
      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
    >
      <Download className="mr-2" />
      Xuất Raw Data
    </Button>
  );
};

export default ExportButton;