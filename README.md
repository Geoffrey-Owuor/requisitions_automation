# Hotpoint Apps Hub

A comprehensive web application for automating internal requisitions at Hotpoint, built with Next.js. Streamlines the process of submitting and approving IT equipment requests and travel requisitions with multi-tier approval workflows.

## Features

### IT Requisitions

- Request laptops, peripherals, software, and other IT equipment
- Simple approval workflow: Submit → HOD Approval → IT Fulfillment
- Track completion status and fulfillment details
- Automated email notifications

### Travel Requisitions

- Submit requests for site visits, local flights, road travel, and international travel
- Multi-tier approval system based on travel cost:
  - **Local Travel** (< 30K): HOD Approval
  - **Air Travel** (30K-100K): HOD → HR Approval
  - **Global Travel** (> 100K): HOD → HR → Director Approval
- Detailed cost breakdown including transport, accommodation, per diem, and other expenses
- Budget validation and cost center tracking

### Dashboard & Management

- User dashboard for submitting and tracking requisitions
- Approver dashboards for reviewing and approving requests
- Real-time status updates and approval workflows
- Export requisitions data to Excel
- Comprehensive search and filtering

### Security & Authentication

- Microsoft Entra ID (Azure AD) authentication
- Role-based access control
- Secure API endpoints with proper validation

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack React Query
- **Authentication**: NextAuth.js with Microsoft Entra ID
- **Database**: PostgreSQL
- **Email**: Nodemailer, Microsoft Graph Mail.Send API
- **File Export**: ExcelJS
- **Icons**: Lucide React
