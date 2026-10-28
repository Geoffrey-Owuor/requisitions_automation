import {
  EMPLOYEE_ATTACHMENT_TYPES,
  EMPLOYEE_ATTACHMENT_TYPE_LABELS,
  EmployeeAttachmentType,
} from "@/public/assets";
import AttachmentLink from "./AttachmentLink";

export interface AttachmentTypeGroupsAttachment {
  attachmentId: string;
  originalFilename: string;
  attachmentType: EmployeeAttachmentType;
}

// Shared by EmployeeApprovalModal and EmployeeRequisitionViewModal so both
// surfaces group a position's attachments under their Job Description /
// KPIs / Org Chart label the same way. Requisitions imported from before the
// app (migration 036) have no documents, so they get a note instead.
export default function AttachmentTypeGroups({
  attachments,
  queryString,
  imported = false,
}: {
  attachments: AttachmentTypeGroupsAttachment[];
  queryString?: string;
  imported?: boolean;
}) {
  if (imported && attachments.length === 0) {
    return (
      <p className="text-[12px] text-neutral-500 italic">
        Imported record — no documents
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {EMPLOYEE_ATTACHMENT_TYPES.map((type) => {
        const attachment = attachments.find((a) => a.attachmentType === type);
        if (!attachment) return null;

        return (
          <div key={type} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium tracking-[0.4px] text-[#b0a0a0] uppercase">
              {EMPLOYEE_ATTACHMENT_TYPE_LABELS[type]}
            </span>
            <AttachmentLink
              attachmentId={attachment.attachmentId}
              label={attachment.originalFilename}
              queryString={queryString}
            />
          </div>
        );
      })}
    </div>
  );
}
