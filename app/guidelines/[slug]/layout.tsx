import { ReactNode } from "react";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { appDirectory } from "@/lib/appDirectory";

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

/**
 * Navigation rail plus shell for the guideline pages.
 *
 * The rail lives in the layout so it is preserved across slug changes, and it
 * reads the active slug from `params` rather than `usePathname` — which keeps
 * the whole guidelines section free of client JS.
 */
export default async function GuidelinesLayout({ children, params }: Props) {
  const { slug } = await params;

  return (
    <PageShell>
      <div className="flex flex-1 flex-col gap-5 py-8 md:flex-row md:gap-8">
        <aside className="w-full min-w-0 md:w-56 md:shrink-0">
          <nav
            aria-label="Guidelines"
            className="flex flex-col gap-1.5 md:sticky md:top-20"
          >
            <span className="hidden px-2 pb-1 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase md:block">
              Guidelines
            </span>

            <div className="small-scrollbar flex flex-row gap-1.5 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
              {appDirectory.map((entry) => {
                const isActive = entry.slug === slug;
                const Icon = entry.icon;

                return (
                  <Link
                    key={entry.slug}
                    href={`/guidelines/${entry.slug}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-control flex shrink-0 items-center gap-2 px-2.5 py-2 text-sm font-medium transition-colors md:w-full ${
                      isActive
                        ? "bg-brand-600 text-white"
                        : "hover:bg-brand-50 hover:text-brand-700 border border-slate-200 bg-white text-slate-600 md:border-transparent md:bg-transparent"
                    }`}
                  >
                    <Icon size={15} className="shrink-0" />
                    <span className="whitespace-nowrap md:whitespace-normal">
                      {entry.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </PageShell>
  );
}
