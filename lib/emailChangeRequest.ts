// Shared between EmailChangeRequestModal (client) and SubmitEmailChangeRequest
// (server action), so this file must stay free of server-only imports.

export const EMAIL_CHANGE_REASONS = [
  "Lost access to current email",
  "New email address issued",
  "Incorrect email on file",
  "Other",
] as const;

export interface EmailChangeRequestInput {
  staffNumber: string;
  staffName: string;
  department: string;
  reason: string;
  newEmail: string;
  confirmEmail: string;
  ownershipConfirmed: boolean;
  // Honeypot: real users never see or fill this in.
  website: string;
}

// Limits are counted against email_change_requests rows.
export const EMAIL_CHANGE_RATE_LIMIT = {
  windowMinutes: 60,
  maxPerIp: 5,
  maxPerStaffNumber: 3,
  // A still-open request for the same staff number blocks a new one for this long.
  duplicateWindowHours: 24,
} as const;
