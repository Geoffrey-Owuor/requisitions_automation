import { Fragment, ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  SquarePen,
} from "lucide-react";
import { findApp } from "@/lib/appDirectory";

/**
 * Shared building blocks for the guideline panels.
 *
 * These used to be exported from the guidelines page itself, which meant every
 * panel imported back from the page that rendered it. They live here so the
 * dependency runs one way.
 */

/** Coloured callout block (tips, warnings, external links). */
export const Callout = ({
  icon,
  title,
  children,
  tone = "brand",
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  tone?: "brand" | "rose" | "blue" | "amber";
}) => {
  const tones = {
    brand: {
      wrap: "border-brand-100 bg-brand-50",
      chip: "bg-brand-600",
      title: "text-brand-900",
      body: "text-brand-800/80",
    },
    rose: {
      wrap: "border-brand-100 bg-brand-50",
      chip: "bg-brand-600",
      title: "text-brand-900",
      body: "text-brand-800/80",
    },
    blue: {
      wrap: "border-blue-100 bg-blue-50",
      chip: "bg-blue-600",
      title: "text-blue-900",
      body: "text-blue-800/80",
    },
    amber: {
      wrap: "border-amber-200 bg-amber-50",
      chip: "bg-amber-500",
      title: "text-amber-900",
      body: "text-amber-800/80",
    },
  }[tone];

  return (
    <div
      className={`rounded-surface flex items-start gap-3 border p-4 ${tones.wrap}`}
    >
      <div
        className={`rounded-control flex h-8 w-8 shrink-0 items-center justify-center text-white ${tones.chip}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className={`text-sm font-semibold ${tones.title}`}>{title}</h4>
        <p className={`mt-1 text-sm leading-relaxed ${tones.body}`}>
          {children}
        </p>
      </div>
    </div>
  );
};

export const GeneralNote = () => (
  <div className="rounded-surface shadow-raised flex items-start gap-3 border border-slate-200 bg-white p-4">
    <div className="rounded-control flex h-8 w-8 shrink-0 items-center justify-center bg-slate-100 text-slate-500">
      <AlertCircle size={16} />
    </div>
    <p className="text-sm leading-relaxed text-slate-600">
      <span className="font-semibold text-slate-900">Important: </span>
      Requisitions are inherently tied to the named employee&apos;s information.
      This remains true even if the requisition is raised on behalf of another
      employee who does not have access to a company email account.
    </p>
  </div>
);

export const InfoCard = ({
  icon,
  title,
  items,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
}) => (
  <div className="rounded-surface shadow-raised border border-slate-200 bg-white p-4">
    <div className="mb-3 flex items-center gap-2.5">
      <div className="ring-brand-100 bg-brand-50 text-brand-600 rounded-control flex h-8 w-8 shrink-0 items-center justify-center ring-1">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
    </div>
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 text-sm text-slate-600"
        >
          <ChevronRight size={14} className="text-brand-300 mt-0.5 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const TierCard = ({
  tier,
  type,
  cost,
  approvers,
  icon,
}: {
  tier: string;
  type: string;
  cost: string;
  approvers: string[];
  icon: ReactNode;
}) => (
  <div className="rounded-surface shadow-raised flex flex-col justify-between gap-3 border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
    <div className="flex items-center gap-3">
      <div className="rounded-control flex h-11 w-11 shrink-0 items-center justify-center bg-slate-50 text-slate-400 ring-1 ring-slate-100">
        {icon}
      </div>
      <div>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
          {tier}
        </span>
        <h4 className="mt-1 text-sm font-semibold text-slate-900">{type}</h4>
        <p className="text-sm text-slate-500">{cost}</p>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
      {approvers.map((approver, idx) => (
        <Fragment key={approver}>
          <div className="border-brand-100 bg-brand-50/60 rounded-compact flex items-center gap-1.5 border py-1 pr-2.5 pl-1.5 text-xs font-semibold text-slate-700">
            <CheckCircle2 size={12} className="text-brand-500 shrink-0" />
            {approver}
          </div>
          {idx < approvers.length - 1 && (
            <ChevronRight
              size={12}
              className="hidden text-slate-300 sm:block"
            />
          )}
        </Fragment>
      ))}
    </div>
  </div>
);

/**
 * Heading block for a guideline panel. The navigation rail already names the
 * section, so this renders the title once — there is no separate eyebrow.
 * Pass `slug` to show the directory entry's form link beside the title.
 */
export const GuidelineHeading = ({
  icon,
  title,
  slug,
  children,
}: {
  icon: ReactNode;
  title: string;
  slug?: string;
  children: ReactNode;
}) => {
  const action = slug ? findApp(slug)?.action : undefined;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <div className="flex items-center gap-2.5">
          <span className="bg-brand-600 rounded-control flex h-8 w-8 shrink-0 items-center justify-center text-white">
            {icon}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
        </div>

        {action && (
          <Link
            href={action.href}
            className="rounded-control bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-600 group flex shrink-0 items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <SquarePen className="h-4 w-4" />
            {action.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
        {children}
      </p>
    </div>
  );
};

/**
 * Closing call to action for a form or portal's guideline panel, so a reader
 * who has worked through the page doesn't have to scroll back up to the heading.
 */
export const GuidelineActionCard = ({ slug }: { slug: string }) => {
  const entry = findApp(slug);
  if (!entry?.action) return null;

  const isPortal = entry.group === "portal";

  return (
    <div className="rounded-surface border-brand-100 bg-brand-50 flex flex-col items-start justify-between gap-4 border p-4 sm:flex-row sm:items-center sm:p-5">
      <div>
        <h2 className="text-brand-900 text-base font-semibold tracking-tight">
          {isPortal ? "Ready to go?" : "Ready to submit?"}
        </h2>
        <p className="text-brand-800/80 mt-1 text-sm leading-relaxed">
          Open {isPortal ? entry.label : `the ${entry.label} form`}.{" "}
          {entry.action.signInRequired
            ? "You'll be asked to sign in with your work account first if you haven't already."
            : "No sign-in needed."}
        </p>
      </div>

      <Link
        href={entry.action.href}
        className="rounded-control bg-brand-600 hover:bg-brand-700 focus-visible:outline-brand-600 group flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <SquarePen className="h-4 w-4" />
        {entry.action.label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
};

/** Section title within a guideline panel. */
export const SectionTitle = ({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) => (
  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
    <span className="ring-brand-100 bg-brand-50 text-brand-600 rounded-compact flex h-7 w-7 items-center justify-center ring-1">
      {icon}
    </span>
    {children}
  </h2>
);
