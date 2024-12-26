import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Input } from "./input";
import { Button } from "./button";
import { CheckCircle, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "./checkbox";
import ProgressBar from "./ProgressBar";
import ExportButton from "./exportBtnScore";
import InvalidRowsDisplay from "./invalidRowResultDisplay";

const ITEMS_PER_PAGE = 10;

const ScoringResultDisplay = ({
  results,
  isLoading,
  batchProgress,
  progressUpdates,
}) => {
  const [expandedDate, setExpandedDate] = useState(null);
  const [showOnlyDiscrepancies, setShowOnlyDiscrepancies] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStores, setExpandedStores] = useState({});
  const consoleRef = useRef(null);
  // const [displayedUpdates, setDisplayedUpdates] = useState([]);
  const displayedUpdates = progressUpdates.slice(-100); // Display only the last 100 updates

  useEffect(() => {
    console.log("Batch Progress:", batchProgress);
    console.log("Progress Updates:", progressUpdates);
  }, [batchProgress, progressUpdates]);
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [displayedUpdates]);

  const toggleDate = (date) => {
    setExpandedDate(expandedDate === date ? null : date);
    setExpandedStores({});
  };
  const renderSkuDetails = ({ missingSKUs, extraSKUs }) => (
    <div className="p-2">
      {/* <h4 className="font-semibold mb-2">Chi tiết SKU:</h4> */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h5 className="font-medium text-red-500">Thiếu SKUs:</h5>
          {missingSKUs.length > 0 ? (
            <ul className="list-none">
              {missingSKUs.map((sku, index) => (
                <li key={`missing-${index}`} className="text-red-500">
                  -- {sku}
                </li>
              ))}
            </ul>
          ) : (
            <p>Không có SKU bị thiếu.</p>
          )}
        </div>
        <div>
          <h5 className="font-medium text-green-500">Thừa SKUs:</h5>
          {extraSKUs.length > 0 ? (
            <ul className="list-none">
              {extraSKUs.map((sku, index) => (
                <li key={`extra-${index}`} className="text-green-500">
                  ++ {sku}
                </li>
              ))}
            </ul>
          ) : (
            <p>Không có SKU dư thừa.</p>
          )}
        </div>
      </div>
    </div>
  );
  const toggleStore = (date, storeId) => {
    setExpandedStores((prev) => ({
      ...prev,
      [`${date}-${storeId}`]: !prev[`${date}-${storeId}`],
    }));
  };

  const filteredResults = useMemo(() => {
    if (!results || !results.skuCounts) return {};
    return Object.entries(results.skuCounts).reduce((acc, [date, stores]) => {
      const filteredStores = Object.entries(stores).filter(
        ([storeId, data]) => {
          const matchesSearch = storeId
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
          const hasDiscrepancy = data.actual !== data.expected;
          return matchesSearch && (!showOnlyDiscrepancies || hasDiscrepancy);
        }
      );

      if (filteredStores.length > 0) {
        acc[date] = Object.fromEntries(filteredStores);
      }

      return acc;
    }, {});
  }, [results?.skuCounts, searchTerm, showOnlyDiscrepancies]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>
            {batchProgress === 0
              ? "Đang đọc dữ liệu..."
              : "Đang xử lý dữ liệu..."}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {batchProgress !== 0 && (
            <>
              <ProgressBar progress={batchProgress} />

              <p className="text-center">{batchProgress}% hoàn thành</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (
    !results ||
    !results.skuCounts ||
    Object.keys(results.skuCounts).length === 0
  ) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Không có dữ liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Không có dữ liệu chấm điểm để hiển thị.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Kết quả chấm điểm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Input
              className="max-w-sm"
              placeholder="Tìm kiếm cửa hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showDiscrepancies"
                checked={showOnlyDiscrepancies}
                onCheckedChange={setShowOnlyDiscrepancies}
              />
              <label htmlFor="showDiscrepancies" className="text-sm">
                Chỉ hiển thị cửa hàng có sai lệch
              </label>
              <ExportButton
                results={results}
                filteredResults={filteredResults}
                showOnlyDiscrepancies={showOnlyDiscrepancies}
              />
            </div>
          </div>

          {Object.entries(filteredResults).map(([date, stores]) => (
            <Card key={date} className="mb-4">
              <CardHeader className="py-2">
                <CardTitle
                  className="flex justify-between items-center cursor-pointer text-lg"
                  onClick={() => toggleDate(date)}
                >
                  <span>{formatDate(date)}</span>
                  <span className="text-sm">
                    {Object.keys(stores).length} cửa hàng
                  </span>
                  {expandedDate === date ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CardTitle>
              </CardHeader>
              {expandedDate === date && (
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã Cửa hàng</TableHead>
                        <TableHead>SKU Kỳ vọng</TableHead>
                        <TableHead>SKU Thực tế</TableHead>
                        <TableHead>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(stores).map(([storeId, storeData]) => (
                        <React.Fragment key={storeId}>
                          <TableRow
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleStore(date, storeId)}
                          >
                            <TableCell>{storeId}</TableCell>
                            <TableCell>{storeData.expected}</TableCell>
                            <TableCell>{storeData.actual}</TableCell>
                            <TableCell>
                              {storeData.expected === storeData.actual ? (
                                <CheckCircle className="text-green-500" />
                              ) : (
                                <XCircle className="text-red-500" />
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedStores[`${date}-${storeId}`] && (
                            <TableRow>
                              <TableCell colSpan={4} className="bg-gray-50">
                                {renderSkuDetails(storeData)}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          ))}
        </CardContent>
      </Card>
      {results.invalidRows && results.invalidRows.length > 0 && (
        <div className="mt-4 pt-6">
          <h2 class="text-md font-bold text-red-600 shadow-lg p-2 border-b-2 border-red-500">
            Dữ liệu ngoại lệ
          </h2>
          <InvalidRowsDisplay invalidRows={results.invalidRows} />
        </div>
      )}
    </div>
  );
};

export default ScoringResultDisplay;
