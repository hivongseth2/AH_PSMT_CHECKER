export const ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: (productId, date, store) =>
    `Không tìm thấy mã sản phẩm trong checklist: ${productId}. Ngày: ${date}, Cửa hàng: ${store}`,
  ROW_DATE_UNDEFINED: (productId, date, store) =>
    `rowDate undefined: ${productId}. Ngày: ${date}, Cửa hàng: ${store}`,
  INVALID_PRODUCT_BEFORE_FLEX: (productId, date) =>
    `Mã sản phẩm không hợp lệ trước khoảng thời gian linh động: ${productId}. Ngày: ${date}`,
  INVALID_NEW_CODE_AFTER_FLEX: (productId, date) =>
    `New code không đúng sau khoảng thời gian linh động (ngày hiện tại > flexEndDate): ${productId}. Ngày: ${date}`,
  INVALID_ITEM_CODE_AFTER_FLEX: (productId, date) =>
    `Item code không đúng sau khoảng thời gian linh động: ${productId}. Ngày: ${date}`,
  INVALID_PRODUCT_OUTSIDE_FLEX: (productId, date) =>
    `Mã sản phẩm không hợp lệ ngoài khoảng thời gian linh động: ${productId}. Ngày: ${date}`,
  INVALID_PRODUCT_DURING_FLEX: (productId, date) =>
    `Mã sản phẩm không hợp lệ trong khoảng thời gian linh động: ${productId}. Ngày: ${date}`,
  INVALID_PRODUCT_AFTER_FLEX: (productId, date) =>
    `Mã sản phẩm không phải là mã mới nhất sau khoảng thời gian linh động: ${productId}. Ngày: ${date}`,
  
};
