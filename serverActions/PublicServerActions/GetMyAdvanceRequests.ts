"use server";
import { query } from "@/lib/db";
import { getAdvanceFormSession } from "@/lib/advanceVerificationSession";
import { INSTALLMENT_PROGRESS_SQL } from "@/lib/salaryAdvanceRules";
import { MessageResponse } from "./SubmitAdvanceForm";

export interface AdvanceAlterationSummary {
  alterationType: string;
  previousRequestType: string | null;
  newRequestType: string | null;
  previousInstallments: number | null;
  newInstallments: number | null;
  createdAt: string;
}

export interface MyAdvanceRequest {
  requestId: string;
  requestCreatedAt: string;
  requestType: string;
  requestAmount: number;
  noOfInstallments: number;
  repaymentStartDate: string;
  approvalStatus: string;
  approverComments: string;
  exported: boolean;
  elapsedInstallments: number;
  remainingInstallments: number;
  alterations: AdvanceAlterationSummary[];
}

export interface MyAdvanceRequestsResponse extends MessageResponse {
  requests?: MyAdvanceRequest[];
}

interface MyAdvanceRequestRow {
  request_id: string;
  request_created_at: string;
  request_type: string;
  request_amount: number;
  no_of_installments: number;
  repayment_start_date: string;
  approval_status: string;
  approver_comments: string;
  exported: boolean;
  elapsed_installments: number;
  remaining_installments: number;
  alterations: AdvanceAlterationSummary[];
}

// The staff member's full salary advance history (including declined
// requests, unlike lib/salaryAdvanceRules's getActiveAdvances) plus any
// self-service alterations applied to each — for the "Modify Existing
// Request" toggle's read-only history view.
export async function GetMyAdvanceRequests(): Promise<MyAdvanceRequestsResponse> {
  try {
    const verifiedStaff = await getAdvanceFormSession();

    if (!verifiedStaff) {
      return {
        type: "error",
        message:
          "Your verification session has expired. Please verify your email again.",
      };
    }

    const rows = await query<MyAdvanceRequestRow>(
      `
      SELECT
        sa.request_id, sa.request_created_at, sa.request_type, sa.request_amount,
        sa.no_of_installments, sa.repayment_start_date, sa.approval_status,
        sa.approver_comments, sa.exported,
        ${INSTALLMENT_PROGRESS_SQL},
        COALESCE(alt.alterations, '[]'::json) AS alterations
      FROM salary_advances sa
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'alterationType', a.alteration_type,
          'previousRequestType', a.previous_request_type,
          'newRequestType', a.new_request_type,
          'previousInstallments', a.previous_installments,
          'newInstallments', a.new_installments,
          'createdAt', a.created_at
        ) ORDER BY a.created_at) AS alterations
        FROM salary_advance_alterations a WHERE a.request_id = sa.request_id
      ) alt ON TRUE
      WHERE sa.staff_number = $1
      ORDER BY sa.request_created_at DESC
      `,
      [verifiedStaff.staffNumber],
    );

    const requests: MyAdvanceRequest[] = rows.map((row) => ({
      requestId: row.request_id,
      requestCreatedAt: row.request_created_at,
      requestType: row.request_type,
      requestAmount: row.request_amount,
      noOfInstallments: row.no_of_installments,
      repaymentStartDate: row.repayment_start_date,
      approvalStatus: row.approval_status,
      approverComments: row.approver_comments,
      exported: row.exported,
      elapsedInstallments: row.elapsed_installments,
      remainingInstallments: row.remaining_installments,
      alterations: row.alterations,
    }));

    return { type: "success", message: "", requests };
  } catch (error) {
    console.error("Error fetching salary advance history:", error);
    return {
      type: "error",
      message:
        "An internal server error occurred while loading your request history.",
    };
  }
}
