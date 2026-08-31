import { Fragment } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookText,
  ChevronRight,
  CircleDollarSign,
  CircleGauge,
  KeyRound,
  LaptopMinimalCheck,
  MailCheck,
  ShieldAlert,
  ShoppingBag,
  Workflow,
  type LucideIcon,
} from "lucide-react";
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

      <section className="grid grid-cols-1 items-start gap-6 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_30rem] lg:gap-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Hotpoint <span className="text-brand-600">Apps</span> Hub
          </h1>

          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
            Every internal app and requisition form in one place. Depending on
            the feature, you may be asked to sign in with your work credentials,
            or to verify your identity using the personal email address on file
            from your onboarding.
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
              href="/guidelines/travel"
              className="rounded-control hover:border-brand-200 hover:text-brand-700 flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
            >
              <BookText className="h-4 w-4" />
              Read the guidelines
            </Link>
          </div>
        </div>

        <QuickLinksCard />
      </section>

      <StatsBand />

      <HowItWorksSection />

      <DirectorySection
        title="Requisition Forms"
        caption="Available Online Requisition Forms"
        entries={appsByGroup("form")}
      />

      <DirectorySection
        title="Internal Portals"
        caption="Separate systems you sign into from the dashboard."
        entries={appsByGroup("portal")}
      />

      <WhyHubSection />

      <ComplianceSection />
    </PageShell>
  );
}

/** Counts derived from the app directory itself, so this never drifts from
 *  what is actually listed further down the page. "Approval stages" is
 *  computed over forms only - a portal's chain describes a downstream
 *  process in a separate system, not a stage in this app's own workflow. */
function StatsBand() {
  const formsCount = appsByGroup("form").length;
  const portalsCount = appsByGroup("portal").length;
  const maxStages = Math.max(
    ...appsByGroup("form").map((entry) => entry.chain.length),
  );

  const stats = [
    { value: formsCount, label: "Requisition forms" },
    { value: portalsCount, label: "Internal portals" },
    { value: maxStages, label: "Approval stages, at most" },
  ];

  return (
    <section className="rounded-surface shadow-raised mb-10 grid grid-cols-3 divide-x divide-slate-100 border border-slate-200 bg-white py-5">
      {stats.map((stat) => (
        <div key={stat.label} className="px-2 text-center sm:px-4">
          <div className="text-brand-600 text-2xl font-bold tracking-tight sm:text-3xl">
            {stat.value}
          </div>
          <div className="mt-1 text-xs leading-tight font-medium text-slate-500 sm:text-sm">
            {stat.label}
          </div>
        </div>
      ))}
    </section>
  );
}

type Step = { number: string; title: string; description: string };

const howItWorksSteps: Step[] = [
  {
    number: "01",
    title: "Sign in with Microsoft",
    description:
      "Use your work account to reach the dashboard. Salary Advance is the one form reachable without signing in at all.",
  },
  {
    number: "02",
    title: "Submit your request",
    description:
      "Pick the form for what you need and fill it in. Every requisition type has its own guidelines page covering what to expect.",
  },
  {
    number: "03",
    title: "Track it by email",
    description:
      "Your request moves through its approval chain automatically, and you're emailed as it progresses - nothing to chase up.",
  },
];

function HowItWorksSection() {
  return (
    <section className="mt-2 mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          How it works
        </h2>
        <p className="text-sm text-slate-500">
          From sign-in to approval, in three steps.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {howItWorksSteps.map((step) => (
          <div
            key={step.number}
            className="rounded-surface border border-slate-200 bg-white p-4"
          >
            <span className="text-brand-300 text-3xl font-black tracking-tight">
              {step.number}
            </span>
            <h3 className="mt-1 text-base font-semibold tracking-tight text-slate-900">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

type ValueProp = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const valueProps: ValueProp[] = [
  {
    title: "One sign-in for everything",
    description:
      "A single Microsoft account gets you into every requisition form and internal portal listed here.",
    icon: KeyRound,
  },
  {
    title: "Routed automatically",
    description:
      "Each request finds its own approval chain - HOD, HR, IT, Security, or the Director - without anyone forwarding an email.",
    icon: Workflow,
  },
  {
    title: "Updates at every stage",
    description:
      "Submitters and approvers are emailed as a request moves, so status is never something you have to ask about.",
    icon: MailCheck,
  },
  {
    title: "No sign-in for Salary Advance",
    description:
      "It's the one form built to be reachable directly, for staff who need it without a dashboard login.",
    icon: CircleDollarSign,
  },
];

function WhyHubSection() {
  return (
    <section className="mt-2 mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Why use the Hub
        </h2>
        <p className="text-sm text-slate-500">
          Built to remove the manual follow-up around requisitions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {valueProps.map(({ title, description, icon: Icon }) => (
          <div
            key={title}
            className="rounded-surface border border-slate-200 bg-white p-4"
          >
            <div className="bg-brand-50 text-brand-600 flex h-10 w-10 items-center justify-center rounded-full">
              <Icon size={18} />
            </div>
            <h3 className="mt-3 text-sm font-semibold tracking-tight text-slate-900">
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComplianceSection() {
  return (
    <section className="rounded-surface mt-2 mb-10 border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <h2 className="text-base font-semibold tracking-tight text-amber-900">
              Guidelines &amp; compliance
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-amber-800">
              Every requisition type has its own guidelines page covering who
              approves it, what tiers or thresholds apply, and what to have
              ready before you submit. Standard compliance and procedures for
              online form requisitions must be adhered to.
            </p>
          </div>
        </div>

        <Link
          href="/guidelines/travel"
          className="rounded-control flex shrink-0 items-center gap-2 border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
        >
          <BookText className="h-4 w-4" />
          Read the guidelines
        </Link>
      </div>
    </section>
  );
}

type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

/** The three destinations people land on most, reachable without going through
 *  the guidelines first. Ordered as the two portals, then the public form. */
const quickLinks: QuickLink[] = [
  {
    href: "/dashboard/helpdesk",
    label: "HelpDesk",
    description: "Log an IT ticket and track it to resolution.",
    icon: LaptopMinimalCheck,
  },
  {
    href: "/dashboard/staffproductpurchase",
    label: "Staff Product Purchase",
    description: "Purchase products at discounted staff prices.",
    icon: ShoppingBag,
  },
  {
    href: "/advance",
    label: "Salary Advance",
    description: "Request an advance - no sign-in needed.",
    icon: CircleDollarSign,
  },
];

function QuickLinksCard() {
  return (
    <aside
      aria-labelledby="quick-links-heading"
      className="rounded-surface shadow-raised border border-slate-200 bg-white p-4 lg:mt-1.5"
    >
      <h2
        id="quick-links-heading"
        className="text-xs font-bold tracking-wider text-slate-400 uppercase"
      >
        Quick links
      </h2>

      <ul className="mt-3 flex flex-col gap-1">
        {quickLinks.map(({ href, label, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="rounded-control hover:bg-brand-50/60 focus-visible:outline-brand-600 group flex items-start gap-3 p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="group-hover:bg-brand-600 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:text-white">
                <Icon size={18} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="group-hover:text-brand-700 block text-sm font-semibold tracking-tight text-slate-900 transition-colors">
                  {label}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                  {description}
                </span>
              </span>

              <ChevronRight className="group-hover:text-brand-600 mt-2 h-4 w-4 shrink-0 text-slate-300 transition-[color,transform] group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
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
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="text-sm text-slate-500">{caption}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        <div className="group-hover:bg-brand-600 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:text-white">
          <Icon size={17} />
        </div>
        <span
          className={`rounded-lg border px-2 py-1 text-[10px] font-bold tracking-wider uppercase ${ownerTone[entry.owner]}`}
        >
          {entry.owner}
        </span>
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-slate-900">
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
        <div className="mt-4">
          <span className="text-sm font-semibold text-slate-500">
            Approval:
          </span>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {entry.chain.map((step, index) => (
              <Fragment key={step}>
                {index > 0 && (
                  <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />
                )}
                <span className="bg-brand-50 text-brand-700 rounded-lg px-2 py-1 text-xs font-medium">
                  {step}
                </span>
              </Fragment>
            ))}
            {entry.chainNote && (
              <span className="text-sm text-slate-400">
                ({entry.chainNote})
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 pt-1">
        <span className="text-brand-600 flex items-center gap-1 text-sm font-semibold">
          Read guidelines
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>

        {entry.action && (
          <Link
            href={entry.action.href}
            className="hover:border-brand-200 hover:text-brand-700 relative z-10 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors"
          >
            {entry.action.label}
          </Link>
        )}
      </div>
    </div>
  );
}
