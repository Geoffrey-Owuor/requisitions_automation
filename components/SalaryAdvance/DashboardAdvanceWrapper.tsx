"use client";
import { useState } from "react";
import SalaryAdvancePage from "./SalaryAdvancePage";
import SalaryAdvanceDashboard from "./SalaryAdvanceDashboard";
import { useUser } from "@/context/UserContext";

type ViewState = "dashboard" | "page";

const DashboardAdvanceWrapper = () => {
  const { roles } = useUser();
  const [activeView, setActiveView] = useState<ViewState>("page");

  return (
    <div className="mx-auto h-full w-full">
      {/* Toggle Container - Visible only on the hr side */}
      {roles.includes("hr") && (
        <div className="flex justify-center p-4">
          <div className="flex w-full gap-1 rounded-2xl bg-gray-100 p-1 shadow-inner sm:w-auto">
            <button
              onClick={() => setActiveView("page")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
                activeView === "page"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              Make a Request
            </button>

            <button
              onClick={() => setActiveView("dashboard")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
                activeView === "dashboard"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              Dashboard
            </button>
          </div>
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
