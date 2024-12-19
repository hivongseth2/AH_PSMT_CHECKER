import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AdvancedDataAnalysis = ({ validationResults, rawData, checklist }) => {
  // Calculate additional statistics
  const totalItems = rawData.length;
  const validPercentage = (validationResults.validCount / totalItems) * 100;
  const invalidPercentage = (validationResults.invalidCount / totalItems) * 100;
  const outOfRangePercentage =
    (validationResults.outOfRangeCount / totalItems) * 100;

  // Group errors by type
  const errorTypes = validationResults.errors.reduce((acc, error) => {
    const type = error.message.split(":")[0];
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const errorChartData = Object.entries(errorTypes).map(([type, count]) => ({
    type,
    count,
  }));

  // Analyze product distribution
  const productDistribution = rawData.reduce((acc, item) => {
    acc[item["Product_id"]] = (acc[item["Product_id"]] || 0) + 1;
    return acc;
  }, {});

  const topProducts = Object.entries(productDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([product, count]) => ({ product, count }));

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Phân Tích Dữ Liệu Nâng Cao</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Thống Kê Tổng Quan</h3>
            <ul className="list-disc list-inside">
              <li>Tổng số mục: {totalItems}</li>
              <li>Tỷ lệ hợp lệ: {validPercentage.toFixed(2)}%</li>
              <li>Tỷ lệ không hợp lệ: {invalidPercentage.toFixed(2)}%</li>
              <li>Tỷ lệ ngoài phạm vi: {outOfRangePercentage.toFixed(2)}%</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Phân Bố Lỗi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={errorChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Top 10 Sản Phẩm</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedDataAnalysis;
