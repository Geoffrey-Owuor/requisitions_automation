"use client";
import { useState } from "react";
import SalaryAdvancePage from "./SalaryAdvancePage";
import SalaryAdvanceDashboard from "./SalaryAdvanceDashboard";
import { useUser } from "@/context/UserContext";
import { LayoutDashboard, Plus } from "lucide-react";

type ViewState = "dashboard" | "page";

const DashboardAdvanceWrapper = () => {
  const { roles } = useUser();
  const [activeView, setActiveView] = useState<ViewState>(
    roles.includes("hr") ? "dashboard" : "page",
  );

  return (
    <div className="relative h-full w-full">
      {/* HR Action toggle button */}
      {roles.includes("hr") && (
        <div className="fixed right-6 bottom-4 z-50 flex flex-col items-end">
          {/* Make a Request Button */}
          <button
            onClick={() => setActiveView("page")}
            title="Make a Request"
            className="group flex h-10 cursor-pointer items-center justify-end overflow-hidden rounded-t-2xl bg-slate-800 px-0.5 text-neutral-100 transition-all duration-300 ease-out"
          >
            {/* Label: Slides out to the left on hover */}
            <span className="max-w-0 text-xs font-semibold tracking-wide whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:pl-4 group-hover:opacity-100">
              Make a Request
            </span>
            {/* Icon Container */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <Plus className="h-5 w-5" />
            </div>
          </button>

          {/* Dashboard Button */}
          <button
            onClick={() => setActiveView("dashboard")}
            title="Dashboard"
            className="group flex h-10 cursor-pointer items-center justify-end overflow-hidden rounded-b-2xl bg-slate-900 px-0.5 text-neutral-100 transition-all duration-300 ease-out"
          >
            {/* Label: Slides out to the left on hover */}
            <span className="max-w-0 text-xs font-semibold tracking-wide whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-xs group-hover:pl-4 group-hover:opacity-100">
              Dashboard
            </span>
            {/* Icon Container */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              <LayoutDashboard className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="h-full w-full">
        {activeView === "dashboard" ? (
          <SalaryAdvanceDashboard />
        ) : (
          <SalaryAdvancePage />
        )}
      </div>
    </div>
  );
};

export default DashboardAdvanceWrapper;
