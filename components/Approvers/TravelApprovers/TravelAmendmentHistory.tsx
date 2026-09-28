import { History } from "lucide-react";
import StatusFormatter from "@/components/Dashboard/StatusFormatter";
import { ChangedValuePill } from "@/components/Approvers/CasualApprovers/CasualAmendmentHistory";
import { dateFormatter } from "@/public/assets";
import {
  formatTravelAmendmentValue,
  isLongTravelAmendmentField,
  sortTravelAmendmentFields,
  TravelAmendmentValues,
  travelAmendmentFieldLabel,
} from "@/lib/travelAmendment";

/**
 * Renders the amendment trail for a travel requisition - each amendment
 * shows who made it, when, why, the approval decisions it reset, and an
 * old -> new diff of every field that changed. Renders nothing when the
 * requisition has never been amended.
 */
const TravelAmendmentHistory = ({
  amendments,
}: {
  amendments: TravelAmendmentValues[];
}) => {
  if (amendments.length === 0) return null;

  return (
    <div className="mb-6 border-t border-[rgba(240,180,180,0.4)] pt-6">
      <div className="mb-2.5 flex items-center gap-1.5">
        <History className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
          Amendment History
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {amendments.map((amendment) => (
          <div
            key={amendment.amendmentid}
            className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4"
          >
            <div className="mb-2">
              <p className="text-[13px] font-semibold text-[#1e1b1b]">
                Amendment #{amendment.amendmentnumber}
              </p>
              <p className="text-[11px] text-[#a18080]">
                {amendment.amendedbyname} &middot;{" "}
                {dateFormatter(amendment.createdat)}
              </p>
            </div>
            <p className="mb-3 rounded-xl border border-dashed border-amber-300 bg-white/60 px-3 py-2 text-[12px] leading-relaxed text-[#7c5a5a] italic">
              &quot;{amendment.amendmentreason}&quot;
            </p>

            <div className="flex flex-col gap-1.5">
              {sortTravelAmendmentFields(amendment.fields).map((field) =>
                isLongTravelAmendmentField(field.fieldKey) ? (
                  <div key={field.fieldKey} className="text-[12px]">
                    <p className="mb-1 text-[#7c5a5a]">
                      {travelAmendmentFieldLabel(field.fieldKey)}
                    </p>
                    <p className="whitespace-pre-line text-[#a18080] line-through">
                      {formatTravelAmendmentValue(
                        field.fieldKey,
                        field.previousValue,
                      )}
                    </p>
                    <p className="mt-1 rounded-lg bg-amber-100 px-2 py-1 whitespace-pre-line text-amber-950">
                      {formatTravelAmendmentValue(
                        field.fieldKey,
                        field.newValue,
                      )}
                    </p>
                  </div>
                ) : (
                  <div
                    key={field.fieldKey}
                    className="flex items-center justify-between gap-3 text-[12px]"
                  >
                    <span className="text-[#7c5a5a]">
                      {travelAmendmentFieldLabel(field.fieldKey)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[#a18080] line-through">
                        {formatTravelAmendmentValue(
                          field.fieldKey,
                          field.previousValue,
                        )}
                      </span>
                      <ChangedValuePill>
                        {formatTravelAmendmentValue(
                          field.fieldKey,
                          field.newValue,
                        )}
                      </ChangedValuePill>
                    </span>
                  </div>
                ),
              )}
              {amendment.previousapprovaltier !== amendment.newapprovaltier && (
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="text-[#7c5a5a]">Approval Tier</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#a18080] line-through">
                      {amendment.previousapprovaltier}
                    </span>
                    <ChangedValuePill>{amendment.newapprovaltier}</ChangedValuePill>
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-200 pt-3 text-[11px] text-[#a18080]">
              <span>Decisions reset by this amendment:</span>
              {[
                { label: "HOD", status: amendment.nullifiedhodstatus },
                { label: "HR", status: amendment.nullifiedhrstatus },
                { label: "Director", status: amendment.nullifieddirectorstatus },
              ]
                .filter((step) => step.status && step.status !== "N/A")
                .map((step) => (
                  <span key={step.label} className="flex items-center gap-1">
                    {step.label}
                    <StatusFormatter status={step.status!} />
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TravelAmendmentHistory;
