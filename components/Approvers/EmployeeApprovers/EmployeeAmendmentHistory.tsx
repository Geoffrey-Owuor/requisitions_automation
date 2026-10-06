import { History } from "lucide-react";
import StatusFormatter from "@/components/Dashboard/StatusFormatter";
import { ChangedValuePill } from "@/components/Approvers/CasualApprovers/CasualAmendmentHistory";
import {
  dateFormatter,
  EMPLOYEE_ATTACHMENT_TYPE_LABELS,
} from "@/public/assets";
import {
  EmployeeAmendmentAttachmentChange,
  EmployeeAmendmentPositionValues,
  EmployeeAmendmentValues,
} from "@/lib/employeeAmendment";
import AttachmentLink from "./AttachmentLink";

const OLD_FILE_CLASS =
  "flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-[rgba(240,180,180,0.6)] bg-white/50 px-2.5 py-1 text-[11px] text-[#a18080] line-through hover:bg-rose-50";
const NEW_FILE_CLASS =
  "flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-950 hover:bg-amber-200";

function FieldDiff({
  label,
  previous,
  next,
}: {
  label: string;
  previous: string | number | null;
  next: string | number | null;
}) {
  if (previous === next) return null;

  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-[#7c5a5a]">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="text-[#a18080] line-through">
          {previous ?? "—"}
        </span>
        <ChangedValuePill>{next ?? "—"}</ChangedValuePill>
      </span>
    </div>
  );
}

function LongFieldDiff({
  label,
  previous,
  next,
}: {
  label: string;
  previous: string | null;
  next: string | null;
}) {
  if (previous === next) return null;

  return (
    <div className="text-[12px]">
      <p className="mb-1 text-[#7c5a5a]">{label}</p>
      <p className="whitespace-pre-line text-[#a18080] line-through">
        {previous ?? "—"}
      </p>
      <p className="mt-1 rounded-lg bg-amber-100 px-2 py-1 whitespace-pre-line text-amber-950">
        {next ?? "—"}
      </p>
    </div>
  );
}

const formatDate = (value: string | null) =>
  value ? dateFormatter(value) : null;

function AttachmentChangeRow({
  change,
  queryString,
}: {
  change: EmployeeAmendmentAttachmentChange;
  queryString?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
      <span className="text-[#7c5a5a]">
        {EMPLOYEE_ATTACHMENT_TYPE_LABELS[change.attachmentType]}
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {change.previousAttachmentId && change.previousFilename && (
          <AttachmentLink
            attachmentId={change.previousAttachmentId}
            label={change.previousFilename}
            queryString={queryString}
            archived
            className={OLD_FILE_CLASS}
          />
        )}
        {change.newAttachmentId && change.newFilename && (
          <AttachmentLink
            attachmentId={change.newAttachmentId}
            label={change.newFilename}
            queryString={queryString}
            archived={change.newArchived}
            className={NEW_FILE_CLASS}
          />
        )}
      </span>
    </div>
  );
}

function PositionChange({
  position,
  queryString,
}: {
  position: EmployeeAmendmentPositionValues;
  queryString?: string;
}) {
  const isModified = position.changeType === "modified";
  // Added/removed positions show their full values on one side only
  const values =
    position.changeType === "removed"
      ? {
          numberRequired: position.previousNumberRequired,
          jobGrade: position.previousJobGrade,
          dateFilled: position.previousDateFilled,
        }
      : {
          numberRequired: position.newNumberRequired,
          jobGrade: position.newJobGrade,
          dateFilled: position.newDateFilled,
        };

  return (
    <div className="rounded-xl bg-white/70 p-3">
      <p className="mb-1.5 text-[12px] font-semibold text-[#1e1b1b]">
        <span
          className={
            position.changeType === "removed" ? "line-through" : undefined
          }
        >
          {position.positionTitle}
        </span>{" "}
        <span className="text-[10px] font-normal text-[#a18080] uppercase">
          ({position.changeType})
        </span>
      </p>

      {isModified ? (
        <div className="flex flex-col gap-1.5">
          <FieldDiff
            label="Title"
            previous={position.previousTitle}
            next={position.newTitle}
          />
          <FieldDiff
            label="Number Required"
            previous={position.previousNumberRequired}
            next={position.newNumberRequired}
          />
          <FieldDiff
            label="Replacement/New"
            previous={position.previousReplacementOrNew}
            next={position.newReplacementOrNew}
          />
          <FieldDiff
            label="Job Grade"
            previous={position.previousJobGrade}
            next={position.newJobGrade}
          />
          <FieldDiff
            label="Salary Range (KES)"
            previous={position.previousSalaryRange}
            next={position.newSalaryRange}
          />
          <FieldDiff
            label="Reporting To"
            previous={position.previousReportingTo}
            next={position.newReportingTo}
          />
          <FieldDiff
            label="Target Fill Date"
            previous={formatDate(position.previousDateFilled)}
            next={formatDate(position.newDateFilled)}
          />
          <LongFieldDiff
            label="Justification"
            previous={position.previousJustification}
            next={position.newJustification}
          />
        </div>
      ) : (
        <p className="text-[12px] text-[#7c5a5a]">
          {values.numberRequired} required &middot; {values.jobGrade}
          {values.dateFilled && <> &middot; by {dateFormatter(values.dateFilled)}</>}
        </p>
      )}

      {position.attachments.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5 border-t border-dashed border-amber-200 pt-2">
          {position.attachments.map((change) => (
            <AttachmentChangeRow
              key={change.attachmentType}
              change={change}
              queryString={queryString}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Renders the amendment trail for an employee requisition - who amended it,
 * why, an old -> new diff of the header and every changed position, and the
 * attachments each amendment replaced (old versions stay viewable).
 * `queryString` carries an approver's token/stage for the attachment links.
 */
const EmployeeAmendmentHistory = ({
  amendments,
  queryString,
}: {
  amendments: EmployeeAmendmentValues[];
  queryString?: string;
}) => {
  if (amendments.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <History className="h-3.5 w-3.5 text-amber-500" />
        <p className="text-[11px] font-semibold tracking-[0.4px] text-[#b0a0a0] uppercase">
          Amendment History
        </p>
      </div>
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
          <p className="mb-3 rounded-xl border border-dashed border-amber-300 bg-white/60 px-3 py-2 text-[12px] leading-relaxed whitespace-pre-line text-[#7c5a5a] italic">
            &quot;{amendment.amendmentreason}&quot;
          </p>

          <div className="flex flex-col gap-1.5">
            {amendment.newdepartment !== null && (
              <FieldDiff
                label="Department"
                previous={amendment.previousdepartment}
                next={amendment.newdepartment}
              />
            )}
            {amendment.newhodapprover !== null && (
              <FieldDiff
                label="HOD Approver"
                previous={amendment.previoushodapprover}
                next={amendment.newhodapprover}
              />
            )}
            <FieldDiff
              label="Positions"
              previous={amendment.previoustotalpositions}
              next={amendment.newtotalpositions}
            />
            <FieldDiff
              label="Total Headcount"
              previous={amendment.previoustotalrequired}
              next={amendment.newtotalrequired}
            />
          </div>

          {amendment.positions.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 border-t border-amber-200 pt-3">
              {amendment.positions.map((position, index) => (
                <PositionChange
                  key={`${position.changeType}-${position.positionTitle}-${index}`}
                  position={position}
                  queryString={queryString}
                />
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-200 pt-3 text-[11px] text-[#a18080]">
            <span>Decisions reset by this amendment:</span>
            {[
              { label: "HOD", status: amendment.nullifiedhodstatus },
              {
                label: "Retail Director",
                status: amendment.nullifiedretaildirectorstatus,
              },
              { label: "CEO", status: amendment.nullifieddirectorstatus },
              { label: "HR", status: amendment.nullifiedhrstatus },
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
  );
};

export default EmployeeAmendmentHistory;
