"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs"
import MSPromotionResults from "./MSPromotionResults"
import OLPromotionResults from "./OLPromotionResults"
import BigOSAResult from "./BigOSAResult"

const BigPromotionResults = ({ results }) => {
  // Initialize state variables with default values
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedDates, setExpandedDates] = useState({})
  const [expandedCustomers, setExpandedCustomers] = useState({})
  const [expandedStores, setExpandedStores] = useState({})
  const [activeTab, setActiveTab] = useState("ms")

  if (!results) return null

  const { msResults, olResults, msChecklistStats, olChecklistStats,osaResults } = results

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

  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Kết Quả Kiểm Tra Khuyến Mãi Big Format</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="ms" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger isActive={activeTab === "ms"} onClick={() => setActiveTab("ms")}>
                Khuyến Mãi MS
              </TabsTrigger>
              <TabsTrigger isActive={activeTab === "ol"} onClick={() => setActiveTab("ol")}>
                Khuyến Mãi OL
              </TabsTrigger>

              <TabsTrigger isActive={activeTab === "osa"} onClick={() => setActiveTab("osa")}>
                OSA
              </TabsTrigger>


            </TabsList>

            <TabsContent >

            {activeTab === "ms" && (
               <MSPromotionResults
               msResults={msResults}
               msChecklistStats={msChecklistStats}
               searchTerm={searchTerm}
               setSearchTerm={setSearchTerm}
               expandedDates={expandedDates}
               expandedCustomers={expandedCustomers}
               expandedStores={expandedStores}
               toggleDate={toggleDate}
               toggleCustomer={toggleCustomer}
               toggleStore={toggleStore}
             />
            )}


            
              {activeTab === "ol" && (
               <OLPromotionResults
               olResults={olResults}
               olChecklistStats={olChecklistStats}
               searchTerm={searchTerm}
               setSearchTerm={setSearchTerm}
               expandedDates={expandedDates}
               expandedCustomers={expandedCustomers}
               expandedStores={expandedStores}
               toggleDate={toggleDate}
               toggleCustomer={toggleCustomer}
               toggleStore={toggleStore}
             />
            )}



              {activeTab === "osa" && (
                <BigOSAResult
                osaResults={osaResults}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
              
              )}
            </TabsContent>

         
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default BigPromotionResults

