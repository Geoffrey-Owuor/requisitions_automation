import "server-only";
import { query } from "@/lib/db";

export interface ActiveAdvanceRow {
  request_id: string;
  request_type: string;
  request_amount: number;
  no_of_installments: number;
  repayment_start_date: string;
  elapsed_installments: number;
  remaining_installments: number;
}

// Months elapsed and remaining are computed in SQL (AGE against
// repayment_start_date) so the same definition is used everywhere a
// request's installment period needs to be evaluated.
const ACTIVE_ADVANCES_QUERY = `
  SELECT
    request_id,
    request_type,
    request_amount,
    no_of_installments,
    repayment_start_date,
    (EXTRACT(YEAR FROM AGE(CURRENT_DATE, repayment_start_date)) * 12
      + EXTRACT(MONTH FROM AGE(CURRENT_DATE, repayment_start_date)))::int AS elapsed_installments,
    (no_of_installments - (EXTRACT(YEAR FROM AGE(CURRENT_DATE, repayment_start_date)) * 12
      + EXTRACT(MONTH FROM AGE(CURRENT_DATE, repayment_start_date))))::int AS remaining_installments
  FROM salary_advances
  WHERE staff_number = $1 AND approval_status != 'declined'
  ORDER BY request_created_at DESC
`;

async function getActiveAdvances(staffNumber: string) {
  return query<ActiveAdvanceRow>(ACTIVE_ADVANCES_QUERY, [staffNumber]);
}

export interface BlockingAdvance {
  requestId: string;
  requestType: "continuous" | "oneoff";
  repaymentStartDate: string;
  noOfInstallments: number;
}

// A staff member cannot submit a new request while they have:
// - any active continuous request (it never completes), or
// - an active one-off request whose installment period hasn't elapsed yet.
export async function getBlockingActiveAdvance(
  staffNumber: string,
): Promise<BlockingAdvance | null> {
  const activeAdvances = await getActiveAdvances(staffNumber);

  const continuousRequest = activeAdvances.find(
    (row) => row.request_type === "continuous",
  );
  if (continuousRequest) {
    return {
      requestId: continuousRequest.request_id,
      requestType: "continuous",
      repaymentStartDate: continuousRequest.repayment_start_date,
      noOfInstallments: continuousRequest.no_of_installments,
    };
  }

  const unfinishedOneoff = activeAdvances.find(
    (row) => row.request_type === "oneoff" && row.remaining_installments > 0,
  );
  if (unfinishedOneoff) {
    return {
      requestId: unfinishedOneoff.request_id,
      requestType: "oneoff",
      repaymentStartDate: unfinishedOneoff.repayment_start_date,
      noOfInstallments: unfinishedOneoff.no_of_installments,
    };
  }

  return null;
}

export type AlterationType = "switch_to_oneoff" | "reduce_installments";

export interface AlterationCandidate {
  requestId: string;
  requestType: "continuous" | "oneoff";
  requestAmount: number;
  noOfInstallments: number;
  repaymentStartDate: string;
  alterationType: AlterationType;
  // For "reduce_installments": the installment counts the staff may switch to.
  installmentOptions: number[];
}

// Requests eligible for a self-service alteration:
// - continuous -> always eligible to switch to one-off
// - oneoff -> eligible to reduce installments only if more than one
//   installment remains (nothing left to shorten otherwise)
export async function getAlterationCandidates(
  staffNumber: string,
): Promise<AlterationCandidate[]> {
  const activeAdvances = await getActiveAdvances(staffNumber);

  const candidates: AlterationCandidate[] = [];

  for (const row of activeAdvances) {
    if (row.request_type === "continuous") {
      candidates.push({
        requestId: row.request_id,
        requestType: "continuous",
        requestAmount: row.request_amount,
        noOfInstallments: row.no_of_installments,
        repaymentStartDate: row.repayment_start_date,
        alterationType: "switch_to_oneoff",
        installmentOptions: [],
      });
      continue;
    }

    if (row.request_type === "oneoff" && row.remaining_installments > 1) {
      const elapsed = Math.max(row.elapsed_installments, 0);
      const options: number[] = [];
      for (
        let candidate = elapsed + 1;
        candidate < row.no_of_installments;
        candidate++
      ) {
        options.push(candidate);
      }

      if (options.length > 0) {
        candidates.push({
          requestId: row.request_id,
          requestType: "oneoff",
          requestAmount: row.request_amount,
          noOfInstallments: row.no_of_installments,
          repaymentStartDate: row.repayment_start_date,
          alterationType: "reduce_installments",
          installmentOptions: options,
        });
      }
    }
  }

  return candidates;
}

// Human-readable completion date for a request's installment period, used
// in the blocking error message shown to staff.
export function getInstallmentCompletionDate(
  repaymentStartDate: string,
  noOfInstallments: number,
): Date {
  const start = new Date(repaymentStartDate);
  return new Date(
    start.getFullYear(),
    start.getMonth() + noOfInstallments,
    start.getDate(),
  );
}
