"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import {
  requestHubSignInCode,
  verifyHubSignInCode,
} from "@/serverActions/PublicServerActions/HubSignIn";
import {
  HUB_SIGN_IN_CODE_LENGTH,
  HUB_SIGN_IN_RESEND_SECONDS,
} from "@/lib/hubSignIn";
import SignInTransition from "@/components/SignInTransition";

// The login page's email-code sign-in: a work email, then the code sent to
// it. A successful sign-in does a full page load of returnTo (not a client
// navigation), so the dashboard starts with the new session cookie. Until
// that page paints, SignInTransition covers the login page.

const LAST_USER_KEY = "Requisitions_Automation_lastUser";

const inputClass =
  "rounded-control w-full border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 disabled:bg-slate-50";

const primaryButtonClass =
  "rounded-control bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-600 flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-70";

const linkButtonClass =
  "rounded-compact cursor-pointer px-1.5 py-1 text-[12.5px] font-medium text-slate-500 transition-colors hover:text-rose-600 disabled:pointer-events-none disabled:opacity-50";

export default function EmailCodeSignIn({
  domains,
  returnTo,
}: {
  domains: string[];
  returnTo?: string;
}) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState<"send" | "verify" | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [resendIn, setResendIn] = useState(0);
  const [signingIn, setSigningIn] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  // Prefill the last account used in this browser (also what QuickSignIn
  // offers), if it's on an allowed domain
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LAST_USER_KEY) ?? "null");
      const savedEmail = typeof saved?.email === "string" ? saved.email : "";
      const domain = savedEmail.split("@")[1]?.toLowerCase();
      if (domain && domains.includes(domain)) {
        Promise.resolve().then(() => setEmail((now) => now || savedEmail));
      }
    } catch {
      // No storage, or nothing usable saved
    }
  }, [domains]);

  // Back from the dashboard can restore this page from the bfcache with the
  // transition still up - drop it so the page is usable again
  useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setSigningIn(false);
        setPending(null);
      }
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  // Into the code field when it appears and after each attempt - only once
  // it's enabled again, since a disabled input can't take focus
  useEffect(() => {
    if (step === "code" && pending === null) codeRef.current?.focus();
  }, [step, pending]);

  const sendCode = async () => {
    setPending("send");
    setNotice(null);
    try {
      const result = await requestHubSignInCode(email);
      if (result.ok) {
        setStep("code");
        setCode("");
        setResendIn(HUB_SIGN_IN_RESEND_SECONDS);
      } else if (result.retryAfterSeconds) {
        // Already sent moments ago: the earlier code still works
        setStep("code");
        setResendIn(result.retryAfterSeconds);
      }
      setNotice({ ok: result.ok, text: result.message });
    } catch {
      setNotice({ ok: false, text: "Something went wrong, please try again." });
    } finally {
      setPending(null);
    }
  };

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    sendCode();
  };

  // Checks a full code - from the form, or as soon as the last digit is
  // typed, pasted or autofilled. The ref blocks a second check before the
  // pending state has re-rendered (e.g. a paste followed straight by Enter).
  const verifyingRef = useRef(false);

  const verifyCode = async (value: string) => {
    if (verifyingRef.current || value.length !== HUB_SIGN_IN_CODE_LENGTH) {
      return;
    }
    verifyingRef.current = true;
    setPending("verify");
    setNotice(null);
    try {
      const result = await verifyHubSignInCode(email, value, returnTo);
      if (result.ok && result.redirectTo) {
        // Stays pending: the page is about to be replaced. The transition
        // paints first, so it's what stays on screen while that page loads.
        // The timer covers a background tab, where animation frames don't run.
        const target = result.redirectTo;
        setSigningIn(true);
        let started = false;
        const go = () => {
          if (started) return;
          started = true;
          window.location.assign(target);
        };
        requestAnimationFrame(() => setTimeout(go, 0));
        setTimeout(go, 150);
        return;
      }
      setNotice({ ok: false, text: result.message });
      setCode("");
    } catch {
      setNotice({ ok: false, text: "Something went wrong, please try again." });
    }
    verifyingRef.current = false;
    setPending(null);
  };

  const handleCodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    verifyCode(code);
  };

  const noticeElement = notice && (
    <p
      role={notice.ok ? "status" : "alert"}
      className={`rounded-control border px-3 py-2 text-[12.5px] leading-relaxed ${
        notice.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      {notice.text}
    </p>
  );

  if (step === "email") {
    return (
      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
        <label className="sr-only" htmlFor="hub-sign-in-email">
          Work email
        </label>
        <input
          id="hub-sign-in-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`name@${domains[0]}`}
          disabled={pending !== null}
          className={inputClass}
        />
        {noticeElement}
        <button
          type="submit"
          disabled={pending !== null}
          className={primaryButtonClass}
        >
          {pending === "send" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Email me a sign-in code
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCodeSubmit} className="flex flex-col gap-3">
      {/* Portaled: the login card's transform and overflow would otherwise
          contain a fixed overlay */}
      {signingIn && createPortal(<SignInTransition />, document.body)}
      <label className="sr-only" htmlFor="hub-sign-in-code">
        {HUB_SIGN_IN_CODE_LENGTH}-digit code
      </label>
      <input
        ref={codeRef}
        id="hub-sign-in-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern={`\\d{${HUB_SIGN_IN_CODE_LENGTH}}`}
        required
        value={code}
        onChange={(e) => {
          const next = e.target.value
            .replace(/\D/g, "")
            .slice(0, HUB_SIGN_IN_CODE_LENGTH);
          setCode(next);
          // Sign in as soon as the code is complete; the button stays as the
          // fallback (e.g. retrying after a network error)
          if (next.length === HUB_SIGN_IN_CODE_LENGTH && next !== code) {
            verifyCode(next);
          }
        }}
        placeholder={"0".repeat(HUB_SIGN_IN_CODE_LENGTH)}
        disabled={pending !== null}
        className={`${inputClass} text-center font-mono text-lg tracking-[0.5em]`}
      />
      {noticeElement}
      <button
        type="submit"
        disabled={pending !== null || code.length !== HUB_SIGN_IN_CODE_LENGTH}
        className={primaryButtonClass}
      >
        {pending === "verify" && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </button>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setNotice(null);
          }}
          disabled={pending !== null}
          className={`${linkButtonClass} inline-flex items-center gap-1`}
        >
          <ArrowLeft size={13} />
          Different email
        </button>
        <button
          type="button"
          onClick={sendCode}
          disabled={pending !== null || resendIn > 0}
          className={linkButtonClass}
        >
          {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
