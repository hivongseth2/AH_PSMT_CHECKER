import React, { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import ProgressBar from "./ProgressBar";

const PromotionResultDisplay = ({
  results,
  isLoading,
  batchProgress,
  invalidRows,
}) => {
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

  console.log(results, "result");

  if (!results || results.length === 0) {
    return null;
  }

  const summary = results.find((result) => result.type === "info");
  const errors = results.filter((result) => result.type === "error");

  console.log("sumary erro", summary, errors);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Kết quả kiểm tra Promotion</CardTitle>
      </CardHeader>
      <CardContent>
        {summary && (
          <Alert>
            <AlertTitle>{summary.title}</AlertTitle>
            <AlertDescription>{summary.message}</AlertDescription>
          </Alert>
        )}

        {errors.length > 0 && (
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="errors">
              <AccordionTrigger>
                Danh sách lỗi ({errors.length})
              </AccordionTrigger>
              <AccordionContent>
                {errors.map((error, index) => (
                  <Alert key={index} variant="destructive" className="mt-2">
                    <AlertTitle>{error.title}</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {invalidRows.length > 0 && (
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="invalid-rows">
              <AccordionTrigger>
                Dòng dữ liệu không hợp lệ ({invalidRows.length})
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dòng</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead>Dữ liệu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invalidRows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.index}</TableCell>
                        <TableCell>{row.reason}</TableCell>
                        <TableCell>{JSON.stringify(row.data)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionResultDisplay;
