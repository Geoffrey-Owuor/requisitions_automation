"use server";
import { query } from "@/lib/db";
import { TravelStageLevels } from "@/components/Dashboard/TravelDetailsModal";
import { getSession } from "@/lib/session";

interface TravelApproverLinkProps {
  email: string;
  uuid: string;
  stage: TravelStageLevels;
}

export async function getTravelApproverLink({
  email,
  uuid,
  stage,
}: TravelApproverLinkProps): Promise<string> {
  const user = await getSession();
  if (!user) return "#";

  const baseQuery = `SELECT ${stage}_uuid AS token 
                     FROM ${stage}_array WHERE ${stage}_email = $1 LIMIT 1`;

  try {
    const result = await query(baseQuery, [email]);

    const token = result[0].token;

    // Construct the link
    const approvalLink = `/travelapproval/${uuid}?token=${token}&stage=${stage}`;

    return approvalLink;
  } catch (error) {
    console.error("Error while trying to get an approver token:", error);
    return "#";
  }
}
