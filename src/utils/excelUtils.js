import * as XLSX from "xlsx";
import { DATE_FIELDS, RAW_DATA_HEADERS } from "../lib/constants";

export const processExcelFile = async (file) => {
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

export const processRawData = (data) => {
  const headers = data[0];

  return data.slice(2).reduce((acc, row) => {
    const item = {};
    headers.forEach((header, index) => {
      if (RAW_DATA_HEADERS.includes(header)) {
        item[header] = row[index];
      }
    });

    if (item["Product ID"] !== undefined) {
      acc.push(item);
    }

    return acc;
  }, []);
};

const excelSerialToDate = (serial) => {
  const epoch = new Date(1899, 11, 30);
  return new Date(epoch.getTime() + serial * 86400 * 1000);
};
