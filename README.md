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
- Multi-tier approval based on travel cost:
  - **Local Travel** (< 30K): HOD Approval
  - **Air Travel** (30K–100K): HOD → HR Approval
  - **Global Travel** (> 100K): HOD → HR → Director Approval
- Detailed cost breakdown (transport, accommodation, per diem, other expenses)
- Engineering job summary fields for HVAC/engineering site visits

### Access / Key Requisitions

- Request physical access or key issuance for retail/other sites
- Approval workflow: HOD Approval → Security Approval

### Casual Requisition

- Request casual staff engagements for one or more sections over a defined period; available locations and sections depend on the requesting department
- Approval workflow: HOD Approval → HR Approval (HR can adjust the final approved headcount per section); on approval, a PDF summary is emailed to HR and to an external casual-labor provider for action
- Daily rate is derived automatically from the selected location (Ruiru vs. other locations), except for the Engineering & HVAC department, which uses a Technician/Welder category rate instead; total cost = casuals × rate/day × engagement days

### Employee Requisition

- Request one or more open positions to be filled, each with its own headcount, justification, reporting line, and target fill date
- Requires at least one supporting document (Job Description/KPIs) per position — Word, Excel, or PDF, up to 5MB per position
- Approval workflow: HOD Approval → CEO Approval → HR Approval

### Salary Advance

- Staff salary advance requests with a monthly submission window
- Requests automatically lock after the 10th of the month at 17:00 (also gated by an admin-controlled DB flag)

### Embedded Internal Portals (SSO)

- IT HelpDesk and Staff Product Purchase systems are embedded as SSO'd iframes inside the dashboard, reusing the same session so users don't re-authenticate

### Dashboard & Management

- User dashboard for submitting and tracking requisitions
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

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Server state**: TanStack React Query
- **Client UI state**: Zustand
- **Auth**: `arctic` (Microsoft Entra ID OAuth/PKCE) + `jose` (signed JWT session cookie)
- **Database**: PostgreSQL (`pg`)
- **Email**: Nodemailer and Microsoft Graph `Mail.Send`
- **PDF/Export**: `@react-pdf/renderer`, `react-pdf-tailwind`, `exceljs`
- **Icons**: Lucide React
