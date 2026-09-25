"use server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getUserRoles } from "@/serverActions/GetUserRoles";
import {
  TravelPushbackValues,
  travelPushbacksQuery,
} from "@/lib/travelPushback";

/**
 * HR push-back history for the dashboard's travel details modal. Limited to
 * the people who can already see the requisition there: its submitter, its
 * stored HOD, travel HR and Directors.
 */
export async function getTravelPushbacks(
  requestId: string,
): Promise<TravelPushbackValues[]> {
  const user = await getSession();
  if (!user) return [];

  try {
    const requisition = await query(
      `SELECT submitter_email, travel_hod_email FROM travel_requisitions WHERE request_id = $1`,
      [requestId],
    );
    if (requisition.length === 0) return [];

    const isSubmitter = requisition[0].submitter_email === user.email;
    const isHod = requisition[0].travel_hod_email === user.email;

    if (!isSubmitter && !isHod) {
      const roles = await getUserRoles(user.email);
      if (!roles.includes("hr-travel") && !roles.includes("director")) {
        return [];
      }
    }

    return await query<TravelPushbackValues>(travelPushbacksQuery, [requestId]);
  } catch (error) {
    console.error("Error while trying to fetch travel push-backs:", error);
    return [];
  }
}
