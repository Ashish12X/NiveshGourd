// src/components/input/UploadButton.jsx
import React, { useRef, useState } from 'react';
import { Paperclip, Check } from 'lucide-react';

export default function UploadButton({ onFileSelected, label = 'Attach', className = '' }) {
  const fileInputRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState(null);

  const handleTrigger = (e) => {
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      if (onFileSelected) onFileSelected(file.name);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        className="hidden"
        accept="image/*,.pdf,.txt,.doc,.docx"
        aria-label="Upload document or screenshot"
      />
      <button
        type="button"
        onClick={handleTrigger}
        title="Upload screenshot, PDF, or message"
        aria-label="Upload document or screenshot"
        className={`inline-flex items-center gap-1.5 p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-xs font-medium cursor-pointer ${
          selectedFileName ? 'text-teal-700 bg-teal-50' : ''
        } ${className}`}
      >
        {selectedFileName ? (
          <>
            <Check className="w-4 h-4 text-teal-600" />
            <span className="max-w-[120px] truncate">{selectedFileName}</span>
          </>
        ) : (
          <>
            <Paperclip className="w-4 h-4" />
            {label && <span className="hidden sm:inline">{label}</span>}
          </>
        )}
      </button>
    </div>
  );
}
