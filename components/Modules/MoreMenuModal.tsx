"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

export interface MoreMenuItem {
  key: string;
  label: string;
  Icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}

interface MoreMenuModalProps {
  items: MoreMenuItem[];
  trigger: React.ReactNode;
  align?: "right" | "bottom";
  triggerClassName?: string;
}

export default function MoreMenuModal({
  items,
  trigger,
  align = "right",
  triggerClassName,
}: MoreMenuModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const positionClasses =
    align === "right"
      ? "left-full ml-4 bottom-0 origin-bottom-left"
      : "top-full mt-2 left-0 w-full origin-top-left";

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={triggerClassName}
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`absolute z-9999 min-w-55 rounded-2xl bg-white p-2 shadow-2xl duration-200 ${positionClasses}`}
        >
          {items.map((item) => {
            const commonClassName =
              "group flex w-full items-center text-left gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98]";

            const content = (
              <>
                <item.Icon
                  size={16}
                  className="transition-colors group-hover:text-rose-500"
                />
                {item.label}
              </>
            );

            if (item.href) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick?.();
                  }}
                  className={commonClassName}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  item.onClick?.();
                }}
                className={commonClassName}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
