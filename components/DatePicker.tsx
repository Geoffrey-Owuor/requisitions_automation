"use client";
import { useState, useRef, useEffect } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface CustomDropdownProps {
  options: { label: string; value: number }[];
  value: number;
  onChange: (value: number) => void;
}

function CustomDropdown({ options, value, onChange }: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll selected item into view when dropdown opens
  useEffect(() => {
    if (open && listRef.current) {
      const selected = listRef.current.querySelector("[data-selected='true']");
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-red-500"
      >
        {selectedLabel}
        <ChevronDown
          size={12}
          className={`mt-px text-neutral-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          className="default-scrollbar absolute top-full left-1/2 z-60 mt-1 max-h-48 w-32 -translate-x-1/2 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-1 py-1 shadow-lg"
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  data-selected={isActive}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition ${
                    isActive
                      ? "bg-red-500 font-medium text-white"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value + "T00:00:00") : new Date();
  });

  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (value)
      Promise.resolve().then(() => setViewDate(new Date(value + "T00:00:00")));
  }, [value]);

  const selected = value ? new Date(value + "T00:00:00") : null;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthOptions = MONTHS.map((label, i) => ({ label, value: i }));
  const yearOptions = Array.from({ length: 101 }, (_, i) => {
    const y = today.getFullYear() - 50 + i;
    return { label: String(y), value: y };
  });

  const selectDay = (day: number) => {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
    setOpen(false);
  };

  const displayValue = selected
    ? selected.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const isSelected = (day: number) =>
    !!selected &&
    day === selected.getDate() &&
    month === selected.getMonth() &&
    year === selected.getFullYear();

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative flex items-center">
        <input
          readOnly
          value={displayValue}
          placeholder={placeholder}
          onClick={() => setOpen((o) => !o)}
          className="h-10 w-full cursor-pointer rounded-xl border border-neutral-300 bg-white py-2 pr-10 pl-3 text-sm text-neutral-600 transition-all outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-12 cursor-pointer rounded-full p-0.5 hover:bg-neutral-200"
          >
            <X className="h-3 w-3 text-neutral-500" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-4 text-neutral-400 hover:text-neutral-600"
          tabIndex={-1}
        >
          <CalendarDays size={16} />
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Custom dropdowns for Month and Year */}
            <div className="flex items-center gap-2">
              <CustomDropdown
                options={monthOptions}
                value={month}
                onChange={(m) => setViewDate(new Date(year, m, 1))}
              />
              <CustomDropdown
                options={yearOptions}
                value={year}
                onChange={(y) => setViewDate(new Date(y, month, 1))}
              />
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="pl-3">
            <div className="mb-1 grid grid-cols-7">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="h-8 w-8 py-1 text-center text-xs font-medium text-neutral-400"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 border-b border-neutral-100 pb-1">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const sel = isSelected(day);
                const tod = isToday(day);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                      sel
                        ? "bg-red-500 font-medium text-white"
                        : tod
                          ? "font-medium text-red-500 hover:bg-red-50"
                          : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                onChange(iso);
                setOpen(false);
              }}
              className="w-full rounded-lg py-2.5 text-sm text-red-500 transition hover:bg-red-50"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
