import React, { useState, createContext, useContext } from "react";

const DialogContext = createContext({
  isOpen: false,
  openDialog: () => {},
  closeDialog: () => {},
});

export const Dialog = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openDialog = () => setIsOpen(true);
  const closeDialog = () => setIsOpen(false);

  return (
    <DialogContext.Provider value={{ isOpen, openDialog, closeDialog }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger = ({ children }) => {
  const { openDialog } = useContext(DialogContext);
  return (
    <div onClick={openDialog} className="cursor-pointer">
      {children}
    </div>
  );
};

export const DialogContent = ({ children }) => {
  const { isOpen, closeDialog } = useContext(DialogContext);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={closeDialog}
    >
      <div
        className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({ children }) => {
  const { closeDialog } = useContext(DialogContext);
  return (
    <div className="mb-4 relative">
      {children}
      <button
        onClick={closeDialog}
        className="absolute top-0 right-0 text-gray-500 hover:text-gray-800"
      >
        ×
      </button>
    </div>
  );
};

export const DialogTitle = ({ children }) => {
  return <h2 className="text-xl font-bold">{children}</h2>;
};

export const DialogDescription = ({ children }) => {
  return <p className="mt-2 text-gray-600">{children}</p>;
};
