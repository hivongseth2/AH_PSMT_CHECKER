import React, { useState } from "react";

export const TooltipProvider = ({ children }) => {
  return <div className="relative">{children}</div>;
};

export const Tooltip = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

export const TooltipTrigger = ({ children, onMouseEnter, onMouseLeave }) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="inline-block cursor-pointer"
    >
      {children}
    </div>
  );
};

export const TooltipContent = ({ children }) => {
  return (
    <div className="absolute bg-gray-700 text-white text-sm rounded-md shadow-lg px-3 py-1 mt-2">
      {children}
    </div>
  );
};
