import React from "react";
import { Card, CardContent } from "../card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export const StoreCompareResult = ({ result }) => {
  const { missingInRaw = [], extraInRaw = [] } = result || {};

  const renderStoreList = (title, list, Icon, colorClass) => (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Icon className={colorClass.icon} size={18} />
          <span>{title}</span>
          <span className="ml-auto text-gray-500">({list.length})</span>
        </div>

        {list.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Không có dữ liệu.</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {list.map((store, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-sm rounded border ${colorClass.border} ${colorClass.text} bg-white`}
              >
                {store}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderStoreList(
        "Thiếu Store trong Raw Data",
        missingInRaw,
        AlertCircle,
        { icon: "text-red-500", border: "border-red-200", text: "text-red-600" }
      )}

      {renderStoreList(
        "Không có trong DS Store (RawData thừa)",
        extraInRaw,
        CheckCircle2,
        { icon: "text-blue-500", border: "border-blue-200", text: "text-blue-600" }
      )}
    </div>
  );
};
