import hotpoint_logo from "./web-app-manifest-192x192.png";
import form_image from "./Form_Image.png";

export const assets = {
  hotpoint_logo,
  form_image,
};

// Create a Hotpoint Email Suffix
export const emailSuffix = "@example.com";

// Date formatter
export function dateFormatter(dateString: string) {
  const date = new Date(dateString);
  const dateResult = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return dateResult;
}

// --- Constants ---
export const DEPARTMENTS = [
  "IT & Projects",
  "Finance",
  "Marketing",
  "Operations",
  "Commercial",
  "HR & Admin",
  "Modern Trade",
  "Retail",
  "B2B",
  "Internal Audit",
  "Engineering & HVAC",
  "Security",
  "Directorate",
];

// Approvers
export const HOD_APPROVERS = [
  "Example Approver 01",
  "Example Approver 02",
  "Example Approver 03",
  "Example Approver 04",
  "Example Approver 05",
  "Example Approver 06",
  "Example Approver 07",
  "Example Approver 08",
  "Example Approver 09",
  "Example Approver 10",
  "Example Approver 11",
  "Example Approver 12",
  "Example Approver 13",
  "Example Approver 14",
  "Example Approver 15",
  "Example Approver 16",
];

export const TRAVEL_CATEGORIES = ["International", "Local"];
export const TRAVEL_MODES = ["Road", "Air"];
export const BUDGET_STATUS = ["Yes", "No"];

// HOD ARRAY
export const HOD_ARRAY = [
  {
    name: "Example Approver 01",
    email: `approver01${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000001",
  },
  {
    name: "Example Approver 02",
    email: `approver02${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000002",
  },
  {
    name: "Example Approver 03",
    email: `approver03${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000003",
  },
  {
    name: "Example Approver 04",
    email: `approver04${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000004",
  },
  {
    name: "Example Approver 05",
    email: `approver05${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000005",
  },
  {
    name: "Example Approver 06",
    email: `approver06${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000006",
  },
  {
    name: "Example Approver 07",
    email: `approver07${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000007",
  },
  {
    name: "Example Approver 08",
    email: `approver08${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000008",
  },
  {
    name: "Example Approver 09",
    email: `approver09${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000009",
  },
  {
    name: "Example Approver 10",
    email: `approver10${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000010",
  },
  {
    name: "Example Approver 11",
    email: `approver11${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000011",
  },
  {
    name: "Example Approver 12",
    email: `approver12${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000012",
  },
  {
    name: "Example Approver 13",
    email: `approver13${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000013",
  },
  {
    name: "Example Approver 14",
    email: `approver14${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000014",
  },
  {
    name: "Example Approver 15",
    email: `approver15${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000015",
  },
  // Test HOD
  {
    name: "Example Approver 16",
    email: `approver16${emailSuffix}`,
    uuid: "00000000-0000-4000-8000-000000000016",
  },
];
