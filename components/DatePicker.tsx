"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Select } from "@/components/Select";

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
  minDate?: string;
  maxDate?: string;
  // Matches the surrounding inputs: "red" (default), the requisition forms'
  // "rose" or Settings' "slate"
  tone?: "red" | "rose" | "slate";
}

const TRIGGER_TONES = {
  red: "border-neutral-300 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
  rose: "border-[rgba(240,180,180,0.6)] bg-white/80 placeholder:text-[#a18080] focus:border-rose-600 focus:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]",
  slate:
    "border-neutral-200 bg-white hover:border-neutral-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10",
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  tone = "red",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value + "T00:00:00") : new Date();
  });

  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);
  const today = new Date();

  // Calculate position (Top vs Bottom) based on remaining screen height
  const updatePlacement = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedPickerHeight = 350; // Approx height of the calendar popover

    if (spaceBelow < estimatedPickerHeight && spaceAbove > spaceBelow) {
      setPlacement("top");
    } else {
      setPlacement("bottom");
    }
  }, []);

  const toggleOpen = () => {
    if (!open) {
      updatePlacement();
      setShift(0);
    }
    setOpen((prev) => !prev);
  };

  // When the calendar fits neither above nor below the input (a short
  // window, or a centred modal), slide it back inside the viewport rather
  // than letting its header run off-screen. It may then cover the input.
  // Measured once per open/placement with the shift cleared, so it can't
  // feed back into itself.
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    if (!open || !popover) return;
    const margin = 8;
    popover.style.transform = "";
    const { top, bottom } = popover.getBoundingClientRect();
    let next = 0;
    if (top < margin) next = margin - top;
    else if (bottom > window.innerHeight - margin)
      next = Math.max(window.innerHeight - margin - bottom, margin - top);
    next = Math.round(next);
    // Re-applied by hand too: if the value didn't change, React won't
    // rewrite the style it rendered
    popover.style.transform = next ? `translateY(${next}px)` : "";
    setShift(next);
  }, [open, placement]);

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
  const minD = minDate ? new Date(minDate + "T00:00:00") : null;
  const maxD = maxDate ? new Date(maxDate + "T00:00:00") : null;
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

  const monthOptions = MONTHS.map((label, i) => ({ label, value: String(i) }));
  // Type-ahead finds a year: typing "2027" jumps straight to it
  const yearOptions = Array.from({ length: 101 }, (_, i) => {
    const y = String(today.getFullYear() - 50 + i);
    return { label: y, value: y };
  });

  const isDisabled = (day: number) => {
    const d = new Date(year, month, day);
    if (minD && d < minD) return true;
    if (maxD && d > maxD) return true;
    return false;
  };

  const isTodayDisabled = Boolean(
    (minD && today < minD) || (maxD && today > maxD),
  );

  const selectDay = (day: number) => {
    if (isDisabled(day)) return;
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
          onClick={toggleOpen}
          className={`h-10 w-full cursor-pointer rounded-xl border py-2 pr-10 pl-3 text-sm text-neutral-600 transition-all outline-none ${TRIGGER_TONES[tone]}`}
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
          onClick={toggleOpen}
          className="absolute right-4 text-neutral-400 hover:text-neutral-600"
          tabIndex={-1}
        >
          <CalendarDays size={16} />
        </button>
      </div>

      {open && (
        <div
          ref={popoverRef}
          style={shift ? { transform: `translateY(${shift}px)` } : undefined}
          className={`absolute left-0 z-50 w-full rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl ${
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
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
              <Select
                appearance="inline"
                aria-label="Month"
                searchable={false}
                options={monthOptions}
                value={String(month)}
                onChange={(m) => setViewDate(new Date(year, Number(m), 1))}
              />
              <Select
                appearance="inline"
                aria-label="Year"
                searchable={false}
                options={yearOptions}
                value={String(year)}
                onChange={(y) => setViewDate(new Date(Number(y), month, 1))}
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
                const disabled = isDisabled(day);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectDay(day)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                      disabled
                        ? "cursor-not-allowed text-neutral-300"
                        : sel
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
              disabled={isTodayDisabled}
              onClick={() => {
                const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                onChange(iso);
                setOpen(false);
              }}
              className="w-full rounded-lg py-2.5 text-sm text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
