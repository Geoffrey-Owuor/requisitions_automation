import hotpoint_logo from "./web-app-manifest-192x192.png";
import form_image from "./form_image.png";
import hotpoint_background from "./hotpoint_logo.png";
import it_form_image from "./it_form_image.png";

export const assets = {
  hotpoint_logo,
  form_image,
  hotpoint_background,
  it_form_image,
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
  "Retail Projects",
];

export const TRAVEL_CATEGORIES = ["International", "Local"];
export const TRAVEL_MODES = ["Road", "Air"];
export const BUDGET_STATUS = ["Yes", "No"];

export const initialsHelper = (userName: string) => {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials;
};
