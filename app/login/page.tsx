// app/login/page.tsx
import { getSession } from "@/lib/session"; // Updated import
import { redirect } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "The login page for requisition hub",
};

export default async function LoginPage() {
  // Check the secure cookie using our jose helper
  const session = await getSession();

  // If a session exists, push them straight to the dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4">
      {/* Glass card */}
      <div className="relative flex w-full max-w-105 flex-col items-center rounded-3xl border border-white/85 bg-white/60 px-9 py-10 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.9),inset_0_-1px_0_0_rgba(180,190,220,0.25),0_24px_48px_rgba(60,80,160,0.10),0_8px_16px_rgba(60,80,160,0.06)] backdrop-blur-xl backdrop-saturate-160 sm:px-6 sm:py-8">
        {/* Logo mark */}
        <div className="mb-6">
          <div className="flex h-15 w-15 items-center justify-center rounded-2xl border border-[#B4C8FF]/50 bg-white/90 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_4px_12px_rgba(59,110,232,0.12)]">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 3L24 8.5V19.5L14 25L4 19.5V8.5L14 3Z"
                stroke="#3B6EE8"
                strokeWidth="1.8"
                fill="none"
              />
              <path
                d="M14 8L19 10.75V16.25L14 19L9 16.25V10.75L14 8Z"
                fill="#3B6EE8"
                fillOpacity="0.18"
                stroke="#3B6EE8"
                strokeWidth="1.2"
              />
            </svg>
          </div>
        </div>

        {/* Heading group */}
        <div className="mb-6 text-center">
          <h1 className="mb-2.5 text-[22px] leading-tight font-semibold tracking-tight text-[#1a2340] sm:text-[20px]">
            Sign in to continue
          </h1>
          <p className="px-3 text-[14px] leading-relaxed font-normal text-[#5a6480]">
            Sign in to your company Microsoft&nbsp;365 account to access your
            dashboard and make requisitions.
          </p>
        </div>

        {/* Divider */}
        <div className="mb-6 h-px w-full bg-linear-to-r from-transparent via-[#A0AFDC]/35 to-transparent" />

        {/* CHANGE: Point the form directly to your custom API handler */}
        <form action="/api/auth/login" method="GET" className="w-full">
          <button
            type="submit"
            className="group flex w-full cursor-pointer items-center justify-center gap-2.75 rounded-xl border border-[#B4C3F0]/60 bg-white/85 px-5 py-3.25 text-[14.5px] font-medium text-[#1a2340] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.95),0_4px_14px_rgba(59,110,232,0.10),0_1px_3px_rgba(60,80,160,0.08)] transition-all duration-200 hover:border-[#648CFF]/45 hover:bg-white/95 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,1),0_6px_20px_rgba(59,110,232,0.16),0_2px_6px_rgba(60,80,160,0.10)] active:translate-y-0 active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_2px_8px_rgba(59,110,232,0.10)]"
          >
            <MicrosoftIcon />
            <span>Sign in with Microsoft 365</span>
          </button>
        </form>

        {/* Back link */}
        <Link
          href="/"
          className="mt-5 text-[12px] leading-normal text-[#8a95b0] underline decoration-[#8a95b0]/30 underline-offset-4 transition-colors hover:text-[#3B6EE8]"
        >
          Back to HomePage
        </Link>
      </div>

      {/* Global Footer Placeholder */}
      <div className="absolute bottom-6 w-full px-4 text-center">
        <p className="text-[13px] text-[#8a95b0]">
          &copy; {new Date().getFullYear()} Hotpoint Appliances Ltd · Internal
          Use Only
        </p>
      </div>
    </div>
  );
}

function MicrosoftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
