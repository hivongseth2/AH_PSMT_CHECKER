import React from "react";
import { Card, CardContent } from "../card";
import { Badge } from "../badge";

export const StoreCompareResult = ({ result }) => {
  const { missingInRaw, extraInRaw } = result || {};

  const renderList = (title, list, type) => (
    <Card className="mb-4">
      <CardContent>
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {list?.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Không có dữ liệu.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {list.map((store, index) => (
              <Badge key={index} variant={type === "error" ? "destructive" : "outline"}>
                {store}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {renderList(
        "🟥 Store CÓ TRONG danh sách chuẩn nhưng KHÔNG CÓ trong Raw Data",
        missingInRaw,
        "error"
      )}
      {renderList(
        "🟦 Store CÓ TRONG Raw Data nhưng KHÔNG CÓ trong danh sách chuẩn",
        extraInRaw,
        "info"
      )}
    </div>
  );
};
