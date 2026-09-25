import { ArrowRight, Undo2 } from "lucide-react";
import StatusFormatter from "@/components/Dashboard/StatusFormatter";
import { dateFormatter } from "@/public/assets";
import { TravelPushbackValues } from "@/lib/travelPushback";

/**
 * Renders the HR push-back trail for a travel requisition - each entry shows
 * who reversed the HR decision, when, why, and the old -> new decision.
 * Renders nothing when the requisition has never been pushed back.
 */
const TravelPushbackHistory = ({
  pushbacks,
}: {
  pushbacks: TravelPushbackValues[];
}) => {
  if (pushbacks.length === 0) return null;

  return (
    <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
      <div className="mb-2.5 flex items-center gap-1.5">
        <Undo2 className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
          HR Push-back History
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {pushbacks.map((pushback) => (
          <div
            key={pushback.pushbackid}
            className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"
          >
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[13px] font-semibold text-[#1e1b1b]">
                  Push-back #{pushback.pushbacknumber}
                </p>
                <p className="text-[11px] text-[#a18080]">
                  {pushback.pushedbyname} &middot;{" "}
                  {dateFormatter(pushback.createdat)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusFormatter status={pushback.previousstatus} />
                <ArrowRight className="h-3.5 w-3.5 text-[#a18080]" />
                <StatusFormatter status={pushback.newstatus} />
              </div>
            </div>
            <p className="mb-2 rounded-xl border border-dashed border-amber-300 bg-white/60 px-3 py-2 text-[12px] leading-relaxed text-[#7c5a5a] italic">
              <span className="font-semibold not-italic">Reason: </span>
              &quot;{pushback.pushbackreason}&quot;
            </p>
            <div className="grid grid-cols-2 gap-2 text-[12px] max-sm:grid-cols-1">
              <p className="text-[#7c5a5a]">
                <span className="font-semibold">Previous comments</span>
                {pushback.previousapprover && ` (${pushback.previousapprover})`}
                : {pushback.previouscomments || "No comments"}
              </p>
              <p className="text-[#7c5a5a]">
                <span className="font-semibold">New comments</span>:{" "}
                {pushback.newcomments || "No comments"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelPushbackHistory;
