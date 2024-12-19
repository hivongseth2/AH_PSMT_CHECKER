import React, { useRef, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

const ResultDisplay = ({
  results,
  isLoading,
  progressUpdates,
  batchProgress,
}) => {
  const consoleRef = useRef(null);
  const [displayedUpdates, setDisplayedUpdates] = useState([]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [displayedUpdates]);

  useEffect(() => {
    setDisplayedUpdates((prevDisplayed) => {
      const newUpdates = progressUpdates.slice(prevDisplayed.length);
      return [...prevDisplayed, ...newUpdates].slice(-100); // Keep last 100 updates
    });
  }, [progressUpdates]);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Kết Quả Kiểm Tra</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          ref={consoleRef}
          className="bg-black text-green-400 p-4 font-mono text-sm h-64 overflow-y-auto mb-4"
          style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
        >
          {isLoading ? (
            <>
              {displayedUpdates.map(
                (update, index) =>
                  `> Đang kiểm tra: ${update.productId} | ${update.date} | ${update.store} | ${update.status}\n`
              )}
              - Đang xử lý dữ liệu... (${batchProgress}% complete)\n
            </>
          ) : (
            results &&
            results.map(
              (result, index) =>
                `> ${result.type.toUpperCase()}: ${result.title} - ${
                  result.message
                }\n`
            )
          )}
        </div>
        {results && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Thông tin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.type === "error"
                          ? "bg-red-100 text-red-800"
                          : result.type === "warning"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {result.type}
                    </span>
                  </TableCell>
                  <TableCell>{result.title}</TableCell>
                  <TableCell>{result.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultDisplay;
