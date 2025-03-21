"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs"

import ScoringResultDisplay from "../ScoringResultDisplay"
import PromotionResultDisplay from "../PromotionResultDisplay"

const SmallPromotionResults = ({ promotionResults,isProcessing,batchProgress,currentProgress,osaResults }) => {
  // Initialize state variables with default values

  const [activeTab, setActiveTab] = useState("osa")



  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Kết Quả Kiểm Tra Small Format</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="ms" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger isActive={activeTab === "osa"} onClick={() => setActiveTab("osa")}>
                Osa RAW
              </TabsTrigger>
              <TabsTrigger isActive={activeTab === "pro"} onClick={() => setActiveTab("pro")}>
              Promotion
              </TabsTrigger>
            </TabsList>

            <TabsContent >

            {activeTab === "osa" && (
               <ScoringResultDisplay
               results={osaResults}
               isLoading={isProcessing}
               batchProgress={batchProgress}
               progressUpdates={currentProgress}
             
             />
            )}


            
                {activeTab === "pro" && (
              <PromotionResultDisplay
              results={promotionResults}
              isLoading={isProcessing}
              batchProgress={batchProgress}
              invalidRows={promotionResults?.invalidRows || []}
            />
            )}
             
            </TabsContent>

         
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default SmallPromotionResults

