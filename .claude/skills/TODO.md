<!-- TODO.md file -->

I read .claude/skills/CHANGES.md. It asks for a one-time Excel import of past Employee Requisitions, and I've written a proposal for it below. I haven't changed any code.

How it would work

Where it lives: a standalone script folder, scripts/import-employee-requisitions/, run on the server. It is not a Settings tab. A one-off import doesn't justify a permanent page, role and server action that we'd have to keep secure and maintain. The script is plain Node 24 code using pg and exceljs, which the app already depends on. It can't import the lib/ modules because of the @/ aliases and server-only, so it checks values directly against the database and copies the few small formatting helpers it needs. After the import has run and been checked, we can delete the folder in a later commit, and git history keeps it.

It has three commands:

1. template builds the Excel template from the live database, so its dropdowns list the real departments, job grades and statuses.
2. validate <file> is a dry run that writes nothing. It produces <file>.errors.xlsx, a copy of the sheet with each bad cell highlighted and a reason column.
3. import <file> --commit re-runs every check, then writes everything in one transaction under one import_batch_id. Any error means nothing is written, and it sends no emails.

Migration 036_employee_requisition_import.sql adds three columns to employee_requisitions:

- imported_at
- import_batch_id
- legacy_reference, with a unique index where it isn't NULL, so running the same file twice can't create duplicates.

Undoing an import is one statement: DELETE … WHERE import_batch_id = $1, and the cascade removes the positions with it.

The template

It's a single data sheet with one row per position. Rows sharing a Legacy Ref belong to one requisition, and the requisition-level fields must be identical on each of those rows. This is much easier to fill in than linked header and position sheets. The workbook has four sheets:

- Instructions: what each column means, which are required, accepted values, date format, and a worked example covering two requisitions and three positions.
- Requisitions: the data, with the header row frozen and dropdown validation.
- Lists: the active and inactive departments, job grades and stage decisions that feed the dropdowns.
- Example: a filled-in sample to copy from.

Requisition columns (repeated on each position row):

┌────────────────────────────────────────────┬────────────────────────────────────────────┐
│ Column │ Rule │
├────────────────────────────────────────────┼────────────────────────────────────────────┤
│ Legacy Ref*│ Unique per requisition; groups its │
│ │ positions │
├────────────────────────────────────────────┼────────────────────────────────────────────┤
│ Submitted Date* │ A valid date, not in the future │
├────────────────────────────────────────────┼────────────────────────────────────────────┤
│ Submitter Name*/ Submitter Email* │ Email format, stored lowercase │
├────────────────────────────────────────────┼────────────────────────────────────────────┤
│ Department*│ Must exist in base_departments (an │
│ │ inactive department is allowed) │
├────────────────────────────────────────────┼────────────────────────────────────────────┤
│ Approval Order* │ "HR before CEO" or "CEO before HR" → │
│ │ hr_before_director │
├────────────────────────────────────────────┼────────────────────────────────────────────┤
│ HOD, Retail Director, HR, CEO: Decision / │ See the rules below │
│ Name / Email / Date / Comments │ │
└────────────────────────────────────────────┴────────────────────────────────────────────┘

Position columns:

┌───────────────────────┬─────────────────────────────────────────────────────────────────┐
│ Column │ Rule │
├───────────────────────┼─────────────────────────────────────────────────────────────────┤
│ Position Title*│ Up to 100 characters │
├───────────────────────┼─────────────────────────────────────────────────────────────────┤
│ Number Required* │ Whole number, at least 1 │
├───────────────────────┼─────────────────────────────────────────────────────────────────┤
│ Replacement/New*│ Dropdown │
├───────────────────────┼─────────────────────────────────────────────────────────────────┤
│ Job Grade* │ Must match a job_grades name (inactive allowed); the rank is │
│ │ stored the same way the app stores it │
├───────────────────────┼─────────────────────────────────────────────────────────────────┤
│ Salary Min*/ Salary │ Numbers, 0 < min ≤ max, stored as "min - max" │
│ Max* │ │
├───────────────────────┼─────────────────────────────────────────────────────────────────┤
│ Justification*│ Required │
├───────────────────────┼─────────────────────────────────────────────────────────────────┤
│ Reporting To* │ Up to 100 characters │
├───────────────────────┼─────────────────────────────────────────────────────────────────┤
│ Target Fill Date\* │ Any date (the "today or later" form rule doesn't apply to past │
│ │ data) │
└───────────────────────┴─────────────────────────────────────────────────────────────────┘

Checks on the approval stages:

- Each Decision is Approved, Declined, N/A (Retail Director only) or blank, meaning the stage was never reached.
- Following the chosen Approval Order, the stages that were decided must come in sequence:
  - Stages stop at the first Declined, and the stages after it are stored as pending, the same way a live decline leaves them.
  - Either every stage is Approved, or there is a Declined. Pending requisitions are refused, because no emails go out and one would sit in a queue with no one notified.
- A decided stage needs an approver name, email and date. Dates must not go backwards and must not be earlier than the submission date.
- employee_hod_actioned_by_email is set to the HOD email.
- Retail Director N/A is checked against the department's requires_retail_director flag. A mismatch is a warning, not an error, since department flags may have changed over time.
- Dates without a time are stored as midnight Nairobi time, written in the database session time zone so createdInRange and the analytics turnaround figures still work.

Other areas affected

1. Amendments: this must be fixed. isEmployeeAmendable treats a declined requisition as amendable. Without a guard, a submitter could amend a two-year-old declined requisition, which would reopen it in the live approval chain and send emails. Imported rows would be blocked in three places: GetEmployeeAmendmentContext, the submitamendment route, and the Amend button in EmployeeDetailsModal.
2. Attachments: past requisitions probably have no Job Description, KPIs or Org Chart files. Nothing in the database requires them, but AttachmentTypeGroups would show an empty area. The details modal, the employeeview page and the approval page would show "Imported record — no documents" instead.
3. Labelling: an "Imported" badge in the dashboard table and details modal. The Employee report would gain "Imported" and "Legacy Ref" columns.
4. Where imported rows will appear, as intended:
   - submitters' "My Requisitions", matched by email;
   - HOD history, through employee_hod_email;
   - each later stage's history, for every member of that stage's approver list;
   - Reports;
   - Employee Analytics;
   - the "department at a glance" panel on the approval page.

   One side effect: past declines will show in turnaround and decline-rate figures.

5. Not affected: approval links, which would show AlreadyProcessed; pending-work checks, since imported rows are never pending; and the approver lists.

Commit phases

I'd do this in three commits, each one after you've checked it:

1. Migration 036, plus the amendment guard and the "Imported" labels in the UI.
2. The import script folder, with its template and validate commands and a README.
3. The import --commit command and the undo-by-batch instructions.

Right now the only uncommitted changes are under .claude/skills/: CHANGES.md edited, CHANGES2.md edited and CHANGES_PLAN.md deleted. They'd go in a separate housekeeping commit, or I'll leave them out if you'd rather.

Before I write the plan, I need to know

- Do the past records have emails for submitters and approvers, or only names? If only names, I'd make the emails optional. The rows would then not show in anyone's "My Requisitions" or HOD history.
- Which approval order did the old process use? I'm suggesting a per-requisition column, but if it was always one order, I'd fix that order and drop the column.
- Are any past requisitions still pending? I'm suggesting they be refused, and submitted again through the app instead.
- Do you have the old documents, and should they be imported? This could be an optional file-name column pointing to a folder next to the Excel file, which the script would copy into UPLOAD_DIRECTORY.

Once you answer, I'll write the agreed plan to CHANGES_PLAN.md, the same way as last time, and start phase 1.
