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
      <div className="flex flex-1 flex-col gap-5 py-8 lg:flex-row lg:gap-8">
        <aside className="w-full min-w-0 lg:w-58 lg:shrink-0">
          <nav
            aria-label="Guidelines"
            className="flex flex-col gap-2 py-2 lg:sticky lg:top-20 lg:rounded-2xl lg:border lg:border-slate-200/70 lg:bg-white/70 lg:p-2.5 lg:shadow-sm lg:backdrop-blur-xl"
          >
            <span className="hidden px-2 pb-1 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase lg:block">
              Guidelines
            </span>

            <div className="small-scrollbar flex flex-row gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
              {appDirectory.map((entry) => {
                const isActive = entry.slug === slug;
                const Icon = entry.icon;

                return (
                  <Link
                    key={entry.slug}
                    href={`/guidelines/${entry.slug}`}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-control flex shrink-0 items-center gap-2 px-2.5 py-2 text-sm font-medium transition-colors lg:w-full ${
                      isActive
                        ? "bg-brand-600 text-white"
                        : "hover:bg-brand-50 hover:text-brand-700 border border-slate-200 bg-white text-slate-600 lg:border-transparent lg:bg-transparent"
                    }`}
                  >
                    <Icon size={15} className="shrink-0" />
                    <span className="whitespace-nowrap lg:whitespace-normal">
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
