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
    icon: <Plane size={22} />,
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
      "Request laptops, peripherals, and software. Routed to HOD then fulfilled by IT Support.",
    href: "/dashboard/itrequisition",
    icon: <Monitor size={22} />,
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
        <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-rose-100/50 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] h-[30%] w-[30%] rounded-full bg-blue-50/50 blur-[100px]" />
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Brand />
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-rose-600"
            >
              Login
            </Link>
            <a
              href="http://192.168.0.27:10556"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.02] active:scale-95"
            >
              Purchase Portal
              <ExternalLink size={14} />
            </a>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {/* ── HERO SECTION ── */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center lg:text-left">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50/50 px-4 py-1.5 text-[12px] font-bold tracking-wide text-rose-600 uppercase">
                <Sparkles size={14} /> Internal Operations
              </div>
              <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Hotpoint{" "}
                <span className="bg-linear-to-r from-rose-500 to-rose-700 bg-clip-text text-transparent">
                  Requisition
                </span>{" "}
                Hub
              </h1>
              <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-500 lg:mx-0">
                Submit and track internal requisitions. Some forms may require
                you to be signed into your company account and are routed
                automatically through the appropriate approval chain.
              </p>
            </div>

            {/* Quick Stats/Links Card */}
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50">
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
        <section className="mx-auto max-w-6xl px-6 pb-32">
          <div className="mb-10 flex items-center gap-4">
            <h2 className="text-sm font-bold tracking-[0.2em] text-slate-400 uppercase">
              Available Requisitions
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {requisitions.map((req) => (
              <div
                key={req.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 transition-all duration-300 hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-100"
              >
                <div>
                  <div className="mb-8 flex items-start justify-between">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${req.accent} text-white shadow-lg ${req.shadow}`}
                    >
                      {req.icon}
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold tracking-tight text-slate-500 uppercase">
                      {req.badge}
                    </span>
                  </div>

                  <h3 className="mb-3 text-2xl font-bold text-slate-900">
                    {req.label}
                  </h3>
                  <p className="mb-8 leading-relaxed text-slate-500">
                    {req.description}
                  </p>

                  {/* Visual Workflow Steps */}
                  <div className="mb-8 flex items-center gap-2">
                    {req.workflow.map((step, i) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/50 px-2.5 py-1">
                          <CheckCircle2 size={12} className="text-rose-500" />
                          <span className="text-[11px] font-semibold text-slate-700">
                            {step}
                          </span>
                        </div>
                        {i < req.workflow.length - 1 && (
                          <div className="h-px w-4 bg-slate-200" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Tier Pills (If travel) */}
                  {req.tiers && (
                    <div className="mb-8 flex flex-wrap gap-2">
                      {req.tiers.map((tier) => (
                        <div
                          key={tier.label}
                          className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-[12px]"
                        >
                          <span className="text-rose-500">{tier.icon}</span>
                          <span className="font-bold text-slate-800">
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
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r ${req.accent} py-4 text-sm font-bold text-white transition-transform group-hover:scale-[1.01] active:scale-[0.98]`}
                >
                  Create New Request <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>

          {/* COMPLIANCE FOOTNOTE */}
          <div className="mt-12 flex items-center justify-center gap-3 text-slate-400">
            <Shield size={16} />
            <p className="text-sm">
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
      className="group flex items-center justify-between rounded-2xl p-4 transition-colors hover:bg-slate-50"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{sub}</p>
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
