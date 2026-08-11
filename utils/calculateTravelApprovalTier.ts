export type TravelApprovalTier = "Tier 1" | "Tier 2" | "Tier 3";

/**
 * Single source of truth for the cost-based travel approval tier, used both
 * client-side (for display) and server-side (to verify the client's claim).
 */
export function calculateTravelApprovalTier(
  totalCost: number,
): TravelApprovalTier {
  if (!totalCost || totalCost <= 30000) return "Tier 1";
  if (totalCost >= 100000) return "Tier 3";
  return "Tier 2";
}
