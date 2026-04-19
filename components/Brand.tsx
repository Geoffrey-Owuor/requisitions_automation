import Image from "next/image";
import { assets } from "@/public/assets";

const Brand = () => {
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-6 w-6">
        <Image
          src={assets.hotpoint_logo}
          alt="IssueDesk Logo"
          sizes="32px"
          loading="eager"
          className="object-contain"
        />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[13px] font-semibold text-[#1e1b1b]">
          Hotpoint Appliances Ltd
        </span>
        <span className="text-[10px] text-[#a18080]">
          Travel Requisition Form V3
        </span>
      </div>
    </div>
  );
};

export default Brand;
