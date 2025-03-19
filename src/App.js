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
import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

export default function App() {
  const [files, setFiles] = useState({
    [FILE_TYPES.CHECKLIST]: null,
    [FILE_TYPES.RAW_DATA]: null,
  });
  const [activeTab, setActiveTab] = useState(CHECK_TYPES.SCORING);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scoringResults, setScoringResults] = useState(null);
  const [promotionResults, setPromotionResults] = useState(null);
  const [rawWorkbook, setRawWorkbook] = useState(null); // Lưu workbook gốc
  const [batchProgress, setBatchProgress] = useState(0);
  const [currentProgress, setCurrentProgress] = useState([]);

  const handleFileChange = (type) => (event) => {
    setFiles((prev) => ({
      ...prev,
      [type]: event.target.files ? event.target.files[0] : null,
    }));
  };
  const addProgressUpdate = useCallback((update) => {
    setCurrentProgress((prev) => [...prev, update]);
    if (update.progress) setBatchProgress(update.progress);
  }, []);

  const handleAllDataCheck = async () => {
    if (!files[FILE_TYPES.CHECKLIST] || !files[FILE_TYPES.RAW_DATA]) return;

    setIsProcessing(true);
    setScoringResults(null);
    setPromotionResults(null);
    setRawWorkbook(null);
    setBatchProgress(0);
    setCurrentProgress([]);

    try {
      // Đọc dữ liệu từ file
      const checklistData = await processExcelFile(files[FILE_TYPES.CHECKLIST]);
      const rawFileReader = new FileReader();
      const rawPromise = new Promise((resolve) => {
        rawFileReader.onload = (e) => {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          resolve(workbook);
        };
        rawFileReader.readAsArrayBuffer(files[FILE_TYPES.RAW_DATA]);
      });
      const rawWorkbook = await rawPromise;
      setRawWorkbook(rawWorkbook);

      // Xử lý OSA RAW (Sheet 2, index 1)
      const osaSheet = rawWorkbook.Sheets[rawWorkbook.SheetNames[1]];
      const osaRawData = XLSX.utils.sheet_to_json(osaSheet, { header: 1 });
      const osaChecklist = processChecklistData(checklistData);
      const osaProcessedRaw = processRawData(osaRawData);
      const osaResults = await countStore(
        osaChecklist,
        osaProcessedRaw,
        addProgressUpdate,
        setBatchProgress
      );

      // Xử lý PROOL (Sheet 6, index 5)
      const promoSheet = rawWorkbook.Sheets[rawWorkbook.SheetNames[5]];
      const promoRawData = XLSX.utils.sheet_to_json(promoSheet, { header: 1 });
      const promoChecklist = processChecklistPromotionData(checklistData);
      const promoProcessedRaw = processPromotionRawData(promoRawData);
      const promoResults = await checkPromotion(
        promoChecklist,
        promoProcessedRaw,
        addProgressUpdate,
        setBatchProgress
      );

      setScoringResults(osaResults);
      setPromotionResults(promoResults);

    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
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
    if (activeTab === "ALL") {
      await handleAllDataCheck();
    } else if (activeTab === CHECK_TYPES.PROMOTION) {
      await handlePromotionDataCheck();
    } else if (activeTab === CHECK_TYPES.SCORING) {
      await handleScoringDataCheck();
    }
  };
  const exportFullResults = async () => {
    if (!rawWorkbook || (!scoringResults && !promotionResults)) return;
  
    const worker = new Worker(new URL("./workers/excelWorker.js", import.meta.url));
    const rawWorkbookData = XLSX.write(rawWorkbook, { type: "buffer", bookType: "xlsx" });
  
    worker.postMessage({
      rawWorkbookData,
      scoringResults,
      promotionResults,
      sheetNames: rawWorkbook.SheetNames,
    });
  
    worker.onmessage = (e) => {
      const buffer = e.data;
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `ket_qua_full_raw_data_${new Date().toISOString()}.xlsx`);
      worker.terminate();
    };
  
    worker.onerror = (error) => {
      console.error("Worker error:", error);
      worker.terminate();
    };
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
                <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <TabsTrigger
                    isActive={activeTab === "ALL"}
                    onClick={() => setActiveTab("ALL")}
                  >
                    Kiểm Tra Tất Cả
                  </TabsTrigger>
                </TabsList>

                <TabsContent>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {activeTab === CHECK_TYPES.SCORING && "Kiểm Tra số lượng SKU"}
                        {activeTab === CHECK_TYPES.PROMOTION && "Kiểm Tra Dữ Liệu Promotion"}
                        {activeTab === "ALL" && "Kiểm Tra Toàn Bộ Dữ Liệu"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-4">
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
                        <Button
                          onClick={exportFullResults}
                          disabled={!rawWorkbook || isProcessing}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Xuất Raw Data
                        </Button>
                      </div>
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

              {activeTab === "ALL" && (
                <>
                  <ScoringResultDisplay
                    results={scoringResults}
                    isLoading={isProcessing}
                    batchProgress={batchProgress}
                    progressUpdates={currentProgress}
                  />
                  <PromotionResultDisplay
                    results={promotionResults}
                    isLoading={isProcessing}
                    batchProgress={batchProgress}
                    invalidRows={promotionResults?.invalidRows || []}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}