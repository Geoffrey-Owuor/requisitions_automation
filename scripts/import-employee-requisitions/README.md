# Employee Requisition import (one-time)

Imports Employee Requisitions from before the Apps Hub, from an Excel file, into `employee_requisitions` and `employee_requisition_positions`. Delete this folder once the import has been run and checked (git history keeps it).

Imported requisitions are history only. They are marked by `imported_at` (migration `036_employee_requisition_import.sql`, which must run first), show an "Imported" badge, can't be amended, have no documents, send no emails, and are left out of the analytics average days to a decision.

## Running it

The script is plain Node (24+) using the app's own `pg` and `exceljs`. It connects with the same `DATABASE_*` variables as the app, loaded with `--env-file`: `.env.local` in development, or whichever env file the server's app uses. Run it from the repo root:

```sh
node --env-file=.env.local scripts/import-employee-requisitions/index.mjs template employee-requisitions-import.xlsx
node --env-file=.env.local scripts/import-employee-requisitions/index.mjs validate employee-requisitions-import.xlsx
```

1. **`template [output.xlsx]`** builds the Excel template from the database, so its dropdowns list the real departments and job grades. It has an Instructions sheet (every column, the rules, and a worked example), the Requisitions sheet to fill in, and a Lists sheet.
2. **`validate <file.xlsx>`** checks a filled-in file and writes nothing to the database. It prints the first problems, and when there are any, saves `<file>.errors.xlsx`: a copy with each problem cell filled (red: error, yellow: warning) with the reason as a note, an Issues column per row, and an Issues sheet listing everything. Fix the original (or the report itself, which validating again updates in place) until there are no errors.

## The rules

- One row per position; rows with the same Legacy Ref are one requisition. A requisition's columns (pink and blue headers) come from its first row; later rows leave them blank or repeat them exactly.
- Legacy Refs are unique, also against earlier imports (case-insensitively).
- Dates are real Excel dates or `YYYY-MM-DD` text, never ambiguous text like `03/04/2023`. Submission and approval dates may have a time, aren't in the future, and approval dates don't go backwards.
- Department and Job Grade must exist (inactive ones allowed); the grade's current rank is stored, like a live submission.
- Approvals follow the row's Approval Order (`HR before CEO` sets `hr_before_director`). Every stage is decided up to the final approval or the first decline, so pending requisitions are refused: no one would be notified about them. Stages after a decline are blank and stored `pending` (Retail Director `N/A` when the department doesn't use one), the way a live decline leaves them.
- A decided stage needs a name, email and date; an undecided one has none.
- Retail Director `N/A` is compared with today's department flag, only as a warning.
- Errors block the import; warnings don't.

## Files

- `index.mjs`: the commands
- `columns.mjs`: the template's columns, stages and accepted values
- `cells.mjs`: reading Excel cells as text, dates and numbers
- `validate.mjs`: the checks, producing the rows to store
- `report.mjs`: the `.errors.xlsx` report
- `template.mjs`: the template
- `db.mjs`: the connection and the department/job grade lookups

A few small helpers are copied from the app (the script can't import `lib/` because of the `@/` aliases and `server-only`); each names its source.
