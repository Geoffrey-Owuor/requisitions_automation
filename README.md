# Hotpoint Apps Hub

An internal web application for Hotpoint Appliances Ltd that automates requisitions and hosts a set of embedded internal portals behind a single sign-on. Streamlines submitting and approving IT equipment requests, travel requisitions, salary advances, and physical access/key requests with multi-tier approval workflows.

## Features

### IT Requisitions

- Request laptops, peripherals, software, and other IT equipment
- Approval workflow: Submit → HOD Approval → IT Fulfillment
- Track completion status and fulfillment details
- Automated email notifications with PDF requisition summaries

### Travel Requisitions

- Submit requests for site visits, local flights, road travel, and international travel
- Multi-tier approval based on travel cost — HOD and HR approval are mandatory for every tier; only Director approval is conditional:
  - **Tier 1** (≤ 30K) and **Tier 2** (30K–100K): HOD → HR Approval
  - **Tier 3** (≥ 100K): HOD → HR → Director Approval
- Detailed cost breakdown (transport, accommodation, per diem, other expenses)
- Engineering job summary fields for HVAC/engineering site visits

### Access / Key Requisitions

- Request physical access or key issuance for retail/other sites
- Approval workflow: HOD Approval → Security Approval

### Casual Requisition

- Request casual staff engagements for one or more sections over a defined period; available locations and sections depend on the requesting department
- Approval workflow: HOD Approval → HR Approval; on approval, a PDF summary is emailed to HR and to an external casual-labor provider for action. Both stages are array-based — any member of the HOD or HR approver group can act, first click wins
- The original submitter can amend their own requisition (any field, any section) any time before HR gives final approval — this restarts the HOD → HR approval chain against the amended content and is recorded in a full amendment history. There is no mechanism to change a requisition once HR has approved it
- Daily rate is derived automatically from the selected location (Ruiru vs. other locations), except for the Engineering & HVAC department, which uses a Technician/Welder category rate instead; total cost = casuals × rate/day × engagement days

### Employee Requisition

- Request one or more open positions to be filled, each with its own headcount, justification, reporting line, and target fill date
- Each position also records whether it's a Replacement or a New position, its Job Grade (Assistant Officer through Director), and a Salary Range in KES (minimum cannot be 0, maximum cannot be less than the minimum)
- Requires a Job Description, KPIs, and Org Chart document per position — each is its own required upload (Word, Excel, or PDF), up to 2MB per file
- Approval workflow: HOD Approval → Retail Director Approval (retail departments only, and skipped if the HOD is themself a Retail Director) → CEO Approval → HR Approval. Retail Director, CEO, and HR stages are array-based — any group member can act, first click wins

### Salary Advance

- Staff salary advance requests — no submission deadline; HR batches processing once a month using a per-request `exported` flag rather than a calendar cutoff
- A new request is blocked while any active (non-declined) request's repayment installments haven't fully elapsed — a continuous request blocks indefinitely, a one-off request blocks until its `repayment_start_date + no_of_installments` has passed
- Staff can self-service alter an eligible active request instead of submitting a new one — switch a continuous request to one-off, reduce a one-off request's remaining installments, or delete a still-pending, not-yet-exported request outright — applied immediately with no HR approval or email; switch/reduce alterations are logged in `salary_advance_alterations` only once the underlying request has already been exported

### Embedded Internal Portals (SSO)

- IT HelpDesk and Staff Product Purchase systems are embedded as SSO'd iframes inside the dashboard, reusing the same session so users don't re-authenticate

### Dashboard & Management

- User dashboard with a dedicated table per requisition type and approval stage you're eligible to see (your own submissions, plus any pending-approval queues you're an approver for) across Travel, IT, Access, Casual, and Employee requisitions, with a jump-nav for finding a specific table once several are visible
- Approver dashboards/links (emailed, token-based) for reviewing and approving requests without needing to log in
- PDF generation for requisitions (`@react-pdf/renderer`)
- Export requisitions and salary advance data to Excel (`exceljs`)
- Search, filtering, and pagination on requisition tables

### Security & Authentication

- Sign-in via Microsoft Entra ID (Azure AD) using an authorization-code + PKCE flow (`arctic`)
- App-issued session: a signed JWT (`jose`) in an httpOnly cookie, independent of the Entra ID token
- Route protection via a `proxy.ts` request proxy (Next.js 16's replacement for `middleware.ts`)
- Role-based access control backed by Postgres (`users` → `user_roles` → `roles`)
- Token-gated public approval links for approvers who aren't logged-in staff
- HOD-aware requisition forms — department selection still auto-fills the matching HOD approver, but a submitter who is themself that department's HOD won't see their own name in the approver list or have it auto-selected

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Server state**: TanStack React Query
- **Client UI state**: Zustand
- **Auth**: `arctic` (Microsoft Entra ID OAuth/PKCE) + `jose` (signed JWT session cookie)
- **Database**: PostgreSQL (`pg`)
- **Email**: Nodemailer and Microsoft Graph `Mail.Send` (`@azure/msal-node` for the Graph auth token)
- **PDF/Export/Preview**: `@react-pdf/renderer`, `react-pdf-tailwind`, `exceljs` (also renders Excel attachment previews), `mammoth` (Word attachment previews)
- **Icons**: Lucide React
