import React, { useState, useRef, useEffect } from "react";

const Tooltip = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  const handleMouseEnter = (e) => {
    setVisible(true);

    const tooltipEl = tooltipRef.current;
    if (tooltipEl) {
      const { top, left, width } = e.target.getBoundingClientRect();
      const { offsetHeight } = tooltipEl;

      // Adjust tooltip position dynamically
      setPosition({
        top: top - offsetHeight - 10, // Above the element
        left: left + width / 2,
      });
    }
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: "translateX(-50%)",
            zIndex: 10,
            backgroundColor: "#333",
            color: "#fff",
            fontSize: "12px",
            borderRadius: "4px",
            padding: "8px",
            maxWidth: "450px",
            maxHeight: "250px",
            overflowY: "auto",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
            whiteSpace: "pre-wrap",
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
