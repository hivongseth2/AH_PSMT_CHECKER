import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordionV2";
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

  if (!results || !results.dailySummary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Không có dữ liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
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

  const { validCount, invalidCount, errors, dailySummary } = results;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Kết quả kiểm tra Promotion</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertTitle>Tổng quan</AlertTitle>
          <AlertDescription>
            Số lượng hợp lệ: {validCount}
            <br />
            Số lượng không hợp lệ: {invalidCount}
          </AlertDescription>
        </Alert>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="daily-summary">
            <AccordionTrigger>Tổng hợp theo ngày</AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[400px]">
                {Object.entries(dailySummary).map(([date, types]) => (
                  <Card key={date} className="mb-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Ngày: {date}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Loại cửa hàng</TableHead>
                            <TableHead>Số lượng thực tế</TableHead>
                            <TableHead>Số lượng kỳ vọng</TableHead>
                            <TableHead>Chênh lệch</TableHead>
                            <TableHead>Chi tiết</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(types).map(([type, summary]) => (
                            <TableRow key={type}>
                              <TableCell>{type}</TableCell>
                              <TableCell>{summary.actualCount}</TableCell>
                              <TableCell>{summary.expectedCount}</TableCell>
                              <TableCell>
                                {summary.actualCount - summary.expectedCount}
                              </TableCell>
                              <TableCell>
                                <Accordion type="multiple" className="w-full">
                                  {summary.missingPromotions.length > 0 && (
                                    <AccordionItem
                                      value={`${date}-${type}-missing`}
                                    >
                                      <AccordionTrigger>
                                        <Badge variant="destructive">
                                          Thiếu (
                                          {summary.missingPromotions.length})
                                        </Badge>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>
                                                Promotion ID
                                              </TableHead>
                                              <TableHead>Product ID</TableHead>
                                              <TableHead>Customer ID</TableHead>
                                              <TableHead>Store Type</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {summary.missingPromotions.map(
                                              (data, index) => (
                                                <TableRow key={index}>
                                                  <TableCell>
                                                    {data.promotionId || "N/A"}
                                                  </TableCell>
                                                  <TableCell>
                                                    {data.productId || "N/A"}
                                                  </TableCell>
                                                  <TableCell>
                                                    {data.customerId || "N/A"}
                                                  </TableCell>
                                                  <TableCell>
                                                    {data.typeStore || "N/A"}
                                                  </TableCell>
                                                </TableRow>
                                              )
                                            )}
                                          </TableBody>
                                        </Table>
                                      </AccordionContent>
                                    </AccordionItem>
                                  )}
                                  {summary.extraPromotions.length > 0 && (
                                    <AccordionItem
                                      value={`${date}-${type}-extra`}
                                    >
                                      <AccordionTrigger>
                                        <Badge variant="warning">
                                          Thừa ({summary.extraPromotions.length}
                                          )
                                        </Badge>
                                      </AccordionTrigger>
                                      <AccordionContent>
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>
                                                Promotion ID
                                              </TableHead>
                                              <TableHead>Product ID</TableHead>
                                              <TableHead>Customer ID</TableHead>
                                              <TableHead>Store Type</TableHead>
                                              <TableHead>Store ID</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {summary.extraPromotions.map(
                                              (data, index) => (
                                                <TableRow key={index}>
                                                  <TableCell>
                                                    {data.promotionId || "N/A"}
                                                  </TableCell>
                                                  <TableCell>
                                                    {data.productId || "N/A"}
                                                  </TableCell>
                                                  <TableCell>
                                                    {data.customerId || "N/A"}
                                                  </TableCell>
                                                  <TableCell>
                                                    {data.typeStore || "N/A"}
                                                  </TableCell>
                                                  <TableCell>
                                                    {data.storeId || "N/A"}
                                                  </TableCell>
                                                </TableRow>
                                              )
                                            )}
                                          </TableBody>
                                        </Table>
                                      </AccordionContent>
                                    </AccordionItem>
                                  )}
                                </Accordion>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          {errors.length > 0 && (
            <AccordionItem value="errors">
              <AccordionTrigger>
                Danh sách lỗi ({errors.length})
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ngày/Dòng</TableHead>
                        <TableHead>Lỗi</TableHead>
                        <TableHead>Chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {error.date || `Dòng ${error.row}`}
                          </TableCell>
                          <TableCell>{error.message}</TableCell>
                          <TableCell>
                            {error.missingPromotions && (
                              <Accordion type="single" collapsible>
                                <AccordionItem value="missing">
                                  <AccordionTrigger>
                                    <Badge variant="destructive">
                                      Thiếu ({error.missingPromotions.length})
                                    </Badge>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Promotion ID</TableHead>
                                          <TableHead>Product ID</TableHead>
                                          <TableHead>Customer ID</TableHead>
                                          <TableHead>Store Type</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {error.missingPromotions.map(
                                          ([id, data], index) => (
                                            <TableRow key={index}>
                                              <TableCell>{id}</TableCell>
                                              <TableCell>
                                                {data.productId}
                                              </TableCell>
                                              <TableCell>
                                                {data.customerId}
                                              </TableCell>
                                              <TableCell>
                                                {data.typeStore}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
                                      </TableBody>
                                    </Table>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                            {error.extraPromotions && (
                              <Accordion type="single" collapsible>
                                <AccordionItem value="extra">
                                  <AccordionTrigger>
                                    <Badge variant="warning">
                                      Thừa ({error.extraPromotions.length})
                                    </Badge>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Promotion ID</TableHead>
                                          <TableHead>Product ID</TableHead>
                                          <TableHead>Customer ID</TableHead>
                                          <TableHead>Store Type</TableHead>
                                          <TableHead>Store ID</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {error.extraPromotions.map(
                                          ([id, data], index) => (
                                            <TableRow key={index}>
                                              <TableCell>{id}</TableCell>
                                              <TableCell>
                                                {data[0].productId}
                                              </TableCell>
                                              <TableCell>
                                                {data[0].customerId}
                                              </TableCell>
                                              <TableCell>
                                                {data[0].typeStore}
                                              </TableCell>
                                              <TableCell>
                                                {data[0].storeId}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
                                      </TableBody>
                                    </Table>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          )}

          {invalidRows && invalidRows.length > 0 && (
            <AccordionItem value="invalid-rows">
              <AccordionTrigger>
                Dòng dữ liệu không hợp lệ ({invalidRows.length})
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-[400px]">
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
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default PromotionResultDisplay;
