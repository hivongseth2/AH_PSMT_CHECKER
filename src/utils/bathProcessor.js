export async function processBatch(items, batchSize, processItem, onBatchComplete) {
    const results = [];
  
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await new Promise((resolve) => {
        setTimeout(() => {
          const processed = batch.map((item, index) => processItem(item, i + index));
          resolve(processed);
        }, 0);
      });
  
      results.push(...batchResults);
  
      if (onBatchComplete) {
        onBatchComplete(batchResults);
      }
    }
  
    return results;
  }
  