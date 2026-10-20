// Client-safe: the base_departments flag columns (migrations 024, 025) the
// Settings page's Departments tab toggles. Routing reads these flags, never
// department names (lib/departments.ts).

export const DEPARTMENT_FLAGS = [
  {
    key: "requires_retail_director",
    label: "Retail Director",
    description: "Employee requisitions get a Retail Director stage",
    summary: "needs Retail Director approval",
  },
  {
    key: "casual_category_required",
    label: "Casual category",
    description: "The casual form asks for a category",
    summary: "asks for a casual category",
  },
  {
    key: "requires_engineering_jobs",
    label: "Engineering jobs",
    description: "The travel form asks for engineering jobs",
    summary: "asks for engineering jobs on travel",
  },
] as const;

export type DepartmentFlag = (typeof DEPARTMENT_FLAGS)[number]["key"];

export const isDepartmentFlag = (value: unknown): value is DepartmentFlag =>
  DEPARTMENT_FLAGS.some((flag) => flag.key === value);
