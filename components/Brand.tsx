import Image from "next/image";
import { assets } from "@/public/assets";
import Link from "next/link";

const Brand = () => {
  return (
    <Link href="/" className="flex items-center gap-1.5">
      <div className="relative h-6 w-6">
        <Image
          src={assets.hotpoint_logo}
          alt="IssueDesk Logo"
          sizes="32px"
          loading="eager"
          className="object-contain"
        />
      </div>
      <div className="flex flex-col gap-px leading-none">
        <span className="text-[13px] font-semibold text-[#1e1b1b]">
          Requisition Hub
        </span>
        <span className="text-[10px] text-[#a18080]">
          Hotpoint Appliances Ltd
        </span>
      </div>
    </Link>
  );
};

export default Brand;
