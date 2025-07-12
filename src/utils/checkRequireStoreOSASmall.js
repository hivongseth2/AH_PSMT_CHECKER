export const checkRequireStore = (storeData, rawData) => {
  const cleanedStoreData = storeData.map(s => s.trim());
    // unique store trong file raw
  const uniqueRawStoreMap = {};
  rawData.forEach(item => {
    const storeId = item["Store ID - Unilever"]?.trim();
    if (storeId && !uniqueRawStoreMap[storeId]) {
      uniqueRawStoreMap[storeId] = item;
    }
  });

  const rawStoreIds = Object.keys(uniqueRawStoreMap);
  // so sánh dư thiếu

  const missingInRaw = cleanedStoreData.filter(id => !rawStoreIds.includes(id));
  const extraInRaw = rawStoreIds.filter(id => !cleanedStoreData.includes(id));

  return {
    missingInRaw, // có trong storeData nhưng không có trong raw
    extraInRaw    // có trong raw nhưng không có trong storeData
  };
};
