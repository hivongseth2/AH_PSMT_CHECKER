import ExcelJS from "exceljs";

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