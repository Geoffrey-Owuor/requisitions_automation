interface FlagBadgeProps {
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
  tone?: "emerald" | "violet";
}

const TONE_STYLES: Record<NonNullable<FlagBadgeProps["tone"]>, string> = {
  emerald: "bg-emerald-100 text-emerald-600",
  violet: "bg-violet-100 text-violet-600",
};

// Small status pill for boolean request properties (exported/altered),
// styled to match StatusFormatter so the two badge families read as one
// system in the table and modal.
export function FlagBadge({
  value,
  trueLabel = "Yes",
  falseLabel = "No",
  tone = "emerald",
}: FlagBadgeProps) {
  const style = value ? TONE_STYLES[tone] : "bg-gray-100 text-gray-600";

  return (
    <span
      className={`max-w-20 truncate rounded-full px-3 py-1 text-[10px] font-semibold tracking-tighter uppercase ${style}`}
    >
      {value ? trueLabel : falseLabel}
    </span>
  );
}
