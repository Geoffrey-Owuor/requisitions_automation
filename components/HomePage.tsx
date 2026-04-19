"use client";
import Footer from "./Footer";

import Link from "next/link";
import {
  Plane,
  MapPin,
  Shield,
  Monitor,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  CircleGauge,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import Brand from "./Brand";

const requisitions = [
  {
    id: "travel",
    label: "Travel Requisition",
    description:
      "Road trips, local flights, and international travel. Structured approval based on estimated cost.",
    href: "/dashboard/travelrequisition",
    icon: <Plane size={20} />,
    accent: "from-rose-500 to-rose-600",
    badge: "3 Approval Tiers",
    badgeColor: "bg-rose-50 border-rose-200 text-rose-600",
    workflow: [
      { step: "Submit", detail: "Fill out travel details & cost estimate" },
      { step: "HOD", detail: "Head of Department reviews & approves" },
      { step: "HR / Director", detail: "Escalated based on travel tier" },
    ],
    tiers: [
      {
        label: "Local Road",
        cost: "Under KES 30,000",
        approvers: ["HOD"],
        icon: <MapPin size={14} />,
      },
      {
        label: "Local Air",
        cost: "KES 30K – 100K",
        approvers: ["HOD", "HR"],
        icon: <Plane size={14} />,
      },
      {
        label: "International",
        cost: "Over KES 100,000",
        approvers: ["HOD", "HR", "Director"],
        icon: <Shield size={14} />,
      },
    ],
  },
  {
    id: "it",
    label: "IT Requisition",
    description:
      "Laptops, peripherals, and IT equipment. Routed through your HOD then fulfilled by the IT department.",
    href: "/dashboard/itrequisition",
    icon: <Monitor size={20} />,
    accent: "from-slate-600 to-slate-700",
    badge: "2-Step Process",
    badgeColor: "bg-slate-100 border-slate-200 text-slate-600",
    workflow: [
      { step: "Submit", detail: "Specify equipment & business justification" },
      { step: "HOD", detail: "Head of Department reviews & approves" },
      { step: "IT Team", detail: "IT accepts and fulfils the request" },
    ],
    tiers: null,
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans">
      {/* ── HEADER ── */}
      <header className="relative z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Brand />
          <a
            href="http://192.168.0.27:10556"
            target="_blank"
            rel="noopener norefferer"
            className="hidden items-center gap-2 rounded-xl bg-black px-3 py-2 text-sm text-white sm:flex"
          >
            Staff Purchase Portal
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* ── HERO ── */}
      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            {/* Left — headline */}
            <div className="max-w-xl">
              <span className="mb-6 inline-block rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold tracking-[2px] text-rose-600 uppercase">
                Company Portal
              </span>
              <h2 className="mb-4 text-[40px] leading-[1.1] font-bold tracking-[-1.5px] text-[#1e1b1b] sm:text-[50px]">
                Hotpoint Requisition
                <br />
                <span className="bg-linear-to-r from-rose-500 to-rose-700 bg-clip-text text-transparent">
                  Hub
                </span>
              </h2>
              <p className="max-w-lg text-[15px] leading-relaxed text-[#7c5a5a]">
                Submit and track internal requisitions. All forms require you to
                be signed into your company account and are routed automatically
                through the appropriate approval chain.
              </p>
            </div>

            {/* Right — quick links */}
            <div className="flex flex-col gap-3 lg:min-w-45">
              <p className="mb-1 text-[10px] font-semibold tracking-[2px] text-[#a18080] uppercase">
                Quick Access
              </p>

              <Link
                href="/dashboard/travelrequisition"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[rgba(240,180,180,0.5)] bg-white/70 px-4 py-3.5 shadow-[0_4px_16px_rgba(160,60,60,0.07)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(160,60,60,0.12)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-rose-500 to-rose-600 text-white">
                    <Plane size={14} />
                  </div>
                  <div>
                    <p className="text-[13px] leading-tight font-semibold text-[#1e1b1b]">
                      Travel Requisition
                    </p>
                    <p className="text-[11px] text-[#a18080]">
                      Road · Air · International
                    </p>
                  </div>
                </div>
                <ArrowUpRight
                  size={14}
                  className="shrink-0 text-[#c8a0a0] transition-colors group-hover:text-rose-500"
                />
              </Link>

              <Link
                href="/dashboard/itrequisition"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[rgba(200,210,220,0.5)] bg-white/70 px-4 py-3.5 shadow-[0_4px_16px_rgba(100,110,130,0.06)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(100,110,130,0.1)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-slate-600 to-slate-700 text-white">
                    <Monitor size={14} />
                  </div>
                  <div>
                    <p className="text-[13px] leading-tight font-semibold text-[#1e1b1b]">
                      IT Requisition
                    </p>
                    <p className="text-[11px] text-[#a18080]">
                      Laptops · Peripherals · Equipment
                    </p>
                  </div>
                </div>
                <ArrowUpRight
                  size={14}
                  className="shrink-0 text-[#b0b8c8] transition-colors group-hover:text-slate-500"
                />
              </Link>

              <a
                href="http://192.168.0.27:10556"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-[rgba(180,200,180,0.5)] bg-white/70 px-4 py-3.5 shadow-[0_4px_16px_rgba(60,120,60,0.05)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(60,120,60,0.09)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 text-white">
                    <ShoppingBag size={14} />
                  </div>
                  <div>
                    <p className="text-[13px] leading-tight font-semibold text-[#1e1b1b]">
                      Staff Purchase Portal
                    </p>
                    <p className="text-[11px] text-[#a18080]">
                      External · Opens in new tab
                    </p>
                  </div>
                </div>
                <ExternalLink
                  size={13}
                  className="shrink-0 text-[#a8c0a8] transition-colors group-hover:text-emerald-500"
                />
              </a>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto mb-8 max-w-6xl px-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-[rgba(240,180,180,0.5)] to-transparent" />
            <span className="text-[11px] font-semibold tracking-[2px] text-[#a18080] uppercase">
              Available Form Requisitions
            </span>
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-[rgba(240,180,180,0.5)] to-transparent" />
          </div>
        </div>

        {/* Requisition Cards */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {requisitions.map((req) => (
              <div
                key={req.id}
                className="group relative overflow-hidden rounded-3xl border border-white/85 bg-white/65 shadow-[0_16px_40px_rgba(160,60,60,0.07)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(160,60,60,0.13)]"
              >
                {/* Card Top */}
                <div className="p-7 pb-5">
                  <div className="mb-5 flex items-start justify-between">
                    <div
                      className={`h-11 w-11 rounded-xl bg-linear-to-br ${req.accent} flex items-center justify-center text-white shadow-md`}
                    >
                      {req.icon}
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-widest uppercase ${req.badgeColor}`}
                    >
                      {req.badge}
                    </span>
                  </div>

                  <h3 className="mb-2 text-[22px] font-bold tracking-tight text-[#1e1b1b]">
                    {req.label}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-[#7c5a5a]">
                    {req.description}
                  </p>
                </div>

                {/* Workflow Steps */}
                <div className="mx-7 mb-5 rounded-2xl border border-[rgba(240,180,180,0.3)] bg-white/40 p-4">
                  <p className="mb-3 text-[10px] font-semibold tracking-widest text-[#a18080] uppercase">
                    Approval Workflow
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {req.workflow.map((w, i) => (
                      <div key={w.step} className="flex items-center gap-1.5">
                        <div className="group/step relative flex items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <CheckCircle2
                              size={12}
                              className="shrink-0 text-rose-400"
                            />
                            <span className="text-[12px] font-semibold text-[#1e1b1b]">
                              {w.step}
                            </span>
                          </div>
                        </div>
                        {i < req.workflow.length - 1 && (
                          <ChevronRight
                            size={12}
                            className="shrink-0 text-[#c8a0a0]"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Workflow detail on hover — shown as subtle sub-text */}
                  <div className="mt-3 space-y-1.5">
                    {req.workflow.map((w) => (
                      <div key={w.step} className="flex items-start gap-2">
                        <span className="w-20 shrink-0 text-[11px] font-semibold text-[#1e1b1b]">
                          {w.step}
                        </span>
                        <span className="text-[11px] text-[#a18080]">
                          {w.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Travel-only: Tier breakdown */}
                {req.tiers && (
                  <div className="mx-7 mb-5">
                    <p className="mb-2 text-[10px] font-semibold tracking-widest text-[#a18080] uppercase">
                      Cost-Based Tiers
                    </p>
                    <div className="space-y-1.5">
                      {req.tiers.map((tier) => (
                        <div
                          key={tier.label}
                          className="flex items-center justify-between rounded-xl border border-[rgba(240,180,180,0.3)] bg-white/60 px-3.5 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-rose-400">{tier.icon}</span>
                            <span className="text-[12px] font-semibold text-[#1e1b1b]">
                              {tier.label}
                            </span>
                            <span className="text-[11px] text-[#a18080]">
                              · {tier.cost}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {tier.approvers.map((a) => (
                              <span
                                key={a}
                                className="rounded-md border border-[rgba(240,180,180,0.5)] bg-[#fff1f2] px-2 py-0.5 text-[10px] font-medium text-[#1e1b1b]"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <div className="px-7 pb-7">
                  <Link
                    href={req.href}
                    className={`flex w-full items-center justify-center gap-2 bg-linear-to-r py-3 ${req.accent} rounded-2xl text-[13px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
                  >
                    Start {req.label} <ArrowUpRight size={14} />
                  </Link>
                  <p className="mt-2.5 text-center text-[11px] text-[#a18080]">
                    Takes ~3 minutes · Requires company sign-in
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Info Banner */}
          <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-3xl border border-[rgba(255,255,255,0.06)] bg-linear-to-r from-[#1e1b1b] to-[#2d2828] p-7 shadow-[0_20px_40px_rgba(0,0,0,0.15)] sm:flex-row">
            <div>
              <h4 className="text-[18px] font-bold tracking-tight text-white">
                Compliance Requirements
              </h4>
              <p className="mt-1 text-[12px] text-white/40">
                Compliance procedures for any requisition must be followed
              </p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm text-black"
            >
              <CircleGauge className="h-4 w-4" />
              Your Dashboard
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}
