export type TravelApprovalTier = "Tier 1" | "Tier 2" | "Tier 3";

// travel_tier_thresholds (migration 027_requisition_options.sql): a total up
// to tier2Above is Tier 1, from tier3From it is Tier 3, anything between is
// Tier 2
export interface TravelTierThresholds {
  tier2Above: number;
  tier3From: number;
  effectiveFrom: string; // YYYY-MM-DD
}

// The thresholds in effect on `date` (YYYY-MM-DD, Africa/Nairobi): the row
// with the latest effective_from on or before it
export function thresholdsOn(
  thresholds: TravelTierThresholds[],
  date: string,
): TravelTierThresholds | null {
  return (
    thresholds
      .filter((row) => row.effectiveFrom <= date)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null
  );
}

/**
 * Single source of truth for the cost-based travel approval tier, used both
 * client-side (for display) and server-side (to verify the client's claim).
 */
export function calculateTravelApprovalTier(
  totalCost: number,
  thresholds: TravelTierThresholds,
): TravelApprovalTier {
  if (!totalCost || totalCost <= thresholds.tier2Above) return "Tier 1";
  if (totalCost >= thresholds.tier3From) return "Tier 3";
  return "Tier 2";
}

// The cost range each tier covers, for the form and guideline tier cards
export function travelTierCostLabels(
  thresholds: TravelTierThresholds,
): Record<TravelApprovalTier, string> {
  const kes = (amount: number) => `KES ${amount.toLocaleString()}`;
  return {
    "Tier 1": `Up to ${kes(thresholds.tier2Above)}`,
    "Tier 2": `Over ${kes(thresholds.tier2Above)}, under ${kes(thresholds.tier3From)}`,
    "Tier 3": `${kes(thresholds.tier3From)} and over`,
  };
}
