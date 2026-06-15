"use server";
import { query } from "@/lib/db";

export type ITStageLevels = "hod" | "it" | "user";

interface ITApproverLinkProps {
  email: string;
  uuid: string;
  stage: ITStageLevels;
}

export async function getITApproverLink({
  email,
  uuid,
  stage,
}: ITApproverLinkProps): Promise<string> {
  const baseQuery = `SELECT ${stage}_uuid AS token 
                     FROM ${stage}_array WHERE ${stage}_email = $1 LIMIT 1`;

  try {
    const result = await query(baseQuery, [email]);

    const token = result[0].token;

    // Construct the link
    const approvalLink = `/itapproval/${uuid}?token=${token}&stage=${stage}`;

    return approvalLink;
  } catch (error) {
    console.error("Error while trying to get an approver token:", error);
    return "#";
  }
}
