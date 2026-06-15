const RolePill = ({ role }: { role: string }) => {
  const roleColors: Record<string, string> = {
    user: "bg-blue-100 text-blue-700 border-blue-200",
    it: "bg-purple-100 text-purple-700 border-purple-200",
    hr: "bg-pink-100 text-pink-700 border-pink-200",
    director: "bg-amber-100 text-amber-700 border-amber-200",
    hod: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  // Fallback color for any roles not explicitly listed above
  const colorClasses =
    roleColors[role] || "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider capitalize ${colorClasses}`}
    >
      {role}
    </span>
  );
};

export default RolePill;
