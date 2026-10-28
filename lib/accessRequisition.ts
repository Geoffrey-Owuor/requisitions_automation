// Client-safe definitions shared by the Key & Access form, its submission
// route, the approval page, the details modal, the PDF and the email.

export const ACCESS_EMPLOYEE_STATUSES = [
  "Permanent",
  "Contract",
  "Probation",
] as const;

export type AccessEmployeeStatus = (typeof ACCESS_EMPLOYEE_STATUSES)[number];

export const isAccessEmployeeStatus = (
  value: unknown,
): value is AccessEmployeeStatus =>
  ACCESS_EMPLOYEE_STATUSES.includes(value as AccessEmployeeStatus);

// Display labels for access_locations / access_requirements
export const ACCESS_LOCATIONS_LABEL = "Locations/Access Level";
export const ACCESS_REQUIREMENTS_LABEL = "Requirements & Justification";

export interface AccessPolicy {
  intro: string;
  conditions: string[];
  warning: string;
  // The submitter's agreement, in their own words, as ticked on the form
  acknowledgement: string;
}

// Each requisition stores the version its submitter agreed to
// (access_requisitions.terms_version), so a reworded policy goes in as a new
// version and older requisitions keep showing the wording they agreed to.
export const ACCESS_POLICY_VERSIONS: Record<number, AccessPolicy> = {
  1: {
    intro:
      "By receiving these keys/access codes, you are bound by the following conditions:",
    conditions: [
      "Safeguard the store and key(s) securely at all times.",
      "Use the key(s) strictly for official purposes only.",
      "Arm and disarm the premises during departure and entry respectively.",
      "Ensure all staff and visitors have exited the premises, all windows and access points are closed, and lights switched off before arming the system.",
      "Report any lost, damaged, or missing key(s) to HOD & HAL Security immediately.",
      "Do not attempt to copy, alter, duplicate, or reproduce any HAL facility key(s).",
      "Do not share your access code with any colleague, stranger, or unauthorized person.",
      "If unable to secure the premises, report immediately to the HOD & HAL Security Department.",
      "Produce or surrender the key(s) upon official request or before proceeding on leave.",
      "Report any absence or unfamiliar security guard within the facility before opening the premises.",
      "Open & close the premises only in the presence of familiar contracted security personnel.",
      "Report and respond appropriately to any emergencies brought to your attention.",
      "Change your access code whenever deemed necessary based on your judgment or security concerns.",
    ],
    warning:
      "Do not hand over the key(s) to strangers or unauthorized persons under any circumstances.",
    acknowledgement:
      "I agree to comply with all HAL policies and procedures relating to the custody and use of facility/store key(s) and access codes. I further acknowledge that if the key(s) are lost, stolen, damaged, or not surrendered upon request, I may be surcharged for costs incurred, including replacement of locks and related security measures.",
  },
};

export const CURRENT_ACCESS_POLICY_VERSION = 1;

export const getAccessPolicy = (version: number): AccessPolicy =>
  ACCESS_POLICY_VERSIONS[version] ??
  ACCESS_POLICY_VERSIONS[CURRENT_ACCESS_POLICY_VERSION];
