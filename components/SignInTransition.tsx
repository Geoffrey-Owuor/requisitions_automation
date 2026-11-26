import HotpointMark from "@/components/HotpointMark";

// Full-screen "Signing you in" screen shown between a successful sign-in and
// the first paint of the page it lands on, so the login page never blanks
// out while that page loads. EmailCodeSignIn shows it once a code is
// accepted; the Microsoft callback's hand-off page (lib/signInHandoff.ts)
// draws the same screen in plain HTML - keep the two in step.
export default function SignInTransition() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-canvas animate-fade-in fixed inset-0 z-100 flex flex-col items-center justify-center px-4 text-center"
    >
      {/* The login page's rose glow, as a gradient: a large blur filter
          repainting under the spinner is costly on 4K screens */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(254,205,211,0.55),transparent)]"
      />
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span
          aria-hidden="true"
          className="border-t-brand-600 absolute inset-0 animate-spin rounded-full border-2 border-rose-100"
        />
        <span className="rounded-control flex h-16 w-16 items-center justify-center border border-rose-100 bg-linear-to-br from-white to-rose-50 shadow-[inset_0_1.5px_0_rgba(255,255,255,1),0_10px_24px_-10px_rgba(225,29,72,0.45)]">
          <HotpointMark className="h-7 w-7" />
        </span>
      </div>
      <p className="relative mt-6 text-[17px] font-semibold tracking-tight text-slate-900">
        Signing you in
      </p>
      <p className="relative mt-1 text-[13px] text-slate-500">
        Getting the Apps Hub ready&hellip;
      </p>
    </div>
  );
}
