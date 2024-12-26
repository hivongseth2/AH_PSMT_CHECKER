import React from "react";
import { Button } from "./button";
import { Download } from "lucide-react";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const ExportButton = ({ results, filteredResults, showOnlyDiscrepancies }) => {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Kết quả chấm điểm");

    // Thêm tiêu đề cho sheet chính
    worksheet.addRow([
      "Ngày",
      "Mã Cửa hàng",
      "SKU Kỳ vọng",
      "SKU Thực tế",
      "Trạng thái",
      "SKU",
      "Loại",
      "Mô tả",
    ]);

    // Định dạng tiêu đề
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    // Thêm dữ liệu
    const dataToExport = showOnlyDiscrepancies
      ? filteredResults
      : results.skuCounts;
    Object.entries(dataToExport).forEach(([date, stores]) => {
      Object.entries(stores).forEach(([storeId, storeData]) => {
        if (!showOnlyDiscrepancies || storeData.expected !== storeData.actual) {
          const baseRow = [
            new Date(date).toLocaleDateString("vi-VN"),
            storeId,
            storeData.expected,
            storeData.actual,
            storeData.expected === storeData.actual ? "Đạt" : "Không đạt",
          ];

          // Thêm các dòng cho SKU thiếu
          storeData.missingSKUs.forEach((sku) => {
            worksheet.addRow([
              ...baseRow,
              sku,
              "Thiếu",
              `SKU ${sku} bị thiếu tại cửa hàng ${storeId}`,
            ]);
          });

          // Thêm các dòng cho SKU thừa
          storeData.extraSKUs.forEach((sku) => {
            worksheet.addRow([
              ...baseRow,
              sku,
              "Thừa",
              `SKU ${sku} thừa tại cửa hàng ${storeId}`,
            ]);
          });

          // Nếu không có SKU thiếu hoặc thừa, thêm một dòng duy nhất
          if (
            storeData.missingSKUs.length === 0 &&
            storeData.extraSKUs.length === 0
          ) {
            worksheet.addRow([
              ...baseRow,
              "",
              "",
              "Không có SKU thiếu hoặc thừa",
            ]);
          }
        }
      });
    });

    // Thêm dữ liệu ngày không hợp lệ vào một sheet riêng
    if (results.invalidRows && results.invalidRows.length > 0) {
      const invalidSheet = workbook.addWorksheet("Dữ liệu không hợp lệ");

      // Thêm tiêu đề gồm "Dòng", "Lý do", và các key từ row.data
      const sampleRowData = results.invalidRows[0]?.data || {};
      const headers = [
        "STT",
        "Dòng tương ứng file RAW",
        "Lý do",
        ...Object.keys(sampleRowData),
      ];

      invalidSheet.addRow(headers);

      // Thêm dữ liệu cho sheet không hợp lệ
      results.invalidRows.forEach((row, index) => {
        const rowData = row.data || {};
        const rowValues = [
          index + 1, // Thêm số dòng
          row.index + 1,

          row.reason || "", // Lý do
          ...Object.keys(sampleRowData).map((key) => rowData[key] || ""), // Các giá trị từ row.data
        ];
        invalidSheet.addRow(rowValues);
      });
    }

    // Định dạng worksheet chính
    worksheet.columns.forEach((column, index) => {
      column.width = index === 7 ? 40 : 20; // Cột mô tả rộng hơn
      column.alignment = { vertical: "middle", wrapText: true };
    });

    // Áp dụng màu sắc và đường viền
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      if (rowNumber !== 1) {
        const status = row.getCell(5).value;
        const skuType = row.getCell(7).value;

        if (status === "Đạt") {
          row.getCell(5).font = { color: { argb: "FF008000" } }; // Màu xanh đậm
        } else if (status === "Không đạt") {
          row.getCell(5).font = { color: { argb: "FFFF0000" } }; // Màu đỏ
        }

        if (skuType === "Thiếu") {
          row.getCell(7).font = { color: { argb: "FFFF0000" } }; // Màu đỏ
        } else if (skuType === "Thừa") {
          row.getCell(7).font = { color: { argb: "FF008000" } }; // Màu xanh đậm
        }
      }
    });

    // Tạo và lưu tệp
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `ket_qua_cham_diem_${new Date().toISOString()}.xlsx`);
  };

  return (
    <Button
      onClick={exportToExcel}
      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
    >
      <Download className="mr-2" />
      Xuất kết quả Excel
    </Button>
  );
};

export default ExportButton;
