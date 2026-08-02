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

/** Section eyebrow used at the top of every guideline. */
export const GuidelineBadge = ({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/70 bg-white/80 py-1.5 pr-4 pl-1.5 text-[11px] font-bold tracking-wide text-rose-700 uppercase shadow-sm backdrop-blur-sm">
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-rose-500 to-rose-700 text-white">
      {icon}
    </span>
    {label}
  </div>
);

/** Coloured callout block (tips, warnings, external links). */
export const Callout = ({
  icon,
  title,
  children,
  tone = "rose",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  tone?: "rose" | "blue" | "amber";
}) => {
  const tones = {
    rose: {
      wrap: "border-rose-100 bg-linear-to-br from-rose-50 to-white",
      chip: "bg-linear-to-br from-rose-500 to-rose-700 shadow-rose-500/30",
      title: "text-rose-900",
      body: "text-rose-800/80",
    },
    blue: {
      wrap: "border-blue-100 bg-linear-to-br from-blue-50 to-white",
      chip: "bg-linear-to-br from-blue-500 to-blue-700 shadow-blue-500/30",
      title: "text-blue-900",
      body: "text-blue-800/80",
    },
    amber: {
      wrap: "border-amber-200 bg-linear-to-br from-amber-50 to-white",
      chip: "bg-linear-to-br from-amber-400 to-amber-600 shadow-amber-500/30",
      title: "text-amber-900",
      body: "text-amber-800/80",
    },
  }[tone];

  return (
    <div
      className={`flex items-start gap-4 rounded-[1.75rem] border p-5 shadow-sm ${tones.wrap}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-lg ${tones.chip}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className={`font-semibold ${tones.title}`}>{title}</h4>
        <p className={`mt-1 text-sm leading-relaxed ${tones.body}`}>
          {children}
        </p>
      </div>
    </div>
  );
};

export const GeneralNote = () => (
  <div className="flex items-start gap-3.5 rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-sm">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <AlertCircle size={17} />
    </div>
    <p className="text-sm leading-relaxed text-slate-600">
      <span className="font-semibold text-slate-900">Important: </span>{" "}
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
  <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_1px_2px_rgba(140,40,60,0.03)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_18px_36px_-18px_rgba(140,40,60,0.3)]">
    <div className="pointer-events-none absolute -top-20 -right-12 h-40 w-40 rounded-full bg-transparent blur-3xl transition-colors duration-500 group-hover:bg-rose-100/60" />
    <div className="relative mb-4 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100 transition-all duration-300 group-hover:bg-linear-to-br group-hover:from-rose-500 group-hover:to-rose-700 group-hover:text-white group-hover:ring-rose-300">
        {icon}
      </div>
      <h4 className="font-semibold text-slate-900">{title}</h4>
    </div>
    <ul className="relative space-y-2.5">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
          <ChevronRight
            size={14}
            className="mt-0.5 shrink-0 text-rose-300 transition-colors group-hover:text-rose-400"
          />
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
  <div className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/85 p-5 shadow-[0_1px_2px_rgba(140,40,60,0.03)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-[0_18px_36px_-18px_rgba(140,40,60,0.3)] sm:flex-row sm:items-center">
    <div className="pointer-events-none absolute -top-20 -right-12 h-40 w-40 rounded-full bg-transparent blur-3xl transition-colors duration-500 group-hover:bg-rose-100/60" />

    <div className="relative flex items-center gap-4">
      <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 ring-1 ring-slate-100 transition-all duration-300 group-hover:bg-linear-to-br group-hover:from-rose-500 group-hover:to-rose-700 group-hover:text-white group-hover:ring-rose-300">
        {icon}
      </div>
      <div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          {tier}
        </span>
        <h4 className="mt-1 text-base font-semibold text-slate-900">{type}</h4>
        <p className="text-sm text-slate-500">{cost}</p>
      </div>
    </div>

    <div className="relative flex flex-wrap items-center gap-1.5 sm:justify-end">
      {approvers.map((approver: string, idx: number) => (
        <Fragment key={approver}>
          <div className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/60 py-1 pr-3 pl-1.5 text-[11px] font-semibold text-slate-700">
            <CheckCircle2 size={13} className="shrink-0 text-rose-500" />
            {approver}
          </div>
          {idx < approvers.length - 1 && (
            <ChevronRight size={12} className="hidden text-slate-300 sm:block" />
          )}
        </Fragment>
      ))}
    </div>
  </div>
);

/** Consistent header block for each guideline panel. */
export const GuidelineHeading = ({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) => (
  <div className="space-y-3">
    <GuidelineBadge icon={icon} label={eyebrow} />
    <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
      {title}
    </h2>
    <p className="max-w-2xl leading-relaxed text-slate-500">{children}</p>
  </div>
);

/** Section title with a rose accent icon. */
export const SectionTitle = ({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) => (
  <h3 className="flex items-center gap-2.5 text-lg font-semibold text-slate-900">
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100">
      {icon}
    </span>
    {children}
  </h3>
);

// Main Page Component
export default function GuidelinesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("travel");

  const tabs = [
    {
      id: "travel",
      label: "Travel Requisition",
      icon: <BriefcaseBusiness size={15} />,
    },
    { id: "it", label: "IT Requisition", icon: <Monitor size={15} /> },
    { id: "desk", label: "HelpDesk", icon: <LaptopMinimalCheck size={15} /> },
    {
      id: "purchase",
      label: "Staff Purchase",
      icon: <ShoppingBag size={15} />,
    },
    { id: "access", label: "Key(s) & Access", icon: <LockKeyhole size={15} /> },
    {
      id: "advance",
      label: "Salary Advance",
      icon: <CircleDollarSign size={15} />,
    },
  ] as const;

  return (
    <div className="layout-scrollbar flex h-screen flex-col bg-[#fdfbfb] text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-aurora absolute -top-[15%] -left-[10%] h-[55%] w-[55%] rounded-full bg-rose-200/40 blur-[100px] sm:h-[45%] sm:w-[45%] sm:blur-[130px]" />
        <div className="animate-drift absolute top-[10%] -right-[12%] h-[45%] w-[45%] rounded-full bg-orange-100/45 blur-[100px] sm:h-[35%] sm:w-[35%]" />
        <div className="hero-grid absolute inset-x-0 top-0 h-[60vh]" />
      </div>

      <Header />

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 sm:px-6 md:flex-row md:gap-8">
        {/* Sidebar */}
        <aside className="w-full min-w-0 md:w-60 md:shrink-0">
          {/* Mobile: horizontal pill strip · Desktop: sticky rail */}
          <nav className="scrollbar-hide flex flex-row gap-1.5 overflow-x-auto py-2 md:sticky md:top-24 md:flex-col md:gap-1 md:rounded-[1.75rem] md:border md:border-slate-200/70 md:bg-white/70 md:p-2 md:shadow-sm md:backdrop-blur-xl">
            <span className="hidden px-3 pt-2 pb-2 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase md:block">
              Guidelines
            </span>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-full py-2 pr-4 pl-1.5 text-xs font-semibold transition-all duration-200 md:w-full md:text-[13px] ${
                    isActive
                      ? "bg-linear-to-br from-rose-500 to-rose-700 text-white shadow-md shadow-rose-500/25"
                      : "border border-slate-200/70 bg-white/70 text-slate-600 hover:border-rose-200 hover:bg-rose-50/70 hover:text-rose-700 md:border-transparent md:bg-transparent"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-rose-50 text-rose-500 group-hover:bg-white"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Scrollable Content */}
        <div className="animate-rise min-h-0 flex-1 pt-2 pb-4" key={activeTab}>
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
