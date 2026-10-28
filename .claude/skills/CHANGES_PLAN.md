<!-- Agreed plan for the one-time Employee Requisition import (from TODO.md + review, 2026-10-28) -->

# One-time Excel import of past Employee Requisitions

## Decisions

- **Where:** standalone `scripts/import-employee-requisitions/` (plain Node 24, `pg` + `exceljs`), run on the server, deleted in a later commit once the import is checked. Not a Settings tab. Loads the app's `.env` via `node --env-file`. Copied helpers carry a comment naming their source (e.g. `formatSalaryRange` in `public/assets.ts`).
- **Commands:** `template` (built from the live DB), `validate <file>` (dry run, writes `<file>.errors.xlsx` with highlighted cells and a reason column), `import <file> --commit` (re-validates, one transaction, one `import_batch_id`, no emails; any error writes nothing).
- **Emails required:** submitter email and the email of every decided stage, stored lowercase.
- **Approval order:** per-row "Approval Order" column (HR before CEO / CEO before HR), mapped to `hr_before_director`.
- **Pending refused:** every row must be fully approved or contain a decline; pending requisitions are resubmitted through the app.
- **No documents:** no attachment import; imported records show "Imported record — no documents".
- **Analytics:** imported rows count in volumes, approvals and declines, but are excluded from turnaround / days-to-decision figures (`imported_at IS NULL`). Reports still show their dates.

## Migration 036_employee_requisition_import.sql

`employee_requisitions` gains `imported_at`, `import_batch_id`, `legacy_reference` (unique index where not NULL). Undo = `DELETE FROM employee_requisitions WHERE import_batch_id = $1` (positions cascade).

## Template

One row per position; rows sharing a Legacy Ref form one requisition, and their requisition-level fields must be identical. Sheets: **Instructions** (columns, required fields, accepted values, date format, worked example), **Requisitions** (frozen header, dropdowns), **Lists** (departments, job grades, decisions; inactive ones included).

Requisition columns: Legacy Ref*, Submitted Date*, Submitter Name*, Submitter Email*, Department* (exists in `base_departments`, inactive allowed), Approval Order*, and per stage (HOD, Retail Director, HR, CEO): Decision / Name / Email / Date / Comments.

Position columns: Position Title* (≤100), Number Required* (integer ≥1), Replacement/New*, Job Grade* (a `job_grades` name, inactive allowed; rank stored as the app does), Salary Min*/Max* (0 < min ≤ max, stored `"min - max"`), Justification*, Reporting To* (≤100), Target Fill Date* (any date).

## Validation rules

- Dates: real Excel date cells or ISO text (`YYYY-MM-DD`) only; ambiguous text like `03/04/2024` is rejected. ExcelJS date cells are read as calendar dates (they arrive as UTC), then stored as midnight Nairobi in the DB session time zone.
- Submitted Date not in the future.
- Decision: Approved, Declined, N/A (Retail Director only) or blank (never reached).
- In the row's approval order, decided stages are contiguous; stages after the first Declined are stored `pending`, as a live decline leaves them; otherwise every stage is Approved.
- A decided stage needs name, email and date; dates don't go backwards and aren't before submission.
- Retail Director N/A vs the department's `requires_retail_director` flag: warning, not error.
- Duplicate Legacy Ref (in the file or already in the DB) is an error.
- Stored values match the live app: lowercase `approved`/`declined`/`pending`, `N/A`, `employee_hod_actioned_by_email` = HOD email, `amendment_count = 0`, `last_amended_at = NULL`, `position_created_at` = submitted date.

## App changes

1. **Amendment guard** in `isEmployeeAmendable` itself (add `imported` to `EmployeeChainStatuses`), so `GetEmployeeAmendmentContext`, the submitamendment route and `EmployeeDetailsModal` share it; imported rows get their own not-amendable message.
2. **No documents** note in the details modal and `employeeview` (the approval page never shows details for imported rows: `AlreadyProcessed`, or `StageNotReached` after a decline).
3. **Labels:** "Imported" badge in the dashboard table and details modal; Employee report gains "Imported" and "Legacy Ref" columns.
4. **Analytics:** turnaround / days-to-decision queries exclude imported rows.

Imported rows appear (as intended) in submitters' My Requisitions, HOD history, each later stage's history, Reports, Analytics and the approval page's department overview. Not affected: approval links, pending-work checks, approver lists.

## Phases (one commit each, verified before committing)

0. Housekeeping commit for the `.claude/skills/` and `CLAUDE.md` changes already in the working tree.
1. Migration 036, amendment guard, no-documents note, Imported labels, report columns, analytics turnaround exclusion. Verified with a hand-inserted imported row in the dev DB (deleted afterwards). Must be deployed before the import runs in production.
2. Script folder with `template` and `validate` commands and a README.
3. `import --commit`, plus undo-by-batch instructions in the README.
