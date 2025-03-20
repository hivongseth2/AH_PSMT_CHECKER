import * as XLSX from "xlsx";
import {
  DATE_FIELDS,
  RAW_DATA_HEADERS,
  RAW_PROMOTION_DATA_HEADERS,
} from "../lib/constants";

export const processExcelFile = async (file, sheetName = null) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        let worksheet;
        if (sheetName) {
          worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            throw new Error(`Sheet "${sheetName}" not found in the workbook`);
          }
        } else {
          const firstSheetName = workbook.SheetNames[0];
          worksheet = workbook.Sheets[firstSheetName];
        }
// erm
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

export const processChecklistData = (data) => {
  const headers = data[9];

  const processedData = data.slice(1).map((row) => {
    const item = {};

    headers.forEach((header, index) => {
      const cellValue = row[index];

      if (DATE_FIELDS.includes(header) && typeof cellValue === "number") {
        item[header] = excelSerialToDate(cellValue);
      } else if (header?.startsWith("STR-")) {
        if (!item.stores) item.stores = {};
        item.stores[header] = cellValue;
      } else {
        item[header] = cellValue;
      }
    });

    return item;
  });

  return processedData;
};
export const processChecklistPromotionData = (data) => {
  const headers = data[5]; // Header chính
  const header1 = data[2]; // Header phụ
  const storeName = data[4]; // Dòng chứa tên store

  const processedData = data.slice(1).map((row) => {
    const item = {};

    headers.forEach((header, index) => {
      const cellValue = row[index];

      if (DATE_FIELDS.includes(header) && typeof cellValue === "number") {
        item[header] = excelSerialToDate(cellValue);
      } else if (
        header1 && 
        storeName && 
        storeName[index] && 
        typeof storeName[index] === "string" && 
        storeName[index].startsWith("TYPE")
      ) {
        if (!item.stores) item.stores = {};
        item.stores[storeName[index]] = cellValue;
      } else {
        item[header] = cellValue;
      }
    });

    return item;
  });

  if (processedData[8] && processedData[8].stores) {
    const storesLength = Object.keys(processedData[8].stores).length;
    console.log("Số lượng keys trong stores:", storesLength);
  } else {
    console.log("stores không tồn tại hoặc không hợp lệ.");
  }

  return processedData;
};

export const processPromotionRawData = (data) => {
  const headers = data[0];
  const uniqueItems = new Map();

  return data.slice(1).reduce((acc, row) => {
    const item = {};
    headers.forEach((header, index) => {
      if (RAW_PROMOTION_DATA_HEADERS.includes(header)) {
        item[header] = row[index];
      }
    });

    if (
      item["Product ID"] !== undefined &&
      item["Audit status"] !== "Not Yet"
    ) {
      const uniqueKey = `${item["Store ID - Unilever"]}_${item["Promotion ID"]}_${item["Product ID"]}`;
      const existingItem = uniqueItems.get(uniqueKey);

      if (!existingItem) {
        // Nếu chưa tồn tại thì thêm vào Map và danh sách
        uniqueItems.set(uniqueKey, item);
        acc.push(item);
      }
    }

    return acc;
  }, []);
};

export const processRawData = (data) => {
  const headers = data[0];

  return data.slice(1).reduce((acc, row) => {
    const item = {};
    headers.forEach((header, index) => {
      if (RAW_DATA_HEADERS.includes(header)) {
        item[header] = row[index];
      }
    });

    if (
      item["Product ID"] !== undefined &&
      item["Audit status"] !== "Not Yet"
    ) {
      acc.push(item);
    }

    return acc;
  }, []);
};

const excelSerialToDate = (serial) => {
  const epoch = new Date(1899, 11, 30);
  return new Date(epoch.getTime() + serial * 86400 * 1000);
};
// New function for Big Format checklist

export const processChecklistBigFormatData = (data) => {
  // Step 1: Identify the main headers (Row 5, index 4)
  const promotionHeaders = data[5];
  if (!promotionHeaders || !promotionHeaders.includes("KA")) {
    throw new Error("Could not find main headers (expected 'KA' in Row 5).");
  }

  // Step 2: Get the store code mappings (Row 3, index 2)
  const storeCodeMappings = data[4];
  if (!storeCodeMappings || !storeCodeMappings.some(code => code && code.startsWith("STR-"))) {
    throw new Error("Could not find ESSSTORECODE mappings in Row 3.");
  }

  // Step 3: Process promotion data (starting from Row 7, index 6)
  const promotionData = data.slice(8).filter(row => row[0]);

  // Step 4: Create a mapping of store names to ESSSTORECODE
  const storeNameToCodeMap = {};
  const uniqueStoreCodes = new Set();
  promotionHeaders.forEach((header, index) => {
    if (storeCodeMappings[index] && storeCodeMappings[index].startsWith("STR-")) {
      storeNameToCodeMap[header] = storeCodeMappings[index];
      uniqueStoreCodes.add(storeCodeMappings[index]);
    }
  });

  // Step 5: Process promotion data and compute statistics
  const customerStats = {};

  const promotions = promotionData.map((row) => {
    const item = {};

    promotionHeaders.forEach((header, index) => {
      const cellValue = row[index];

      // Handle date fields
      if (DATE_FIELDS.includes(header)) {
        if (typeof cellValue === "number") {
          item[header] = excelSerialToDate(cellValue);
        } else if (typeof cellValue === "string") {
          const [day, month, year] = cellValue.split("/");
          item[header] = new Date(`${year}-${month}-${day}`);
        } else {
          item[header] = cellValue;
        }
      }
      // Handle store-specific columns
      else if (storeNameToCodeMap[header]) {
        if (!item.stores) item.stores = {};
        const storeCode = storeNameToCodeMap[header];
        item.stores[storeCode] = cellValue === "Y" ? true : false;
      }
      // Handle other columns
      else {
        item[header] = cellValue;
      }
    });

    // Compute statistics for each customer
    const customer = item["CUSTOMER"] || "Unknown";
    if (!customerStats[customer]) {
      customerStats[customer] = {
        totalPromotions: 0,
        auditedPromotions: 0,
        dateRanges: new Set(),
        storeAuditCounts: {},
      };
    }

    customerStats[customer].totalPromotions += 1;

    if (item["AUDIT ON MS"] === "Y") {
      customerStats[customer].auditedPromotions += 1;

      // Collect date ranges
      const rangeKey = `${item["START DATE"].toLocaleDateString("en-GB")}-${item["END DATE"].toLocaleDateString("en-GB")}`;
      customerStats[customer].dateRanges.add(rangeKey);

      // Store audit counts
      if (item.stores) {
        Object.entries(item.stores).forEach(([storeCode, isAudited]) => {
          if (isAudited) {
            customerStats[customer].storeAuditCounts[storeCode] =
              (customerStats[customer].storeAuditCounts[storeCode] || 0) + 1;
          }
        });
      }
    }

    return item;
  });

  // Step 6: Compile statistics
  const statistics = {
    customerStats: Object.keys(customerStats).reduce((acc, customer) => {
      acc[customer] = {
        totalPromotions: customerStats[customer].totalPromotions,
        auditedPromotions: customerStats[customer].auditedPromotions,
        totalStores: Object.keys(customerStats[customer].storeAuditCounts).length,
        dateRanges: Array.from(customerStats[customer].dateRanges).map(range => {
          const [start, end] = range.split("-");
          return {
            startDate: start,
            endDate: end
          };
        }),
        storeAuditCounts: customerStats[customer].storeAuditCounts,
      };
      return acc;
    }, {}),
    totalStores: uniqueStoreCodes.size,
  };

  return {
    promotions,
    statistics
  };
};

export const processBIGPromotionRawData = (data, sheetName) => {
  const headers = data[0];
  const uniqueItems = new Map();

  // Define header mappings for Big Format (MS and OL)
  const headerMapping = {
    "Report of month": "ReportMonth",
    "Loại": "Type",
    "Date": "Date",
    "Time": "Time",
    "Store ID - Unilever": "StoreID",
    "Store_name": "StoreName",
    "Customer ID": "CustomerID",
    "Customer": "Customer",
    "Supervisor": "Supervisor",
    "PS Category ID": "PSCategoryID",
    "PS Category": "PSCategory",
    "Product_id": "ProductID",
    "PromotionID": "PromotionID",
    "Product": "Product",
    "Mechanic": "Mechanic",
    "Vị trí": "Position",
    "Hiện diện SP (1/0)": "ProductPresence",
    "Nội dung KM (1/0)": "PromotionContent",
    "Thông báo KM (1/0)": "PromotionNotice",
    "Kết quả (1/0)": "Result",
    "Lý do": "Reason",
    "Comment": "Comment",
    "Reject (1/0)": "Reject",
    "Lý  do": "RejectReason", // Handle the duplicate "Lý do" by renaming
    "Team dự án Revise": "TeamProjectRevise",
    "Team dự án phản hồi": "TeamProjectResponse",
    "Final Reject": "FinalReject",
    "SR không đồng ý": "SRDisagree",
    "Nội dung phản hồi": "ResponseContent",
    "AH phản hồi": "AHResponse",
    "AUDIT": "AuditStatus",
  };

  // Map the raw headers to standardized keys
  const mappedHeaders = headers.map((header) => headerMapping[header] || header);

  // Validate required headers
  const requiredHeaders = ["Customer", "Date", "PromotionID", "Result"];
  const missingHeaders = requiredHeaders.filter((header) => !mappedHeaders.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers in raw data (${sheetName}): ${missingHeaders.join(", ")}`);
  }

  return data.slice(1).reduce((acc, row) => {
    const item = {};
    mappedHeaders.forEach((header, index) => {
      let cellValue = row[index];

      // Handle date fields
      if (header === "Date") {
        if (typeof cellValue === "number") {
          cellValue = excelSerialToDate(cellValue);
        } else if (typeof cellValue === "string") {
          // Handle date strings in various formats
          if (cellValue.includes("-")) {
            // Format: "YYYY-MM-DD" (e.g., "2025-03-01")
            const [year, month, day] = cellValue.split("-");
            cellValue = new Date(`${year}-${month}-${day}`);
          } else if (cellValue.includes("/")) {
            // Format: "DD/MM/YYYY" (e.g., "01/03/2025")
            const [day, month, year] = cellValue.split("/");
            cellValue = new Date(`${year}-${month}-${day}`);
          } else {
            throw new Error(`Invalid date format in raw data (${sheetName}): ${cellValue}`);
          }
        }
      }

      item[header] = cellValue;
    });

    // Filter out items where Result is not 1 (assuming Kết quả (1/0) indicates audit completion)
    if (
      item["ProductID"] !== undefined 
   
    ) {
      const uniqueKey = `${item["StoreID"]}_${item["PromotionID"]}_${item["ProductID"]}`;
      const existingItem = uniqueItems.get(uniqueKey);

      if (!existingItem) {
        uniqueItems.set(uniqueKey, item);
        acc.push(item);
      }
    }

    return acc;
  }, []);
};