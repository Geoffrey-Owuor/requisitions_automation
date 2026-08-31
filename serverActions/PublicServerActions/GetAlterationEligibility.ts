"use server";
import { getAdvanceFormSession } from "@/lib/advanceVerificationSession";
import {
  getAlterationCandidates,
  AlterationCandidate,
} from "@/lib/salaryAdvanceRules";
import { MessageResponse } from "./SubmitAdvanceForm";

export interface AlterationEligibilityResponse extends MessageResponse {
  candidates?: AlterationCandidate[];
}

export async function GetAlterationEligibility(): Promise<AlterationEligibilityResponse> {
  try {
    const verifiedStaff = await getAdvanceFormSession();

    if (!verifiedStaff) {
      return {
        type: "error",
        message:
          "Your verification session has expired. Please verify your email again.",
      };
    }

    const candidates = await getAlterationCandidates(
      verifiedStaff.staffNumber,
    );

    return {
      type: "success",
      message: "",
      candidates,
    };
  } catch (error) {
    console.error("Error fetching alteration eligibility:", error);
    return {
      type: "error",
      message:
        "An internal server error occurred while checking your eligibility.",
    };
  }
}
