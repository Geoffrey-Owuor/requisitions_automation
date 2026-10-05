// Amendment history for employee requisitions - shared by the dashboard
// modal, the read-only view, the approval page, the amend form and the
// email template. The write path is
// app/api/employeerequisition/submitamendment/route.ts.

import { EmployeeAttachmentType } from "@/public/assets";

export interface EmployeeAmendmentAttachmentChange {
  attachmentType: EmployeeAttachmentType;
  changeType: "added" | "replaced" | "removed";
  // Always an archived attachment (served with ?archived=1)
  previousAttachmentId: string | null;
  previousFilename: string | null;
  newAttachmentId: string | null;
  newFilename: string | null;
  // True once a later amendment replaced/removed the new file in turn
  newArchived: boolean;
}

export interface EmployeeAmendmentPositionValues {
  positionTitle: string;
  changeType: "added" | "removed" | "modified";
  previousTitle: string | null;
  newTitle: string | null;
  previousNumberRequired: number | null;
  newNumberRequired: number | null;
  previousReplacementOrNew: string | null;
  newReplacementOrNew: string | null;
  previousJobGrade: string | null;
  newJobGrade: string | null;
  previousSalaryRange: string | null;
  newSalaryRange: string | null;
  previousJustification: string | null;
  newJustification: string | null;
  previousReportingTo: string | null;
  newReportingTo: string | null;
  previousDateFilled: string | null;
  newDateFilled: string | null;
  attachments: EmployeeAmendmentAttachmentChange[];
}

export interface EmployeeAmendmentValues {
  amendmentid: string;
  amendmentnumber: number;
  amendedbyname: string;
  amendedbyemail: string;
  amendmentreason: string;
  createdat: string;
  previousdepartment: string | null;
  newdepartment: string | null;
  previoushodapprover: string | null;
  newhodapprover: string | null;
  previoustotalpositions: number;
  newtotalpositions: number;
  previoustotalrequired: number;
  newtotalrequired: number;
  nullifiedhodstatus: string | null;
  nullifiedretaildirectorstatus: string | null;
  nullifieddirectorstatus: string | null;
  nullifiedhrstatus: string | null;
  positions: EmployeeAmendmentPositionValues[];
}

export const employeeAmendmentsQuery = `
  SELECT
    a.amendment_id AS amendmentid,
    a.amendment_number AS amendmentnumber,
    a.amended_by_name AS amendedbyname,
    a.amended_by_email AS amendedbyemail,
    a.amendment_reason AS amendmentreason,
    a.created_at AS createdat,
    a.previous_department AS previousdepartment,
    a.new_department AS newdepartment,
    a.previous_hod_approver AS previoushodapprover,
    a.new_hod_approver AS newhodapprover,
    a.previous_total_positions AS previoustotalpositions,
    a.new_total_positions AS newtotalpositions,
    a.previous_total_required AS previoustotalrequired,
    a.new_total_required AS newtotalrequired,
    a.nullified_hod_status AS nullifiedhodstatus,
    a.nullified_retail_director_status AS nullifiedretaildirectorstatus,
    a.nullified_director_status AS nullifieddirectorstatus,
    a.nullified_hr_status AS nullifiedhrstatus,
    COALESCE(
      (SELECT json_agg(json_build_object(
          'positionTitle', p.position_title,
          'changeType', p.change_type,
          'previousTitle', p.previous_title,
          'newTitle', p.new_title,
          'previousNumberRequired', p.previous_number_required,
          'newNumberRequired', p.new_number_required,
          'previousReplacementOrNew', p.previous_replacement_or_new,
          'newReplacementOrNew', p.new_replacement_or_new,
          'previousJobGrade', p.previous_job_grade,
          'newJobGrade', p.new_job_grade,
          'previousSalaryRange', p.previous_salary_range,
          'newSalaryRange', p.new_salary_range,
          'previousJustification', p.previous_justification,
          'newJustification', p.new_justification,
          'previousReportingTo', p.previous_reporting_to,
          'newReportingTo', p.new_reporting_to,
          'previousDateFilled', TO_CHAR(p.previous_date_filled, 'YYYY-MM-DD'),
          'newDateFilled', TO_CHAR(p.new_date_filled, 'YYYY-MM-DD'),
          'attachments', COALESCE(
            (SELECT json_agg(json_build_object(
                'attachmentType', x.attachment_type,
                'changeType', x.change_type,
                'previousAttachmentId', x.previous_attachment_id,
                'previousFilename', x.previous_filename,
                'newAttachmentId', x.new_attachment_id,
                'newFilename', x.new_filename,
                'newArchived', EXISTS (
                  SELECT 1 FROM employee_requisition_archived_attachments z
                  WHERE z.attachment_id = x.new_attachment_id)
              ) ORDER BY x.attachment_type)
             FROM employee_requisition_amendment_attachments x
             WHERE x.amendment_position_id = p.amendment_position_id),
            '[]'::json)
        ) ORDER BY p.change_type, p.position_title)
       FROM employee_requisition_amendment_positions p
       WHERE p.amendment_id = a.amendment_id),
      '[]'::json
    ) AS positions
  FROM employee_requisition_amendments a
  WHERE a.request_id = $1
  ORDER BY a.amendment_number ASC
`;
