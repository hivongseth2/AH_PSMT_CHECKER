import React, { useState } from "react";
import { Button } from "./components/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/tabs";
import FileUpload from "./components/FileUpload";
import ResultDisplay from "./components/ResultDisplay";
import {
  CHECK_TYPES,
  FILE_TYPES,
  CHECKLIST_HEADERS,
  RAW_DATA_HEADERS,
  STORE_TYPES,
} from "./lib/constants";
import * as XLSX from "xlsx";
import { isWithinInterval, fromUnixTime } from "date-fns";

import { parseDate } from "./utils/dateUtils";

export default function App() {
  const [files, setFiles] = useState({
    [FILE_TYPES.CHECKLIST]: null,
    [FILE_TYPES.RAW_DATA]: null,
  });
  const [activeTab, setActiveTab] = useState(CHECK_TYPES.DAILY);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);

  // xlsx đọc dữ liệu date kiểu number cần parse
  const DATE_FIELDS = [
    "START DATE",
    "END DATE",
    "Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới",
    "Ngày Kết Thúc Linh Động Đo Hàng Cũ & Mới",
    "Ngày review SKU relaunch",
  ];
  // hàm parse dữ liệu
  const excelSerialToDate = (serial) => {
    const epoch = new Date(1899, 11, 30); // Ngày khởi đầu Excel
    return new Date(epoch.getTime() + serial * 86400 * 1000);
  };

  const handleFileChange = (type) => (event) => {
    if (event.target.files) {
      setFiles((prev) => ({
        ...prev,
        [type]: event.target.files[0],
      }));
    }
  };

  const processExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // xử lý dữ liệu checklist, date cua checklist khac nen phai xu ly kieu khac
  const processChecklistData = (data) => {
    const headers = data[10]; // Dòng đầu tiên là header

    const processedData = data.slice(1).map((row) => {
      const item = {}; // Object mới để lưu kết quả

      headers.forEach((header, index) => {
        const cellValue = row[index]; // Giá trị ô hiện tại

        if (DATE_FIELDS.includes(header) && typeof cellValue === "number") {
          // Chuyển đổi cột ngày tháng từ serial date
          item[header] = excelSerialToDate(cellValue);
        } else if (header?.startsWith("STR-")) {
          // Gom cột STR-* vào object stores
          if (!item.stores) item.stores = {};
          item.stores[header] = cellValue;
        } else {
          // Giữ nguyên giá trị các cột khác
          item[header] = cellValue;
        }
      });

      return item;
    });

    return processedData;
  };

  // xu ly raw dataa, nay xu ly don gian th
  const processRawData = (data) => {
    const headers = data[1];

    return data.slice(1).map((row) => {
      const item = {};
      headers.forEach((header, index) => {
        if (RAW_DATA_HEADERS.includes(header)) {
          item[header] = row[index];
        }
      });
      return item;
    });
  };

  // kieem tra du lieu
  const handleDataCheck = async () => {
    if (!files[FILE_TYPES.CHECKLIST] || !files[FILE_TYPES.RAW_DATA]) {
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const [checklistData, rawData] = await Promise.all([
        processExcelFile(files[FILE_TYPES.CHECKLIST]),
        processExcelFile(files[FILE_TYPES.RAW_DATA]),
      ]);

      // lay du lieu tu 2 file excel
      const processedChecklist = processChecklistData(checklistData);
      const processedRawData = processRawData(rawData);
      // bat dau kiem tra bat/ tat
      const validationResults = validateData(
        processedChecklist,
        processedRawData
      );

      setResults([
        {
          type: "info",
          title: "Thông tin tệp",
          message: `Đã xử lý ${processedChecklist.length} dòng từ checklist và ${processedRawData.length} dòng từ dữ liệu thô`,
        },
        {
          type: "info",
          title: "Kết quả kiểm tra",
          message: `
            Dữ liệu hợp lệ: ${validationResults.validCount}
            Dữ liệu không hợp lệ: ${validationResults.invalidCount}
            Dữ liệu ngoài phạm vi: ${validationResults.outOfRangeCount}
          `,
        },
        ...validationResults.errors.map((error) => ({
          type: "error",
          title: `Lỗi ở dòng ${error.row}`,
          message: error.message,
        })),
      ]);
    } catch (error) {
      setResults([
        {
          type: "error",
          title: "Lỗi xử lý",
          message: error.message,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };
  // ... (previous imports and component code remain unchanged)

  const validateData = (checklist, rawData) => {
    const results = {
      validCount: 0,
      invalidCount: 0,
      outOfRangeCount: 0,
      errors: [],
    };

    rawData.forEach((row, index) => {
      const checklistItem = checklist.find((item) => {
        const isMatchingProduct =
          item["Item Code"] == row["Product_id"] ||
          item["Old code"] == row["Product_id"] ||
          (item["New code"] && item["New code"] == row["Product_id"]);
      
        const rowStore = row["Store ID - Unilever"];
        const storeValue = Number(item.stores[rowStore]);


       console.log(`Store Value: ${storeValue}`);
      
        return isMatchingProduct && storeValue > 0; // Chỉ trả về mục khớp và `storeValue > 0`
      });

      if (!checklistItem) {
        results.invalidCount++;
        results.errors.push({
          row: index + 2,
          message: `Không tìm thấy mã sản phẩm trong checklist: ${row["Product_id"]}. Ngày: ${row.Date}, Cửa hàng: ${row["Store ID - Unilever"]}`,
        });
        return; // Continue to the next iteration
      }
      if (row.Date === undefined) {
        results.invalidCount++;
        results.errors.push({
          row: index + 1,
          message: `rowDate undefined: ${row["Product_id"]}. Ngày: ${row.Date}, Cửa hàng: ${row["Store ID - Unilever"]}`,
        });
        return; // Continue to the next iteration
      }

      console.log(row.Date, "row.date");

      const rowDate = parseDate(row.Date, "row.Date parse");

      console.log(
        checklistItem["Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới"],
        "Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới"
      );
      console.log(
        checklistItem["Ngày Kết Thúc Linh Động Đo Hàng Cũ & Mới"],
        "Ngày Kết Thúc Linh Động Đo Hàng Cũ & Mới"
      );

      const flexStartDate =
        checklistItem["Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới"] !== undefined
          ? checklistItem["Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới"]
          : null;

      const flexEndDate =
        checklistItem["Ngày Kết Thúc Linh Động Đo Hàng Cũ & Mới"] !== undefined
          ? checklistItem["Ngày Kết Thúc Linh Động Đo Hàng Cũ & Mới"]
          : null;

      let inFlexibleRange = false;
      if (flexStartDate && flexEndDate) {
        inFlexibleRange = isWithinInterval(rowDate, {
          start: flexStartDate,
          end: flexEndDate,
        });
      }

      const itemCode = String(checklistItem["Item Code"]);
      const newCode = checklistItem["New code"]
        ? String(checklistItem["New code"])
        : null;
      const oldCode = checklistItem["Old code"]
        ? String(checklistItem["Old code"])
        : null;
      const productId = String(row["Product_id"]);

      // tồn tại ngày bắt đầu linh động và ngày hiện tại nhỏ hơn ngày linh động
      if (flexStartDate && rowDate < flexStartDate) {
        // luôn luôn là item code

        if (productId === itemCode) {
          results.validCount++;
        } else {
          results.invalidCount++;
          results.errors.push({
            row: index + 2,
            message: `Mã sản phẩm không hợp lệ trước khoảng thời gian linh động: ${productId}. Ngày: ${row.Date}`,
          });
        }
      } 
      // ngày hiện tại lớn hơn ngày kết thúc linh động
      else if (flexStartDate && rowDate > flexEndDate) {

        if (newCode) {
          // Item Code + New Code : lấy new code
          if (productId == newCode) {
            results.validCount++;
          } else {
            results.outOfRangeCount++;
            results.errors.push({
              row: index + 2,
              message: `New code không đúng sau khoảng thời gian linh động (ngày hiện tại > flexEndDate): ${productId}. Ngày: ${row.Date}`,
            });
          }
        } else if (oldCode) {
          //Old Code + Item Code, check Item Code
          if (productId == itemCode) {
            results.validCount++;
          } else {
            results.outOfRangeCount++;
            results.errors.push({
              row: index + 2,
              message: `Item code không đúng sau khoảng thời gian linh động: ${productId}. Ngày: ${row.Date}`,
            });
          }
        } else {
          // chỉ có 1 mình item code
          if (productId == itemCode) {
            results.validCount++;
          } else {
            results.outOfRangeCount++;
            results.errors.push({
              row: index + 2,
              message: `Mã sản phẩm không hợp lệ ngoài khoảng thời gian linh động: ${productId}. Ngày: ${row.Date}`,
            });
          }
        }
      }
      // =================trong thời gian linh động
      else if (inFlexibleRange) {
        //trong khoảng thời gian linh động
        const validCombinations = [
          [itemCode, newCode].filter(Boolean),
          [oldCode, itemCode].filter(Boolean),
        ];

        // xuất hiện 2 mã
        const isValid = validCombinations.some(
          (combo) =>
            combo.length === 2 &&
            combo.map(String).includes(String(row["Product_id"]))
        );
        if (isValid) {
          results.validCount++;
        } else {
          results.invalidCount++;
          results.errors.push({
            row: index + 2,
            message: `Mã sản phẩm không hợp lệ hoặc không đủ trong khoảng thời gian linh động: ${productId}. Ngày: ${row.Date}`,
          });
        }
      } else {
        // ======================================================
        // sau khoảng thời gian linh động
        if (newCode) {
          // Item Code + New Code : lấy new code
          if (productId == newCode) {
            results.validCount++;
          } else {
            results.outOfRangeCount++;
            results.errors.push({
              row: index + 2,
              message: `Mã sản phẩm không phải là mã mới nhất sau khoảng thời gian linh động: ${productId}. Ngày: ${row.Date}`,
            });
          }
        } else if (oldCode) {
          //Old Code + Item Code, check Item Code
          if (productId == itemCode) {
            results.validCount++;
          } else {
            results.outOfRangeCount++;
            results.errors.push({
              row: index + 2,
              message: `Mã sản phẩm không phải là mã mới nhất ngoài khoảng thời gian linh động: ${productId}. Ngày: ${row.Date}`,
            });
          }
        } else {
          // chỉ có 1 mình item code
          if (productId == itemCode) {
            results.validCount++;
          } else {
            results.outOfRangeCount++;
            results.errors.push({
              row: index + 2,
              message: `Mã sản phẩm không hợp lệ ngoài khoảng thời gian linh động: ${productId}. Ngày: ${row.Date}`,
            });
          }
        }
      }
    });

    return results;
  };

  // ... (rest of the component code remains unchanged)

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <Card>
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl font-bold text-blue-900">
              Kiểm Tra PSMT- An Hòa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FileUpload
                label="File Kiểm Tra (Checklist)"
                accept=".xlsx,.xls"
                onChange={handleFileChange(FILE_TYPES.CHECKLIST)}
              />
              <FileUpload
                label="File Dữ Liệu Thô (Raw Data)"
                accept=".xlsx,.xls"
                onChange={handleFileChange(FILE_TYPES.RAW_DATA)}
              />
            </div>

            <Tabs>
              <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <TabsTrigger
                  isActive={activeTab === CHECK_TYPES.DAILY}
                  onClick={() => setActiveTab(CHECK_TYPES.DAILY)}
                >
                  Kiểm Tra Dữ Liệu Hàng Ngày
                </TabsTrigger>
                <TabsTrigger
                  isActive={activeTab === CHECK_TYPES.SCORING}
                  onClick={() => setActiveTab(CHECK_TYPES.SCORING)}
                >
                  Kiểm Tra Dữ Liệu Chấm Điểm
                </TabsTrigger>
                <TabsTrigger
                  isActive={activeTab === CHECK_TYPES.MONTHLY}
                  onClick={() => setActiveTab(CHECK_TYPES.MONTHLY)}
                >
                  Kiểm Tra Dữ Liệu Hàng Tháng
                </TabsTrigger>
              </TabsList>

              <TabsContent>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {activeTab === CHECK_TYPES.DAILY &&
                        "Kiểm Tra Dữ Liệu Hàng Ngày"}
                      {activeTab === CHECK_TYPES.SCORING &&
                        "Kiểm Tra Dữ Liệu Chấm Điểm"}
                      {activeTab === CHECK_TYPES.MONTHLY &&
                        "Kiểm Tra Dữ Liệu Hàng Tháng"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleDataCheck}
                      disabled={
                        !files[FILE_TYPES.CHECKLIST] ||
                        !files[FILE_TYPES.RAW_DATA] ||
                        isProcessing
                      }
                      isLoading={isProcessing}
                    >
                      {isProcessing ? "Đang Kiểm Tra..." : "Bắt Đầu Kiểm Tra"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <ResultDisplay results={results} isLoading={isProcessing} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
