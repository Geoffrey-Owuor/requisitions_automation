// app/login/page.tsx
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import LoginWrapper from "@/components/LoginWrapper";
import Brand from "@/components/Brand";
import Footer from "@/components/Footer";
import { ArrowLeft, FileText, Lock, ShieldCheck } from "lucide-react";
import HardRedirect from "@/components/HardRedirect";
import Image from "next/image";
import { assets } from "@/public/assets";

export const metadata: Metadata = {
  title: "Login | Hotpoint Apps Hub",
  description: "Secure corporate portal for Hotpoint Appliances Ltd",
};

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  // Handle auto-redirect if requested by middleware
  const { returnTo } = await searchParams;
  if (returnTo) {
    return <HardRedirect url="/api/auth/login" returnTo={returnTo} />;
  }

  return (
    <div className="layout-scrollbar bg-canvas relative h-screen w-full selection:bg-rose-100 selection:text-rose-900">
      {/* Structural Central Container */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        {/* ── ENTERPRISE HEADER ── */}
        <header className="flex h-18 items-center justify-between">
          <Brand showText={true} />

          <Link
            href="/guidelines"
            className="rounded-control bg-brand-600 hover:bg-brand-700 flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white transition-colors"
          >
            <FileText
              size={14}
              className="transition-colors group-hover:text-rose-500"
            />
            <span className="hidden sm:inline">Requisition Guidelines</span>
            <span className="sm:hidden">Guidelines</span>
          </Link>
        </header>

        {/* ── MAIN CONTENT LAYER ── */}
        <main className="flex flex-1 items-center justify-center py-6">
          <div className="animate-rise relative w-full max-w-sm">
            {/* Neomorphic Enterprise Card */}
            <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-8 shadow-[0_2px_4px_rgba(140,40,60,0.03),0_28px_56px_-24px_rgba(140,40,60,0.35),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-xl sm:p-9">
              {/* Top gradient hairline */}
              <div className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-rose-400/60 to-transparent" />

              {/* Embedded Logo Core */}
              <div className="mb-6 flex justify-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-rose-100 bg-linear-to-br from-white to-rose-50 shadow-[inset_0_1.5px_0_rgba(255,255,255,1),0_10px_24px_-10px_rgba(225,29,72,0.45)]">
                  <div className="absolute inset-0 rounded-full ring-8 ring-rose-50/60" />
                  <div className="relative h-7 w-7">
                    <Image
                      src={assets.hotpoint_logo}
                      alt="Hotpoint Apps Hub"
                      sizes="32px"
                      className="object-contain"
                      fill
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Typography Header Group */}
              <div className="mb-6 text-center">
                <span className="rounded-control mb-3 inline-flex items-center gap-1.5 border border-rose-100 bg-rose-50/70 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-rose-600 uppercase">
                  <Lock size={10} />
                  Secure Sign In
                </span>
                <h1 className="mb-2 text-[26px] leading-tight font-semibold tracking-tight text-slate-900">
                  Welcome Back
                </h1>
                <p className="px-1 text-[13.5px] leading-relaxed font-normal text-slate-500">
                  Valid work account required. Login using your Microsoft 365
                  account to proceed.
                </p>
              </div>

              {/* Linear Segment Divider */}
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-linear-to-r from-transparent to-rose-100" />
                <span className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Continue with
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-transparent to-rose-100" />
              </div>

              {/* Dynamic Handshake Interface Trigger */}
              <LoginWrapper />

              {/* Trust strip */}
              <div className="mt-6 flex items-center justify-center gap-2 px-4 py-2">
                <ShieldCheck size={13} className="shrink-0 text-emerald-500" />
                <p className="text-[11.5px] text-slate-500">
                  Protected by Microsoft Entra ID
                </p>
              </div>

              {/* Fallback Utility Link */}
              <div className="mt-5 text-center">
                <Link
                  href="/"
                  className="group rounded-control inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:bg-rose-50/70 hover:text-rose-600"
                >
                  <ArrowLeft
                    size={13}
                    className="transition-transform duration-200 group-hover:-translate-x-0.5"
                  />
                  Back to Homepage
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
