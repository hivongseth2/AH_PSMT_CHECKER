import React, { useState, useCallback } from "react";
import { Button } from "./components/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/tabs";
import FileUpload from "./components/FileUpload";
import ScoringResultDisplay from "./components/ScoringResultDisplay";
import PromotionResultDisplay from "./components/PromotionResultDisplay";
import ErrorBoundary from "./components/errorBoundary";
import { CHECK_TYPES, FILE_TYPES } from "./lib/constants";
import BigPromotionResults from './components/BigPromotionResults'; // Import the new component
import {
  processExcelFile,
  processChecklistData,
  processRawData,
  processChecklistPromotionData,
  processPromotionRawData,
  processChecklistBigFormatData,
  processBIGPromotionRawData
} from "./utils/excelUtils";
import { countStore } from "./utils/countStore";
import { checkPromotion } from "./utils/checkPromotionSF";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// New imports for Big Format logic (to be implemented later)
import { checkPromotionBigMS } from "./utils/checkPromotionBigMS";
import { checkPromotionBigOL } from "./utils/checkPromotionBigOL";
import { exportResultsBig } from "./utils/exportResult";

export default function App() {
  const [files, setFiles] = useState({
    [FILE_TYPES.CHECKLIST]: null,
    [FILE_TYPES.RAW_DATA]: null,
  });
  const [activeTab, setActiveTab] = useState("OSA_PRO_SMALL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scoringResults, setScoringResults] = useState(null);
  const [promotionResults, setPromotionResults] = useState(null);
  const [bigPromotionResults, setBigPromotionResults] = useState(null); // For Big Format results
  const [rawWorkbook, setRawWorkbook] = useState(null);
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

  // Handle Small Format OSA + Promotion Check
  const handleSmallFormatCheck = async () => {
    if (!files[FILE_TYPES.CHECKLIST] || !files[FILE_TYPES.RAW_DATA]) return;

    setIsProcessing(true);
    setScoringResults(null);
    setPromotionResults(null);
    setBigPromotionResults(null);
    setRawWorkbook(null);
    setBatchProgress(0);
    setCurrentProgress([]);

    try {
      // Read the raw workbook for export later
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

      // Process OSA
      const [checklistData, osaRawData] = await Promise.all([
        processExcelFile(files[FILE_TYPES.CHECKLIST], "OSA"),
        processExcelFile(files[FILE_TYPES.RAW_DATA], "OSA_RAW"),
      ]);

      const osaChecklist = processChecklistData(checklistData);
      const osaProcessedRaw = processRawData(osaRawData);
      const osaResults = await countStore(
        osaChecklist,
        osaProcessedRaw,
        addProgressUpdate,
        setBatchProgress
      );

      // Process PROOL (Small Format Promotion)
      const [checklistDataPro, promoRawData] = await Promise.all([
        processExcelFile(files[FILE_TYPES.CHECKLIST], "PROMOTION"),
        processExcelFile(files[FILE_TYPES.RAW_DATA], "PROOL"),
      ]);

      const promoChecklist = processChecklistPromotionData(checklistDataPro);
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
      setScoringResults([
        { type: "error", title: "Lỗi xử lý", message: error.message },
      ]);
      setPromotionResults([
        { type: "error", title: "Lỗi xử lý", message: error.message },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };


const handleBigFormatCheck = async () => {
  if (!files[FILE_TYPES.CHECKLIST] || !files[FILE_TYPES.RAW_DATA]) return;

  setIsProcessing(true);
  setScoringResults(null);
  setPromotionResults(null);
  setBigPromotionResults(null);
  setRawWorkbook(null);
  setBatchProgress(0);
  setCurrentProgress([]);

  try {
    const rawFileReader = new FileReader();
    const rawPromise = new Promise((resolve) => {
      rawFileReader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {
          type: "array"
        });
        resolve(workbook);
      };
      rawFileReader.readAsArrayBuffer(files[FILE_TYPES.RAW_DATA]);
    });
    const rawWorkbook = await rawPromise;
    setRawWorkbook(rawWorkbook);

    // Process Big Format MS Promotion
    const [checklistDataMS, rawDataMS] = await Promise.all([
      processExcelFile(files[FILE_TYPES.CHECKLIST], "3. Pro MS & 4. Pro OL"),
      processExcelFile(files[FILE_TYPES.RAW_DATA], "PROMS"),
    ]);

    const {
      promotions: msPromotions,
      statistics: msChecklistStats
    } = processChecklistBigFormatData(checklistDataMS);
    const processedRawDataMS = processBIGPromotionRawData(rawDataMS, "PROMS");
    const msResults = await checkPromotionBigMS(
      msPromotions,
      processedRawDataMS,
      addProgressUpdate,
      setBatchProgress
    );

    // Process Big Format OL Promotion (placeholder)
    const [checklistDataOL, rawDataOL] = await Promise.all([
      processExcelFile(files[FILE_TYPES.CHECKLIST], "3. Pro MS & 4. Pro OL"),
      processExcelFile(files[FILE_TYPES.RAW_DATA], "PROOL_Dup"),
    ]);

    const {
      promotions: olPromotions,
      statistics: olChecklistStats
    } = processChecklistBigFormatData(checklistDataOL);
    const processedRawDataOL = processPromotionRawData(rawDataOL, "PROOL_Dup");
    const olResults = await checkPromotionBigOL(
      olPromotions,
      processedRawDataOL,
      addProgressUpdate,
      setBatchProgress
    );

    setBigPromotionResults({
      msResults,
      olResults,
      msChecklistStats,
      olChecklistStats,
    });
  } catch (error) {
    console.error(error);
    setBigPromotionResults({
      msResults: [{
        type: "error",
        title: "Lỗi xử lý MS",
        message: error.message
      }],
      olResults: [{
        type: "error",
        title: "Lỗi xử lý OL",
        message: error.message
      }],
      msChecklistStats: null,
      olChecklistStats: null,
    });
  } finally {
    setIsProcessing(false);
  }
};
  const handleDataCheck = async () => {
    if (activeTab === "OSA_PRO_SMALL") {
      await handleSmallFormatCheck();
    } else if (activeTab === "PROMOTION_BIG") {
      await handleBigFormatCheck();
    }
  };

  const exportFullResultsSmall = async () => {
    if (!rawWorkbook || (!scoringResults && !promotionResults && !bigPromotionResults)) return;

    const worker = new Worker(new URL("./workers/excelWorker.js", import.meta.url));
    const rawWorkbookData = XLSX.write(rawWorkbook, { type: "buffer", bookType: "xlsx" });

    worker.postMessage({
      rawWorkbookData,
      scoringResults,
      promotionResults,
      bigPromotionResults,
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
  const exportFullResultsBig = async () => {
    try {
      await exportResultsBig(rawWorkbook, bigPromotionResults);
    } catch (error) {
      alert(error.message);
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
                    isActive={activeTab === "OSA_PRO_SMALL"}
                    onClick={() => setActiveTab("OSA_PRO_SMALL")}
                  >
                    Kiểm Tra OSA, Pro Small
                  </TabsTrigger>
                  <TabsTrigger
                    isActive={activeTab === "PROMOTION_BIG"}
                    onClick={() => setActiveTab("PROMOTION_BIG")}
                  >
                    Kiểm Tra Promotion Big
                  </TabsTrigger>
                </TabsList>

                <TabsContent>
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {activeTab === "OSA_PRO_SMALL" && "Kiểm Tra OSA, Pro Small"}
                        {activeTab === "PROMOTION_BIG" && "Kiểm Tra Promotion Big"}
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
                          onClick={()=>
                            {
                              if(activeTab === "PROMOTION_BIG")
                              {
                                exportFullResultsBig()
                              }
                              else
                              {
                                exportFullResultsSmall()
                              }

                            }}
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

              {activeTab === "OSA_PRO_SMALL" && (
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

              {activeTab === "PROMOTION_BIG"&& (
               <div>
                 <BigPromotionResults results={bigPromotionResults} />
              </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
}