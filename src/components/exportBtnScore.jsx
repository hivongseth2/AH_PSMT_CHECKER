import React from "react";
import { Button } from "./button";
import { Download } from "lucide-react";
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const ExportButton = ({ results, filteredResults, showOnlyDiscrepancies }) => {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Scoring Results");

    // Add headers
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

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    // Add data
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

          // Add rows for missing SKUs
          storeData.missingSKUs.forEach((sku) => {
            worksheet.addRow([
              ...baseRow,
              sku,
              "Thiếu",
              `SKU ${sku} bị thiếu tại cửa hàng ${storeId}`,
            ]);
          });

          // Add rows for extra SKUs
          storeData.extraSKUs.forEach((sku) => {
            worksheet.addRow([
              ...baseRow,
              sku,
              "Thừa",
              `SKU ${sku} thừa tại cửa hàng ${storeId}`,
            ]);
          });

          // If there are no missing or extra SKUs, add a single row
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

    // Style the worksheet
    worksheet.columns.forEach((column, index) => {
      column.width = index === 7 ? 40 : 20; // Wider column for description
      column.alignment = { vertical: "middle", wrapText: true };
    });

    // Apply colors and borders
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
          row.getCell(5).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF92D050" },
          };
        } else {
          row.getCell(5).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFF0000" },
          };
        }

        if (skuType === "Thiếu") {
          row.getCell(7).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFF0000" }, // Red
          };
        } else if (skuType === "Thừa") {
          row.getCell(7).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF92D050" }, // Green
          };
        }
      }
    });

    // Generate and save the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `scoring_results_${new Date().toISOString()}.xlsx`);
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
