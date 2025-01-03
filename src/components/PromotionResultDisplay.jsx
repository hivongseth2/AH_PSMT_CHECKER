import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
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
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  Check,
  ChevronRight,
} from "lucide-react";
import ProgressBar from "./ProgressBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import StoreTypesTooltip from "./promotionTooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

const PromotionResultDisplay = ({ results, isLoading, batchProgress }) => {
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [expandedDates, setExpandedDates] = useState(new Set());

  const groupedData = useMemo(() => {
    if (!results || !results.dailySummary) return {};
    return Object.entries(results.dailySummary).reduce(
      (acc, [date, promotions]) => {
        acc[date] = Object.entries(promotions).map(([promotionId, data]) => ({
          date,
          promotionId,
          ...data,
        }));
        return acc;
      },
      {}
    );
  }, [results]);

  const filteredData = useMemo(() => {
    return Object.entries(groupedData).reduce((acc, [date, promotions]) => {
      const filteredPromotions = promotions.filter(
        (item) =>
          item.date.toLowerCase().includes(filter.toLowerCase()) ||
          item.promotionId.toLowerCase().includes(filter.toLowerCase()) ||
          item.customerName.toLowerCase().includes(filter.toLowerCase())
      );
      if (filteredPromotions.length > 0) {
        acc[date] = filteredPromotions;
      }
      return acc;
    }, {});
  }, [groupedData, filter]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return Object.entries(filteredData).reduce((acc, [date, promotions]) => {
      acc[date] = [...promotions].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
      return acc;
    }, {});
  }, [filteredData, sortConfig]);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      );
    }
    return <ChevronsUpDown className="h-4 w-4" />;
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Promotion Results");

    worksheet.addRow([
      "Ngày",
      "Mã Promotion",
      "Khách hàng",
      "Kỳ vọng",
      "Thực tế",
      "Chênh lệch",
      "Trạng thái",
      "Loại cửa hàng",
      "Cửa hàng thiếu",
      "Cửa hàng thừa",
    ]);

    Object.values(sortedData)
      .flat()
      .forEach((item) => {
        worksheet.addRow([
          item.date,
          item.promotionId,
          item.customerName,
          item.expectedCount,
          item.actualCount,
          item.difference,
          item.difference === 0 ? "Đủ" : item.difference > 0 ? "Thừa" : "Thiếu",
          item.storeTypesVisited.join(", "),
          item.missingStores.join(", "),
          item.excessStores.join(", "),
        ]);
      });

    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "promotion_results.xlsx");
  };

  const toggleDateExpansion = (date) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Đang kiểm tra...</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar value={batchProgress} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!results || !results.dailySummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không có dữ liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>
              Không có dữ liệu để hiển thị. Vui lòng kiểm tra lại quá trình xử
              lý.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { validCount, invalidCount } = results;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Kết quả kiểm tra Promotion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Input
            placeholder="Lọc theo ngày, mã promotion hoặc khách hàng"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={exportToExcel} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Export to Excel
          </Button>
        </div>

        <ScrollArea className="h-[600px] border rounded-md">
          <div className="w-full">
            {Object.entries(sortedData).map(([date, promotions]) => {
              const hasError = promotions.some(
                (item) => item.missingStores.length > 0 || item.difference !== 0
              );

              return (
                <div key={date} className="border-b last:border-b-0">
                  <Collapsible
                    open={expandedDates.has(date)}
                    onOpenChange={() => toggleDateExpansion(date)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start p-2 ${
                          hasError ? "text-red-500" : ""
                        }`}
                      >
                        <ChevronRight
                          className={`mr-2 h-4 w-4 transition-transform ${
                            expandedDates.has(date) ? "rotate-90" : ""
                          }`}
                        />
                        {date} ({promotions.length} mã)
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mã Promotion</TableHead>
                            <TableHead>Khách hàng</TableHead>
                            <TableHead className="text-right">
                              Kỳ vọng
                            </TableHead>
                            <TableHead className="text-right">
                              Thực tế
                            </TableHead>
                            <TableHead className="text-right">
                              Chênh lệch
                            </TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Loại cửa hàng</TableHead>
                            <TableHead>Chi tiết</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {promotions.map((item, index) => {
                            const hasIssue =
                              item.missingStores.length > 0 ||
                              item.difference !== 0;
                            return (
                              <TableRow
                                key={index}
                                className={hasIssue ? "bg-red-100" : ""}
                              >
                                <TableCell className="font-medium">
                                  {item.promotionId}
                                </TableCell>
                                <TableCell>{item.customerName}</TableCell>
                                <TableCell className="text-right">
                                  {item.expectedCount}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.actualCount}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.difference}
                                </TableCell>
                                <TableCell>
                                  {item.difference === 0 ? (
                                    <Badge
                                      variant="success"
                                      className="text-green-500 "
                                    >
                                      <Check className="h-5 w-5" />
                                    </Badge>
                                  ) : item.difference > 0 ? (
                                    <Badge
                                      variant="warning"
                                      className="text-green-500"
                                    >
                                      Thừa
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="destructive"
                                      className=" text-red-500"
                                    >
                                      Thiếu
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <StoreTypesTooltip
                                    storeTypes={item.storeTypesVisited}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        Xem chi tiết
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[900px] w-full">
                                      <DialogHeader>
                                        <DialogTitle className="text-xl font-semibold">
                                          {item.promotionId}
                                        </DialogTitle>
                                        <DialogDescription>
                                          <div className="flex flex-wrap gap-4">
                                            <p className="font-medium text-blue-600">
                                              <span className="font-semibold">
                                                Ngày:
                                              </span>{" "}
                                              {item.date}
                                            </p>
                                          </div>
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-6">
                                        <div>
                                          <h4 className="text-lg font-semibold">
                                            {item.customerName}
                                          </h4>
                                          <div className="grid grid-cols-2 gap-4">
                                            <p>
                                              <span className="font-medium">
                                                Kỳ vọng:
                                              </span>{" "}
                                              {item.expectedCount}
                                            </p>
                                            <p>
                                              <span className="font-medium">
                                                Thực tế:
                                              </span>{" "}
                                              {item.actualCount}
                                            </p>
                                            <p
                                              className={`font-medium ${
                                                item.difference !== 0
                                                  ? "text-red-500"
                                                  : "text-green-500"
                                              }`}
                                            >
                                              <span>Chênh lệch:</span>{" "}
                                              {item.difference}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Missing Stores */}
                                        <div>
                                          {item.missingStores.length > 0 ? (
                                            <div className="rounded-lg overflow-hidden border">
                                              <div className="bg-red-500 text-white px-4 py-2 font-semibold">
                                                Store thiếu
                                              </div>
                                              <div className="divide-y">
                                                {item.missingStores.map(
                                                  (store, idx) => (
                                                    <div
                                                      key={idx}
                                                      className="px-4 py-2 bg-white"
                                                    >
                                                      {store}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-gray-500 italic">
                                              Không có cửa hàng thiếu
                                            </p>
                                          )}
                                        </div>

                                        {/* Excess Stores */}
                                        <div>
                                          {item.excessStores.length > 0 ? (
                                            <div className="rounded-lg overflow-hidden border">
                                              <div className="bg-green-600 text-white px-4 py-2 font-semibold">
                                                Store thừa
                                              </div>
                                              <div className="divide-y">
                                                {item.excessStores.map(
                                                  (store, idx) => (
                                                    <div
                                                      key={idx}
                                                      className="px-4 py-2 bg-white"
                                                    >
                                                      {store}
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-gray-500 italic">
                                              Không có cửa hàng thừa
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PromotionResultDisplay;
