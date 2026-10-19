"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Plane, Shield } from "lucide-react";
import { loadPublicTravelTiers } from "@/lib/loadAppDataV2";
import { nairobiToday } from "@/lib/casualConfig";
import {
  thresholdsOn,
  travelTierCostLabels,
} from "@/utils/calculateTravelApprovalTier";
import { TierCard } from "./GuidelinePrimitives";

// The approval tiers with the cost thresholds in effect today, from
// travel_tier_thresholds. A client component because the guideline pages are
// statically built, while thresholds change.
export default function TravelTierCards() {
  const { data: rows, isLoading } = useQuery({
    queryKey: ["PublicTravelTiers"],
    queryFn: loadPublicTravelTiers,
  });

  const thresholds = rows ? thresholdsOn(rows, nairobiToday()) : null;
  const costs = thresholds ? travelTierCostLabels(thresholds) : null;
  const cost = (tier: keyof NonNullable<typeof costs>) =>
    costs?.[tier] ?? (isLoading ? "Loading…" : "Unavailable");

  return (
    <div className="flex flex-col gap-3">
      <TierCard
        tier="Tier 1"
        type="Local Road Travel"
        cost={cost("Tier 1")}
        approvers={["HOD Approval", "HR Approval"]}
        icon={<MapPin size={22} />}
      />
      <TierCard
        tier="Tier 2"
        type="Local Air Travel"
        cost={cost("Tier 2")}
        approvers={["HOD Approval", "HR Approval"]}
        icon={<Plane size={22} />}
      />
      <TierCard
        tier="Tier 3"
        type="International Travel"
        cost={cost("Tier 3")}
        approvers={["HOD Approval", "HR Approval", "Director Approval"]}
        icon={<Shield size={22} />}
      />
    </div>
  );
}
