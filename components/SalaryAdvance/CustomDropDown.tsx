"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  openUpwards?: boolean;
}

export default function CustomDropdown({
  label,
  options,
  value,
  onChange,
  required = true,
  openUpwards = false,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Find the label that matches the current value to display in the button
  const selectedLabel = options.find(
    (opt) => String(opt.value) === String(value),
  )?.label;

  return (
    <div className="relative flex flex-col gap-2">
      <label className="text-[13px] font-medium text-[#7c5a5a]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <button
        type="button"
        className="flex h-10 cursor-pointer items-center justify-between rounded-xl border border-[rgba(240,180,180,0.6)] bg-white/80 px-3.5 text-sm transition-all duration-200 outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedLabel ? "text-[#1e1b1b]" : "text-[#a18080]"}>
          {selectedLabel || "Select option..."}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Invisible overlay to handle clicking outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown Menu */}
          <div
            className={`absolute right-0 ${openUpwards ? "bottom-[calc(100%-22px)]" : "top-[calc(100%+4px)]"} left-0 z-50 max-h-60 scrollbar-thin overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg`}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                className={`cursor-pointer rounded-lg px-3 py-2.5 text-[14px] transition-all duration-200 ${
                  String(value) === String(opt.value)
                    ? "bg-rose-100 font-medium text-rose-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
