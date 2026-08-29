import Link from "next/link";
import { ArrowRight, BookText, CircleGauge, ShieldAlert } from "lucide-react";
import PageShell from "./PageShell";
import QuickSignIn from "./QuickSignIn";
import { appsByGroup, type AppEntry, type Owner } from "@/lib/appDirectory";

/** The owning team is the only taxonomy on this page that carries meaning, so
 *  it is the only thing that gets a colour. */
const ownerTone: Record<Owner, string> = {
  HR: "border-brand-100 bg-brand-50 text-brand-700",
  IT: "border-blue-100 bg-blue-50 text-blue-700",
  Retail: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function HomePage() {
  return (
    <PageShell>
      <QuickSignIn />

      <section className="py-8 sm:py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Hotpoint <span className="text-brand-600">Apps</span> Hub
        </h1>

        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
          Every internal app and requisition form in one place. Depending on the
          feature you may be asked to sign in with your work credentials, or to
          verify your identity using the personal email address on file from
          your onboarding.
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-control bg-brand-600 hover:bg-brand-700 group flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <CircleGauge className="h-4 w-4" />
            Go to my dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/guidelines"
            className="rounded-control hover:border-brand-200 hover:text-brand-700 flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
          >
            <BookText className="h-4 w-4" />
            Read the guidelines
          </Link>
        </div>
      </section>

      <DirectorySection
        title="Requisition forms"
        caption="Available Online Requisition Forms"
        entries={appsByGroup("form")}
      />

      <DirectorySection
        title="Internal portals"
        caption="Separate systems you sign into from the dashboard."
        entries={appsByGroup("portal")}
      />

      <div className="rounded-surface mt-8 mb-10 flex items-center gap-2.5 border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <p className="text-sm">
          Standard compliance and procedures for online form requisitions must
          be adhered to.
        </p>
      </div>
    </PageShell>
  );
}

function DirectorySection({
  title,
  caption,
  entries,
}: {
  title: string;
  caption: string;
  entries: AppEntry[];
}) {
  return (
    <section className="mt-2 mb-6">
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="text-sm text-slate-500">{caption}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {entries.map((entry) => (
          <AppCard key={entry.slug} entry={entry} />
        ))}
      </div>
    </section>
  );
}

/**
 * Every card navigates. The title carries the link and stretches over the whole
 * card, which keeps the card a single tab stop while leaving room for a second,
 * separately focusable action alongside it.
 */
function AppCard({ entry }: { entry: AppEntry }) {
  const Icon = entry.icon;

  return (
    <div className="rounded-surface shadow-raised hover:border-brand-200 hover:shadow-floating group relative flex flex-col border border-slate-200 bg-white p-4 transition-[border-color,box-shadow]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="group-hover:bg-brand-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:text-white">
          <Icon size={17} />
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${ownerTone[entry.owner]}`}
        >
          {entry.owner}
        </span>
      </div>

      <h3 className="text-base font-semibold tracking-tight text-slate-900">
        <Link
          href={`/guidelines/${entry.slug}`}
          className="group-hover:text-brand-700 rounded-control focus-visible:outline-brand-600 transition-colors after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {entry.label}
        </Link>
      </h3>

      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
        {entry.description}
      </p>

      {entry.chain.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Approval: </span>
          {entry.chain.join(" → ")}
          {entry.chainNote && ` (${entry.chainNote})`}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3 pt-1">
        <span className="text-brand-600 flex items-center gap-1 text-xs font-semibold">
          Read guidelines
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>

        {entry.action && (
          <Link
            href={entry.action.href}
            className="rounded-control hover:border-brand-200 hover:text-brand-700 relative z-10 border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors"
          >
            {entry.action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
