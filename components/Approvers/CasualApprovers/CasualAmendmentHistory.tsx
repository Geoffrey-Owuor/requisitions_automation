import { History, Pencil } from "lucide-react";
import { dateFormatter } from "@/public/assets";
import { CasualAmendmentValues } from "@/services/CasualEmailSender";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
      {children}
    </p>
  );
}

export function ChangedValuePill({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-amber-950 shadow-sm">
      <Pencil className="h-3 w-3" />
      {children}
    </span>
  );
}

function FieldDiff({
  label,
  previous,
  next,
}: {
  label: string;
  previous: string | number | null;
  next: string | number | null;
}) {
  if (previous === next || previous == null) return null;

  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-[#7c5a5a]">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="text-[#a18080] line-through">{String(previous)}</span>
        <ChangedValuePill>{String(next)}</ChangedValuePill>
      </span>
    </div>
  );
}

/**
 * Renders the amendment trail for a casual requisition - each amendment
 * shows who made it, why, and an old -> new diff for header and per-section
 * fields that changed. Sections with no diff (unchanged) render nothing.
 */
const CasualAmendmentHistory = ({
  amendments,
}: {
  amendments: CasualAmendmentValues[];
}) => {
  if (amendments.length === 0) return null;

  return (
    <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
      <div className="flex items-center gap-1.5">
        <History className="mb-2.5 h-3.5 w-3.5 text-amber-500" />
        <SectionLabel>Amendment History</SectionLabel>
      </div>
      <div className="flex flex-col gap-3">
        {amendments.map((amendment) => (
          <div
            key={amendment.amendmentid}
            className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-[13px] font-semibold text-[#1e1b1b]">
                  Amendment #{amendment.amendmentnumber}
                </p>
                <p className="text-[11px] text-[#a18080]">
                  {amendment.amendedbyname} &middot;{" "}
                  {dateFormatter(amendment.createdat)}
                </p>
              </div>
            </div>
            <p className="mb-3 rounded-xl border border-dashed border-amber-300 bg-white/60 px-3 py-2 text-[12px] leading-relaxed text-[#7c5a5a] italic">
              &quot;{amendment.amendmentreason}&quot;
            </p>

            <div className="flex flex-col gap-1.5">
              <FieldDiff
                label="Department"
                previous={amendment.previousdepartment}
                next={amendment.newdepartment}
              />
              <FieldDiff
                label="Location"
                previous={amendment.previouslocation}
                next={amendment.newlocation}
              />
              <FieldDiff
                label="Casual Category"
                previous={amendment.previouscasualcategory}
                next={amendment.newcasualcategory}
              />
              <FieldDiff
                label="HOD Approver"
                previous={amendment.previoushodapprover}
                next={amendment.newhodapprover}
              />
            </div>

            {amendment.sections.length > 0 && (
              <div className="mt-3 flex flex-col gap-2 border-t border-amber-200 pt-3">
                {amendment.sections.map((section) => (
                  <div
                    key={section.sectionName}
                    className="rounded-xl bg-white/70 p-3"
                  >
                    <p className="mb-1.5 text-[12px] font-semibold text-[#1e1b1b]">
                      {section.sectionName}{" "}
                      <span className="text-[10px] font-normal text-[#a18080] uppercase">
                        ({section.changeType})
                      </span>
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <FieldDiff
                        label="Number of Casuals"
                        previous={section.previousNumberOfCasuals}
                        next={section.newNumberOfCasuals}
                      />
                      <FieldDiff
                        label="Period From"
                        previous={
                          section.previousPeriodFrom
                            ? dateFormatter(section.previousPeriodFrom)
                            : null
                        }
                        next={
                          section.newPeriodFrom
                            ? dateFormatter(section.newPeriodFrom)
                            : null
                        }
                      />
                      <FieldDiff
                        label="Period To"
                        previous={
                          section.previousPeriodTo
                            ? dateFormatter(section.previousPeriodTo)
                            : null
                        }
                        next={
                          section.newPeriodTo
                            ? dateFormatter(section.newPeriodTo)
                            : null
                        }
                      />
                      <FieldDiff
                        label="Total Amount"
                        previous={section.previousTotalAmount}
                        next={section.newTotalAmount}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CasualAmendmentHistory;
