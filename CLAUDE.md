# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — start the production server (`PORT` env var controls the port)
- `npm run lint` — ESLint (flat config, `eslint-config-next`)
- No test suite is configured in this repo (no test script, no test runner in `package.json`).

## Architecture

Hotpoint Apps Hub is an internal Next.js 16 (App Router) portal for submitting/approving requisitions — IT equipment, travel, salary advances, and physical access/keys — plus two SSO-embedded internal systems (IT HelpDesk, Staff Product Purchase).

### Auth & session model

- Sign-in is a manual Microsoft Entra ID OAuth/PKCE flow using `arctic` (`app/api/auth/login`, `app/api/auth/callback`).
- After the Entra callback, the app issues its **own** session: a `jose`-signed JWT in an httpOnly cookie `requisitions_session` (`lib/session.ts`, 7-day expiry). All server-side auth checks read this cookie, not the Entra token.
- Route gating is `proxy.ts` at the repo root, **not** `middleware.ts` — Next.js 16 renamed the convention. It redirects unauthenticated `/dashboard/*` to `/login`, and bounces already-authenticated users away from `/`, `/login`, `/advance`.
- `app/(protected)/dashboard/layout.tsx` is the second gate: re-checks the session, loads roles via `serverActions/GetUserRoles.ts` (Postgres join `users` → `user_roles` → `roles`, defaults to `["user"]`), and wraps children in `UserProvider` (`context/UserContext.tsx`).
- `(approvers)` route group (`accessapproval/[uuid]`, `itapproval/[uuid]`, `travelapproval/[uuid]`) is reached via emailed links and is token-gated per-UUID, independent of the logged-in session — don't assume `getSession()` applies there.

### Route groups (`app/`)

- `(protected)/dashboard` — authenticated area. Nested groups: `(embeddings)` (HelpDesk / Staff Purchase SSO iframes), `(pdfs)` (PDF viewers, e.g. `casualpdf`), plus `advance` (salary advance) and `employeeview` (session-gated, read-only Employee Requisition viewer — no PDF export, so it deliberately lives outside `(pdfs)`).
- `(approvers)` — public, per-UUID approval pages for approvers acting on emailed links (`casualapproval`, `employeeapproval`, etc.).
- `advance/page.tsx` and `login/page.tsx` are public entry points gated by `proxy.ts`.
- `api/` — form submission routes (`{access,it,travel,casual,employee}requisition/submitrequisition`), auth routes, mail triggers, `CRON_SECRET`-gated scheduled triggers (`api/triggers/*`), `REVALIDATE_TAG_KEY`-gated cache revalidation (`api/revalidate-tag`), and `api/employeerequisition/attachment/[attachmentId]` — an authenticated file-streaming route (session or approver-token gated) since Employee Requisition attachments are stored on disk under `UPLOAD_DIRECTORY`, outside `public/`.

### Approval workflows

Each requisition type has its own multi-stage chain under `utils/`:

- `utils/ITApprovalStages/` — hodApprovalStage → itApprovalStage
- `utils/AccessApprovalStages/` — hodApprovalStage → securityApprovalStage
- `utils/TravelApprovalStages/` — hodApprovalStage → hrApprovalStage → directorApprovalStage, tiered by cost (<30K HOD only, 30K–100K +HR, >100K +Director)
- `utils/CasualApprovalStages/` — hodApprovalStage → hrApprovalStage (no Finance stage, no tiering); both stages are array-based (`hod_array`/`hr_array` — any member can act, first click wins) and HR can adjust the final approved headcount per section. On HR approval, a generated PDF summary is attached to the HR approver's confirmation email and to a notification sent to the external casual-labor provider (`EXTERNAL_CASUAL_PROVIDER`); `loadFinanceArray()` in `lib/loadAppDataV2.ts` is kept but unused by this flow
- `utils/EmployeeApprovalStages/` — hodApprovalStage → directorApprovalStage → hrApprovalStage, always all three stages; CEO and HR stages are array-based (`director_array`/`hr_array`, reused from Travel/Casual — any member can act, first click wins). Approval is whole-requisition (no per-position adjustment). Introduces the app's first file-attachment handling (`lib/attachmentStorage.ts`, disk-backed under the `UPLOAD_DIRECTORY` env var). Each position also records Replacement/New status, a Job Grade (fixed 9-grade list, `JOB_GRADES` in `public/assets.ts`), and a Salary Range in KES (min/max entered separately, stored combined as `"<min> to <max>"`)

Status transitions live in `serverActions/Update{IT,Travel,AccessRequisitionStatus}` and each fires an email via the matching `services/*EmailSender.ts`, rendered from templates in `utils/templates/`.

### Two approver-loading paths — check which one applies

`lib/loadAppData.ts` (JSON-backed, reads `data/*.json`) and `lib/loadAppDataV2.ts` (Postgres-backed, wrapped in `unstable_cache`) export functions with the **same names** (`loadHodArray`, `loadHrArray`, `loadITArray`, `loadDirectorArray`, `loadBaseDepartments`, plus V2-only `loadSecurityArray`). The DB-backed V2 is the current path; the JSON version is being phased out and `data/*.json` is gitignored, so it won't exist on a fresh clone. When editing approver-loading code, check the actual import to know which module a given caller uses — don't assume based on the function name alone.

### Email

`services/EmailService.ts` / `services/EmailSender.ts` are the shared send path; `AccessEmailSender`, `AdvanceEmailSender`, `ITEmailSender`, `CasualEmailSender`, `EmployeeEmailSender` are per-flow wrappers. Sends go through Nodemailer and/or Microsoft Graph `Mail.Send`, with sender addresses set per flow via `EMAIL_SENDER`, `IT_EMAIL_SENDER`, `ACCESS_EMAIL_SENDER`, `ADVANCE_EMAIL_SENDER`, `CASUAL_EMAIL_SENDER`, `EMPLOYEE_EMAIL_SENDER`. Employee Requisition emails never include attachments — only links to them (`api/employeerequisition/attachment/[attachmentId]`) — due to Microsoft Graph payload size limits. Casual Requisition is the one flow that does attach a file: on final HR approval, `sendEmail`'s `attachments` param (Graph `fileAttachment`, base64-encoded) carries a server-rendered PDF (`@react-pdf/renderer`'s `renderToBuffer`) to the HR approver and to `EXTERNAL_CASUAL_PROVIDER`, an external casual-labor provider notified for action on every approved casual requisition.

### State management split

- Server data: TanStack React Query (`components/QueryProvider.tsx`), fed by `serverActions/`.
- Client-only UI state: Zustand stores in `store/` (`useAlertStore`, `useLoadingStore`, `useToggleStore`) — these do not hold server data.
- `utils/ApiHandler.ts` is a thin fetch wrapper for client components calling internal `api/` routes, as distinct from calling server actions directly.

### Salary advance submission window

Submissions are not time-gated: there is no submission deadline, and the old `salary_advance_metadata.lock_advance_form` gate (and the table itself, plus its dead `salary_advance_otp` column) was dropped in migration `006_salary_advance_export_flag.sql`. HR still batches processing once a month, but nothing in code enforces a submission cutoff.

### Salary advance active-request lock, self-service alterations, and the export flag

`serverActions/PublicServerActions/SubmitAdvanceForm.ts` blocks a new submission while the staff member (identified by `staff_number`) has an active request — `approval_status != 'declined'` — whose installment period hasn't elapsed: a `continuous` request blocks indefinitely (no end date), a `oneoff` request blocks until `repayment_start_date + no_of_installments` months has passed. This check, plus the alteration-eligibility lookup below, share their "months elapsed/remaining" logic via `lib/salaryAdvanceRules.ts` rather than duplicating the SQL.

Both `salary_advances` and `salary_advance_alterations` carry an `exported` boolean (migration `006_salary_advance_export_flag.sql`), which `app/api/triggers/send-advance-requests/route.ts` uses instead of a calendar-month filter now that submissions have no monthly cutoff: it pulls every row with `exported = false` (plus, unconditionally, every `continuous` request — those must keep reappearing every run as a standing deduction reminder) and flips the flag to `true` only after the email actually sends successfully, so a failed send doesn't silently drop rows from future exports.

Instead of waiting out that lock, a staff member can request a self-service **alteration** to an eligible active request from the "Modify Existing Request" toggle in `components/SalaryAdvance/SalaryAdvanceClient.tsx` (`SalaryAdvanceAlterationSection.tsx`): switch an active `continuous` request to `oneoff`, reduce the remaining installments of an active `oneoff` request that has more than one installment left, or — new — delete a request outright while it's still `approval_status = 'pending'` and `exported = false` (a single request can offer more than one of these at once, e.g. a pending, unexported continuous request can both switch and delete). `serverActions/PublicServerActions/GetAlterationEligibility.ts` computes which of the staff's requests qualify for which actions (empty result drives a fallback UI); `serverActions/PublicServerActions/SubmitAlterationRequest.ts` re-validates eligibility server-side before applying the change. Switch/reduce alterations only insert an audit row into `salary_advance_alterations` (FK to `salary_advances.request_id`) when the underlying request was already `exported = true` at alteration time — an alteration on a not-yet-exported request just mutates the `salary_advances` row in place, since there's no prior export to reconcile. Deletion is a hard `DELETE` with no audit row (nothing to reconcile — the row never went out). Alterations take effect immediately — no HR approval step, no email.

### Embedded SSO portals

The HelpDesk and Staff Product Purchase dashboard pages render an iframe against an internally reverse-proxied SSO URL (`SSO_SHARED_SECRET`) — they're portals into separate internal systems, not requisition forms, and don't follow the requisition/approval patterns above.

### Path alias

`@/*` maps to the repo root (`tsconfig.json`), e.g. `@/lib/session`, `@/serverActions/GetUserRoles`.
