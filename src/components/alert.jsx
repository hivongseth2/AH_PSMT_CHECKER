import React from "react";

export const Alert = ({ children, variant = "default" }) => {
  const baseClasses = "p-4 rounded-md";
  const variantClasses = {
    default: "bg-blue-100 text-blue-700",
    destructive: "bg-red-100 text-red-700",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`} role="alert">
      {children}
    </div>
  );
};

export const AlertTitle = ({ children }) => {
  return <h5 className="font-medium mb-1">{children}</h5>;
};

export const AlertDescription = ({ children }) => {
  return <div className="text-sm">{children}</div>;
};
