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

- `(protected)/dashboard` — authenticated area. Nested groups: `(embeddings)` (HelpDesk / Staff Purchase SSO iframes), `(pdfs)` (PDF viewers), plus `advance` (salary advance).
- `(approvers)` — public, per-UUID approval pages for approvers acting on emailed links.
- `advance/page.tsx` and `login/page.tsx` are public entry points gated by `proxy.ts`.
- `api/` — form submission routes (`{access,it,travel}requisition/submitrequisition`), auth routes, mail triggers, `CRON_SECRET`-gated scheduled triggers (`api/triggers/*`), and `REVALIDATE_TAG_KEY`-gated cache revalidation (`api/revalidate-tag`).

### Approval workflows

Each requisition type has its own multi-stage chain under `utils/`:

- `utils/ITApprovalStages/` — hodApprovalStage → itApprovalStage
- `utils/AccessApprovalStages/` — hodApprovalStage → securityApprovalStage
- `utils/TravelApprovalStages/` — hodApprovalStage → hrApprovalStage → directorApprovalStage, tiered by cost (<30K HOD only, 30K–100K +HR, >100K +Director)

Status transitions live in `serverActions/Update{IT,Travel,AccessRequisitionStatus}` and each fires an email via the matching `services/*EmailSender.ts`, rendered from templates in `utils/templates/`.

### Two approver-loading paths — check which one applies

`lib/loadAppData.ts` (JSON-backed, reads `data/*.json`) and `lib/loadAppDataV2.ts` (Postgres-backed, wrapped in `unstable_cache`) export functions with the **same names** (`loadHodArray`, `loadHrArray`, `loadITArray`, `loadDirectorArray`, `loadBaseDepartments`, plus V2-only `loadSecurityArray`). The DB-backed V2 is the current path; the JSON version is being phased out and `data/*.json` is gitignored, so it won't exist on a fresh clone. When editing approver-loading code, check the actual import to know which module a given caller uses — don't assume based on the function name alone.

### Email

`services/EmailService.ts` / `services/EmailSender.ts` are the shared send path; `AccessEmailSender`, `AdvanceEmailSender`, `ITEmailSender` are per-flow wrappers. Sends go through Nodemailer and/or Microsoft Graph `Mail.Send`, with sender addresses set per flow via `EMAIL_SENDER`, `IT_EMAIL_SENDER`, `ACCESS_EMAIL_SENDER`, `ADVANCE_EMAIL_SENDER`.

### State management split

- Server data: TanStack React Query (`components/QueryProvider.tsx`), fed by `serverActions/`.
- Client-only UI state: Zustand stores in `store/` (`useAlertStore`, `useLoadingStore`, `useToggleStore`) — these do not hold server data.
- `utils/ApiHandler.ts` is a thin fetch wrapper for client components calling internal `api/` routes, as distinct from calling server actions directly.

### Salary advance submission window

Enforced on both client and server: locked after the 10th of the month at 17:00 local time, additionally gated by a DB flag from `serverActions/GetSalaryAdvanceLock.ts` (see `components/SalaryAdvance/SalaryAdvancePage.tsx`).

### Embedded SSO portals

The HelpDesk and Staff Product Purchase dashboard pages render an iframe against an internally reverse-proxied SSO URL (`SSO_SHARED_SECRET`) — they're portals into separate internal systems, not requisition forms, and don't follow the requisition/approval patterns above.

### Path alias

`@/*` maps to the repo root (`tsconfig.json`), e.g. `@/lib/session`, `@/serverActions/GetUserRoles`.
