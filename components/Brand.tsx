import Image from "next/image";
import { assets } from "@/public/assets";
import Link from "next/link";

// TODO: Ensure your assets.hotpoint_logo points to a valid image path
const Brand = ({ showText = false }: { showText?: boolean }) => {
  return (
    <Link href="/" className="flex items-center gap-1.5">
      <div className="relative h-6.5 w-6.5 shrink-0">
        <Image
          src={assets.hotpoint_logo}
          alt="IssueDesk Logo"
          sizes="32px"
          loading="eager"
          className="object-contain"
          fill // Added fill to fit safely inside the absolute container
          priority
        />
      </div>
      {showText && (
        <div className="flex flex-col gap-px leading-none">
          <span className="text-[14px] font-semibold text-[#1e1b1b]">
            Apps Hub
          </span>
          <span className="text-[11px] text-[#a18080]">
            Hotpoint Appliances
          </span>
        </div>
      )}
    </Link>
  );
};

export default Brand;
