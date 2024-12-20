import ExcelJS from "exceljs";

export const exportResults = async (results) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Kết quả");

  // Định nghĩa các cột
  worksheet.columns = [
    { header: "Loại", key: "type", width: 30 },
    { header: "Tiêu đề", key: "title", width: 45 },
    { header: "Nội dung", key: "message", width: 100 },
  ];

  // Thêm header với style
  const headerRow = worksheet.getRow(1);
  headerRow.values = ["Loại", "Tiêu đề", "Nội dung"];
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } }; // Chữ trắng
  headerRow.alignment = { horizontal: "center", vertical: "middle" }; // Căn giữa
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber <= 3) {
      // Chỉ áp dụng style cho 3 cột đầu
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0070C0" }, // Màu nền xanh
      };
    }
  });

  // Thêm dữ liệu với màu sắc theo loại
  results.forEach((result) => {
    const row = worksheet.addRow({
      type: result.type,
      title: result.title,
      message: result.message,
    });

    // Styling cho từng dòng dựa trên `type`
    const fillColor =
      result.type === "error"
        ? { argb: "FFFFCCCC" } // Màu đỏ nhạt
        : result.type === "info"
        ? { argb: "FFCCFFCC" } // Màu xanh nhạt
        : null;

    row.eachCell((cell, colNumber) => {
      if (colNumber <= 3) {
        // Chỉ style trong phạm vi 3 cột
        if (fillColor) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: fillColor,
          };
        }
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", horizontal: "left" }; // Căn trái dữ liệu
      }
    });
  });

  // Xuất file trên trình duyệt
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `ket_qua_${new Date().toISOString()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
