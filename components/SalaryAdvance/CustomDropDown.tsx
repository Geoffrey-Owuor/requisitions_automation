"use client";

import { useId } from "react";
import { Select, SelectOption } from "@/components/Select";

interface CustomDropdownProps {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

// The salary advance forms' labelled dropdown: the shared Select in the
// requisition forms' rose tone. Select opens upwards by itself when there
// isn't room below.
export default function CustomDropdown({
  label,
  options,
  value,
  onChange,
  required = true,
}: CustomDropdownProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-medium text-[#7c5a5a]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Select
        id={id}
        tone="rose"
        value={value}
        onChange={onChange}
        options={options}
        placeholder="Select option..."
      />
    </div>
  );
}
