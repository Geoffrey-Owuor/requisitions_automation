import hotpoint_logo from "./web-app-manifest-192x192.png";
import form_image from "./Form_Image.png";

export const assets = {
  hotpoint_logo,
  form_image,
};

// Create a Hotpoint Email Suffix
export const emailSuffix = "@hotpoint.co.ke";

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
  "Naheed Manjothi",
  "Pritesh Singadia",
  "Raj Kanani",
  "Peter Kiilu",
  "Julius Caesar",
  "Komal Dawani",
  "Wanini Wachira",
  "Ricky Rathod",
  "Timothy Lemeiyan",
  "Patrick Jesse",
  "Victor Otieno",
  "Bedan Kivuva",
  "Veronica Thongori",
  "Ravi Kanani",
  "Lydia Manyaga",
  "Geoffrey Owuor",
];

export const TRAVEL_CATEGORIES = ["International", "Local"];
export const TRAVEL_MODES = ["Road", "Air"];
export const BUDGET_STATUS = ["Yes", "No"];

// HOD ARRAY
export const HOD_ARRAY = [
  {
    name: "Naheed Manjothi",
    email: `naheed${emailSuffix}`,
    uuid: "ec24c338-d1e0-491b-94fd-00e85cf740fc",
  },
  {
    name: "Pritesh Singadia",
    email: `prs${emailSuffix}`,
    uuid: "0e37d46e-93c1-4e6d-ae11-3dd07772c3c1",
  },
  {
    name: "Raj Kanani",
    email: `raj${emailSuffix}`,
    uuid: "79196870-675c-40d8-b8a7-fc2718f1d73d",
  },
  {
    name: "Peter Kiilu",
    email: `hr${emailSuffix}`,
    uuid: "ccf25f6d-1d0c-408b-9f55-965fb5c9d4ed",
  },
  {
    name: "Julius Caesar",
    email: `julius${emailSuffix}`,
    uuid: "5d97cfc1-bb7f-4695-aa94-08585fd596bb",
  },
  {
    name: "Komal Dawani",
    email: `komal${emailSuffix}`,
    uuid: "b981da07-d0cd-41e5-b475-4d5616cdcd3b",
  },
  {
    name: "Wanini Wachira",
    email: `wanini${emailSuffix}`,
    uuid: "dac54676-312f-4c0e-b1af-bbbfa6ceaec6",
  },
  {
    name: "Ricky Rathod",
    email: `ricky${emailSuffix}`,
    uuid: "c88ebaaa-a598-4159-b598-788c6b00dcdf",
  },
  {
    name: "Timothy Lemeiyan",
    email: `timothy${emailSuffix}`,
    uuid: "7220ab94-6969-40d6-aa5b-39803741bbea",
  },
  {
    name: "Patrick Jesse",
    email: `security${emailSuffix}`,
    uuid: "155322bd-d86c-445a-a417-45b248b10167",
  },
  {
    name: "Victor Otieno",
    email: `votieno${emailSuffix}`,
    uuid: "01ffad68-4dbf-4f87-beff-7293fcff31f7",
  },
  {
    name: "Bedan Kivuva",
    email: `bkivuva${emailSuffix}`,
    uuid: "8becbd03-43ad-4229-b7bc-0ecd38db2ad1",
  },
  {
    name: "Veronica Thongori",
    email: `veronica${emailSuffix}`,
    uuid: "318fe134-97ef-4e57-83ef-eedc08d3e400",
  },
  {
    name: "Ravi Kanani",
    email: `ravi${emailSuffix}`,
    uuid: "92e1f176-2f9a-429a-b160-698051d83585",
  },
  {
    name: "Lydia Manyaga",
    email: `lmanyaga${emailSuffix}`,
    uuid: "75d85bca-a6ec-45e3-8df1-f1c4f9b6edb3",
  },
  // Test HOD
  {
    name: "Geoffrey Owuor",
    email: `geoffrey${emailSuffix}`,
    uuid: "294f2d50-ebba-4fa0-a1ad-331d7f1bbd39",
  },
];
