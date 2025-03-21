import React, { useRef } from "react";
import { FileIcon, XIcon } from "lucide-react";

const FileUpload = ({ label, accept, onChange, className = "", file }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    onChange(event); // Gửi toàn bộ event để App.js xử lý
  };

  const removeFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Xóa giá trị input
    }
    onChange({ target: { files: null } }); // Gửi event với files: null
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center justify-center w-full">
        {!file ? (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 mb-4 text-gray-500"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click để tải file lên</span>
              </p>
              <p className="text-xs text-gray-500">XLSX hoặc XLS hoặc XLSB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              
              className="hidden"
              accept={accept}
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <div className="flex items-center p-4 w-full bg-gray-50 border border-gray-300 rounded-lg">
            <FileIcon className="w-8 h-8 text-blue-500 mr-4" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={removeFile}
              className="p-1 ml-auto bg-transparent rounded-full text-gray-400 hover:text-gray-500"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;