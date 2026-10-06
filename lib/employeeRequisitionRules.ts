import "server-only";
import {
  isAllowedAttachmentType,
  MAX_ATTACHMENT_BYTES_PER_FILE,
} from "@/lib/attachmentStorage";
import {
  REPLACEMENT_OR_NEW_OPTIONS,
  JOB_GRADES,
  EMPLOYEE_ATTACHMENT_TYPES,
  EMPLOYEE_ATTACHMENT_TYPE_LABELS,
  EmployeeAttachmentType,
} from "@/public/assets";

// Shared between the initial submission route and the amendment route so
// both validate employee requisition positions and their attachments
// identically.

export type PositionInput = {
  // Set on an amendment for a position that already exists; absent for a
  // newly added one (and always absent on the initial submission)
  positionId?: string;
  title: string;
  numberRequired: number;
  replacementOrNew: string;
  jobGrade: string;
  salaryMin: number;
  salaryMax: number;
  justification: string;
  reportingTo: string;
  dateFilled: string;
};

// Returns true only if the value is genuinely missing (Allowing 0 values)
export const isEmpty = (val: unknown) =>
  val === null || val === undefined || val === "";

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

// Returns the first problem with a position's fields, or null when valid.
// The target fill date must not be in the past - on an amendment this
// applies to unchanged positions too, so approvers never see a stale target.
export function getPositionError(
  position: PositionInput,
  index: number,
  today: string,
): string | null {
  if (
    isEmpty(position.title) ||
    isEmpty(position.justification) ||
    isEmpty(position.reportingTo) ||
    isEmpty(position.dateFilled)
  ) {
    return `Position ${index + 1} is missing some required fields`;
  }

  if (position.title.length > 100 || position.reportingTo.length > 100) {
    return `Position ${index + 1}'s title/reporting to must not exceed 100 characters`;
  }

  if (
    !Number.isInteger(Number(position.numberRequired)) ||
    Number(position.numberRequired) < 1
  ) {
    return `Position ${index + 1} must request at least 1 number required`;
  }

  if (position.dateFilled < today) {
    return `Position ${index + 1}'s target fill date cannot be in the past`;
  }

  if (
    !REPLACEMENT_OR_NEW_OPTIONS.includes(
      position.replacementOrNew as (typeof REPLACEMENT_OR_NEW_OPTIONS)[number],
    )
  ) {
    return `Position ${index + 1} has an invalid Replacement/New selection`;
  }

  if (!JOB_GRADES.includes(position.jobGrade as (typeof JOB_GRADES)[number])) {
    return `Position ${index + 1} has an invalid Job Grade selection`;
  }

  if (
    !Number.isFinite(Number(position.salaryMin)) ||
    Number(position.salaryMin) <= 0
  ) {
    return `Position ${index + 1}'s minimum salary must be greater than 0`;
  }

  if (
    !Number.isFinite(Number(position.salaryMax)) ||
    Number(position.salaryMax) < Number(position.salaryMin)
  ) {
    return `Position ${index + 1}'s maximum salary cannot be less than the minimum salary`;
  }

  return null;
}

export type PositionFilesResult =
  | { ok: true; files: Partial<Record<EmployeeAttachmentType, File>> }
  | { ok: false; message: string };

// Reads and validates a position's typed files (form keys
// positionFiles_{index}_{type}). With `required`, every type must be present
// (initial submission, or a position added by an amendment); otherwise a
// missing type means "keep the current file" (an existing position being
// amended), and only the files actually sent are returned.
export function readPositionFiles(
  formData: FormData,
  index: number,
  required: boolean,
): PositionFilesResult {
  const files: Partial<Record<EmployeeAttachmentType, File>> = {};

  for (const attachmentType of EMPLOYEE_ATTACHMENT_TYPES) {
    const file = formData.get(`positionFiles_${index}_${attachmentType}`);
    const label = EMPLOYEE_ATTACHMENT_TYPE_LABELS[attachmentType];

    if (!(file instanceof File) || file.size === 0) {
      if (required) {
        return {
          ok: false,
          message: `Position ${index + 1} is missing its ${label} attachment`,
        };
      }
      continue;
    }

    if (!isAllowedAttachmentType(file.name, file.type)) {
      return {
        ok: false,
        message: `Position ${index + 1}'s ${label} attachment is an unsupported file type: ${file.name}`,
      };
    }

    if (file.size > MAX_ATTACHMENT_BYTES_PER_FILE) {
      return {
        ok: false,
        message: `Position ${index + 1}'s ${label} attachment exceeds the 2MB size limit`,
      };
    }

    files[attachmentType] = file;
  }

  return { ok: true, files };
}
