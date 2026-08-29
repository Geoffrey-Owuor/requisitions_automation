import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { appDirectory, findApp } from "@/lib/appDirectory";
import { guidelinePanels } from "@/components/GuidelineCards/registry";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return appDirectory.map((entry) => ({ slug: entry.slug }));
}

/** Only the slugs above exist; anything else is a 404 rather than a runtime render. */
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = findApp(slug);

  if (!entry) return { title: "Guidelines" };

  return {
    title: `${entry.label} Guidelines`,
    description: entry.description,
  };
}

export default async function GuidelinePage({ params }: Props) {
  const { slug } = await params;
  const Panel = guidelinePanels[slug];

  if (!Panel) notFound();

  return <Panel />;
}
