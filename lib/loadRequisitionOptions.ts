import "server-only";
import { unstable_cache } from "next/cache";
import { query } from "@/lib/db";
import {
  thresholdsOn,
  type TravelTierThresholds,
} from "@/utils/calculateTravelApprovalTier";
import { nairobiToday } from "@/lib/casualConfig";

// Option lists moved out of code (migration 027_requisition_options.sql).
// Each is cached under its own tag - refresh it after editing the table by
// hand. They throw if the database can't be read (nothing is cached then),
// so a submission is never validated against an empty list.

export interface JobGrade {
  name: string;
  rank: number;
  isActive: boolean;
}

export interface ItRequirementItem {
  id: number;
  name: string;
  isActive: boolean;
}

// Every row, future-dated ones included - thresholdsOn picks by date
export const loadTravelTierThresholds = unstable_cache(
  async (): Promise<TravelTierThresholds[]> =>
    query<TravelTierThresholds>(
      `SELECT tier2_above AS "tier2Above", tier3_from AS "tier3From",
       TO_CHAR(effective_from, 'YYYY-MM-DD') AS "effectiveFrom"
       FROM travel_tier_thresholds`,
    ),
  ["travel_tier_thresholds"],
  { revalidate: 3600, tags: ["GetTravelTiers"] },
);

// The thresholds in effect today (Africa/Nairobi), for the submission and
// amendment routes. Throws when none are, rather than tiering against nothing.
export async function loadTravelThresholdsToday(): Promise<TravelTierThresholds> {
  const thresholds = thresholdsOn(
    await loadTravelTierThresholds(),
    nairobiToday(),
  );
  if (!thresholds) throw new Error("No travel tier thresholds are in effect");
  return thresholds;
}

// In rank order, inactive grades included (old positions still name them)
export const loadJobGrades = unstable_cache(
  async (): Promise<JobGrade[]> =>
    query<JobGrade>(
      `SELECT grade_name AS name, grade_rank AS rank, is_active AS "isActive"
       FROM job_grades ORDER BY grade_rank`,
    ),
  ["job_grades"],
  { revalidate: 3600, tags: ["GetJobGrades"] },
);

// In id order, inactive items included
export const loadItRequirementItems = unstable_cache(
  async (): Promise<ItRequirementItem[]> =>
    query<ItRequirementItem>(
      `SELECT id, item_name AS name, is_active AS "isActive"
       FROM it_requirement_items ORDER BY id`,
    ),
  ["it_requirement_items"],
  { revalidate: 3600, tags: ["GetItRequirementItems"] },
);
