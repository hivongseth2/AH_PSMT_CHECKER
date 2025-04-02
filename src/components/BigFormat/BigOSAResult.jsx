"use client"

import { Card, CardContent } from "../card"
import { Search, AlertTriangle } from "lucide-react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../accordion"
import { useState } from "react"

const BigOSAResult = ({ osaResults, searchTerm, setSearchTerm }) => {
  const [filterType, setFilterType] = useState("all") // "all", "issues", "valid"

  // Combine all stores from different categories
  const allStores = [
    ...(osaResults?.discrepancies || []), // Prioritize stores with discrepancies
    // ...(osaResults?.overdue || []),
    ...(osaResults?.fullyChecked || []),
  ]

  // Handle search/filter
  const filteredStores = allStores.filter((store) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      store.storeCode.toLowerCase().includes(searchLower) ||
      store.missingItemCodes.some((itemCode) => itemCode.toString().toLowerCase().includes(searchLower)) ||
      store.extraItemCodes.some((itemCode) => itemCode.toString().toLowerCase().includes(searchLower))

    const hasDiscrepancy = store.missingItemCodes.length > 0 || store.extraItemCodes.length > 0

    // Apply type filter
    if (filterType === "issues" && !hasDiscrepancy) return false
    if (filterType === "valid" && hasDiscrepancy) return false

    return matchesSearch
  })

  // Helper function to chunk array into groups
  const chunkArray = (array, size) => {
    const chunkedArr = []
    for (let i = 0; i < array.length; i += size) {
      chunkedArr.push(array.slice(i, i + size))
    }
    return chunkedArr
  }

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      {osaResults?.message ? (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{osaResults.message}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Tổng Số Item Dự Kiến</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{osaResults.totalExpectedItems}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Tổng Số Item Thực Tế</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{osaResults.totalActualItems}</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Tổng Số Sai Sót</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{osaResults.totalDiscrepancies}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">Không có kết quả để hiển thị.</p>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã cửa hàng hoặc mã sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-lg border transition-all ${
              filterType === "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterType("issues")}
            className={`px-4 py-2 rounded-lg border transition-all ${
              filterType === "issues"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Có sai sót
          </button>
          <button
            onClick={() => setFilterType("valid")}
            className={`px-4 py-2 rounded-lg border transition-all ${
              filterType === "valid"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Hợp lệ
          </button>
        </div>
      </div>

      {/* Store Results */}
      {filteredStores.length > 0 ? (
        <div className="space-y-3">
          {filteredStores.map((store) => {
            const hasDataDiscrepancy = store.missingItemCodes.length > 0 || store.extraItemCodes.length > 0

            // Chunk arrays for grid layout
            const missingChunks = chunkArray(store.missingItemCodes, 12)
            const extraChunks = chunkArray(store.extraItemCodes, 12)

            return (
              <Accordion
                key={store.storeCode}
                type="single"
                collapsible
                className="border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                <AccordionItem value={store.storeCode} className="border-0">
                  <AccordionTrigger className="px-4 py-3 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex items-center w-full">
                      {hasDataDiscrepancy && (
                        <div className="bg-red-100 rounded-full p-1 mr-3">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-semibold text-gray-800">{store.storeCode}</h4>
                        {hasDataDiscrepancy && (
                          <p className="text-sm text-red-600">Thiếu: {store.missingItemCodes.length}</p>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="bg-white">
                    <div className="p-4 space-y-5">
                      {/* Overview */}
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-gray-600">
                            Item Dự Kiến: <span className="font-medium">{store.expectedItemCodes.length}</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            Item Thực Tế: <span className="font-medium">{store.actualItemCodes.length}</span>
                          </p>
                        </div>

                        {hasDataDiscrepancy && (
                          <div className="text-right">
                            <p className="text-sm text-red-600 font-medium">
                              Thiếu: {store.missingItemCodes.length} item
                            </p>
                            {store.extraItemCodes.length > 0 && (
                              <p className="text-sm text-amber-600 font-medium">
                                Thừa: {store.extraItemCodes.length} item
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expected and Actual Items Side by Side */}
                      <div className="border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Expected Items */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              Item Dự Kiến ({store.expectedItemCodes.length})
                            </h5>
                            <div className="space-y-2">
                              {chunkArray(store.expectedItemCodes, 6).map((chunk, index) => (
                                <div key={`expected-row-${index}`} className="flex flex-wrap gap-2">
                                  {chunk.map((itemCode) => (
                                    <span
                                      key={`expected-${itemCode}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {itemCode}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actual Items */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">
                              Item Thực Tế ({store.actualItemCodes.length})
                            </h5>
                            <div className="space-y-2">
                              {chunkArray(store.actualItemCodes, 6).map((chunk, index) => (
                                <div key={`actual-row-${index}`} className="flex flex-wrap gap-2">
                                  {chunk.map((itemCode) => (
                                    <span
                                      key={`actual-${itemCode}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"
                                    >
                                      {itemCode}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Discrepancies */}
                      {hasDataDiscrepancy && (
                        <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                          <h5 className="text-sm font-medium text-red-700 mb-2">Sự Không Khớp</h5>

                          {/* Missing Items */}
                          {store.missingItemCodes.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs text-red-600 mb-1">Thiếu item:</p>
                              <div className="space-y-2">
                                {missingChunks.map((chunk, index) => (
                                  <div key={`missing-row-${index}`} className="flex flex-wrap gap-2">
                                    {chunk.map((itemCode) => (
                                      <span
                                        key={`missing-${itemCode}`}
                                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800"
                                      >
                                        {itemCode}
                                      </span>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Extra Items */}
                          {store.extraItemCodes.length > 0 && (
                            <div>
                              <p className="text-xs text-amber-600 mb-1">Thừa item:</p>
                              <div className="space-y-2">
                                {extraChunks.map((chunk, index) => (
                                  <div key={`extra-row-${index}`} className="flex flex-wrap gap-2">
                                    {chunk.map((itemCode) => (
                                      <span
                                        key={`extra-${itemCode}`}
                                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-800"
                                      >
                                        {itemCode}
                                      </span>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )
          })}
        </div>
      ) : (
        <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Không tìm thấy kết quả phù hợp.</p>
        </div>
      )}
    </div>
  )
}

export default BigOSAResult

