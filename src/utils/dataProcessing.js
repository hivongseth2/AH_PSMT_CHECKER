import { parseDate } from "./dateUtils";

export function processRawDataForScoring(rawData) {
  const result = {};

  rawData.forEach((row) => {

    const date = parseDate(row.Date);
    const storeId = row["Store ID - Unilever"];

    if (!result[date]) {
      result[date] = {};
    }

    if (!result[date][storeId]) {
      result[date][storeId] = 0;
    }

    result[date][storeId]++;
  });

  return result;
}

export function getExpectedSkuCount(checklistData, date, storeId) {
  // Filter checklist data for the given date and store
  const relevantItems = checklistData.filter((item) => {
    const startDate = parseDate(item["START DATE"]);
    const endDate = parseDate(item["END DATE"]);
    const currentDate = parseDate(date);
    return (
      currentDate >= startDate &&
      currentDate <= endDate &&
      item.stores[storeId] > 0
    );
  });

  return relevantItems.length;
}

export function compareActualVsExpected(processedRawData, checklistData) {
  const results = [];

  for (const [date, stores] of Object.entries(processedRawData)) {
    for (const [storeId, actualCount] of Object.entries(stores)) {
      const expectedCount = getExpectedSkuCount(checklistData, date, storeId);

      if (actualCount !== expectedCount) {
        const missingSKUs = checklistData
          .filter((item) => {
            const startDate = parseDate(item["START DATE"]);
            const endDate = parseDate(item["END DATE"]);
            const currentDate = parseDate(date);
            return (
              currentDate >= startDate &&
              currentDate <= endDate &&
              item.stores[storeId] > 0
            );
          })
          .map((item) => item["Item Code"]);

        results.push({
          date,
          storeId,
          expected: expectedCount,
          actual: actualCount,
          missingSKUs,
        });
      }
    }
  }

  return results;
}
