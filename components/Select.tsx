"use client";

import {
  KeyboardEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  // Second line under the label, e.g. "(inactive)" or a scope
  description?: string;
};

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  // Shown while `value` is empty
  placeholder?: string;
  // Shown for a value no option has, e.g. an inactive department an
  // amendment keeps; it isn't offered in the list
  unlistedLabel?: string;
  // Accessible name when no visible <label htmlFor={id}> names it
  "aria-label"?: string;
  id?: string;
  disabled?: boolean;
  // Disabled while options load, with a progress cursor
  busy?: boolean;
  // Defaults to on from this many options
  searchable?: boolean;
  // "slate" matches Settings and Reports, "rose" the requisition forms
  tone?: SelectTone;
  // "field" is a full-width input; "inline" a borderless text trigger, as in
  // the DatePicker's month/year header
  appearance?: "field" | "inline";
};

export type SelectTone = "slate" | "rose";

const SEARCH_THRESHOLD = 8;
const LIST_MAX_HEIGHT = 288;

const TONES: Record<
  SelectTone,
  {
    field: string;
    fieldOpen: string;
    fieldClosed: string;
    value: string;
    placeholder: string;
    active: string;
    check: string;
  }
> = {
  slate: {
    field:
      "border bg-white px-3 focus-visible:border-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900/10",
    fieldOpen: "border-slate-900",
    fieldClosed: "border-neutral-200 hover:border-neutral-400",
    value: "text-neutral-900",
    placeholder: "text-neutral-400",
    active: "bg-neutral-100",
    check: "text-slate-900",
  },
  rose: {
    field:
      "border bg-white/80 px-3.5 focus-visible:border-rose-600 focus-visible:shadow-[0_0_0_3px_rgba(225,29,72,0.1)]",
    fieldOpen: "border-rose-600 shadow-[0_0_0_3px_rgba(225,29,72,0.1)]",
    fieldClosed: "border-[rgba(240,180,180,0.6)]",
    value: "text-[#1e1b1b]",
    placeholder: "text-[#a18080]",
    active: "bg-rose-50 text-rose-600",
    check: "text-rose-600",
  },
};

// An accessible replacement for the native <select> (the ARIA "select-only
// combobox" pattern): arrow keys, Home/End, Enter, Escape and type-ahead on
// the trigger, plus a search box for long lists. Escape is kept from the
// enclosing <dialog>, so closing the list never closes a modal it sits in.
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select...",
  unlistedLabel,
  "aria-label": ariaLabel,
  id,
  disabled: disabledProp,
  busy,
  searchable = options.length >= SEARCH_THRESHOLD,
  tone = "slate",
  appearance = "field",
}: SelectProps) {
  const disabled = disabledProp || busy;
  const styles = TONES[tone];
  const inline = appearance === "inline";
  const listId = useId();
  const optionId = (index: number) => `${listId}-option-${index}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeahead = useRef({ text: "", at: 0 });

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");

  const selected = options.find((option) => option.value === value);
  const shownLabel = selected?.label ?? (value ? unlistedLabel : undefined);
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle
      ? options.filter((option) => option.label.toLowerCase().includes(needle))
      : options;
  }, [options, query]);

  const openList = (index?: number) => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setPlacement(
        below < LIST_MAX_HEIGHT + 64 && rect.top > below ? "top" : "bottom",
      );
    }
    setQuery("");
    setActiveIndex(
      index ??
        Math.max(
          0,
          options.findIndex((o) => o.value === value),
        ),
    );
    setOpen(true);
  };

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (option: SelectOption | undefined) => {
    if (!option) return;
    if (option.value !== value) onChange(option.value);
    close();
  };

  // Close on a press outside, without refocusing (focus goes where pressed)
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Keep the active option in view as it moves
  useLayoutEffect(() => {
    if (!open || activeIndex < 0) return;
    document
      .getElementById(optionId(activeIndex))
      ?.scrollIntoView({ block: "nearest" });
    // optionId only depends on listId, which never changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  const move = (delta: number) =>
    setActiveIndex((index) =>
      shown.length === 0
        ? -1
        : Math.min(shown.length - 1, Math.max(0, index + delta)),
    );

  // Keys shared by the trigger and the search box while the list is open
  const onListKey = (e: KeyboardEvent) => {
    const handled = () => {
      e.preventDefault();
      e.stopPropagation();
    };
    switch (e.key) {
      case "ArrowDown":
        handled();
        move(1);
        return true;
      case "ArrowUp":
        handled();
        move(-1);
        return true;
      case "PageDown":
        handled();
        move(8);
        return true;
      case "PageUp":
        handled();
        move(-8);
        return true;
      case "Enter":
        handled();
        choose(shown[activeIndex]);
        return true;
      case "Escape":
        // Not the dialog's Escape: only the list closes
        handled();
        close();
        return true;
      case "Tab":
        // Back on the trigger first, so Tab moves on from there
        close();
        return true;
    }
    return false;
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (onListKey(e)) return;
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActiveIndex(e.key === "Home" ? 0 : shown.length - 1);
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      choose(shown[activeIndex]);
      return;
    }
    // Type-ahead: jump to the next option starting with what was typed
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      const ahead = typeahead.current;
      ahead.text = (now - ahead.at > 700 ? "" : ahead.text) + e.key;
      ahead.at = now;
      const needle = ahead.text.toLowerCase();
      const start = ahead.text.length === 1 ? activeIndex + 1 : activeIndex;
      const ordered = [...shown.slice(start), ...shown.slice(0, start)];
      const match = ordered.find((option) =>
        option.label.toLowerCase().startsWith(needle),
      );
      if (match) setActiveIndex(shown.indexOf(match));
    }
  };

  const activeId =
    open && activeIndex >= 0 && shown[activeIndex]
      ? optionId(activeIndex)
      : undefined;

  return (
    <div ref={rootRef} className={`relative ${inline ? "" : "w-full"}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={searchable ? undefined : activeId}
        aria-busy={busy || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKey}
        className={
          inline
            ? `flex items-center gap-1 rounded-lg px-1.5 py-1 text-sm font-medium text-neutral-700 transition outline-none hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-300 ${open ? "bg-neutral-100" : ""}`
            : `flex h-10 w-full items-center justify-between gap-2 rounded-xl text-left text-sm transition-colors outline-none disabled:opacity-50 ${
                busy ? "cursor-progress" : "disabled:cursor-not-allowed"
              } ${styles.field} ${open ? styles.fieldOpen : styles.fieldClosed}`
        }
      >
        <span
          className={`truncate ${inline ? "" : shownLabel ? styles.value : styles.placeholder}`}
        >
          {shownLabel ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden
          className={`shrink-0 text-neutral-400 transition-transform duration-150 ${inline ? "h-3 w-3" : "h-4 w-4"} ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-60 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg ${
            inline
              ? "left-1/2 w-36 -translate-x-1/2"
              : "right-0 left-0 min-w-48"
          } ${placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"}`}
        >
          {searchable && (
            <div className="relative border-b border-neutral-100 p-1.5">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400"
              />
              <input
                autoFocus
                type="text"
                role="combobox"
                aria-label="Search options"
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                value={query}
                placeholder="Search..."
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onListKey}
                className="h-8 w-full rounded-lg bg-neutral-50 pr-2 pl-8 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:bg-neutral-100"
              />
            </div>
          )}
          <ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{ maxHeight: LIST_MAX_HEIGHT }}
            className="normal-scrollbar overflow-y-auto p-1"
          >
            {shown.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-neutral-400">
                No matches
              </li>
            ) : (
              shown.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    // Keep focus on the trigger/search box while choosing
                    onPointerDown={(e) => e.preventDefault()}
                    onPointerMove={() => setActiveIndex(index)}
                    onClick={() => choose(option)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm ${
                      inline ? "py-1.5" : "py-2"
                    } ${isSelected ? "font-medium" : ""} ${
                      index === activeIndex
                        ? styles.active
                        : isSelected
                          ? styles.value
                          : "text-neutral-700"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.description && (
                        <span className="block truncate text-xs font-normal text-neutral-500">
                          {option.description}
                        </span>
                      )}
                    </span>
                    <Check
                      aria-hidden
                      className={`h-4 w-4 shrink-0 ${styles.check} ${isSelected ? "" : "invisible"}`}
                    />
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
