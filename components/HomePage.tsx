"use client";
import Footer from "./Footer";
import Link from "next/link";
import {
  Plane,
  MapPin,
  Shield,
  Monitor,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleGauge,
  ShoppingBag,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import Brand from "./Brand";
import { ReactNode } from "react";

const requisitions = [
  {
    id: "travel",
    label: "Travel Requisition",
    description:
      "Site visits, local flights, road travel, and international travel with automated multi-tier approvals.",
    href: "/dashboard/travelrequisition",
    icon: <Plane size={22} className="h-5 w-5 sm:h-6 sm:w-6" />,
    accent: "from-rose-500 to-rose-600",
    shadow: "shadow-rose-200",
    badge: "3 Approval Tiers",
    workflow: ["Submit", "HOD", "HR", "Director"],
    tiers: [
      { label: "Local", cost: "< 30K", icon: <MapPin size={12} /> },
      { label: "Air", cost: "30K-100K", icon: <Plane size={12} /> },
      { label: "Global", cost: "> 100K", icon: <Shield size={12} /> },
    ],
  },
  {
    id: "it",
    label: "IT Requisition",
    description:
      "Request laptops, peripherals, and software. Routed to HOD then fulfilled by IT Team.",
    href: "/dashboard/itrequisition",
    icon: <Monitor size={22} className="h-5 w-5 sm:h-6 sm:w-6" />,
    accent: "from-slate-800 to-slate-900",
    shadow: "shadow-slate-200",
    badge: "Direct Process",
    workflow: ["Submit", "HOD", "IT Fulfilment"],
    tiers: null,
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[#fafafa] text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      {/* ── AMBIENT BACKGROUND ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-rose-100/50 blur-[80px] sm:h-[40%] sm:w-[40%] sm:blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[40%] w-[40%] rounded-full bg-blue-50/50 blur-[80px] sm:h-[30%] sm:w-[30%] sm:blur-[100px]" />
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Brand />
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/login"
              className="text-xs font-medium text-slate-600 transition-colors hover:text-rose-600 sm:text-sm"
            >
              Login
            </Link>
            <a
              href="http://192.168.0.27:10556"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-transform hover:scale-[1.02] active:scale-95 sm:gap-2 sm:px-5 sm:py-2 sm:text-sm"
            >
              <span className="hidden sm:inline">Purchase Portal</span>
              <span className="sm:hidden">Portal</span>
              <ExternalLink size={14} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </a>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* ── HERO SECTION ── */}
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-12 text-center sm:px-6 sm:pt-20 sm:pb-16 lg:text-left">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-5 lg:gap-12">
            <div className="lg:col-span-3">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/50 px-3 py-1 text-[9px] font-bold tracking-wide text-rose-600 uppercase sm:mb-6 sm:gap-2 sm:px-4 sm:py-1.5 sm:text-[10px]">
                <Sparkles size={14} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                Internal Operations
              </div>
              <h1 className="mb-4 text-3xl font-semibold tracking-tight text-slate-900 sm:mb-6 sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
                Hotpoint{" "}
                <span className="bg-linear-to-r from-rose-500 to-rose-700 bg-clip-text text-transparent">
                  Requisition
                </span>{" "}
                Hub
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base lg:mx-0">
                Submit and track internal requisitions. Some forms may require
                you to be signed into your company account and are routed
                automatically through the appropriate approval chain.
              </p>
            </div>

            {/* Quick Stats/Links Card */}
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 sm:rounded-3xl">
                <div className="flex flex-col gap-1">
                  <QuickLink
                    href="/dashboard"
                    icon={<CircleGauge size={18} />}
                    label="View My Dashboard"
                    sub="Track your requisitions"
                  />
                  <QuickLink
                    href="http://192.168.0.27:10556"
                    icon={<ShoppingBag size={18} />}
                    label="Staff Purchase"
                    sub="External portal"
                    isExternal
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── REQUISITION GRID ── */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-32">
          <div className="mb-8 flex items-center gap-4 sm:mb-10">
            <h2 className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase sm:text-sm">
              Available Requisitions
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {requisitions.map((req) => (
              <div
                key={req.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-4xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-100 sm:rounded-[2.5rem] sm:p-8"
              >
                <div>
                  <div className="mb-6 flex items-start justify-between sm:mb-8">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${req.accent} text-white shadow-lg ${req.shadow} sm:h-14 sm:w-14 sm:rounded-2xl`}
                    >
                      {req.icon}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-tight text-slate-500 uppercase sm:px-3 sm:text-[11px]">
                      {req.badge}
                    </span>
                  </div>

                  <h3 className="mb-2 text-xl font-semibold text-slate-900 sm:mb-3 sm:text-2xl">
                    {req.label}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-slate-500 sm:mb-8 sm:text-base">
                    {req.description}
                  </p>

                  {/* Visual Workflow Steps - flex-wrap ensures they don't break on narrow screens */}
                  <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-3 sm:mb-8">
                    {req.workflow.map((step, i) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1">
                          <CheckCircle2 size={12} className="text-rose-500" />
                          <span className="text-[10px] font-semibold text-slate-700 sm:text-[11px]">
                            {step}
                          </span>
                        </div>
                        {i < req.workflow.length - 1 && (
                          <div className="h-px w-2 bg-slate-200 sm:w-4" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Tier Pills (If travel) */}
                  {req.tiers && (
                    <div className="mb-6 flex flex-wrap gap-2 sm:mb-8">
                      {req.tiers.map((tier) => (
                        <div
                          key={tier.label}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-100 px-2.5 py-1.5 text-[11px] sm:gap-2 sm:px-3 sm:py-2 sm:text-[12px]"
                        >
                          <span className="text-rose-500">{tier.icon}</span>
                          <span className="font-semibold text-slate-800">
                            {tier.label}
                          </span>
                          <span className="text-slate-400">{tier.cost}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Link
                  href={req.href}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r ${req.accent} py-3 text-sm font-semibold text-white transition-transform group-hover:scale-[1.01] active:scale-[0.98] sm:py-4`}
                >
                  Create New Request <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>

          {/* COMPLIANCE FOOTNOTE */}
          <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 sm:mt-12 sm:gap-3">
            <Shield size={16} className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <p className="text-xs sm:text-sm">
              Standard compliance and procedures apply to all requisitions.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

type QuickLinkProps = {
  href: string;
  icon: ReactNode;
  label: string;
  sub: string;
  isExternal?: boolean;
};

function QuickLink({
  href,
  icon,
  label,
  sub,
  isExternal = false,
}: QuickLinkProps) {
  const Tag = isExternal ? "a" : Link;
  return (
    <Tag
      href={href}
      target={isExternal ? "_blank" : undefined}
      className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-slate-50 sm:rounded-2xl sm:p-4"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white sm:h-10 sm:w-10 sm:rounded-xl">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-[10px] text-slate-500 sm:text-xs">{sub}</p>
        </div>
      </div>
      {isExternal ? (
        <ExternalLink size={14} className="text-slate-300" />
      ) : (
        <ArrowUpRight size={14} className="text-slate-300" />
      )}
    </Tag>
  );
}
