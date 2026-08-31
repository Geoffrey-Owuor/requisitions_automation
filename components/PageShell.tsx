import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

type PageShellProps = {
  children: ReactNode;
  /** Constrains the main column. Login uses "narrow"; content pages use "wide". */
  width?: "wide" | "narrow";
};

/**
 * Ground, wash, header and footer for the public pages.
 *
 * `h-screen` with an inner scroller is required while `html { overflow: hidden }`
 * is set globally in css/globals.css for the dashboard — see note in that file.
 */
const PageShell = ({ children, width = "wide" }: PageShellProps) => {
  return (
    <div className="layout-scrollbar bg-canvas selection:bg-brand-100 selection:text-brand-900 relative flex h-screen flex-col text-slate-900">
      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-aurora absolute top-[-15%] left-[-10%] h-[55%] w-[55%] rounded-full bg-rose-200/40 blur-[100px] sm:h-[45%] sm:w-[45%] sm:blur-[130px]" />
        <div className="animate-drift absolute top-[10%] right-[-12%] h-[45%] w-[45%] rounded-full bg-orange-100/45 blur-[100px] sm:h-[35%] sm:w-[35%]" />
        <div className="hero-grid absolute inset-x-0 top-0 h-[60vh]" />
      </div>

      <Header />

      <main
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col px-4 ${
          width === "narrow" ? "max-w-md" : "max-w-6xl"
        }`}
      >
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default PageShell;
