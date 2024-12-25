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
import { Checkbox } from "./checkbox";

const ITEMS_PER_PAGE = 10;

const ScoringResultDisplay = ({ results, isLoading }) => {
  const [expandedDate, setExpandedDate] = useState(null);
  const [showOnlyDiscrepancies, setShowOnlyDiscrepancies] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStores, setExpandedStores] = useState({});

  const toggleDate = (date) => {
    setExpandedDate(expandedDate === date ? null : date);
    setExpandedStores({});
  };

  const toggleStore = (date, storeId) => {
    setExpandedStores((prev) => ({
      ...prev,
      [`${date}-${storeId}`]: !prev[`${date}-${storeId}`],
    }));
  };

  const filteredResults = useMemo(() => {
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
  }, [results.skuCounts, searchTerm, showOnlyDiscrepancies]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
          <label htmlFor="showDiscrepancies">
            Chỉ hiển thị cửa hàng có sai lệch
          </label>
        </div>
      </div>

      {Object.entries(filteredResults).map(([date, stores]) => (
        <Card key={date} className="mt-4">
          <CardHeader>
            <CardTitle
              className="flex justify-between items-center cursor-pointer"
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
                        className="cursor-pointer"
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
                          <TableCell colSpan={4} className="bg-muted">
                            <div className="p-2">
                              <h4 className="font-semibold">Chi tiết SKU:</h4>
                              {storeData.missingSKUs &&
                              storeData.missingSKUs.length > 0 ? (
                                <ul className="list-disc list-inside">
                                  {storeData.missingSKUs.map((sku, index) => (
                                    <li key={index}>{sku}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p>Không có SKU bị thiếu.</p>
                              )}
                            </div>
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
    </div>
  );
};
export default ScoringResultDisplay;
