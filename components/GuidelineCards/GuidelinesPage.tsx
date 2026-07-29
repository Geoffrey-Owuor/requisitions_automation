"use client";
import { Fragment, ReactNode, useState } from "react";
import Header from "../Header";
import Footer from "../Footer";
import {
  Monitor,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BriefcaseBusiness,
  LockKeyhole,
  LaptopMinimalCheck,
  ShoppingBag,
  CircleDollarSign,
} from "lucide-react";
import ITRequisitionGuideline from "./ITRequisitionGuideline";
import TravelRequisitionGuideline from "./TravelRequisitionGuideline";
import HelpdeskGuideline from "./HelpDeskGuideline";
import AccessRequisitionGuideline from "./AccessRequisitionGuideline";
import StaffPurchaseGuideline from "./StaffPurchaseGuideline";
import SalaryAdvanceGuideline from "./SalaryAdvanceGuideline";

// Types
type TabId = "travel" | "it" | "access" | "desk" | "purchase" | "advance";

// Reusable Sub-components
export const GeneralNote = () => (
  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
    <AlertCircle size={18} className="mt-0.5 shrink-0 text-slate-400" />
    <p className="text-sm text-slate-600">
      <span className="font-semibold text-slate-800">Important: </span>{" "}
      Requisitions are inherently tied to the named employee&apos;s information.
      This remains true even if the requisition is raised on behalf of another
      employee who does not have access to a company email account.
    </p>
  </div>
);

export const InfoCard = ({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
    <div className="mb-4 flex items-center gap-2 text-slate-800">
      <div className="text-rose-500">{icon}</div>
      <h4 className="font-semibold">{title}</h4>
    </div>
    <ul className="space-y-2.5">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
          <ChevronRight size={14} className="mt-0.5 shrink-0 text-slate-300" />
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ul>
  </div>
);

export const TierCard = ({
  tier,
  type,
  cost,
  approvers,
  icon,
}: {
  tier: string;
  type: string;
  cost: string;
  approvers: string[];
  icon: ReactNode;
}) => (
  <div className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-rose-200 hover:shadow-sm sm:flex-row sm:items-center">
    <div className="flex items-center gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 transition-colors group-hover:bg-rose-50 group-hover:text-rose-600">
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            {tier}
          </span>
        </div>
        <h4 className="text-base font-semibold text-slate-900">{type}</h4>
        <p className="text-sm text-slate-500">{cost}</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 sm:justify-end">
      {approvers.map((approver: string, idx: number) => (
        <Fragment key={approver}>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            <CheckCircle2 size={12} className="text-rose-500" />
            {approver}
          </div>
          {idx < approvers.length - 1 && (
            <div className="mt-3 hidden h-px w-3 bg-slate-200 sm:block" />
          )}
        </Fragment>
      ))}
    </div>
  </div>
);

// Main Page Component
export default function GuidelinesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("travel");

  const tabs = [
    {
      id: "travel",
      label: "Travel Requisition",
      icon: <BriefcaseBusiness size={14} />,
    },
    { id: "it", label: "IT Requisition", icon: <Monitor size={14} /> },
    { id: "desk", label: "HelpDesk", icon: <LaptopMinimalCheck size={14} /> },
    {
      id: "purchase",
      label: "Staff Purchase",
      icon: <ShoppingBag size={14} />,
    },
    { id: "access", label: "Key(s) & Access", icon: <LockKeyhole size={14} /> },
    {
      id: "advance",
      label: "Salary Advance",
      icon: <CircleDollarSign size={14} />,
    },
  ] as const;

  return (
    <div className="layout-scrollbar flex h-screen flex-col bg-[#fafafa] text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Ambient Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-rose-100/40 blur-[80px] sm:h-[40%] sm:w-[40%] sm:blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-50/40 blur-[80px] sm:h-[30%] sm:w-[30%] sm:blur-[100px]" />
      </div>

      <Header />

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto mt-4 flex max-w-6xl flex-1 flex-col gap-4 px-4 sm:mt-6 sm:px-6 md:flex-row md:gap-8">
        {/* Sidebar */}
        <aside className="w-[calc(100vw-40px)] md:w-auto">
          {/* Mobile: horizontal pill strip */}
          <nav className="scrollbar-hide flex flex-row gap-1 overflow-x-auto py-2 md:sticky md:top-20 md:flex-col md:gap-1 md:overflow-y-auto md:py-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-all duration-200 md:w-full md:shrink-0 md:text-sm ${
                  activeTab === tab.id
                    ? "bg-rose-100/60 text-slate-900"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors`}
                >
                  {tab.icon}
                </div>
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 pb-4">
          {activeTab === "travel" && <TravelRequisitionGuideline />}
          {activeTab === "it" && <ITRequisitionGuideline />}
          {activeTab === "desk" && <HelpdeskGuideline />}
          {activeTab === "purchase" && <StaffPurchaseGuideline />}
          {activeTab === "access" && <AccessRequisitionGuideline />}
          {activeTab === "advance" && <SalaryAdvanceGuideline />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
