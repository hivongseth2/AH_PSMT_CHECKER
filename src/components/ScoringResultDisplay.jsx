import React, { useState, useMemo } from "react";
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

const ITEMS_PER_PAGE = 10;

const ScoringResultDisplay = ({ results, isLoading }) => {
  const [expandedDate, setExpandedDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return <div>Đang xử lý dữ liệu chấm điểm...</div>;
  }

  if (
    !results ||
    !results.skuCounts ||
    Object.keys(results.skuCounts).length === 0
  ) {
    return <div>Không có dữ liệu chấm điểm để hiển thị.</div>;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const getDaySummary = (stores) => {
    let totalStores = Object.keys(stores).length;
    let totalExpected = 0;
    let totalActual = 0;
    let errorStores = 0;

    Object.values(stores).forEach((store) => {
      totalExpected += store.expected;
      totalActual += store.actual;
      if (store.expected !== store.actual) errorStores++;
    });

    return { totalStores, totalExpected, totalActual, errorStores };
  };

  const renderDayData = (date, stores) => {
    const filteredStores = Object.entries(stores).filter(([storeId]) =>
      storeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedStores = filteredStores.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{formatDate(date)}</span>
            <Input
              className="max-w-sm"
              placeholder="Tìm kiếm cửa hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã Cửa hàng</TableHead>
                <TableHead>SKU Kỳ vọng</TableHead>
                <TableHead>SKU Thực tế</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>SKU Thiếu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStores.map(([storeId, storeData]) => (
                <TableRow key={storeId}>
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
                  <TableCell>
                    {storeData.expected !== storeData.actual && (
                      <span>
                        {Array.from(storeData.missingSKUs).join(", ")}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4">
            <div>
              Trang {currentPage} /{" "}
              {Math.ceil(filteredStores.length / ITEMS_PER_PAGE)}
            </div>
            <div>
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              <Button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      Math.ceil(filteredStores.length / ITEMS_PER_PAGE),
                      prev + 1
                    )
                  )
                }
                disabled={
                  currentPage ===
                  Math.ceil(filteredStores.length / ITEMS_PER_PAGE)
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {Object.entries(results.skuCounts).map(([date, stores]) => {
        const { totalStores, totalExpected, totalActual, errorStores } =
          getDaySummary(stores);
        return (
          <Card key={date} className="mt-4">
            <CardHeader>
              <CardTitle
                className="flex justify-between items-center cursor-pointer"
                onClick={() =>
                  setExpandedDate(expandedDate === date ? null : date)
                }
              >
                <span>{formatDate(date)}</span>
                <span className="text-sm">
                  {totalStores} cửa hàng | {totalExpected} SKU kỳ vọng |{" "}
                  {totalActual} SKU thực tế | {errorStores} cửa hàng có sai lệch
                </span>
                {expandedDate === date ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
            {expandedDate === date && renderDayData(date, stores)}
          </Card>
        );
      })}
    </div>
  );
};

export default ScoringResultDisplay;
