"use server";
import { query } from "@/lib/db";
import { TravelStageLevels } from "@/components/Dashboard/TravelDetailsModal";
import { getSession } from "@/lib/session";
import { isValidTravelStage } from "@/public/assets";

interface TravelApproverLinkProps {
  uuid: string;
  stage: TravelStageLevels;
  // "pushback" opens the HR stage in push-back mode (HR reversing its own
  // recorded decision) - see PushbackTravelHrDecision.
  mode?: "pushback";
}

export async function getTravelApproverLink({
  uuid,
  stage,
  mode,
}: TravelApproverLinkProps): Promise<string> {
  const user = await getSession();
  if (!user) return "#";

  // stage is interpolated into the query below - never trust it unchecked
  if (!isValidTravelStage(stage)) return "#";
  if (mode === "pushback" && stage !== "hr") return "#";

  // The token is always resolved for the signed-in user, never for a
  // client-supplied email.
  const baseQuery = `SELECT ${stage}_uuid AS token
                     FROM ${stage}_array WHERE ${stage}_email = $1 LIMIT 1`;

  try {
    const result = await query(baseQuery, [user.email]);

    if (result.length === 0) return "#";

    const token = result[0].token;

    // Construct the link
    const approvalLink = `/travelapproval/${uuid}?token=${token}&stage=${stage}${mode === "pushback" ? "&mode=pushback" : ""}`;

    return approvalLink;
  } catch (error) {
    console.error("Error while trying to get an approver token:", error);
    return "#";
  }
}
