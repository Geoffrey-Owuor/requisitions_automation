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
// KPIs / Org Chart label the same way.
export default function AttachmentTypeGroups({
  attachments,
  queryString,
}: {
  attachments: AttachmentTypeGroupsAttachment[];
  queryString?: string;
}) {
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
