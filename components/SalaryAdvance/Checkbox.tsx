import { Check } from "lucide-react";
import { ComponentProps } from "react";

type CheckboxProps = Omit<ComponentProps<"input">, "type">;

export function Checkbox({ className = "", ...props }: CheckboxProps) {
  return (
    <label
      className="relative inline-flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className={`peer size-4.5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white shadow-xs transition-colors duration-150 outline-none checked:border-slate-800 checked:bg-slate-800 hover:border-slate-400 checked:hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-slate-800/25 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:opacity-50 ${className}`}
        {...props}
      />
      <span className="pointer-events-none absolute inset-0 flex scale-75 items-center justify-center text-white opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100">
        <Check className="size-3.5" strokeWidth={3.5} />
      </span>
    </label>
  );
}
