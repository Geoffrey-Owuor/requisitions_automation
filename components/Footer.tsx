import Image from "next/image";
import { assets } from "@/public/assets";
import Brand from "./Brand";

const Footer = () => {
  return (
    <footer className="relative z-10">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <Brand />

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
