import { History } from "lucide-react";
import { initialsHelper } from "@/public/assets";

export interface PreviousApproval {
  label: string;
  approverName: string;
  status: string;
  comments: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
      {children}
    </p>
  );
}

function statusStyles(status: string) {
  const lower = (status || "").toLowerCase();

  if (lower.includes("approved") || lower.includes("accepted")) {
    return {
      color: "text-emerald-700",
      bg: "bg-emerald-100",
      border: "border-emerald-300",
    };
  }
  if (lower.includes("declined") || lower.includes("rejected")) {
    return {
      color: "text-rose-700",
      bg: "bg-rose-100",
      border: "border-rose-300",
    };
  }
  return {
    color: "text-amber-700",
    bg: "bg-amber-100",
    border: "border-amber-300",
  };
}

/**
 * Mirrors the "Approval Workflow" section of the requisition email templates
 * so the current approver can see who acted before them and what they said,
 * without needing to check their email.
 */
const PreviousApprovalsSection = ({
  approvals,
}: {
  approvals: PreviousApproval[];
}) => {
  if (approvals.length === 0) return null;

  return (
    <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
      <div className="flex items-center gap-1.5">
        <History className="mb-2.5 h-3.5 w-3.5 text-rose-400" />
        <SectionLabel>Previous Approvals</SectionLabel>
      </div>
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        {approvals.map((approval) => {
          const styles = statusStyles(approval.status);
          return (
            <div
              key={approval.label}
              className="rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/70 p-4"
            >
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-800">
                    {initialsHelper(approval.approverName)}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1e1b1b]">
                      {approval.approverName || "Awaiting Assignment"}
                    </p>
                    <p className="text-[11px] text-[#a18080]">
                      {approval.label}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase ${styles.color} ${styles.bg} ${styles.border}`}
                >
                  {approval.status || "Pending"}
                </span>
              </div>
              <p className="rounded-xl border border-dashed border-[rgba(240,180,180,0.5)] bg-white/60 px-3 py-2 text-[12px] leading-relaxed text-[#7c5a5a] italic">
                &quot;{approval.comments || "No comments"}&quot;
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreviousApprovalsSection;
