"use client";

import { useState } from "react";

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export default function AutocompleteInput({ value, onChange, options, placeholder, className }: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const filtered = options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()));

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className={className}
        placeholder={placeholder}
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#111827] border border-[#374151] rounded-xl shadow-2xl max-h-40 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {filtered.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              className="px-4 py-2 text-[10px] text-gray-300 hover:bg-white/5 cursor-pointer uppercase font-bold"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
