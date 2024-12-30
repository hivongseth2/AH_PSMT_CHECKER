import React from "react";

const ScrollArea = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      <div className="h-full w-full overflow-auto rounded-[inherit] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {children}
      </div>
    </div>
  )
);
ScrollArea.displayName = "ScrollArea";

const ScrollBar = ({ orientation = "vertical", className }) => {
  return (
    <div
      className={`absolute ${
        orientation === "vertical"
          ? "right-0 top-0 h-full w-2.5"
          : "bottom-0 left-0 w-full h-2.5"
      } bg-gray-100`}
    >
      <div
        className={`relative ${
          orientation === "vertical" ? "w-full h-1/3" : "h-full w-1/3"
        } bg-gray-300 rounded-full`}
      ></div>
    </div>
  );
};

export { ScrollArea, ScrollBar };
