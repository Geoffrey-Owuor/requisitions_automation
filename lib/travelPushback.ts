// Rules for HR push-backs on travel requisitions - a travel-HR approver
// reversing the recorded HR decision (approved <-> declined). Shared by the
// dashboard (button visibility), the approval page (push-back mode) and the
// server action, which is the only place the rules are actually enforced.

export const MAX_TRAVEL_HR_PUSHBACKS = 3;
export const MAX_PUSHBACK_REASON_LENGTH = 1000;

// travel_departure_date is a DATE with no time of day - push-backs stay
// allowed until the end of that day in Nairobi. Computed in SQL so neither
// the server's nor the browser's timezone matters.
export const PUSHBACK_WINDOW_SQL = `((CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Nairobi')::date <= travel_departure_date)`;

export interface TravelPushbackState {
  hrStatus: string;
  approvalTier: string;
  pushbackCount: number;
  withinWindow: boolean;
}

/**
 * Returns why a push-back isn't allowed, or null when it is.
 */
export function getTravelPushbackBlocker({
  hrStatus,
  approvalTier,
  pushbackCount,
  withinWindow,
}: TravelPushbackState): string | null {
  if (hrStatus !== "approved" && hrStatus !== "declined") {
    return "Only a requisition HR has already approved or declined can be pushed back";
  }
  if (approvalTier === "Tier 3") {
    return "Tier 3 requisitions require Director approval and cannot be pushed back - please raise a new requisition instead";
  }
  if (Number(pushbackCount) >= MAX_TRAVEL_HR_PUSHBACKS) {
    return `This requisition has reached the maximum of ${MAX_TRAVEL_HR_PUSHBACKS} push-backs`;
  }
  if (!withinWindow) {
    return "The departure date for this requisition has passed, so it can no longer be pushed back";
  }
  return null;
}

// The only decision a push-back can record - it must flip the status.
export function oppositeHrStatus(status: string): "approved" | "declined" {
  return status === "approved" ? "declined" : "approved";
}

export interface TravelPushbackValues {
  pushbackid: string;
  pushbacknumber: number;
  pushedbyname: string;
  pushedbyemail: string;
  pushbackreason: string;
  createdat: string;
  previousstatus: string;
  previousapprover: string | null;
  previouscomments: string | null;
  newstatus: string;
  newcomments: string | null;
}

export const travelPushbacksQuery = `
  SELECT
    pushback_id AS pushbackid,
    pushback_number AS pushbacknumber,
    pushed_by_name AS pushedbyname,
    pushed_by_email AS pushedbyemail,
    pushback_reason AS pushbackreason,
    created_at AS createdat,
    previous_status AS previousstatus,
    previous_approver AS previousapprover,
    previous_comments AS previouscomments,
    new_status AS newstatus,
    new_comments AS newcomments
  FROM travel_hr_pushbacks
  WHERE request_id = $1
  ORDER BY pushback_number ASC
`;
