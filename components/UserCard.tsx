type UserCardProps = {
  initials?: string;
  userName?: string | null;
  userEmail?: string | null;
};

const UserCard = ({ initials, userName, userEmail }: UserCardProps) => {
  return (
    <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/80 bg-white/70 px-5 py-3 shadow-[0_8px_16px_rgba(160,60,60,0.06)] backdrop-blur-xl">
      {/* Initials Avatar */}
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,200,200,0.5)] bg-linear-to-br from-slate-800 to-rose-900 text-sm font-semibold text-white shadow-sm">
        {initials || "N/A"}
      </div>
      {/* Name & Email */}
      <div className="flex flex-col">
        <span className="text-[13px] font-semibold text-[#1e1b1b]">
          {userName || "No User"}
        </span>
        <span className="text-[11px] text-[#a18080]">
          {userEmail || "Not logged in"}
        </span>
      </div>
    </div>
  );
};

export default UserCard;
