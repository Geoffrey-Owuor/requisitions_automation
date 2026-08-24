"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";
import Brand from "@/components/Brand";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="layout-scrollbar relative h-screen w-full bg-[#fdfbfb] selection:bg-rose-100 selection:text-rose-900">
      {/* ── AMBIENT BACKGROUND ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-aurora absolute top-[-20%] left-1/2 h-[70%] w-[80%] -translate-x-1/2 rounded-full bg-rose-200/50 blur-[120px]" />
        <div className="animate-drift absolute bottom-[-15%] left-[-10%] h-[50%] w-[50%] rounded-full bg-orange-100/50 blur-[110px]" />
        <div className="animate-drift absolute right-[-10%] bottom-[-5%] h-[45%] w-[45%] rounded-full bg-blue-100/40 blur-[110px]" />
        <div className="hero-grid absolute inset-x-0 top-0 h-[80vh]" />
      </div>

      {/* Structural Central Container */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        {/* ── ENTERPRISE HEADER ── */}
        <header className="flex h-18 items-center justify-between">
          <Brand showText={true} />
        </header>

        {/* ── MAIN CONTENT LAYER ── */}
        <main className="flex flex-1 items-center justify-center py-6">
          <div className="animate-rise relative w-full max-w-sm">
            {/* Ambient card glow */}
            <div className="absolute -inset-3 rounded-[2.75rem] bg-linear-to-br from-rose-300/35 via-rose-100/20 to-blue-100/30 blur-2xl" />

            {/* Neomorphic Enterprise Card */}
            <div className="relative overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/90 p-8 text-center shadow-[0_2px_4px_rgba(140,40,60,0.03),0_28px_56px_-24px_rgba(140,40,60,0.35),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-xl sm:p-9">
              {/* Top gradient hairline */}
              <div className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-rose-400/60 to-transparent" />

              {/* Icon with a subtle "searching" animation pulse */}
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-rose-100 bg-linear-to-br from-white to-rose-50 shadow-[inset_0_1.5px_0_rgba(255,255,255,1),0_10px_24px_-10px_rgba(225,29,72,0.45)]">
                <div className="absolute inset-0 rounded-full ring-8 ring-rose-50/60" />
                <Search className="relative h-6 w-6 text-rose-500" />
                <div className="absolute inset-0 animate-ping rounded-full bg-rose-400/10" />
              </div>

              {/* Typography Header Group */}
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/70 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-rose-600 uppercase">
                Error 404
              </span>

              <h1 className="mb-2 text-[26px] leading-tight font-semibold tracking-tight text-slate-900">
                Lost in space?
              </h1>

              <p className="mb-8 px-1 text-[13.5px] leading-relaxed font-normal text-slate-500">
                The page you are looking for doesn&apos;t seem to exist or has
                been moved. Let&apos;s get you back on track.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 py-3.5 text-[14px] font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-rose-700 active:scale-[0.98]"
                >
                  <Home size={16} />
                  Return to Homepage
                </Link>

                <button
                  onClick={() => window.history.back()}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-3.5 text-[14px] font-semibold text-slate-700 transition-colors duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.98]"
                >
                  <ArrowLeft size={16} />
                  Go back
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
