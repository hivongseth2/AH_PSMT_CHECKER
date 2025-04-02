import React, { useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Button } from "./components/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/tabs";
import FileUpload from "./components/FileUpload";
import ErrorBoundary from "./components/errorBoundary";
import { CHECK_TYPES, FILE_TYPES } from "./lib/constants";
import BigPromotionResults from "./components/BigPromotion/BigPromotionResults";
import SmallPromotionResults from "./components/SmallOsaPro/SmallResultDisplay";
import UserGuide from "./components/UserGuide"; // Điều chỉnh đường dẫn nếu cần
import {
  processExcelFile,
  processChecklistData,
  processRawData,
  processChecklistPromotionData,
  processPromotionRawData,
  processChecklistBigFormatData,
  processBIGPromotionRawData,
} from "./utils/excelUtils";
import { countStore } from "./utils/countStore";
import { checkPromotion } from "./utils/checkPromotionSF";
import { checkPromotionBigMS } from "./utils/checkPromotionBigMS";
import { checkPromotionBigOL } from "./utils/checkPromotionBigOL";
import { exportRawDataWithErrors } from "./utils/exportUtils";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Component chính cho giao diện kiểm tra PSMT
function MainApp() {
  const [files, setFiles] = useState({
    [FILE_TYPES.CHECKLIST]: null,
    [FILE_TYPES.RAW_DATA]: null,
  });
  const [activeTab, setActiveTab] = useState("OSA_PRO_SMALL");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scoringResults, setScoringResults] = useState(null);
  const [promotionResults, setPromotionResults] = useState(null);
  const [bigPromotionResults, setBigPromotionResults] = useState(null);
  const [rawWorkbook, setRawWorkbook] = useState(null);
  const [batchProgress, setBatchProgress] = useState(0);
  const [currentProgress, setCurrentProgress] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileChange = (type) => (event) => {
    setFiles((prev) => ({
      ...prev,
      [type]: event.target.files ? event.target.files[0] : null,
    }));
    setRawWorkbook(null);
  };

  const addProgressUpdate = useCallback((update) => {
    setCurrentProgress((prev) => [...prev, update]);
    if (update.progress) setBatchProgress(update.progress);
  }, []);

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
          const workbook = XLSX.read(data, { type: "array" });
          resolve(workbook);
        };
        rawFileReader.readAsArrayBuffer(files[FILE_TYPES.RAW_DATA]);
      });
      const rawWorkbook = await rawPromise;
      setRawWorkbook(rawWorkbook);

      const [checklistData, rawDataMS, rawDataOL] = await Promise.all([
        processExcelFile(files[FILE_TYPES.CHECKLIST], "3. Pro MS & 4. Pro OL"),
        processExcelFile(files[FILE_TYPES.RAW_DATA], "PROMS"),
        processExcelFile(files[FILE_TYPES.RAW_DATA], "PROOL_Dup"),
      ]);

      const { promotions, statistics } = processChecklistBigFormatData(checklistData);

      const processedRawDataMS = processBIGPromotionRawData(rawDataMS, "PROMS");
      const msResults = await checkPromotionBigMS(
        promotions.MS,
        processedRawDataMS,
        addProgressUpdate,
        setBatchProgress
      );

      const processedRawDataOL = processBIGPromotionRawData(rawDataOL, "PROOL_Dup");
      const olResults = await checkPromotionBigOL(
        promotions.OL,
        processedRawDataOL,
        addProgressUpdate,
        setBatchProgress
      );

      setBigPromotionResults({
        msResults,
        olResults,
        msChecklistStats: statistics.MS,
        olChecklistStats: statistics.OL,
      });
    } catch (error) {
      console.error(error);
      setBigPromotionResults({
        msResults: [{ type: "error", title: "Lỗi xử lý MS", message: error.message }],
        olResults: [{ type: "error", title: "Lỗi xử lý OL", message: error.message }],
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
    try {
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
        setIsExporting(false);
        worker.terminate();
      };
      worker.onerror = (error) => {
        console.error("Worker error:", error);
        worker.terminate();
      };
    } catch (e) {
      console.error(e);
      setIsExporting(false);
      alert("Lỗi xuất file excel");
    }
  };

  const exportFullResultsBig = async () => {
    try {
      await exportRawDataWithErrors(rawWorkbook, bigPromotionResults).then(() => {
        setIsExporting(false);
      });
    } catch (error) {
      alert(error.message);
      setIsExporting(false);
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
              <Link to="/guide" className="text-blue-600 hover:underline mt-2 block">
                Xem Hướng Dẫn Sử Dụng
              </Link>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <FileUpload
                  label="File Kiểm Tra (Checklist)"
                  accept=".xlsx,.xls,.xlsb"
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
                          onClick={() => {
                            setIsExporting(true);
                            setTimeout(() => {
                              if (activeTab === "PROMOTION_BIG") {
                                exportFullResultsBig();
                              } else {
                                exportFullResultsSmall();
                              }
                            }, 500);
                          }}
                          disabled={!rawWorkbook || isProcessing || isExporting}
                          isLoading={isExporting}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Xuất dữ liệu kiểm tra
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {activeTab === "OSA_PRO_SMALL" && scoringResults != null && promotionResults != null && (
                <SmallPromotionResults
                  osaResults={scoringResults}
                  isProcessing={isProcessing}
                  batchProgress={batchProgress}
                  currentProgress={currentProgress}
                  promotionResults={promotionResults}
                />
              )}

              {activeTab === "PROMOTION_BIG" && (
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/guide" element={<UserGuide />} />
      </Routes>
    </Router>
  );
}