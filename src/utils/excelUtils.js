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
