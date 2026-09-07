"use server";

import { pool } from "@/lib/db";
import { PoolClient } from "pg";
import { AlertInfo } from "@/components/TravelRequisitionPage";
import { hodApprovalStage } from "@/utils/EmployeeApprovalStages/hodApprovalStage";
import { retailDirectorApprovalStage } from "@/utils/EmployeeApprovalStages/retailDirectorApprovalStage";
import { directorApprovalStage } from "@/utils/EmployeeApprovalStages/directorApprovalStage";
import { hrApprovalStage } from "@/utils/EmployeeApprovalStages/hrApprovalStage";
import { EmployeeEmailSender } from "@/services/EmployeeEmailSender";
import { isValidEmployeeStage, RETAIL_DEPARTMENT } from "@/public/assets";
import { isDirectorEmail } from "@/utils/isDirectorEmail";
import { isRetailDirectorEmail } from "@/utils/isRetailDirectorEmail";

export type UpdateRequestStatusProps = {
  uuid: string;
  stage: string;
  status: string;
  comments: string;
  approverName: string;
  approverEmail: string;
};

export async function UpdateEmployeeStatus(
  payload: UpdateRequestStatusProps,
): Promise<AlertInfo> {
  if (!isValidEmployeeStage(payload.stage)) {
    return {
      alertType: "error",
      alertMessage: "Invalid approval stage provided",
    };
  }

  let client: PoolClient | undefined;

  // Our base update query and params
  const baseUpdateQuery = `
    UPDATE employee_requisitions
    SET employee_${payload.stage}_approval_date = CURRENT_TIMESTAMP,
    employee_${payload.stage}_approval_status = $1,
    employee_${payload.stage}_approver = $2,
    employee_${payload.stage}_email = $3,
    employee_${payload.stage}_comments = $4
    WHERE request_id = $5
    `;

  //  params
  const baseParams = [
    payload.status,
    payload.approverName,
    payload.approverEmail,
    payload.comments,
    payload.uuid,
  ];

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    // Check if the requisition has already been acted upon
    const { rows: reviewedResult } = await client.query(
      `SELECT employee_${payload.stage}_approval_status AS approval_status,
       employee_${payload.stage}_approver AS approver,
       submitter_email, employee_department, employee_hod_email,
       employee_retail_director_email, employee_director_email,
       employee_director_approval_status AS director_approval_status
        FROM employee_requisitions WHERE request_id = $1 FOR UPDATE`,
      [payload.uuid],
    );

    if (reviewedResult.length === 0) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "The selected requisition for update could not be found, please contact your admin for support",
      };
    }

    // Check if the approver exists in our table array data set. HR approvers
    // are additionally scoped to the forms in their hr_forms allow-list -
    // salary advance never reaches this check, it has its own approver.
    const isHrStage = payload.stage === "hr";
    const { rows: approverResult } = await client.query(
      isHrStage
        ? `SELECT id, hr_forms FROM hr_array WHERE hr_email = $1 FOR UPDATE`
        : `SELECT id FROM ${payload.stage}_array WHERE ${payload.stage}_email = $1 FOR UPDATE`,
      [payload.approverEmail],
    );

    if (approverResult.length === 0) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "Could not verify the current approver, please contact your admin for support",
      };
    }

    if (isHrStage && !approverResult[0].hr_forms.includes("employee")) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "You are not authorized to approve employee requisitions, please contact your admin for support",
      };
    }

    const isReviewed = reviewedResult[0].approval_status;
    const previousApprover = reviewedResult[0].approver;

    // Required stages data
    const userEmail = reviewedResult[0].submitter_email;
    const department = reviewedResult[0].employee_department;
    const hodEmail = reviewedResult[0].employee_hod_email;
    const retailDirectorEmail = reviewedResult[0].employee_retail_director_email;
    const directorEmail = reviewedResult[0].employee_director_email;

    // Retail Director is only part of the chain for Retail-department
    // requisitions - reject action on that stage otherwise, even if a valid
    // retail director approval token is used.
    if (payload.stage === "retail_director" && department !== RETAIL_DEPARTMENT) {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage:
          "This approval stage does not apply to this requisition, no action is required",
      };
    }

    if (isReviewed !== "pending" && isReviewed !== "N/A") {
      await client.query("ROLLBACK");
      return {
        alertType: "error",
        alertMessage: `This requisition has already been acted upon by ${previousApprover}, no further action is required`,
      };
    }

    await client.query(baseUpdateQuery, baseParams);

    // If the approving HOD is also a Retail Director and/or a Director/CEO,
    // auto-approve those stages in the same transaction so the same person
    // is never asked to approve twice under two different roles. Both checks
    // are independent - a person can hold both roles at once.
    let skipRetailDirectorStage = false;
    let skipDirectorStage = false;
    if (payload.stage === "hod" && payload.status === "approved") {
      if (department === RETAIL_DEPARTMENT) {
        skipRetailDirectorStage = await isRetailDirectorEmail(
          client,
          payload.approverEmail,
        );

        if (skipRetailDirectorStage) {
          await client.query(
            `
            UPDATE employee_requisitions
            SET employee_retail_director_approval_date = CURRENT_TIMESTAMP,
            employee_retail_director_approval_status = 'approved',
            employee_retail_director_approver = $1,
            employee_retail_director_email = $2,
            employee_retail_director_comments = 'Automatically approved - the HOD is also a Retail Director, so a separate Retail Director approval is not required'
            WHERE request_id = $3
            `,
            [payload.approverName, payload.approverEmail, payload.uuid],
          );
        }
      }

      skipDirectorStage = await isDirectorEmail(client, payload.approverEmail);

      if (skipDirectorStage) {
        await client.query(
          `
          UPDATE employee_requisitions
          SET employee_director_approval_date = CURRENT_TIMESTAMP,
          employee_director_approval_status = 'approved',
          employee_director_approver = $1,
          employee_director_email = $2,
          employee_director_comments = 'Automatically approved - the HOD is also a Director/CEO, so a separate CEO approval is not required'
          WHERE request_id = $3
          `,
          [payload.approverName, payload.approverEmail, payload.uuid],
        );
      }
    }

    await client.query("COMMIT");

    switch (payload.stage) {
      case "hod":
        hodApprovalStage({
          uuid: payload.uuid,
          userEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
          department,
          skipRetailDirectorStage,
          skipDirectorStage,
        });
        break;
      case "retail_director":
        // The Director/CEO stage may have already been auto-approved when
        // the HOD approved (if the HOD is also a Director/CEO) - forward
        // straight to HR in that case instead of the Director array.
        retailDirectorApprovalStage({
          uuid: payload.uuid,
          userEmail,
          hodEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
          skipDirectorStage:
            reviewedResult[0].director_approval_status === "approved",
        });
        break;
      case "director":
        directorApprovalStage({
          uuid: payload.uuid,
          userEmail,
          hodEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
        });
        break;
      case "hr":
        hrApprovalStage({
          uuid: payload.uuid,
          userEmail,
          hodEmail,
          retailDirectorEmail,
          directorEmail,
          status: payload.status,
          approverEmail: payload.approverEmail,
          approverName: payload.approverName,
        });
        break;
      default:
        EmployeeEmailSender({
          to: process.env.ACCESS_EMAIL_SENDER!,
          requestId: payload.uuid,
          message:
            "A wrong stage was passed in the employee requisition approval workflow for this requistion",
          title: "Wrong stage passed to employee requisition approval workflow",
          role: "user",
        });
        break;
    }

    return {
      alertType: "success",
      alertMessage:
        "This requisition status has been updated successfully, you may now safely close this window",
    };
  } catch (error) {
    await client?.query("ROLLBACK");
    console.error(
      "Error while trying to update the status of this requisition",
      error,
    );
    return {
      alertType: "error",
      alertMessage:
        "An error occured while trying to update the status of this requisition",
    };
  } finally {
    if (client) client.release();
  }
}
