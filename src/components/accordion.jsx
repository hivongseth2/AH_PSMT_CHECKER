import React, { useState } from "react";

export const Accordion = ({
  children,
  type = "single",
  collapsible = false,
}) => {
  return (
    <div className="divide-y divide-gray-200">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { type, collapsible })
      )}
    </div>
  );
};

export const AccordionItem = ({ children, value, type, collapsible }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    if (type === "single" || collapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="py-2">
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { isOpen, toggle, value })
      )}
    </div>
  );
};

export const AccordionTrigger = ({ children, isOpen, toggle }) => {
  return (
    <button
      className="flex justify-between w-full text-left font-medium text-gray-900 focus:outline-none"
      onClick={toggle}
      aria-expanded={isOpen}
    >
      <span>{children}</span>
      <span
        className={`transform transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`}
      >
        ▼
      </span>
    </button>
  );
};

export const AccordionContent = ({ children, isOpen }) => {
  if (!isOpen) return null;
  return <div className="mt-2">{children}</div>;
};
