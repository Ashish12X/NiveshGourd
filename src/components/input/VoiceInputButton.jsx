// src/components/input/VoiceInputButton.jsx
import React, { useState } from 'react';
import { Mic } from 'lucide-react';

export default function VoiceInputButton({ onVoiceClick, className = '' }) {
  const [isActive, setIsActive] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    setIsActive(!isActive);
    if (onVoiceClick) onVoiceClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Voice input (Mock UI)"
      title="Voice Input (UI Preview)"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
        isActive
          ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-400'
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
      } ${className}`}
    >
      <Mic className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
      {isActive && (
        <span className="absolute -top-7 right-0 text-[10px] font-medium bg-slate-900 text-white px-2 py-0.5 rounded shadow whitespace-nowrap">
          Voice UI preview
        </span>
      )}
    </button>
  );
}
