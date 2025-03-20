/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { useState } from "react"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"
import { Search, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from "lucide-react"

const BigPromotionResults = ({ results }) => {
  if (!results) return null

  const { msResults, olResults, msChecklistStats, olChecklistStats } = results

  // State for search/filter
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedDates, setExpandedDates] = useState({})
  const [expandedCustomers, setExpandedCustomers] = useState({})
  const [expandedStores, setExpandedStores] = useState({})
  const [activeTab, setActiveTab] = useState("ms")

  // Handle search/filter
  const filteredDateResults =
    (msResults?.dateResults || [])?.filter((dateResult) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        dateResult.date.toLowerCase().includes(searchLower) ||
        dateResult.customers.some(
          (customerResult) =>
            customerResult.customer.toLowerCase().includes(searchLower) ||
            customerResult.stores.some(
              (store) =>
                store.storeId.toLowerCase().includes(searchLower) ||
                store.storeName.toLowerCase().includes(searchLower) ||
                store.expectedPromotions.some((id) => id.toLowerCase().includes(searchLower)) ||
                store.actualPromotions.some((id) => id.toLowerCase().includes(searchLower)),
            ),
        )
      )
    }) || []

  // Toggle functions for collapsible sections
  const toggleDate = (date) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }))
  }

  const toggleCustomer = (date, customer) => {
    const key = `${date}_${customer}`
    setExpandedCustomers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleStore = (date, customer, storeId) => {
    const key = `${date}_${customer}_${storeId}`
    setExpandedStores((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Count stores with discrepancies for each date and customer
  const getDiscrepancyCount = (dateResult) => {
    let count = 0
    dateResult.customers.forEach((customer) => {
      customer.stores.forEach((store) => {
        if (store.missingPromotions.length > 0 || store.extraPromotions.length > 0) {
          count++
        }
      })
    })
    return count
  }

  const getCustomerDiscrepancyCount = (customerResult) => {
    let count = 0
    customerResult.stores.forEach((store) => {
      if (store.missingPromotions.length > 0 || store.extraPromotions.length > 0) {
        count++
      }
    })
    return count
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Kết Quả Kiểm Tra Khuyến Mãi Big Format</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="ms" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="ms">Khuyến Mãi MS</TabsTrigger>
              <TabsTrigger value="ol">Khuyến Mãi OL</TabsTrigger>
            </TabsList>

            <TabsContent value="ms">
              {msResults?.message ? (
                <div className="text-gray-700 mb-4 p-4 bg-blue-50 rounded-lg">{msResults.message}</div>
              ) : null}

              {/* Stats Cards */}
              {msChecklistStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-white border-l-4 border-blue-500">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-500">Tổng Số Khách Hàng</p>
                      <h4 className="text-2xl font-bold text-gray-800">
                        {Object.keys(msChecklistStats.customerStats).length}
                      </h4>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-l-4 border-green-500">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-500">Tổng Số Cửa Hàng</p>
                      <h4 className="text-2xl font-bold text-gray-800">{msChecklistStats.totalStores}</h4>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-l-4 border-purple-500">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-500">Khuyến Mãi Kỳ Vọng</p>
                      <h4 className="text-2xl font-bold text-gray-800">{msResults.totalExpectedPromotions || 0}</h4>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-l-4 border-amber-500">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-500">Khuyến Mãi Thực Tế</p>
                      <h4 className="text-2xl font-bold text-gray-800">{msResults.totalActualPromotions || 0}</h4>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo ngày, khách hàng, cửa hàng, hoặc mã khuyến mãi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date Results */}
              {filteredDateResults.length > 0 ? (
                <div className="space-y-4">
                  {filteredDateResults.map((dateResult) => {
                    const discrepancyCount = getDiscrepancyCount(dateResult)
                    return (
                      <Card
                        key={dateResult.date}
                        className={`overflow-hidden ${dateResult.hasDiscrepancies ? "border-l-4 border-red-500" : ""}`}
                      >
                        <div
                          className={`flex justify-between items-center p-4 cursor-pointer ${
                            dateResult.hasDiscrepancies ? "bg-red-50" : "bg-gray-50"
                          }`}
                          onClick={() => toggleDate(dateResult.date)}
                        >
                          <div className="flex items-center gap-2">
                            {dateResult.hasDiscrepancies ? (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            <h5 className="text-lg font-semibold">Ngày: {dateResult.date}</h5>
                            {discrepancyCount > 0 && (
                              <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                {discrepancyCount} cửa hàng có sai sót
                              </span>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="p-1">
                            {expandedDates[dateResult.date] ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                        </div>

                        {expandedDates[dateResult.date] && (
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {dateResult.customers.map((customerResult) => {
                                const customerDiscrepancyCount = getCustomerDiscrepancyCount(customerResult)
                                return (
                                  <Card key={customerResult.customer} className="border border-gray-200">
                                    <div
                                      className={`flex justify-between items-center p-3 cursor-pointer ${
                                        customerDiscrepancyCount > 0 ? "bg-orange-50" : "bg-gray-50"
                                      }`}
                                      onClick={() => toggleCustomer(dateResult.date, customerResult.customer)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <h6 className="font-medium">Khách Hàng: {customerResult.customer}</h6>
                                        {customerDiscrepancyCount > 0 && (
                                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                            {customerDiscrepancyCount} cửa hàng có sai sót
                                          </span>
                                        )}
                                      </div>
                                      <Button variant="ghost" size="sm" className="p-1">
                                        {expandedCustomers[`${dateResult.date}_${customerResult.customer}`] ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>

                                    {expandedCustomers[`${dateResult.date}_${customerResult.customer}`] && (
                                      <CardContent className="p-3">
                                        <div className="space-y-2">
                                          {customerResult.stores.map((store) => {
                                            const hasDiscrepancies =
                                              store.missingPromotions.length > 0 || store.extraPromotions.length > 0
                                            return (
                                              <Card
                                                key={store.storeId}
                                                className={`border ${hasDiscrepancies ? "border-red-300" : "border-gray-200"}`}
                                              >
                                                <div
                                                  className={`flex justify-between items-center p-2 cursor-pointer ${
                                                    hasDiscrepancies ? "bg-red-50" : "bg-white"
                                                  }`}
                                                  onClick={() =>
                                                    toggleStore(dateResult.date, customerResult.customer, store.storeId)
                                                  }
                                                >
                                                  <div className="flex items-center gap-2">
                                                    {hasDiscrepancies ? (
                                                      <AlertTriangle className="h-4 w-4 text-red-500" />
                                                    ) : (
                                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                                    )}
                                                    <p className="text-sm font-medium">
                                                      {store.storeName} ({store.storeId})
                                                    </p>
                                                    {hasDiscrepancies && (
                                                      <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                                        Có sai sót
                                                      </span>
                                                    )}
                                                  </div>
                                                  <Button variant="ghost" size="sm" className="p-1">
                                                    {expandedStores[
                                                      `${dateResult.date}_${customerResult.customer}_${store.storeId}`
                                                    ] ? (
                                                      <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                      <ChevronDown className="h-4 w-4" />
                                                    )}
                                                  </Button>
                                                </div>

                                                {expandedStores[
                                                  `${dateResult.date}_${customerResult.customer}_${store.storeId}`
                                                ] && (
                                                  <CardContent className="p-3 bg-gray-50">
                                                    {store.message ? (
                                                      <p className="text-red-600 text-sm">{store.message}</p>
                                                    ) : (
                                                      <>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                            <p className="text-sm font-medium text-gray-700 mb-2">
                                                              Khuyến Mãi Kỳ Vọng ({store.expectedPromotions.length})
                                                            </p>
                                                            {store.expectedPromotions.length > 0 ? (
                                                              <div className="flex flex-wrap gap-1">
                                                                {store.expectedPromotions.map((id, idx) => (
                                                                  <span
                                                                    key={idx}
                                                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                                                  >
                                                                    {id}
                                                                  </span>
                                                                ))}
                                                              </div>
                                                            ) : (
                                                              <p className="text-sm text-gray-500">
                                                                Không có khuyến mãi kỳ vọng
                                                              </p>
                                                            )}
                                                          </div>
                                                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                            <p className="text-sm font-medium text-gray-700 mb-2">
                                                              Khuyến Mãi Thực Tế ({store.actualPromotions.length})
                                                            </p>
                                                            {store.actualPromotions.length > 0 ? (
                                                              <div className="flex flex-wrap gap-1">
                                                                {store.actualPromotions.map((id, idx) => (
                                                                  <span
                                                                    key={idx}
                                                                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                                                  >
                                                                    {id}
                                                                  </span>
                                                                ))}
                                                              </div>
                                                            ) : (
                                                              <p className="text-sm text-gray-500">
                                                                Không có khuyến mãi thực tế
                                                              </p>
                                                            )}
                                                          </div>
                                                        </div>

                                                        {(store.missingPromotions.length > 0 ||
                                                          store.extraPromotions.length > 0) && (
                                                          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                                            <p className="text-sm font-medium text-red-700 mb-2">
                                                              Sự Không Khớp
                                                            </p>
                                                            {store.missingPromotions.length > 0 && (
                                                              <div className="mb-2">
                                                                <p className="text-xs font-medium text-red-700 mb-1">
                                                                  Thiếu khuyến mãi:
                                                                </p>
                                                                <div className="flex flex-wrap gap-1">
                                                                  {store.missingPromotions.map((id, idx) => (
                                                                    <span
                                                                      key={idx}
                                                                      className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                                                                    >
                                                                      {id}
                                                                    </span>
                                                                  ))}
                                                                </div>
                                                              </div>
                                                            )}
                                                            {store.extraPromotions.length > 0 && (
                                                              <div>
                                                                <p className="text-xs font-medium text-red-700 mb-1">
                                                                  Thừa khuyến mãi:
                                                                </p>
                                                                <div className="flex flex-wrap gap-1">
                                                                  {store.extraPromotions.map((id, idx) => (
                                                                    <span
                                                                      key={idx}
                                                                      className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                                                                    >
                                                                      {id}
                                                                    </span>
                                                                  ))}
                                                                </div>
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                      </>
                                                    )}
                                                  </CardContent>
                                                )}
                                              </Card>
                                            )
                                          })}
                                        </div>
                                      </CardContent>
                                    )}
                                  </Card>
                                )
                              })}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Card className="bg-gray-50 p-6 text-center">
                  <p className="text-gray-600">Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm.</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="ol">
              <Card className="bg-white p-6">
                {olResults?.message ? (
                  <p className="text-gray-700">{olResults.message}</p>
                ) : (
                  <p className="text-gray-700 text-center">Không có kết quả OL nào để hiển thị.</p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default BigPromotionResults

