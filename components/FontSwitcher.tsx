"use client";

import { useState, useRef, useEffect } from "react";
import { ALargeSmall, Check } from "lucide-react";
import { useFontStore, FONT_OPTIONS } from "@/store/useFontStore";

const FONT_CLASS: Record<string, string> = {
  geist: "font-[family-name:var(--font-geist-sans)]",
  inter: "font-[family-name:var(--font-inter)]",
  merriweather: "font-[family-name:var(--font-merriweather)]",
  lora: "font-[family-name:var(--font-lora)]",
};

const FontSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const font = useFontStore((state) => state.font);
  const setFont = useFontStore((state) => state.setFont);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium text-slate-500 transition-colors hover:bg-white hover:text-rose-600"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Accessibility: change app font"
      >
        <ALargeSmall size={15} />
        Font
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full right-0 mb-3 w-56 origin-bottom-right rounded-2xl bg-white p-2 shadow-2xl duration-200"
        >
          <div className="mb-1 px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            App Font
          </div>
          {FONT_OPTIONS.map((option) => (
            <button
              key={option.id}
              role="menuitemradio"
              aria-checked={font === option.id}
              onClick={() => {
                setFont(option.id);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-[13px] font-medium text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98] ${FONT_CLASS[option.id]}`}
            >
              <span className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-[11px] font-normal text-slate-400">
                  {option.category}
                </span>
              </span>
              {font === option.id && (
                <Check size={15} className="shrink-0 text-rose-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FontSwitcher;
