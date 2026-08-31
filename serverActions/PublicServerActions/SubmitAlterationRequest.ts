"use server";
import { query } from "@/lib/db";
import { getAdvanceFormSession } from "@/lib/advanceVerificationSession";
import { getAlterationCandidates, AlterationType } from "@/lib/salaryAdvanceRules";
import { MessageResponse } from "./SubmitAdvanceForm";

export interface AlterationRequestInput {
  requestId: string;
  alterationType: AlterationType;
  newInstallments?: number;
}

export async function SubmitAlterationRequest(
  input: AlterationRequestInput,
): Promise<MessageResponse> {
  try {
    const verifiedStaff = await getAdvanceFormSession();

    if (!verifiedStaff) {
      return {
        type: "error",
        message:
          "Your verification session has expired. Please verify your email again.",
      };
    }

    // Never trust client-supplied eligibility — recompute it against the
    // staff's own active requests before applying anything.
    const candidates = await getAlterationCandidates(
      verifiedStaff.staffNumber,
    );
    const candidate = candidates.find(
      (item) =>
        item.requestId === input.requestId &&
        item.alterationType === input.alterationType,
    );

    if (!candidate) {
      return {
        type: "error",
        message:
          "This request is no longer eligible for the alteration requested. Please refresh and try again.",
      };
    }

    if (input.alterationType === "switch_to_oneoff") {
      await query(
        `UPDATE salary_advances SET request_type = 'oneoff' WHERE request_id = $1`,
        [candidate.requestId],
      );

      // Only log the alteration if the request had already gone out in a
      // prior export — otherwise there's nothing to reconcile yet, the
      // updated row itself will be picked up by the next export as-is.
      if (candidate.exported) {
        await query(
          `INSERT INTO salary_advance_alterations
            (request_id, alteration_type, previous_request_type, new_request_type)
           VALUES ($1, $2, $3, $4)`,
          [candidate.requestId, "switch_to_oneoff", "continuous", "oneoff"],
        );
      }
    } else if (input.alterationType === "reduce_installments") {
      const newInstallments = input.newInstallments;
      if (
        !newInstallments ||
        !candidate.installmentOptions.includes(newInstallments)
      ) {
        return {
          type: "error",
          message: "Please select a valid reduced installment period.",
        };
      }

      await query(
        `UPDATE salary_advances SET no_of_installments = $1 WHERE request_id = $2`,
        [newInstallments, candidate.requestId],
      );

      if (candidate.exported) {
        await query(
          `INSERT INTO salary_advance_alterations
            (request_id, alteration_type, previous_installments, new_installments)
           VALUES ($1, $2, $3, $4)`,
          [
            candidate.requestId,
            "reduce_installments",
            candidate.noOfInstallments,
            newInstallments,
          ],
        );
      }
    } else {
      // delete_request — only ever offered while pending review and
      // unexported; re-verify both server-side before deleting outright.
      if (candidate.approvalStatus !== "pending" || candidate.exported) {
        return {
          type: "error",
          message:
            "This request is no longer eligible for deletion. Please refresh and try again.",
        };
      }

      await query(`DELETE FROM salary_advances WHERE request_id = $1`, [
        candidate.requestId,
      ]);

      return {
        type: "success",
        message: "Your salary advance request has been deleted.",
      };
    }

    return {
      type: "success",
      message: "Your alteration request has been applied successfully.",
    };
  } catch (error) {
    console.error("Error submitting alteration request:", error);
    return {
      type: "error",
      message:
        "An internal server error occurred while processing your request.",
    };
  }
}
