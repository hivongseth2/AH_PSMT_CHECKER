import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import Tooltip from "./tooltip";

const InvalidRowsDisplay = ({ invalidRows }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getSummaryData = (data) => {
    if (!data) return "Không có dữ liệu";
    const {
      "Report of Month": month,
      "Store name": store,
      Target,
      Stock,
    } = data;
    return `Tháng: ${month}, Cửa hàng: ${store}`;
  };

  const handleRowClick = (row) => {
    setSelectedRow(row);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedRow(null);
  };

  // Helper function to render row data as horizontal table
  const renderPopupTable = (data) => {
    const headers = Object.keys(data); // Lấy thành phần làm header
    const values = Object.values(data); // Lấy giá trị tương ứng

    return (
      <div className="overflow-x-auto w-full">
        <table className="table-auto w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-sm text-left">Thành phần</th>
              {headers.map((header, index) => (
                <th key={index} className="border px-2 py-1 text-sm text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1 text-sm">Giá trị</td>
              {values.map((value, index) => (
                <td
                  key={index}
                  className="border px-2 py-1 text-sm truncate max-w-xs"
                >
                  {value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="overflow-auto max-h-96">
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border px-4 py-2">Dòng</th>
            <th className="border px-4 py-2">Lý do</th>
            <th className="border px-4 py-2">Dữ liệu</th>
          </tr>
        </thead>
        <tbody>
          {invalidRows.map((row, index) => (
            <tr
              key={index}
              onClick={() => handleRowClick(row)}
              className="cursor-pointer hover:bg-gray-100"
            >
              <td className="border px-4 py-2">{row.index}</td>
              <td className="border px-4 py-2">{row.reason}</td>
              <td className="border px-4 py-2">
                <Tooltip content={JSON.stringify(row.data, null, 2)}>
                  {getSummaryData(row.data)}
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Popup */}
      {isDialogOpen && selectedRow && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-0 rounded-lg shadow-lg w-full max-w-full">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Chi tiết dữ liệu</CardTitle>
                <button className="text-red-500" onClick={closeDialog}>
                  X
                </button>
              </CardHeader>

              <CardContent>
                <div className="overflow-x-auto w-full">
                  {renderPopupTable(selectedRow.data)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvalidRowsDisplay;
