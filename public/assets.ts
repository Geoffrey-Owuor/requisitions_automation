import hotpoint_logo from "./web-app-manifest-192x192.png";
import form_image from "./Form_Image.png";

export const assets = {
  hotpoint_logo,
  form_image,
};

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
  "Finance",
  "Engineering",
  "Marketing",
  "Operations",
  "Sales",
  "HR",
];

// Approvers
export const HOD_APPROVERS = ["Mwende", "Wazimu"];
export const TRAVEL_CATEGORIES = ["International", "Local"];
export const TRAVEL_MODES = ["Road", "Air"];
export const BUDGET_STATUS = ["Yes", "No"];
