import Link from "next/link";
import { ShieldCheck } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative z-10">
      <div className="mx-auto max-w-6xl px-4 pb-5 sm:px-6">
        <div className="h-px w-full bg-linear-to-r from-transparent via-rose-200/60 to-transparent" />
        <div className="flex flex-col items-center justify-between gap-3 pt-5 sm:flex-row">
          <p className="text-[13px] text-slate-500">
            © {new Date().getFullYear()} Hotpoint Appliances Ltd
          </p>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/60 px-3 py-1 text-[11px] font-semibold tracking-wide text-rose-600 uppercase">
              <ShieldCheck size={12} />
              Internal Use Only
            </span>
            <Link
              href="/guidelines"
              className="rounded-full px-3 py-1 text-[12px] font-medium text-slate-500 transition-colors hover:bg-white hover:text-rose-600"
            >
              Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
