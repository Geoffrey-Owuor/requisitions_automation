import hotpoint_logo from "./hotpoint_icon.png";
import form_image from "./form_image.png";
import hotpoint_background from "./hotpoint_logo.png";
import hotpoint_black_logo from "./hotpoint_black_logo.png";
import it_form_image from "./it_form_image.png";
import access_key_image from "./access_key_image.png";
import advance_form_image from "./advance_form_image.png";
import casual_form_image from "./casual_form_image.png";
import employee_form_image from "./employee_form_image.png";

export const assets = {
  access_key_image,
  advance_form_image,
  hotpoint_logo,
  form_image,
  hotpoint_background,
  hotpoint_black_logo,
  it_form_image,
  casual_form_image,
  employee_form_image,
};

// Date formatter
export function dateFormatter(dateString: string) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  const dateResult = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return dateResult;
}

export const TRAVEL_CATEGORIES = ["International", "Local"];
export const TRAVEL_MODES = ["Road", "Air"];
export const BUDGET_STATUS = ["Yes", "No"];

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export const initialsHelper = (userName: string) => {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials;
};

export const ALLOWED_TRAVEL_STAGES = ["hod", "hr", "director"] as const;
export const ALLOWED_ACCESS_STAGES = ["hod", "security"] as const;
export const ALLOWED_IT_STAGES = ["hod", "it"] as const;
export const ALLOWED_CASUAL_STAGES = ["hod", "hr"] as const;
export const ALLOWED_EMPLOYEE_STAGES = ["hod", "director", "hr"] as const;

// Create a TypeScript union type: "manager" | "director" | "hr" | "finance"
export type TravelStage = (typeof ALLOWED_TRAVEL_STAGES)[number];
export type AccessStage = (typeof ALLOWED_ACCESS_STAGES)[number];
export type itStage = (typeof ALLOWED_IT_STAGES)[number];
export type CasualStage = (typeof ALLOWED_CASUAL_STAGES)[number];
export type EmployeeStage = (typeof ALLOWED_EMPLOYEE_STAGES)[number];

/**
 * Type guard to check if an untrusted string is a valid Stage
 */
export function isValidTravelStage(stage: unknown): stage is TravelStage {
  return (
    typeof stage === "string" &&
    ALLOWED_TRAVEL_STAGES.includes(stage as TravelStage)
  );
}
export function isValidAccessStage(stage: unknown): stage is AccessStage {
  return (
    typeof stage === "string" &&
    ALLOWED_ACCESS_STAGES.includes(stage as AccessStage)
  );
}
export function isValidItStage(stage: unknown): stage is itStage {
  return (
    typeof stage === "string" && ALLOWED_IT_STAGES.includes(stage as itStage)
  );
}
export function isValidCasualStage(stage: unknown): stage is CasualStage {
  return (
    typeof stage === "string" &&
    ALLOWED_CASUAL_STAGES.includes(stage as CasualStage)
  );
}
export function isValidEmployeeStage(stage: unknown): stage is EmployeeStage {
  return (
    typeof stage === "string" &&
    ALLOWED_EMPLOYEE_STAGES.includes(stage as EmployeeStage)
  );
}

export const ALL_CASUAL_LOCATIONS = [
  "Ruiru",
  "Imaara",
  "Galleria",
  "Garden City",
  "Village Market",
  "Karen",
  "Diani",
  "Likoni",
  "Kisumu",
  "Eldoret",
  "CBD",
  "Riara",
  "Nyali",
  "Sarit",
  "Yaya",
];

export const OPERATIONS_DEPARTMENT = "Operations";
export const OPERATIONS_SECTIONS = [
  "Inbound",
  "Outbound",
  "Bond",
  "DO2 Store",
  "CKD Store",
  "RHW2/RHW3",
];

export const ENGINEERING_HVAC_DEPARTMENT = "Engineering & HVAC";
export const CASUAL_CATEGORIES = ["Technician", "Welder"] as const;
export type CasualCategory = (typeof CASUAL_CATEGORIES)[number];
export const CASUAL_CATEGORY_RATES: Record<CasualCategory, number> = {
  Technician: 1000,
  Welder: 1500,
};

export const REPLACEMENT_OR_NEW_OPTIONS = ["Replacement", "New"] as const;
export type ReplacementOrNew = (typeof REPLACEMENT_OR_NEW_OPTIONS)[number];

export const JOB_GRADES = [
  "Assistant Officer",
  "Officer",
  "Supervisor",
  "Executive",
  "Senior Executive",
  "Manager",
  "Senior Manager",
  "Head",
  "Director",
] as const;
export type JobGrade = (typeof JOB_GRADES)[number];
export function getJobGradeNumber(grade: string): number {
  return JOB_GRADES.indexOf(grade as JobGrade) + 1;
}

export function formatSalaryRange(min: number, max: number): string {
  return `${min} - ${max}`;
}

// Employee Requisition position attachments: exactly one file per type is
// required. Slugs sort alphabetically into the desired display order
// (job-description < kpis < org-chart), so `ORDER BY attachment_type` in SQL
// needs no CASE expression to get Job Description, KPIs, Org Chart order.
export const EMPLOYEE_ATTACHMENT_TYPES = [
  "job-description",
  "kpis",
  "org-chart",
] as const;
export type EmployeeAttachmentType = (typeof EMPLOYEE_ATTACHMENT_TYPES)[number];
export const EMPLOYEE_ATTACHMENT_TYPE_LABELS: Record<
  EmployeeAttachmentType,
  string
> = {
  "job-description": "Job Description",
  kpis: "KPIs",
  "org-chart": "Org Chart",
};

// Locations available per department. Departments not listed here fall back
// to showing all locations rather than blocking the form.
export const CASUAL_DEPARTMENT_LOCATIONS: Record<string, string[]> = {
  "IT & Projects": ["Ruiru"],
  Finance: ["Ruiru"],
  Marketing: ["Ruiru"],
  Operations: ["Ruiru"],
  Commercial: ["Ruiru"],
  "HR & Admin": ["Ruiru"],
  "Modern Trade": ["Ruiru"],
  Directorate: ["Ruiru"],
  "Internal Audit": ["Ruiru"],
  B2B: ["Ruiru"],
  "Retail Projects": ALL_CASUAL_LOCATIONS,
  Security: ALL_CASUAL_LOCATIONS,
  Retail: ALL_CASUAL_LOCATIONS.filter((location) => location !== "Ruiru"),
  "Engineering & HVAC": ["Ruiru", "Diani", "Likoni", "Nyali"],
  "Service Center": ["Ruiru", "Sarit", "Diani", "Likoni", "Nyali"],
};

export function getCasualLocationsForDepartment(department: string): string[] {
  return CASUAL_DEPARTMENT_LOCATIONS[department] ?? ALL_CASUAL_LOCATIONS;
}

export function getCasualSections(
  department: string,
  location: string,
): string[] {
  if (department === OPERATIONS_DEPARTMENT) return OPERATIONS_SECTIONS;
  if (!department || !location) return [];
  return [`${department}-${location}`];
}

export function getCasualRatePerDay(
  location: string,
  department?: string,
  casualCategory?: CasualCategory,
) {
  if (department === ENGINEERING_HVAC_DEPARTMENT) {
    return CASUAL_CATEGORY_RATES[casualCategory ?? "Technician"];
  }
  return location === "Ruiru" ? 798 : 868;
}

export function getDailyGreeting(date: Date = new Date()): string {
  const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)

  const greetings: Record<number, string[]> = {
    0: ["Easy like Sunday morning! ☀️", "Happy Sunday! Time to recharge 🔋"],
    1: [
      "May your coffee be strong and your Monday be short! ☕",
      "Happy Monday! Let's crush this week 🚀",
    ],
    2: [
      "Terrific Tuesday! You're already crushing it 💪",
      "Happy Tuesday! Keep up the great momentum ✨",
    ],
    3: [
      "Happy Hump Day! We're officially halfway there 🐪",
      "Wonderful Wednesday! Keep shining 🌟",
    ],
    4: [
      "Thrilling Thursday! The weekend is officially in sight 👀",
      "Happy Thursday! Let's finish strong 🏁",
    ],
    5: [
      "Fri-nally! Time to wrap up and celebrate 🥳",
      "TGIF! Have a fantastic Friday 🎉",
    ],
    6: [
      "Super Saturday! Time to relax and unwind 🌴",
      "Happy Saturday! Enjoy those weekend vibes 🛋️",
    ],
  };

  // Get the array of greetings for the current day
  const dailyGreetings = greetings[dayOfWeek];

  // Pick a random greeting from the available options
  const randomIndex = Math.floor(Math.random() * dailyGreetings.length);

  return dailyGreetings[randomIndex];
}
