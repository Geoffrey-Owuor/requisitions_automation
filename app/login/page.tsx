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

          <Link
            href="/guidelines"
            className="group flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-4 py-2.5 text-[13px] font-medium text-slate-600 shadow-sm backdrop-blur-xl transition-all duration-200 hover:border-rose-200 hover:bg-white hover:text-rose-700 hover:shadow-md active:scale-98"
          >
            <FileText
              size={14}
              className="text-slate-400 transition-colors group-hover:text-rose-500"
            />
            <span className="hidden sm:inline">Requisition Guidelines</span>
            <span className="sm:hidden">Guidelines</span>
          </Link>
        </header>

        {/* ── MAIN CONTENT LAYER ── */}
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="animate-rise relative w-full max-w-sm">
            {/* Ambient card glow */}
            <div className="absolute -inset-3 rounded-[2.75rem] bg-linear-to-br from-rose-300/35 via-rose-100/20 to-blue-100/30 blur-2xl" />

            {/* Neomorphic Enterprise Card */}
            <div className="relative overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/90 p-8 shadow-[0_2px_4px_rgba(140,40,60,0.03),0_28px_56px_-24px_rgba(140,40,60,0.35),inset_0_1px_0_rgba(255,255,255,1)] backdrop-blur-xl sm:p-9">
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
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/70 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-rose-600 uppercase">
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
                <span className="text-[10px] font-semibold tracking-[0.16em] text-slate-300 uppercase">
                  Continue with
                </span>
                <div className="h-px flex-1 bg-linear-to-l from-transparent to-rose-100" />
              </div>

              {/* Dynamic Handshake Interface Trigger */}
              <LoginWrapper />

              {/* Trust strip */}
              <div className="mt-6 flex items-center justify-center gap-2 rounded-full border border-slate-100 bg-slate-50/70 px-4 py-2">
                <ShieldCheck size={13} className="shrink-0 text-emerald-500" />
                <p className="text-[11.5px] text-slate-500">
                  Protected by Microsoft Entra ID
                </p>
              </div>

              {/* Fallback Utility Link */}
              <div className="mt-5 text-center">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:bg-rose-50/70 hover:text-rose-600"
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
