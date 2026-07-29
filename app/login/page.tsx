// app/login/page.tsx
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import LoginWrapper from "@/components/LoginWrapper";
import Brand from "@/components/Brand";
import Footer from "@/components/Footer";
import { FileText } from "lucide-react";
import HardRedirect from "@/components/HardRedirect";

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
    <div className="relative min-h-screen w-full bg-radial from-rose-50/40 via-slate-50 to-slate-100/80 selection:bg-rose-100 selection:text-rose-900">
      {/* Structural Central Container */}
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        {/* ── ENTERPRISE HEADER ── */}
        <header className="flex h-16 items-center justify-between">
          <div className="flex items-center transition-transform duration-200 active:scale-98">
            <Brand showText={true} />
          </div>

          <Link
            href="/guidelines"
            className="group flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/60 px-3.5 py-1.5 text-[13px] font-medium text-slate-600 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-xs transition-all duration-200 hover:border-rose-200 hover:bg-rose-50/50 hover:text-rose-700 hover:shadow-xs"
          >
            <FileText
              size={14}
              className="text-slate-500 transition-colors group-hover:text-rose-500"
            />
            <span>Requisition Guidelines</span>
          </Link>
        </header>

        {/* ── MAIN CONTENT LAYER ── */}
        <main className="flex flex-1 items-center justify-center py-14 sm:py-10">
          {/* Neomorphic Enterprise Card */}
          <div className="relative w-full max-w-sm rounded-2xl border border-rose-100/50 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_16px_32px_rgba(140,40,60,0.04),0_2px_8px_rgba(140,40,60,0.02),inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-6">
            {/* Subtle Brand Ambient Backlight */}
            <div className="absolute -top-10 left-1/2 -z-10 h-24 w-40 -translate-x-1/2 rounded-full bg-rose-400/10 blur-2xl" />

            {/* Embedded Logo Core */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-100/60 bg-rose-50/30 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.95),0_4px_10px_rgba(225,29,72,0.04)]">
                <Brand />
              </div>
            </div>

            {/* Typography Header Group */}
            <div className="mb-6 text-center">
              <h1 className="mb-2 text-2xl leading-tight font-semibold tracking-tight text-slate-900">
                Welcome Back
              </h1>
              <p className="px-1 text-[13.5px] leading-relaxed font-normal text-slate-500">
                Valid work account required. Login using your Microsoft 365
                account to proceed.
              </p>
            </div>

            {/* Linear Segment Divider */}
            <div className="mb-6 h-px w-full bg-linear-to-r from-transparent via-rose-100/60 to-transparent" />

            {/* Dynamic Handshake Interface Trigger */}
            <LoginWrapper />

            {/* Fallback Utility Link */}
            <div className="mt-5 text-center">
              <Link
                href="/"
                className="text-[12px] text-slate-500 underline decoration-slate-200 decoration-1 underline-offset-4 transition-colors hover:text-rose-600 hover:decoration-rose-300"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
