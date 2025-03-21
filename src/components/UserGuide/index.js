import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";

export default function UserGuide() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <Card>
          <CardHeader className="text-center border-b">
            <CardTitle className="text-2xl font-bold text-blue-900">
              Hướng Dẫn Sử Dụng Ứng Dụng Kiểm Tra PSMT - An Hòa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Giới Thiệu
              </h2>
              <p className="text-gray-700">
                Ứng dụng này được thiết kế để kiểm tra dữ liệu PSMT (Promotion & OSA) từ các file Excel, hỗ trợ cả hai định dạng: <strong>Small Format</strong> và <strong>Big Format</strong>. 
                Trong đó:
                <ul className="list-disc ml-6 mt-2">
                  <li><strong>Small Format</strong>: Kiểm tra OSA (Raw Data) và Promotion.</li>
                  <li><strong>Big Format</strong>: Kiểm tra Promotion MS và Promotion OL.</li>
                </ul>
                Tất cả các chức năng hiện tại đều hoạt động tốt, bao gồm tải file, kiểm tra dữ liệu và xuất kết quả.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Hướng Dẫn Chung
              </h2>
              <p className="text-gray-700">
                Để sử dụng ứng dụng, bạn cần chuẩn bị hai loại file Excel:
              </p>
              <ul className="list-decimal ml-6 mt-2 text-gray-700">
                <li><strong>File Kiểm Tra (Checklist)</strong>: Chứa danh sách các mục cần kiểm tra (OSA, Promotion, v.v.).</li>
                <li><strong>File Dữ Liệu Thô (Raw Data)</strong>: Chứa dữ liệu thực tế từ hệ thống để so sánh.</li>
              </ul>
              <p className="text-gray-700 mt-2">
                Sau khi tải file, chọn tab tương ứng với định dạng cần kiểm tra, nhấn nút "Bắt Đầu Kiểm Tra", và chờ kết quả. Sau khi kiểm tra xong, bạn có thể xuất file Excel với các lỗi được đánh dấu.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                1. Kiểm Tra Small Format (OSA & Promotion)
              </h2>
              <p className="text-gray-700">
                Chức năng này kiểm tra dữ liệu OSA (Availability) và Promotion cho định dạng nhỏ.
              </p>
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Các Bước:</h3>
              <ol className="list-decimal ml-6 text-gray-700">
                <li>Chọn tab <strong>"Kiểm Tra OSA, Pro Small"</strong>.</li>
                <li>Tải lên <strong>File Checklist</strong> và <strong>File Raw Data</strong> theo định dạng dưới đây.</li>
                <li>Nhấn <strong>"Bắt Đầu Kiểm Tra"</strong> để xử lý dữ liệu.</li>
                <li>Xem kết quả trên giao diện:
                  <ul className="list-disc ml-6 mt-1">
                    <li>Kết quả OSA: Số lượng SKU thực tế so với kỳ vọng.</li>
                    <li>Kết quả Promotion: Số lượng promotion thực tế so với checklist.</li>
                  </ul>
                </li>
                <li>Nhấn <strong>"Xuất dữ liệu kiểm tra"</strong> để tải file Excel với các lỗi được tô đỏ và cột "Lý Do Sai".</li>
              </ol>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Định Dạng File:</h3>
              <div className="text-gray-700">
                <p><strong>1. File Checklist:</strong></p>
                <ul className="list-disc ml-6 mt-1">
                  <li><strong>Sheet "OSA"</strong>:
                    <ul className="list-circle ml-6">
                      <li><strong>Các cột bắt buộc</strong>: "Item Code", "START DATE", "END DATE", "Old code", "New code", "Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới", "Ngày Kết Thúc Linh Động Đo Hàng Cũ & Mới".</li>
                      <li><strong>Các cột store</strong>: Tên cột bắt đầu bằng "STR-" (ví dụ: "STR-001"), giá trị là số lượng SKU kỳ vọng tại store đó.</li>
                      <li><strong>Định dạng ngày</strong>: Excel serial number (ví dụ: 45135) hoặc "DD/MM/YYYY".</li>
                    </ul>
                  </li>
                  <li><strong>Sheet "PROMOTION"</strong>:
                    <ul className="list-circle ml-6">
                      <li><strong>Các cột bắt buộc</strong>: "Promotion ID", "Customer", "START DATE", "END DATE".</li>
                      <li><strong>Các cột store</strong>: Tên cột là "TYPE" + tên loại store (ví dụ: "TYPEMT"), giá trị "Y" nếu store đó cần kiểm tra promotion.</li>
                      <li><strong>Định dạng ngày</strong>: Excel serial number hoặc "DD/MM/YYYY".</li>
                    </ul>
                  </li>
                </ul>
                <p className="mt-2"><strong>2. File Raw Data:</strong></p>
                <ul className="list-disc ml-6 mt-1">
                  <li><strong>Sheet "OSA_RAW"</strong>:
                    <ul className="list-circle ml-6">
                      <li><strong>Các cột bắt buộc</strong>: "Product ID", "Store ID - Unilever", "Date", "Audit status".</li>
                      <li><strong>Điều kiện lọc</strong>: Chỉ lấy các dòng có "Audit status" khác "Not Yet".</li>
                      <li><strong>Định dạng ngày</strong>: "YYYY-MM-DD", "DD/MM/YYYY", hoặc Excel serial number.</li>
                    </ul>
                  </li>
                  <li><strong>Sheet "PROOL"</strong>:
                    <ul className="list-circle ml-6">
                      <li><strong>Các cột bắt buộc</strong>: "Promotion ID", "Store ID - Unilever", "Customer", "Date", "TYPESTORE", "Product ID", "Audit status".</li>
                      <li><strong>Điều kiện lọc</strong>: Chỉ lấy các dòng có "Audit status" khác "Not Yet".</li>
                      <li><strong>Định dạng ngày</strong>: "YYYY-MM-DD", "DD/MM/YYYY", hoặc Excel serial number.</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                2. Kiểm Tra Big Format (Promotion MS & Promotion OL)
              </h2>
              <p className="text-gray-700">
                Chức năng này kiểm tra dữ liệu Promotion cho định dạng lớn, chia thành MS (Modern Store) và OL (Online).
              </p>
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Các Bước:</h3>
              <ol className="list-decimal ml-6 text-gray-700">
                <li>Chọn tab <strong>"Kiểm Tra Promotion Big"</strong>.</li>
                <li>Tải lên <strong>File Checklist</strong> và <strong>File Raw Data</strong> theo định dạng dưới đây.</li>
                <li>Nhấn <strong>"Bắt Đầu Kiểm Tra"</strong> để xử lý dữ liệu.</li>
                <li>Xem kết quả trên giao diện:
                  <ul className="list-disc ml-6 mt-1">
                    <li><strong>Promotion MS</strong>: Kiểm tra promotion dựa trên cột "AUDIT ON MS" = "Y".</li>
                    <li><strong>Promotion OL</strong>: Kiểm tra promotion dựa trên "Y" trong các cột store.</li>
                  </ul>
                </li>
                <li>Nhấn <strong>"Xuất dữ liệu kiểm tra"</strong> để tải file Excel với các lỗi được tô đỏ và cột "Lý Do Sai".</li>
              </ol>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Định Dạng File:</h3>
              <div className="text-gray-700">
                <p><strong>1. File Checklist:</strong></p>
                <ul className="list-disc ml-6 mt-1">
                  <li><strong>Sheet "3. Pro MS & 4. Pro OL"</strong>:
                    <ul className="list-circle ml-6">
                      <li><strong>Các cột bắt buộc</strong>: "CUSTOMER", "PROMOTION ID", "START DATE", "END DATE", "AUDIT ON MS".</li>
                      <li><strong>Các cột store</strong>: Tên cột là tên store (ví dụ: "KA"), giá trị "Y" nếu store đó cần kiểm tra promotion; ánh xạ với mã "STR-" (ví dụ: "STR-001") ở dòng header phụ.</li>
                      <li><strong>Định dạng ngày</strong>: Excel serial number hoặc "DD/MM/YYYY".</li>
                      <li><strong>Ghi chú</strong>: Dòng 5 chứa header chính, dòng 3 chứa mã store (STR-xxx).</li>
                    </ul>
                  </li>
                </ul>
                <p className="mt-2"><strong>2. File Raw Data:</strong></p>
                <ul className="list-disc ml-6 mt-1">
                  <li><strong>Sheet "PROMS" (cho MS)</strong>:
                    <ul className="list-circle ml-6">
                      <li><strong>Các cột bắt buộc</strong>: "StoreID", "Date", "PromotionID", "Customer", "ProductID".</li>
                      <li><strong>Định dạng ngày</strong>: "YYYY-MM-DD", "DD/MM/YYYY", hoặc Excel serial number.</li>
                    </ul>
                  </li>
                  <li><strong>Sheet "PROOL_Dup" (cho OL)</strong>:
                    <ul className="list-circle ml-6">
                      <li><strong>Các cột bắt buộc</strong>: "StoreID", "Date", "Promotion_id", "Customer", "ProductID".</li>
                      <li><strong>Định dạng ngày</strong>: "YYYY-MM-DD", "DD/MM/YYYY", hoặc Excel serial number.</li>
                      <li><strong>Ghi chú</strong>: Tên cột "Promotion_id" (khác với "PromotionID" ở PROMS).</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Lưu Ý Quan Trọng
              </h2>
              <ul className="list-disc ml-6 text-gray-700">
                <li>Đảm bảo định dạng ngày trong file Excel là "YYYY-MM-DD", "DD/MM/YYYY", hoặc số serial của Excel.</li>
                <li>Tên sheet trong file phải khớp chính xác với yêu cầu (OSA, PROMOTION, PROMS, PROOL_Dup, v.v.).</li>
                <li>Các cột bắt buộc phải có dữ liệu, nếu thiếu sẽ gây lỗi trong quá trình kiểm tra.</li>
                <li>Kết quả xuất ra sẽ giữ nguyên các sheet gốc và thêm cột "Lý Do Sai" trong sheet được kiểm tra.</li>
                <li>Nếu gặp lỗi, kiểm tra console log để biết thêm chi tiết hoặc liên hệ hỗ trợ.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Liên Hệ Hỗ Trợ
              </h2>
              <p className="text-gray-700">
                Nếu bạn gặp khó khăn trong quá trình sử dụng, vui lòng liên hệ đội ngũ phát triển qua email: <a href="mailto:support@xai.com" className="text-blue-600">support@xai.com</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}