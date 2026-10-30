"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CircleDollarSign,
  Mail,
  Plus,
  UsersRound,
} from "lucide-react";
import { getEmailChangeRequestCounts } from "@/serverActions/EmailChangeRequestAdmin";
import { useUser } from "@/context/UserContext";
import RequisitionPagesWrapper from "@/components/Dashboard/RequisitionPagesWrapper";
import {
  ScrollingNav,
  StickyNavBar,
} from "@/components/Dashboard/StickyNavBar";
import SalaryAdvancePage from "./SalaryAdvancePage";
import SalaryAdvanceDashboard, {
  type SalaryAdvanceView,
} from "./SalaryAdvanceDashboard";
import { EMAIL_CHANGE_COUNTS_KEY } from "./EmailChangeRequestsPanel";

const PAGE_HREF = "/dashboard/advance";

// The HR (hr-advance) dashboard's views. ?view=request is the staff request
// form, which HR can use like anyone else.
const VIEWS: { key: SalaryAdvanceView; label: string; Icon: typeof Mail }[] = [
  { key: "requests", label: "Advance requests", Icon: CircleDollarSign },
  { key: "email-changes", label: "Email changes", Icon: Mail },
  { key: "staff", label: "Staff directory", Icon: UsersRound },
];

const viewHref = (view: SalaryAdvanceView | "request") =>
  `${PAGE_HREF}?view=${view}`;

// HR gets a sticky bar with the dashboard's views (kept in ?view=) and a
// way to the request form and back; everyone else gets just the form
const DashboardAdvanceWrapper = ({ view }: { view?: string }) => {
  const { roles } = useUser();
  const isHr = roles.includes("hr-advance");

  if (!isHr) {
    return (
      <RequisitionPagesWrapper>
        <SalaryAdvancePage />
      </RequisitionPagesWrapper>
    );
  }

  // An unknown or missing view falls back to the first
  const activeView =
    view === "request"
      ? "request"
      : (VIEWS.find((entry) => entry.key === view)?.key ?? "requests");

  return (
    <RequisitionPagesWrapper header={<HrNavBar view={activeView} />}>
      {activeView === "request" ? (
        <SalaryAdvancePage />
      ) : (
        <SalaryAdvanceDashboard view={activeView} />
      )}
    </RequisitionPagesWrapper>
  );
};

const HrNavBar = ({ view }: { view: SalaryAdvanceView | "request" }) => {
  // For the badge on the Email changes view
  const { data: counts } = useQuery({
    queryKey: EMAIL_CHANGE_COUNTS_KEY,
    queryFn: getEmailChangeRequestCounts,
  });
  const openRequests = counts?.open ?? 0;

  if (view === "request") {
    return (
      <StickyNavBar>
        <Link
          href={viewHref("requests")}
          className="rounded-control ml-auto inline-flex shrink-0 items-center gap-1.5 border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </StickyNavBar>
    );
  }

  return (
    <StickyNavBar>
      <ScrollingNav
        label="Salary advance views"
        activeKey={view}
        keepContentInView
        className="gap-1"
      >
        {VIEWS.map(({ key, label, Icon }) => {
          const isActive = key === view;
          return (
            <Link
              key={key}
              href={viewHref(key)}
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-compact inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {key === "email-changes" && openRequests > 0 && (
                <span
                  className="rounded-full bg-red-600 px-1.5 text-[11px] leading-4.5 font-semibold text-white"
                  aria-label={`${openRequests} open`}
                >
                  {openRequests}
                </span>
              )}
            </Link>
          );
        })}
      </ScrollingNav>

      <Link
        href={viewHref("request")}
        className="rounded-control inline-flex shrink-0 items-center gap-1.5 bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        <span>
          <span className="max-sm:hidden">Make a </span>Request
        </span>
      </Link>
    </StickyNavBar>
  );
};

export default DashboardAdvanceWrapper;
