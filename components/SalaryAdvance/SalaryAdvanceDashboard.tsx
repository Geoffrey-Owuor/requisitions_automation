"use client";

import SalaryAdvanceCards from "./SalaryAdvanceCards";
import SalaryAdvanceTable from "./SalaryAdvanceTable";

export default function SalaryAdvanceDashboard() {
  return (
    <div className="p-4">
      <SalaryAdvanceCards />
      <SalaryAdvanceTable />
    </div>
  );
}
