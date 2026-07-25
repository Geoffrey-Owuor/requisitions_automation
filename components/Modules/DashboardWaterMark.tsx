import Image from "next/image";
import { assets } from "@/public/assets";

const DashboardWatermark = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 select-none">
      {/* 
        Image Container: 
        - Enlarged to h-40/w-40 (or larger on sm screens)
        - opacity-10 and grayscale to make colored logos look like watermarks
      */}
      <div className="relative h-40 w-40 shrink-0 opacity-10 grayscale sm:h-56 sm:w-56">
        <Image
          src={assets.hotpoint_logo}
          alt="Apps Hub Watermark"
          sizes="(max-width: 768px) 160px, 224px"
          loading="eager"
          className="object-contain"
          fill
          priority
        />
      </div>

      {/* 
        Text Container: 
        - matches the faint styling (text-neutral-200 + opacity) 
      */}
      <div className="flex flex-col items-center gap-1 text-center opacity-60">
        <span className="text-3xl font-bold tracking-tight text-neutral-200 sm:text-5xl">
          Apps Hub
        </span>
        <span className="text-base font-medium tracking-widest text-neutral-200 uppercase sm:text-xl">
          Hotpoint Appliances
        </span>
      </div>
    </div>
  );
};

export default DashboardWatermark;
