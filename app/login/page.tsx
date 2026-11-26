// app/login/page.tsx
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import LoginWrapper from "@/components/LoginWrapper";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import HotpointMark from "@/components/HotpointMark";
import EmailCodeSignIn from "@/components/EmailCodeSignIn";
import { config } from "@/lib/config";
import { safeReturnTo } from "@/lib/safeReturnTo";

export const metadata: Metadata = {
  title: "Login",
  description: "Secure corporate portal for Hotpoint Appliances Ltd",
};

type Props = {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
};

// Set by app/api/auth/callback when Microsoft sign-in doesn't complete.
const SSO_ERROR_MESSAGES: Record<string, string> = {
  sso_unreachable:
    "We couldn't reach Microsoft to complete your sign-in. Please try again in a moment.",
  auth_failed: "Microsoft sign-in didn't complete. Please try again.",
  invalid_state: "Your sign-in session expired. Please try again.",
  account_deactivated:
    "Your account has been deactivated. Please contact your administrator if you need access.",
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await getSession();
  const { returnTo: rawReturnTo, error } = await searchParams;
  // Where either sign-in lands afterwards (proxy.ts sends signed-out
  // dashboard and approval-page visits here with it)
  const returnTo = rawReturnTo ? safeReturnTo(rawReturnTo) : undefined;

  if (session) {
    redirect(returnTo ?? "/dashboard");
  }

  // Empty while HUB_SIGN_IN_EMAIL_DOMAINS is unset: Microsoft only
  const codeDomains = config.hubSignInEmailDomains;

  return (
    <div className="layout-scrollbar bg-canvas h-screen w-full selection:bg-rose-100 selection:text-rose-900">
      {/* Positioning context spans the scrolled content, not just the
          viewport-tall scroller, so the ambient layer reaches the footer. */}
      <div className="relative flex min-h-full flex-col">
        {/* ── AMBIENT BACKGROUND ── */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-20%] left-1/2 h-[70%] w-[80%] -translate-x-1/2 rounded-full bg-rose-200/50 blur-[120px]" />
          <div className="absolute bottom-[-15%] left-[-10%] h-[50%] w-[50%] rounded-full bg-orange-100/50 blur-[110px]" />
          <div className="absolute right-[-10%] bottom-[-5%] h-[45%] w-[45%] rounded-full bg-blue-100/40 blur-[110px]" />
          <div className="hero-grid absolute inset-x-0 top-0 h-[80vh]" />
        </div>

        {/* Shared public header: sticky, and hides its own Login on /login. */}
        <Header />

        {/* Structural Central Container */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4">
          {/* ── MAIN CONTENT LAYER ── */}
          <main className="flex flex-1 items-center justify-center py-6">
            <div className="animate-rise relative w-full max-w-sm">
              {/* Neomorphic Enterprise Card */}
              <div className="rounded-surface relative overflow-hidden border border-white/80 bg-white/90 p-8 shadow-[0_2px_4px_rgba(140,40,60,0.03),0_28px_56px_-24px_rgba(140,40,60,0.35),inset_0_1px_0_rgba(255,255,255,1)] sm:p-9">
                {/* Top gradient hairline */}
                <div className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-rose-400/60 to-transparent" />

                {/* Embedded Logo Core */}
                <div className="mb-6 flex justify-center">
                  <div className="rounded-control relative flex h-16 w-16 items-center justify-center border border-rose-100 bg-linear-to-br from-white to-rose-50 shadow-[inset_0_1.5px_0_rgba(255,255,255,1),0_10px_24px_-10px_rgba(225,29,72,0.45)]">
                    <div className="rounded-control absolute inset-0 ring-8 ring-rose-50/60" />
                    <HotpointMark className="relative h-7 w-7" />
                  </div>
                </div>

                {/* Typography Header Group */}
                <div className="mb-6 text-center">
                  <h1 className="mb-2 text-[26px] leading-tight font-semibold tracking-tight text-slate-900">
                    Welcome Back
                  </h1>
                  <p className="px-1 text-[13.5px] leading-relaxed font-normal text-slate-500">
                    {codeDomains.length > 0
                      ? "Valid work account required. Sign in with Microsoft 365, or get a one-time code at your work email."
                      : "Valid work account required. Login using your Microsoft 365 account to proceed."}
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

                {error && SSO_ERROR_MESSAGES[error] && (
                  <p
                    role="alert"
                    className="rounded-control mb-4 border border-rose-200 bg-rose-50 px-3 py-2 text-center text-[12.5px] text-rose-700"
                  >
                    {SSO_ERROR_MESSAGES[error]}
                  </p>
                )}

                {/* Dynamic Handshake Interface Trigger */}
                <LoginWrapper returnTo={returnTo} />

                {codeDomains.length > 0 && (
                  <>
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-200" />
                      <span className="text-[11px] font-medium text-slate-400">
                        or use your work email
                      </span>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <EmailCodeSignIn
                      domains={codeDomains}
                      returnTo={returnTo}
                    />
                  </>
                )}

                {/* Trust strip */}
                <div className="mt-6 flex items-center justify-center gap-2 px-4 py-2">
                  <ShieldCheck
                    size={13}
                    className="shrink-0 text-emerald-500"
                  />
                  <p className="text-[11.5px] text-slate-500">
                    {codeDomains.length > 0
                      ? "Microsoft Entra ID or a one-time email code"
                      : "Protected by Microsoft Entra ID"}
                  </p>
                </div>

                {/* Fallback Utility Link */}
                <div className="mt-5 text-center">
                  <Link
                    href="/"
                    className="group rounded-compact inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-slate-500 transition-colors hover:bg-rose-50/70 hover:text-rose-600"
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
    </div>
  );
}
