export async function processBatch(
  items,
  batchSize,
  processItem,
  onBatchComplete,
  onProgress
) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const result = await new Promise((resolve) => {
      setTimeout(() => {
        resolve(processItem(items[i], i));
      }, 0);
    });

    results.push(result);

    if (onProgress) {
      onProgress((i + 1) / items.length);
    }

    if ((i + 1) % batchSize === 0 || i === items.length - 1) {
      if (onBatchComplete) {
        onBatchComplete(results.slice(-batchSize), i + 1, items.length);
      }
    }

    // Yield control back to the main thread every 10 items
    if ((i + 1) % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  return results;
}
