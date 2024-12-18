import React from "react"

const Tabs = ({ children, className = "", ...props }) => (
  <div className={`w-full ${className}`} {...props}>
    {children}
  </div>
)

const TabsList = ({ children, className = "", ...props }) => (
  <div
    className={`flex space-x-1 rounded-xl bg-gray-100 p-1 ${className}`}
    {...props}
  >
    {children}
  </div>
)

const TabsTrigger = ({ children, isActive, className = "", ...props }) => (
  <button
    className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 
      ${isActive 
        ? "bg-white text-blue-700 shadow" 
        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"} 
      ${className}`}
    {...props}
  >
    {children}
  </button>
)

const TabsContent = ({ children, className = "", ...props }) => (
  <div className={`mt-4 ${className}`} {...props}>
    {children}
  </div>
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
