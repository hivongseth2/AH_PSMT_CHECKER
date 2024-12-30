import React, { useState } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltipV2";

const StoreTypesTooltip = ({ storeTypes }) => {
  // Khai báo state cho việc hiển thị tooltip
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          asChild
          onMouseEnter={() => setShowTooltip(true)} // Hiển thị tooltip khi hover
          onMouseLeave={() => setShowTooltip(false)} // Ẩn tooltip khi rời chuột
        >
          <span className="text-blue-500 underline cursor-pointer">
            {storeTypes.length} loại
          </span>
        </TooltipTrigger>
        {showTooltip && (
          <TooltipContent>
            <p>{storeTypes.join(", ")}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default StoreTypesTooltip;
