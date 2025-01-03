import React, { useState, useCallback } from "react";
import { Button } from "./components/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/tabs";
import FileUpload from "./components/FileUpload";
import ScoringResultDisplay from "./components/ScoringResultDisplay";
import PromotionResultDisplay from "./components/PromotionResultDisplay";
import ErrorBoundary from "./components/errorBoundary";
import { CHECK_TYPES, FILE_TYPES } from "./lib/constants";
import {
  processExcelFile,
  processChecklistData,
  processRawData,
  processChecklistPromotionData,
  processPromotionRawData,
} from "./utils/excelUtils";
import { countStore } from "./utils/countStore";
import { checkPromotion } from "./utils/checkPromotionSF";

export default function App() {
  const [files, setFiles] = useState({
    [FILE_TYPES.CHECKLIST]: null,
    [FILE_TYPES.RAW_DATA]: null,
  });
  const [activeTab, setActiveTab] = useState(CHECK_TYPES.SCORING);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scoringResults, setScoringResults] = useState(null);
  const [promotionResults, setPromotionResults] = useState(null);
  const [batchProgress, setBatchProgress] = useState(0);
  const [currentProgress, setCurrentProgress] = useState([]);

  const handleFileChange = (type) => (event) => {
    if (event.target.files) {
      setFiles((prev) => ({
        ...prev,
        [type]: event.target.files[0],
      }));
    }
  };

  const addProgressUpdate = useCallback((update) => {
    setCurrentProgress((prev) => [...prev, update]);
    if (update.progress) {
      setBatchProgress(update.progress);
    }
  }, []);

  const handleScoringDataCheck = async () => {
    if (!files[FILE_TYPES.CHECKLIST] || !files[FILE_TYPES.RAW_DATA]) {
      return;
    }

    setIsProcessing(true);
    setScoringResults(null);
    setBatchProgress(0);
    setCurrentProgress([]);

    try {
      const [checklistData, rawData] = await Promise.all([
        processExcelFile(files[FILE_TYPES.CHECKLIST], "OSA"),
        processExcelFile(files[FILE_TYPES.RAW_DATA], "OSA_RAW"),
      ]);

      const processedChecklist = processChecklistData(checklistData);
      const processedRawData = processRawData(rawData);

      const validationResults = await countStore(
        processedChecklist,
        processedRawData,
        addProgressUpdate,
        setBatchProgress
      );

      setScoringResults(validationResults);
    } catch (error) {
      setScoringResults([
        {
          type: "error",
          title: "Lỗi xử lý",
          message: error.message,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromotionDataCheck = async () => {
    if (!files[FILE_TYPES.CHECKLIST] || !files[FILE_TYPES.RAW_DATA]) {
      return;
    }

    setIsProcessing(true);
    setPromotionResults(null);
    setBatchProgress(0);
    setCurrentProgress([]);

    try {
      const [checklistData, rawData] = await Promise.all([
        processExcelFile(files[FILE_TYPES.CHECKLIST], "PROMOTION"),
        processExcelFile(files[FILE_TYPES.RAW_DATA], "PROOL"),
      ]);

      const processedChecklist = processChecklistPromotionData(checklistData);
      const processedRawData = processPromotionRawData(rawData);

      const promotionResult = await checkPromotion(
        processedChecklist,
        processedRawData,
        addProgressUpdate,
        setBatchProgress
      );

      setPromotionResults(promotionResult);
    } catch (error) {
      setPromotionResults([
        {
          type: "error",
          title: "Lỗi xử lý",
          message: error.message,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataCheck = async () => {
    if (activeTab === CHECK_TYPES.PROMOTION) {
      await handlePromotionDataCheck();
    } else if (activeTab === CHECK_TYPES.SCORING) {
      await handleScoringDataCheck();
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader className="text-center border-b">
              <CardTitle className="text-2xl font-bold text-blue-900">
                Kiểm Tra PSMT- An Hòa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FileUpload
                  label="File Kiểm Tra (Checklist)"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange(FILE_TYPES.CHECKLIST)}
                  file={files[FILE_TYPES.CHECKLIST]}
                />
                <FileUpload
                  label="File Dữ Liệu Thô (Raw Data)"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange(FILE_TYPES.RAW_DATA)}
                  file={files[FILE_TYPES.RAW_DATA]}
                />
              </div>

              <Tabs>
                <TabsList className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TabsTrigger
                    isActive={activeTab === CHECK_TYPES.SCORING}
                    onClick={() => setActiveTab(CHECK_TYPES.SCORING)}
                  >
                    Kiểm Tra số lượng SKU
                  </TabsTrigger>
                  <TabsTrigger
                    isActive={activeTab === CHECK_TYPES.PROMOTION}
                    onClick={() => setActiveTab(CHECK_TYPES.PROMOTION)}
                  >
                    Kiểm Tra Dữ Liệu Promotion
                  </TabsTrigger>
                </TabsList>

                <TabsContent>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {activeTab === CHECK_TYPES.SCORING &&
                          "Kiểm Tra số lượng SKU"}
                        {activeTab === CHECK_TYPES.PROMOTION &&
                          "Kiểm Tra Dữ Liệu Promotion"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleDataCheck}
                        disabled={
                          !files[FILE_TYPES.CHECKLIST] ||
                          !files[FILE_TYPES.RAW_DATA] ||
                          isProcessing
                        }
                        isLoading={isProcessing}
                      >
                        {isProcessing ? "Đang Kiểm Tra..." : "Bắt Đầu Kiểm Tra"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {activeTab === CHECK_TYPES.SCORING && (
                <ScoringResultDisplay
                  results={scoringResults}
                  isLoading={isProcessing}
                  batchProgress={batchProgress}
                  progressUpdates={currentProgress}
                />
              )}

              {activeTab === CHECK_TYPES.PROMOTION && (
                <PromotionResultDisplay
                  results={promotionResults}
                  isLoading={isProcessing}
                  batchProgress={batchProgress}
                  invalidRows={promotionResults?.invalidRows || []}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}
