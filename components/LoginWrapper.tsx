"use client";

import { useState } from "react";

const LoginWrapper = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form
      action="/api/auth/login"
      method="GET"
      className="w-full"
      onSubmit={() => setIsLoading(true)}
    >
      {/* Custom keyframes for the sequential color swap. 
        It fades between a very light rose-100 (#ffe4e6) and a deep rose-600 (#e11d48)
      */}
      <style>{`
        @keyframes color-chase {
          0%, 60%, 100% { background-color: #ffe4e6; } 
          30% { background-color: #e11d48; } 
        }
        .chase-dot {
          animation: color-chase 1.2s infinite ease-in-out;
        }
        .chase-1 { animation-delay: -0.4s; }
        .chase-2 { animation-delay: -0.2s; }
        .chase-3 { animation-delay: 0s; }
      `}</style>

      <button
        type="submit"
        disabled={isLoading}
        className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-rose-100/80 bg-white px-5 py-3.5 text-[14.5px] font-medium text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_8px_rgba(140,40,60,0.04),0_1px_2px_rgba(140,40,60,0.02)] transition-all duration-200 hover:border-rose-200 hover:bg-rose-50/40 hover:text-rose-900 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_6px_16px_rgba(140,40,60,0.06),0_2px_4px_rgba(140,40,60,0.03)] active:scale-[0.98] active:shadow-sm disabled:pointer-events-none disabled:opacity-85"
      >
        <MicrosoftIcon />

        {/* Fixed width prevents the button from resizing when the text changes */}
        <span className="flex w-47.5 items-center justify-center">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-rose-900">
              Getting things ready
              {/* The sequential colored dots */}
              <span className="flex items-center gap-0.5 pt-1">
                <span className="chase-dot chase-1 h-1.5 w-1.5 rounded-full"></span>
                <span className="chase-dot chase-2 h-1.5 w-1.5 rounded-full"></span>
                <span className="chase-dot chase-3 h-1.5 w-1.5 rounded-full"></span>
              </span>
            </span>
          ) : (
            "Sign in with Microsoft 365"
          )}
        </span>
      </button>
    </form>
  );
};

export default LoginWrapper;

function MicrosoftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
