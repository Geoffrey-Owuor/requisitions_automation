import { Plane } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative z-10">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-linear-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-[0_4px_10px_rgba(225,29,72,0.25)]">
            <Plane size={13} className="text-white -rotate-45" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-bold text-[#1e1b1b]">
              Hotpoint Appliances Ltd
            </span>
            <span className="text-[10px] text-[#a18080]">
              Travel Requisition Form V3
            </span>
          </div>
        </div>

        {/* Centre note */}
        <p className="text-[12px] text-[#a18080] text-center">
          For HR policy queries contact{" "}
          <span className="text-rose-600 font-semibold">hr@hotpoint.co.ke</span>
        </p>

        {/* Right */}
        <p className="text-[11px] text-[#c0a0a0]">
          © {new Date().getFullYear()} Hotpoint Appliances Ltd · Internal Use
          Only
        </p>
      </div>
    </footer>
  );
};

export default Footer;
