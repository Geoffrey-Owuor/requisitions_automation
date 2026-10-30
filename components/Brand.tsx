import Link from "next/link";
import HotpointMark from "@/components/HotpointMark";

const Brand = ({ showText = false }: { showText?: boolean }) => {
  return (
    <Link
      href="/"
      aria-label={showText ? undefined : "Apps Hub home"}
      className="flex items-center gap-1.5"
    >
      <HotpointMark className="h-6.5 w-6.5 shrink-0" />
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
