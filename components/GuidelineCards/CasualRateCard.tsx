"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { loadPublicCasualRates } from "@/lib/loadAppDataV2";
import {
  currentCasualRates,
  describeCasualRateScope,
  nairobiToday,
} from "@/lib/casualConfig";
import { InfoCard } from "./GuidelinePrimitives";

// The daily rates in effect today, from casual_rates. A client component
// because the guideline pages are statically built, while rates change.
export default function CasualRateCard() {
  const { data: rates, isLoading } = useQuery({
    queryKey: ["PublicCasualRates"],
    queryFn: loadPublicCasualRates,
  });

  if (isLoading) {
    return (
      <div className="rounded-surface shadow-raised h-48 animate-pulse border border-slate-200 bg-white" />
    );
  }

  const current = currentCasualRates(rates ?? [], nairobiToday());

  return (
    <InfoCard
      icon={<Wallet size={18} />}
      title="Daily Rate"
      items={[
        ...(current.length > 0
          ? current.map(
              (rule) =>
                `${describeCasualRateScope(rule)}: KES ${rule.ratePerDay.toLocaleString()} per casual, per day.`,
            )
          : ["The daily rates could not be loaded - please try again later."]),
        "Where more than one rate applies, the most specific wins: department, then location, then category.",
        "Total cost = Number of Casuals × Rate per Day × Engagement Days.",
      ]}
    />
  );
}
