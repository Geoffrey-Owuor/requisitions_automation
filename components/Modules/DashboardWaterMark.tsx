import HotpointMark from "@/components/HotpointMark";

const DashboardWatermark = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 select-none">
      {/* 
        Image Container: 
        - Enlarged to h-40/w-40 (or larger on sm screens)
        - opacity-5 and grayscale so the logo stays a faint backdrop behind content
      */}
      <HotpointMark className="h-40 w-40 shrink-0 opacity-5 grayscale sm:h-56 sm:w-56" />

      {/* 
        Text Container: 
        - matches the faint styling (text-neutral-200 + opacity) 
      */}
      <div className="flex flex-col items-center gap-1 text-center opacity-35">
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
