import React, { useCallback, useEffect, useState } from "react";
import { Button } from "./components/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/tabs";
import FileUpload from "./components/FileUpload";
import ResultDisplay from "./components/ResultDisplay";
import { exportResults } from "./utils/exportResult";
import ErrorBoundary from "./components/errorBoundary";

import {
  CHECK_TYPES,
  FILE_TYPES,
  CHECKLIST_HEADERS,
  RAW_DATA_HEADERS,
  STORE_TYPES,
} from "./lib/constants";
import {
  processExcelFile,
  processChecklistData,
  processRawData,
} from "./utils/excelUtils";
import { validateData } from "./utils/dataValidation";
import { useForceUpdate } from "./hook/UseForceUpdate";
import {
  processRawDataForScoring,
  compareActualVsExpected,
} from "./utils/dataProcessing";
import ScoringResultDisplay from "./components/ScoringResultDisplay";
import { countStore } from "./utils/countStore";

export default function App() {
  const [files, setFiles] = useState({
    [FILE_TYPES.CHECKLIST]: null,
    [FILE_TYPES.RAW_DATA]: null,
  });
  const [activeTab, setActiveTab] = useState(CHECK_TYPES.SCORING);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [batchProgress, setBatchProgress] = useState(0);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const forceUpdate = useForceUpdate();
  const [scoringResults, setScoringResults] = useState(null);
  const addProgressUpdate = useCallback((update) => {
    setCurrentProgress((prev) => [...prev, update]);
    if (update.progress) {
      setBatchProgress(update.progress);
    }
  }, []);

  const handleExportResults = () => {
    if (results) {
      exportResults(results);
    }
  };

  React.useEffect(() => {
    if (batchProgress > 0) {
      setProgressUpdates((prevUpdates) => [
        ...prevUpdates,
        {
          productId: `Batch ${batchProgress}`,
          date: new Date().toLocaleString(),
          store: "N/A",
          status: "Processed",
        },
      ]);
    }
  }, [batchProgress]);

  const handleFileChange = (type) => (event) => {
    if (event.target.files) {
      setFiles((prev) => ({
        ...prev,
        [type]: event.target.files[0],
      }));
    }
  };

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
        processExcelFile(files[FILE_TYPES.CHECKLIST]),
        processExcelFile(files[FILE_TYPES.RAW_DATA]),
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

  const handleDataCheck = async () => {
    if (activeTab === CHECK_TYPES.DAILY) {
      if (!files[FILE_TYPES.CHECKLIST] || !files[FILE_TYPES.RAW_DATA]) {
        return;
      }

      setIsProcessing(true);
      setResults(null);
      setCurrentProgress([]); // Clear previous updates

      try {
        const [checklistData, rawData] = await Promise.all([
          processExcelFile(files[FILE_TYPES.CHECKLIST]),
          processExcelFile(files[FILE_TYPES.RAW_DATA]),
        ]);

        const processedChecklist = processChecklistData(checklistData);
        const processedRawData = processRawData(rawData);

        const validationResults = await validateData(
          processedChecklist,
          processedRawData,
          addProgressUpdate,
          setBatchProgress,
          forceUpdate
        );

        setResults([
          {
            type: "info",
            title: "Thông tin tệp",
            message: `Đã xử lý ${processedChecklist.length} dòng từ checklist và ${processedRawData.length} dòng từ dữ liệu thô`,
          },
          {
            type: "info",
            title: "Kết quả kiểm tra",
            message: `
            Dữ liệu hợp lệ: ${validationResults.validCount}
            Dữ liệu không hợp lệ: ${validationResults.invalidCount}
            Dữ liệu ngoài phạm vi: ${validationResults.outOfRangeCount}
          `,
          },
          ...validationResults.errors.map((error) => ({
            type: "error",
            title: `Lỗi ở dòng ${error.row}`,
            message: error.message,
          })),
        ]);
      } catch (error) {
        setResults([
          {
            type: "error",
            title: "Lỗi xử lý",
            message: error.message,
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
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
                />
                <FileUpload
                  label="File Dữ Liệu Thô (Raw Data)"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange(FILE_TYPES.RAW_DATA)}
                />
              </div>

              <Tabs>
                <TabsList className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* <TabsTrigger
                    isActive={activeTab === CHECK_TYPES.DAILY}
                    onClick={() => setActiveTab(CHECK_TYPES.DAILY)}
                  >
                    Kiểm Tra Dữ Liệu Hàng Ngày
                  </TabsTrigger> */}
                  <TabsTrigger
                    isActive={activeTab === CHECK_TYPES.SCORING}
                    onClick={() => setActiveTab(CHECK_TYPES.SCORING)}
                  >
                    Kiểm Tra số lượng SKU
                  </TabsTrigger>
                  <TabsTrigger
                    isActive={activeTab === CHECK_TYPES.MONTHLY}
                    onClick={() => setActiveTab(CHECK_TYPES.MONTHLY)}
                  >
                    Kiểm Tra Dữ Liệu Hàng Tháng
                  </TabsTrigger>
                </TabsList>

                <TabsContent>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {activeTab === CHECK_TYPES.SCORING &&
                          "Kiểm Tra số lượng SKU"}
                        {activeTab === CHECK_TYPES.MONTHLY &&
                          "Kiểm Tra Dữ Liệu Hàng Tháng"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleDataCheck}
                        disabled={
                          // (activeTab === CHECK_TYPES.DAILY &&
                          //   (!files[FILE_TYPES.CHECKLIST] ||
                          //     !files[FILE_TYPES.RAW_DATA])) ||
                          (activeTab === CHECK_TYPES.SCORING &&
                            (!files[FILE_TYPES.CHECKLIST] ||
                              !files[FILE_TYPES.RAW_DATA])) ||
                          isProcessing
                        }
                        isLoading={isProcessing}
                      >
                        {isProcessing ? "Đang Kiểm Tra..." : "Bắt Đầu Kiểm Tra"}
                      </Button>
                      {/* <Button
                        onClick={handleExportResults}
                        disabled={!results}
                        className="ml-4"
                      >
                        Xuất Kết Quả
                      </Button> */}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {activeTab === CHECK_TYPES.SCORING && (
                <ScoringResultDisplay
                  results={scoringResults}
                  isLoading={isProcessing}
                  batchProgress={batchProgress}
                  progressUpdates={progressUpdates}
                />
              )}

              {/* {activeTab !== CHECK_TYPES.SCORING && (
                <ResultDisplay
                  results={results}
                  isLoading={isProcessing}
                  progressUpdates={progressUpdates}
                  batchProgress={batchProgress}
                />
              )} */}
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}
