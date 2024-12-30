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
  Info,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltipV2";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import StoreTypesTooltip from "./promotionTooltip";

const PromotionResultDisplay = ({ results, isLoading, batchProgress }) => {
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const flattenedData = useMemo(() => {
    if (!results || !results.dailySummary) return [];
    return Object.entries(results.dailySummary).flatMap(([date, promotions]) =>
      Object.entries(promotions).map(([promotionId, data]) => ({
        date,
        promotionId,
        ...data,
      }))
    );
  }, [results]);

  const filteredData = useMemo(() => {
    return flattenedData.filter(
      (item) =>
        item.date.toLowerCase().includes(filter.toLowerCase()) ||
        item.promotionId.toLowerCase().includes(filter.toLowerCase()) ||
        item.customerName.toLowerCase().includes(filter.toLowerCase())
    );
  }, [flattenedData, filter]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
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

    sortedData.forEach((item) => {
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  <Button variant="ghost" onClick={() => requestSort("date")}>
                    Ngày {getSortIcon("date")}
                  </Button>
                </TableHead>
                <TableHead className="w-[150px]">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("promotionId")}
                  >
                    Mã Promotion {getSortIcon("promotionId")}
                  </Button>
                </TableHead>
                <TableHead className="w-[200px]">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("customerName")}
                  >
                    Khách hàng {getSortIcon("customerName")}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px] text-right">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("expectedCount")}
                  >
                    Kỳ vọng {getSortIcon("expectedCount")}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px] text-right">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("actualCount")}
                  >
                    Thực tế {getSortIcon("actualCount")}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px] text-right">
                  <Button
                    variant="ghost"
                    onClick={() => requestSort("difference")}
                  >
                    Chênh lệch {getSortIcon("difference")}
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]">Trạng thái</TableHead>
                <TableHead className="w-[200px]">Loại cửa hàng</TableHead>
                <TableHead className="w-[100px]">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow
                  key={index}
                  className={item.missingStores.length > 0 ? "bg-red-100" : ""}
                >
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.promotionId}</TableCell>
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
                        className="bg-green-100 text-green-800"
                      >
                        Đủ
                      </Badge>
                    ) : item.difference > 0 ? (
                      <Badge
                        variant="warning"
                        className="bg-yellow-100 text-yellow-800"
                      >
                        Thừa
                      </Badge>
                    ) : (
                      <Badge
                        variant="destructive"
                        className="bg-red-100 text-red-800"
                      >
                        Thiếu
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <StoreTypesTooltip storeTypes={item.storeTypesVisited} />
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Xem chi tiết
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[900px] w-full px-8 py-6 bg-white rounded-lg shadow-lg">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold">
                            {item.promotionId}
                          </DialogTitle>
                          <DialogDescription className="text-gray-600">
                            <div className="flex flex-wrap gap-4">
                              <p className="font-medium text-blue-600">
                                <span className="font-semibold">Ngày:</span>{" "}
                                {item.date}
                              </p>
                            </div>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6">
                          {/* Thông tin chung */}
                          <div>
                            <h4 className="text-lg font-semibold">
                              {item.customerName}
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <p>
                                <span className="font-medium">Kỳ vọng:</span>{" "}
                                {item.expectedCount}
                              </p>
                              <p>
                                <span className="font-medium">Thực tế:</span>{" "}
                                {item.actualCount}
                              </p>
                              <p
                                className={`font-medium ${
                                  item.difference !== 0
                                    ? "text-red-500"
                                    : "text-green-500"
                                }`}
                              >
                                <span>Chênh lệch:</span> {item.difference}
                              </p>
                            </div>
                          </div>

                          {/* Bảng cửa hàng thiếu */}
                          <div>
                            {item.missingStores.length > 0 ? (
                              <table className="min-w-full table-auto border-separate border-spacing-0 rounded-lg overflow-hidden shadow-md bg-white">
                                <thead className="bg-red-500 text-white">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase">
                                      Store thiếu
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="text-gray-700">
                                  {item.missingStores.map((store, index) => (
                                    <tr
                                      key={index}
                                      className="border-t hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4">{store}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-gray-500 italic">
                                Không có cửa hàng thiếu
                              </p>
                            )}
                          </div>

                          {/* Bảng cửa hàng thừa */}
                          <div>
                            {item.excessStores.length > 0 ? (
                              <table className="min-w-full table-auto border-separate border-spacing-0 rounded-lg overflow-hidden shadow-md bg-white">
                                <thead className="bg-green-700 text-white">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold uppercase">
                                      Store thừa:
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.excessStores.map((store, index) => (
                                    <tr
                                      key={index}
                                      className="border-t hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-4">{store}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PromotionResultDisplay;
