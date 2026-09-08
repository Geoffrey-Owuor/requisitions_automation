"use server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/session";
import { HrForm } from "@/public/assets";
import {
  EMPTY_MEMBERSHIPS,
  type ApproverMemberships,
} from "@/lib/approverMemberships";

export async function getApproverMemberships(): Promise<ApproverMemberships> {
  const session = await getSession();
  if (!session) return EMPTY_MEMBERSHIPS;

  try {
    const [security, it, director, retailDirector, hr] = await Promise.all([
      query<{ security_email: string }>(
        "SELECT security_email FROM security_array WHERE security_email = $1",
        [session.email],
      ),
      query<{ it_email: string }>(
        "SELECT it_email FROM it_array WHERE it_email = $1",
        [session.email],
      ),
      query<{ director_email: string }>(
        "SELECT director_email FROM director_array WHERE director_email = $1",
        [session.email],
      ),
      query<{ retail_director_email: string }>(
        "SELECT retail_director_email FROM retail_director_array WHERE retail_director_email = $1",
        [session.email],
      ),
      query<{ hr_forms: HrForm[] }>(
        "SELECT hr_forms FROM hr_array WHERE hr_email = $1",
        [session.email],
      ),
    ]);

    return {
      isSecurityApprover: security.length > 0,
      isITApprover: it.length > 0,
      isDirector: director.length > 0,
      isRetailDirector: retailDirector.length > 0,
      hrForms: hr[0]?.hr_forms ?? [],
    };
  } catch (error) {
    console.error("Error while trying to fetch approver memberships:", error);
    return EMPTY_MEMBERSHIPS;
  }
}
