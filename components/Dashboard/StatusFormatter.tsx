const statusObject: Record<string, string> = {
  pending: "bg-amber-100 text-amber-600",
  approved: "bg-emerald-100 text-emerald-600",
  declined: "bg-rose-100 text-rose-600",
  "N/A": "bg-blue-100 text-blue-600",
};
const StatusFormatter = ({ status }: { status: string }) => {
  const defaultStyle = "bg-gray-100 text-gray-600";

  const selectedStyle = statusObject[status] ?? defaultStyle;
  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-semibold ${selectedStyle} tracking-tighter uppercase`}
    >
      {status}
    </span>
  );
};

export default StatusFormatter;
