"use client";
import Footer from "./Footer";
import Link from "next/link";
import {
  Plane,
  MapPin,
  Shield,
  Monitor,
  CircleGauge,
  ShoppingBag,
  ShieldAlert,
  BriefcaseBusiness,
  CircleArrowOutUpRight,
  LockKeyhole,
  LaptopMinimalCheck,
  ArrowRight,
  CircleDollarSign,
  BookText,
  HardHat,
  UserRoundPlus,
} from "lucide-react";
import { JSX, ReactNode } from "react";
import Header from "./Header";
import QuickSignIn from "./QuickSignIn";

interface Requisitions {
  id: string;
  label: string;
  description: string;
  icon: JSX.Element;
  accent: string;
  badge: string;
  workflow: string[];
  tiers?: { label: string; cost: string; icon: JSX.Element }[] | null;
  link?: string;
}

const requisitions: Requisitions[] = [
  {
    id: "advance",
    label: "Salary Advance",
    description:
      "Apply for a salary advance, requests should be submitted before the 14th of every month",
    icon: <CircleDollarSign size={22} className="h-5 w-5 sm:w-6" />,
    accent: "bg-mist-700",
    badge: "HR",
    workflow: ["Submit", "Wait for HR & Finance to review and approve"],
    tiers: null,
    link: "/advance",
  },
  {
    id: "travel",
    label: "Travel Requisition",
    description:
      "Site visits, local flights, road travel, and international travel with automated multi-tier approvals.",
    icon: <BriefcaseBusiness size={22} className="h-5 w-5 sm:h-6 sm:w-6" />,
    accent: "bg-rose-700",
    badge: "HR",
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
    icon: <Monitor size={22} className="h-5 w-5 sm:h-6 sm:w-6" />,
    accent: "bg-slate-800",
    badge: "IT",
    workflow: ["Submit", "HOD", "IT Fulfilment"],
    tiers: null,
  },
  {
    id: "casual",
    label: "Casual Requisition",
    description:
      "Request casual staff engagements for a defined period. Routed to HOD, then Finance, then HR for approval.",
    icon: <HardHat size={22} className="h-5 w-5 sm:h-6 sm:w-6" />,
    accent: "bg-orange-800",
    badge: "HR",
    workflow: ["Submit", "HOD", "Finance", "HR"],
    tiers: null,
  },
  {
    id: "employee",
    label: "Employee Requisition",
    description:
      "Request one or more open positions to be filled. Routed to HOD, then CEO, then HR for approval.",
    icon: <UserRoundPlus size={22} className="h-5 w-5 sm:h-6 sm:w-6" />,
    accent: "bg-teal-800",
    badge: "HR",
    workflow: ["Submit", "HOD", "CEO", "HR"],
    tiers: null,
  },
  {
    id: "desk",
    label: "HelpDesk",
    description:
      "Submit an IT issue/ticket through our internal IT HelpDesk platform.",
    icon: <LaptopMinimalCheck size={22} className="h-5 w-5 sm:h-6 sm:w-6" />,
    accent: "bg-neutral-800",
    badge: "IT",
    workflow: ["Submit Issue", "Track issue until it's resolved"],
    tiers: null,
  },
  {
    id: "purchase",
    label: "Staff Product Purchase",
    description:
      "The purchase portal for making purchase requisitions at discounted staff prices.",
    icon: <ShoppingBag size={22} className="h-5 w-5 sm:h-6 sm:w-6" />,
    accent: "bg-red-800",
    badge: "HR",
    workflow: ["Submit", "Payroll", "HR", "Credit Control", "Invoicing"],
    tiers: null,
  },
  {
    id: "security",
    label: "Key(s) & Access Code Issuance",
    description:
      "Submit a request for Key(s) and Access Code Issuance. Routed to your designated HOD then completed by security.",
    icon: <LockKeyhole size={22} className="h-5 w-5 sm:h-6 sm:w-6" />,
    accent: "bg-zinc-800",
    badge: "Retail",
    workflow: ["Submit", "HOD", "Security finalizes"],
    tiers: null,
  },
];

export default function HomePage() {
  return (
    <div className="layout-scrollbar relative flex h-screen flex-col bg-[#fdfbfb] text-slate-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Quick Sign In component */}
      <QuickSignIn />

      {/* ── AMBIENT BACKGROUND ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-aurora absolute top-[-15%] left-[-10%] h-[55%] w-[55%] rounded-full bg-rose-200/45 blur-[90px] sm:h-[45%] sm:w-[45%] sm:blur-[130px]" />
        <div className="animate-drift absolute top-[10%] right-[-12%] h-[45%] w-[45%] rounded-full bg-orange-100/50 blur-[90px] sm:h-[35%] sm:w-[35%] sm:blur-[110px]" />
        <div className="animate-drift absolute bottom-[-10%] left-[20%] h-[40%] w-[40%] rounded-full bg-blue-100/40 blur-[100px]" />
        <div className="hero-grid absolute inset-x-0 top-0 h-[70vh]" />
      </div>

      {/* Header */}
      <Header />

      <main className="relative z-10">
        {/* ── HERO SECTION ── */}
        <section className="mx-auto max-w-6xl px-4 pt-8 pb-14 sm:px-6 sm:pt-12 sm:pb-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-5 lg:gap-14">
            <div className="animate-rise text-center lg:col-span-3 lg:text-left">
              <h1 className="mb-4 text-4xl font-semibold tracking-tight text-slate-900 sm:mb-6 sm:text-[52px] sm:leading-[1.05]">
                Hotpoint{" "}
                <span className="relative inline-block text-rose-600">
                  Apps
                </span>{" "}
                Hub
              </h1>

              <p className="mx-auto max-w-xl text-[15px] leading-relaxed text-slate-500 sm:text-base lg:mx-0">
                Access all your internal apps and forms in one place. Depending
                on the feature, you may be asked to sign in with your work
                credentials or verify your identity using the personal email
                address on file from your onboarding.
              </p>

              {/* Hero actions */}
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link
                  href="/dashboard"
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-rose-700 active:scale-[0.98] sm:w-auto"
                >
                  Go to my dashboard
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/guidelines"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98] sm:w-auto"
                >
                  <BookText className="h-4 w-4" />
                  Read the guidelines
                </Link>
              </div>

              <p className="mt-4 text-center text-[12.5px] text-slate-400 lg:text-left">
                Not sure which form you need? The guidelines page breaks down
                every app and requisition type.
              </p>
            </div>

            {/* Quick Stats/Links Card */}
            <div className="animate-rise lg:col-span-2">
              <div className="relative">
                <div className="relative rounded-4xl border border-slate-200 bg-white p-2.5 shadow-[0_2px_4px_rgba(140,40,60,0.03),0_24px_48px_-20px_rgba(140,40,60,0.28)]">
                  <div className="flex items-center gap-2 px-3 pt-2 pb-3">
                    <span className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase">
                      Jump straight in
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <QuickLink
                      href="/dashboard"
                      icon={<CircleGauge size={18} />}
                      label="View My Dashboard"
                      sub="Track your requisitions"
                    />

                    <QuickLink
                      href="/dashboard/staffproductpurchase"
                      icon={<ShoppingBag size={18} />}
                      label="Staff Product Purchase"
                      sub="Make a purchase request"
                      isExternal
                    />
                    <QuickLink
                      href="/dashboard/helpdesk"
                      icon={<LaptopMinimalCheck size={18} />}
                      label="HelpDesk"
                      sub="Submit an IT ticket"
                      isExternal
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── REQUISITION GRID ── */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="mb-8 flex items-center gap-4 sm:mb-10">
            <h2 className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-bold tracking-[0.18em] text-slate-500 uppercase sm:text-[11px]">
              Available apps and forms
            </h2>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7">
            {requisitions.map((req) => (
              <div
                key={req.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-4xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(140,40,60,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-rose-200 hover:shadow-[0_24px_48px_-20px_rgba(140,40,60,0.3)] sm:rounded-[2.25rem] sm:p-8"
              >
                <div className="relative">
                  <div className="mb-6 flex items-start justify-between sm:mb-7">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${req.accent} text-white shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14`}
                    >
                      {req.icon}
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase sm:text-[11px]">
                      {req.badge}
                    </span>
                  </div>

                  <h3 className="mb-2 text-xl font-semibold tracking-tight text-slate-900 sm:mb-3 sm:text-2xl">
                    {req.label}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-slate-500 sm:mb-7 sm:text-[15px]">
                    {req.description}
                  </p>

                  {/* Visual Workflow Steps */}
                  <div className="mb-6 flex flex-wrap items-center gap-x-1.5 gap-y-2 sm:mb-7">
                    {req.workflow.map((step, i) => (
                      <div key={step} className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/80 py-1 pr-3 pl-1.5">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-[9px] font-bold text-rose-600">
                            {i + 1}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-700 sm:text-[11px]">
                            {step}
                          </span>
                        </div>
                        {i < req.workflow.length - 1 && (
                          <ArrowRight
                            size={11}
                            className="shrink-0 text-slate-300"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Tier Pills (If travel) */}
                  {req.tiers && (
                    <div className="mb-6 flex flex-wrap gap-2 sm:mb-7">
                      {req.tiers.map((tier) => (
                        <div
                          key={tier.label}
                          className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/50 px-3 py-1.5 text-[11px] sm:gap-2 sm:text-[12px]"
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

                {/* Link if available */}
                {req.link && (
                  <Link
                    href={req.link}
                    className="group/cta relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-mist-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-mist-900/20 transition-all duration-200 hover:bg-mist-800 hover:shadow-xl hover:shadow-mist-900/25 active:scale-[0.98]"
                  >
                    Submit a Request
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* COMPLIANCE FOOTNOTE */}
          <div className="mx-auto mt-10 flex max-w-2xl items-center justify-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-amber-800 sm:mt-14">
            <ShieldAlert size={16} className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <p className="text-center text-xs sm:text-[13px]">
              Standard compliance and procedures for online form requisitions
              must be adhered to.
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
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-full p-2.5 transition-colors hover:bg-rose-50/70 sm:p-3"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100 transition-colors duration-200 group-hover:bg-rose-600 group-hover:text-white group-hover:ring-rose-300 sm:h-10 sm:w-10">
          {icon}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-left text-[10px] text-slate-500 sm:text-xs">
            {sub}
          </p>
        </div>
      </div>
      <span className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 transition-all duration-200 group-hover:bg-white group-hover:text-rose-500 group-hover:shadow-sm">
        {isExternal ? (
          <CircleArrowOutUpRight size={14} />
        ) : (
          <ArrowRight
            size={14}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
          />
        )}
      </span>
    </Link>
  );
}
