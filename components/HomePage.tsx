"use client";

import Link from "next/link";
import {
  Plane,
  ChevronRight,
  MapPin,
  Shield,
  ArrowUpRight,
} from "lucide-react";

const tiers = [
  {
    number: "01",
    label: "Tier 1",
    badge: "Local Road Travel",
    cost: "Under KES 30,000",
    approvers: ["HOD Only"],
    icon: <MapPin size={18} />,
    accent: "from-rose-400 to-rose-500",
  },
  {
    number: "02",
    label: "Tier 2",
    badge: "Local Air Travel",
    cost: "KES 30,000 – 100,000",
    approvers: ["HOD", "HR"],
    icon: <Plane size={18} />,
    accent: "from-rose-500 to-rose-600",
  },
  {
    number: "03",
    label: "Tier 3",
    badge: "International Travel",
    cost: "Over KES 100,000",
    approvers: ["HOD", "HR", "Director"],
    icon: <Shield size={18} />,
    accent: "from-rose-600 to-[#be1038]",
  },
];

export default function HomePage() {
  return (
    <div className="font-sans min-h-screen relative overflow-x-hidden">
      {/* ── HEADER ── */}
      <header className="relative z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-[0_4px_12px_rgba(225,29,72,0.3)]">
              <Plane size={15} className="text-white -rotate-45" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-bold tracking-[-0.3px] text-[#1e1b1b]">
                Hotpoint
              </span>
              <span className="text-[10px] text-[#a18080] font-medium tracking-widest uppercase">
                Appliances Ltd
              </span>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/submitrequisition"
            className="flex items-center gap-2 px-4 py-2 bg-[#1e1b1b] text-white text-[13px] font-semibold rounded-xl hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(225,29,72,0.3)] transition-all duration-200"
          >
            New Requisition <ArrowUpRight size={14} />
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <main className="relative z-10">
        {/* Top Hero Block */}
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            {/* Left — headline */}
            <div className="max-w-xl">
              <span className="inline-block text-[11px] font-semibold uppercase tracking-[2px] text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full mb-6">
                Internal Form
              </span>
              <h2 className="text-[42px] sm:text-[52px] font-bold leading-[1.1] tracking-[-1.5px] text-[#1e1b1b] mb-5">
                Travel Requisition
                <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-rose-700">
                  Form V3
                </span>
              </h2>
              <p className="text-[16px] text-[#7c5a5a] leading-relaxed max-w-md">
                Submitting a requisition will require you to be signed into your
                company account. Structured approval tiers ensure compliance and
                accountability at every level.
              </p>

              <div className="flex items-center gap-4 mt-8">
                <Link
                  href="/submitrequisition"
                  className="flex items-center gap-2 px-6 py-3.5 bg-linear-to-r from-rose-600 to-rose-500 text-white text-[14px] font-semibold rounded-2xl hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(225,29,72,0.35)] transition-all duration-200"
                >
                  Submit a Requisition <ChevronRight size={16} />
                </Link>
                <span className="text-[13px] text-[#a18080]">
                  Takes ~3 minutes
                </span>
              </div>
            </div>

            {/* Right — stats pill */}
            <div className="flex gap-4 flex-wrap lg:flex-nowrap">
              {[
                { value: "3", label: "Approval Tiers" },
                { value: "100%", label: "Digital Process" },
              ].map(({ value, label }) => (
                <div
                  key={label}
                  className="bg-white/70 backdrop-blur-xl border border-[rgba(240,180,180,0.5)] rounded-2xl px-6 py-5 shadow-[0_8px_24px_rgba(160,60,60,0.07)] min-w-27.5 text-center"
                >
                  <div className="text-[28px] font-bold text-[#1e1b1b] tracking-[-1px]">
                    {value}
                  </div>
                  <div className="text-[11px] text-[#a18080] font-medium mt-0.5 leading-tight">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Divider label */}
        <div className="max-w-6xl mx-auto px-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-[rgba(240,180,180,0.5)] to-transparent" />
            <span className="text-[11px] uppercase tracking-[2px] font-semibold text-[#a18080]">
              Approval Tiers (Cost in Kshs)
            </span>
            <div className="h-px flex-1 bg-linear-to-r from-transparent via-[rgba(240,180,180,0.5)] to-transparent" />
          </div>
        </div>

        {/* Tier Cards */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tiers.map((tier) => (
              <div
                key={tier.label}
                className="group relative bg-white/65 backdrop-blur-2xl border border-white/85 rounded-3xl p-7 shadow-[0_16px_40px_rgba(160,60,60,0.08)] hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(160,60,60,0.14)] transition-all duration-300 overflow-hidden"
              >
                {/* Background number watermark */}
                <span className="absolute -bottom-3 -right-2 text-[90px] font-black text-[rgba(225,29,72,0.04)] leading-none select-none pointer-events-none">
                  {tier.number}
                </span>

                {/* Icon + badge row */}
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`w-10 h-10 rounded-xl bg-linear-to-br ${tier.accent} flex items-center justify-center text-white shadow-[0_4px_14px_rgba(225,29,72,0.25)]`}
                  >
                    {tier.icon}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                    {tier.badge}
                  </span>
                </div>

                {/* Label */}
                <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[#a18080] mb-1">
                  {tier.label}
                </p>
                <h3 className="text-[20px] font-bold text-[#1e1b1b] tracking-tight mb-4 leading-snug">
                  {tier.cost}
                </h3>

                {/* Approvers */}
                <div className="border-t border-[rgba(240,180,180,0.35)] pt-4">
                  <p className="text-[11px] uppercase tracking-widest text-[#a18080] font-semibold mb-3">
                    Required Approvals
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tier.approvers.map((a) => (
                      <span
                        key={a}
                        className="text-[12px] font-medium text-[#1e1b1b] bg-[#fff1f2] border border-[rgba(240,180,180,0.6)] px-3 py-1 rounded-lg"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="mt-10 rounded-3xl bg-linear-to-r from-[#1e1b1b] to-[#2d2828] border border-[rgba(255,255,255,0.06)] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
            <div>
              <h4 className="text-white text-[22px] font-bold tracking-tight">
                Start your requisition now
              </h4>
              <p className="text-white/40 text-[13px] mt-1">
                All fields are required · Submissions auto-route to your
                approval chain
              </p>
            </div>
            <Link
              href="/submitrequisition"
              className="shrink-0 flex items-center gap-2 px-7 py-3.5 bg-linear-to-r from-rose-500 to-rose-600 text-white text-[14px] font-bold rounded-2xl hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(225,29,72,0.4)] transition-all duration-200"
            >
              Open Form <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[rgba(240,180,180,0.35)] bg-white/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-[0_4px_10px_rgba(225,29,72,0.25)]">
              <Plane size={13} className="text-white -rotate-45" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[13px] font-bold text-[#1e1b1b]">
                Hotpoint Appliances Ltd
              </span>
              <span className="text-[10px] text-[#a18080]">
                Travel Requisition Form V3
              </span>
            </div>
          </div>

          {/* Centre note */}
          <p className="text-[12px] text-[#a18080] text-center">
            For HR policy queries contact{" "}
            <span className="text-rose-600 font-semibold">
              hr@hotpoint.co.ke
            </span>
          </p>

          {/* Right */}
          <p className="text-[11px] text-[#c0a0a0]">
            © {new Date().getFullYear()} Hotpoint Appliances Ltd · Internal Use
            Only
          </p>
        </div>
      </footer>
    </div>
  );
}
