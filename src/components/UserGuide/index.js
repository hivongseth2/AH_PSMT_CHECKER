import { Card, CardContent, CardHeader, CardTitle } from "../card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { FileText, Video, Info, CheckCircle, AlertTriangle } from "lucide-react"

export default function UserGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4">
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center border-b bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
            <CardTitle className="text-2xl md:text-3xl font-bold">
              Hướng Dẫn Sử Dụng Ứng Dụng Kiểm Tra PSMT - An Hòa
            </CardTitle>
          </CardHeader>

          <Tabs defaultValue="intro" className="w-full">
            <div className="border-b px-6 py-2 bg-gray-50">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <TabsTrigger value="intro" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  <span>Giới Thiệu</span>
                </TabsTrigger>
                <TabsTrigger value="small" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Small Format</span>
                </TabsTrigger>
                <TabsTrigger value="big" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Big Format</span>
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>Video Hướng Dẫn</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-6">
              <TabsContent value="intro">
                <div className="space-y-6">
                  <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      Giới Thiệu
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                      Ứng dụng này được thiết kế để kiểm tra dữ liệu PSMT (Promotion & OSA) từ các file Excel, hỗ trợ cả
                      hai định dạng: <strong>Small Format</strong> và <strong>Big Format</strong>.
                    </p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                        <h3 className="font-medium text-blue-700 mb-2">Small Format</h3>
                        <ul className="list-disc ml-5 space-y-1 text-gray-600">
                          <li>Kiểm tra OSA (Raw Data)</li>
                          <li>Kiểm tra Promotion</li>
                        </ul>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                        <h3 className="font-medium text-blue-700 mb-2">Big Format</h3>
                        <ul className="list-disc ml-5 space-y-1 text-gray-600">
                          <li>Kiểm tra Promotion MS</li>
                          <li>Kiểm tra Promotion OL</li>
                        </ul>
                      </div>
                    </div>
                  
                  </section>

                  <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Hướng Dẫn Chung</h2>
                    <p className="text-gray-700 mb-4">Để sử dụng ứng dụng, bạn cần chuẩn bị hai loại file Excel:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                          <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                            1
                          </span>
                          File Kiểm Tra (Checklist)
                        </h3>
                        <p className="text-gray-600">Chứa danh sách các mục cần kiểm tra (OSA, Promotion, v.v.).</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                          <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                            2
                          </span>
                          File Dữ Liệu Thô (Raw Data)
                        </h3>
                        <p className="text-gray-600">Chứa dữ liệu thực tế từ hệ thống để so sánh.</p>
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-gray-700 font-medium">Quy trình làm việc:</p>
                        <ol className="list-decimal ml-5 mt-2 text-gray-700 space-y-1">
                          <li>Tải lên các file Excel cần thiết</li>
                          <li>Chọn tab tương ứng với định dạng cần kiểm tra</li>
                          <li>Nhấn nút "Bắt Đầu Kiểm Tra" và chờ kết quả</li>
                          <li>Xuất file Excel với các lỗi được đánh dấu</li>
                        </ol>
                      </div>
                    </div>
                  </section>

                  <section className="bg-red-50 p-6 rounded-lg border border-red-100">
                    <h2 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Lưu Ý Quan Trọng
                    </h2>
                    <ul className="list-disc ml-6 text-gray-700 space-y-2">
                      <li>
                        Đảm bảo định dạng ngày trong file Excel là "YYYY-MM-DD", "DD/MM/YYYY", hoặc số serial của Excel.
                      </li>
                      <li>
                        Tên sheet trong file phải khớp chính xác với yêu cầu (OSA, PROMOTION, PROMS, PROOL_Dup, v.v.).
                      </li>
                      <li>Các cột bắt buộc phải có dữ liệu, nếu thiếu sẽ gây lỗi trong quá trình kiểm tra.</li>
                      <li>
                        Kết quả xuất ra sẽ giữ nguyên các sheet gốc và thêm cột "Lý Do Sai" trong sheet được kiểm tra.
                      </li>
                    </ul>
                  </section>

                  <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <h2 className="text-xl font-semibold text-blue-800 mb-4">Liên Hệ Hỗ Trợ</h2>
                    <p className="text-gray-700">
                      Nếu bạn gặp khó khăn trong quá trình sử dụng, vui lòng liên hệ đội ngũ phát triển qua email:   
                      <a href="mailto:nguyenluan130301@gmail.com" className="text-blue-600 hover:underline">
                        .Tại đây
                      </a>
                      .
                    </p>
                  </section>
                </div>
              </TabsContent>

              <TabsContent value="small">
                <section className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <h2 className="text-xl font-semibold text-blue-800 mb-2">
                      Kiểm Tra Small Format (OSA & Promotion)
                    </h2>
                    <p className="text-gray-700">
                      Chức năng này kiểm tra dữ liệu OSA (Availability) và Promotion cho định dạng nhỏ.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Các Bước Thực Hiện:</h3>
                    <ol className="list-decimal ml-6 text-gray-700 space-y-3">
                      <li className="bg-gray-50 p-3 rounded">
                        Chọn tab <strong className="text-blue-700">"Kiểm Tra OSA, Pro Small"</strong>.
                      </li>
                      <li className="bg-gray-50 p-3 rounded">
                        Tải lên <strong className="text-blue-700">File Checklist</strong> và{" "}
                        <strong className="text-blue-700">File Raw Data</strong> theo định dạng yêu cầu.
                      </li>
                      <li className="bg-gray-50 p-3 rounded">
                        Nhấn <strong className="text-green-700">"Bắt Đầu Kiểm Tra"</strong> để xử lý dữ liệu.
                      </li>
                      <li className="bg-gray-50 p-3 rounded">
                        Xem kết quả trên giao diện:
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                          <li>
                            <strong>Kết quả OSA:</strong> Số lượng SKU thực tế so với kỳ vọng.
                          </li>
                          <li>
                            <strong>Kết quả Promotion:</strong> Số lượng promotion thực tế so với checklist.
                          </li>
                        </ul>
                      </li>
                      <li className="bg-gray-50 p-3 rounded">
                        Nhấn <strong className="text-blue-700">"Xuất dữ liệu kiểm tra"</strong> để tải file Excel với
                        các lỗi được tô đỏ và cột "Lý Do Sai".
                      </li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Định Dạng File:</h3>

                    <div className="mb-6">
                      <h4 className="font-medium text-blue-700 mb-3">1. File Checklist:</h4>
                      <div className="ml-4 space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <h5 className="font-medium text-blue-800 mb-2">Sheet "OSA":</h5>
                          <ul className="list-disc ml-6 text-gray-700 space-y-1">
                            <li>
                              <strong>Các cột bắt buộc:</strong> "Item Code", "START DATE", "END DATE", "Old code", "New
                              code", "Ngày Bắt Đầu Linh Động Đo Hàng Cũ & Mới", "Ngày Kết Thúc Linh Động Đo Hàng Cũ &
                              Mới".
                            </li>
                            <li>
                              <strong>Các cột store:</strong> Tên cột bắt đầu bằng "STR-" (ví dụ: "STR-001"), giá trị là
                              số lượng SKU kỳ vọng tại store đó.
                            </li>
                            <li>
                              <strong>Định dạng ngày:</strong> Excel serial number (ví dụ: 45135) hoặc "DD/MM/YYYY".
                            </li>
                          </ul>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <h5 className="font-medium text-blue-800 mb-2">Sheet "PROMOTION":</h5>
                          <ul className="list-disc ml-6 text-gray-700 space-y-1">
                            <li>
                              <strong>Các cột bắt buộc:</strong> "Promotion ID", "Customer", "START DATE", "END DATE".
                            </li>
                            <li>
                              <strong>Các cột store:</strong> Tên cột là "TYPE" + tên loại store (ví dụ: "TYPEMT"), giá
                              trị "Y" nếu store đó cần kiểm tra promotion.
                            </li>
                            <li>
                              <strong>Định dạng ngày:</strong> Excel serial number hoặc "DD/MM/YYYY".
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-blue-700 mb-3">2. File Raw Data:</h4>
                      <div className="ml-4 space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                          <h5 className="font-medium text-green-800 mb-2">Sheet "OSA_RAW":</h5>
                          <ul className="list-disc ml-6 text-gray-700 space-y-1">
                            <li>
                              <strong>Các cột bắt buộc:</strong> "Product ID", "Store ID - Unilever", "Date", "Audit
                              status".
                            </li>
                            <li>
                              <strong>Điều kiện lọc:</strong> Chỉ lấy các dòng có "Audit status" khác "Not Yet".
                            </li>
                            <li>
                              <strong>Định dạng ngày:</strong> "YYYY-MM-DD", "DD/MM/YYYY", hoặc Excel serial number.
                            </li>
                          </ul>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                          <h5 className="font-medium text-green-800 mb-2">Sheet "PROOL":</h5>
                          <ul className="list-disc ml-6 text-gray-700 space-y-1">
                            <li>
                              <strong>Các cột bắt buộc:</strong> "Promotion ID", "Store ID - Unilever", "Customer",
                              "Date", "TYPESTORE", "Product ID", "Audit status".
                            </li>
                            <li>
                              <strong>Điều kiện lọc:</strong> Chỉ lấy các dòng có "Audit status" khác "Not Yet".
                            </li>
                            <li>
                              <strong>Định dạng ngày:</strong> "YYYY-MM-DD", "DD/MM/YYYY", hoặc Excel serial number.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="big">
                <section className="space-y-6">
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                    <h2 className="text-xl font-semibold text-purple-800 mb-2">
                      Kiểm Tra Big Format (Promotion MS & Promotion OL)
                    </h2>
                    <p className="text-gray-700">
                      Chức năng này kiểm tra dữ liệu Promotion cho định dạng lớn, chia thành MS (Modern Store) và OL
                      (Online).
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Các Bước Thực Hiện:</h3>
                    <ol className="list-decimal ml-6 text-gray-700 space-y-3">
                      <li className="bg-gray-50 p-3 rounded">
                        Chọn tab <strong className="text-purple-700">"Kiểm Tra Big Format"</strong>.
                      </li>
                      <li className="bg-gray-50 p-3 rounded">
                        Tải lên <strong className="text-purple-700">File Checklist</strong> và{" "}
                        <strong className="text-purple-700">File Raw Data</strong> theo định dạng yêu cầu.
                      </li>
                      <li className="bg-gray-50 p-3 rounded">
                        Nhấn <strong className="text-green-700">"Bắt Đầu Kiểm Tra"</strong> để xử lý dữ liệu.
                      </li>
                      <li className="bg-gray-50 p-3 rounded">
                        Xem kết quả trên giao diện:
                        <ul className="list-disc ml-6 mt-2 space-y-1">
                          <li>
                            <strong>Promotion MS:</strong> Kiểm tra promotion dựa trên cột "AUDIT ON MS" = "Y".
                          </li>
                          <li>
                            <strong>Promotion OL:</strong> Kiểm tra promotion dựa trên "Y" trong các cột store.
                          </li>
                        </ul>
                      </li>
                      <li className="bg-gray-50 p-3 rounded">
                        Nhấn <strong className="text-purple-700">"Xuất dữ liệu kiểm tra"</strong> để tải file Excel với
                        các lỗi được tô đỏ và cột "Lý Do Sai".
                      </li>
                    </ol>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Định Dạng File:</h3>

                    <div className="mb-6">
                      <h4 className="font-medium text-purple-700 mb-3">1. File Checklist:</h4>
                      <div className="ml-4">
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                          <h5 className="font-medium text-purple-800 mb-2">Sheet "3. Pro MS & 4. Pro OL":</h5>
                          <ul className="list-disc ml-6 text-gray-700 space-y-1">
                            <li>
                              <strong>Các cột bắt buộc:</strong> "CUSTOMER", "PROMOTION ID", "START DATE", "END DATE",
                              "AUDIT ON MS".
                            </li>
                            <li>
                              <strong>Các cột store:</strong> Tên cột là tên store (ví dụ: "KA"), giá trị "Y" nếu store
                              đó cần kiểm tra promotion; ánh xạ với mã "STR-" (ví dụ: "STR-001") ở dòng header phụ.
                            </li>
                            <li>
                              <strong>Định dạng ngày:</strong> Excel serial number hoặc "DD/MM/YYYY".
                            </li>
                            <li>
                              <strong>Ghi chú:</strong> Dòng 5 chứa header chính, dòng 3 chứa mã store (STR-xxx).
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-purple-700 mb-3">2. File Raw Data:</h4>
                      <div className="ml-4 space-y-4">
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                          <h5 className="font-medium text-indigo-800 mb-2">Sheet "PROMS" (cho MS):</h5>
                          <ul className="list-disc ml-6 text-gray-700 space-y-1">
                            <li>
                              <strong>Các cột bắt buộc:</strong> "StoreID", "Date", "PromotionID", "Customer",
                              "ProductID".
                            </li>
                            <li>
                              <strong>Định dạng ngày:</strong> "YYYY-MM-DD", "DD/MM/YYYY", hoặc Excel serial number.
                            </li>
                          </ul>
                        </div>

                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                          <h5 className="font-medium text-indigo-800 mb-2">Sheet "PROOL_Dup" (cho OL):</h5>
                          <ul className="list-disc ml-6 text-gray-700 space-y-1">
                            <li>
                              <strong>Các cột bắt buộc:</strong> "StoreID", "Date", "Promotion_id", "Customer",
                              "ProductID".
                            </li>
                            <li>
                              <strong>Định dạng ngày:</strong> "YYYY-MM-DD", "DD/MM/YYYY", hoặc Excel serial number.
                            </li>
                            <li>
                              <strong>Ghi chú:</strong> Tên cột "Promotion_id" (khác với "PromotionID" ở PROMS).
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="video">
                <section className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Video Hướng Dẫn Sử Dụng</h2>
                    <p className="text-gray-700 mb-6">
                      Xem video hướng dẫn chi tiết dưới đây để hiểu rõ hơn về cách sử dụng ứng dụng:
                    </p>

                    <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                      <video className="w-full h-full" controls poster="/placeholder.svg?height=720&width=1280">
                        <source src="/0321.mp4" type="video/mp4" />
                        Trình duyệt của bạn không hỗ trợ thẻ video.
                      </video>
                    </div>

                    <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h3 className="font-medium text-yellow-800 mb-2 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Lưu ý khi xem video
                      </h3>
                      <ul className="list-disc ml-6 text-gray-700 space-y-1">
                        <li>Đảm bảo bạn đang sử dụng phiên bản ứng dụng mới nhất.</li>
                        <li>Một số tính năng có thể đã được cập nhật so với video.</li>
                        <li>Nếu video không tải được, vui lòng làm mới trang hoặc liên hệ hỗ trợ.</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

