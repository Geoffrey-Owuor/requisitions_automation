# Salary Advance & Casual Engagement Form Automation Implementation Guide

This prompt directive guides Claude AI in implementing the **Casual Requisition Approval Workflow Automation** feature by outlining repository architecture alignment, UX design consistency, validation rules, approval multi-stage logic, email templates, and PDF generation.

---

## 1. Architectural Alignment & Reuse Principles

Before writing any new code, inspect relevant existing previous requisition implementations:

- **UI/UX & Design Patterns:** E.g: Reference `KeyAccessRequisitionForm.tsx`. Mirror form styling, field layouts, validation error badges, submit state behaviors, and responsive containers.
- **Component Reuse:**
  - Use the project's standard `DatePicker` component for date selections.
  - Reuse existing functions to fetch the **Department** list and **HOD Approver** array.
  - Reuse existing notification components, loading indicators, modal structures, and modal triggers.
- **Workflow Parity:** You can follow the approval workflow pattern established in **Travel Requisition** or **IT Requisition** for workflow transitions, and PDF export actions.

---

## 2. Requirements Specification

### A. Database & Schema Updates (`database_schema.txt`)

- See database_schema.txt for some existing requisition table schema definitions
- New approver array table (`finance_array`) will be needed for the finance approval stage

### B. Form Logic & Validation Rules

- **Required Fields:**
  - Department (Dropdown - pre-populated)
  - HOD Approver (Dropdown - pre-populated: selected by requestor)
  - Location (Dropdown)
  - Justification (Text Area)
  - Number of Casuals (Number - min: 1)
  - PPEs Required (Text Area)
  - Casual Engagement Period ( to and from date via DatePicker`)

- **Derived Values**
  - Submitter details will derived from the current user session. It can however be displayed somewhere in the form as a card so the user is aware who is submitting the form (this can be placed in the confirmation stage as previous forms have done).
  - Casual Rate per day is derived from the selected location (Ruiru is 798, all others are 868)

- **Location Options:**

  ```typescript
  const LOCATIONS = [
    "Ruiru",
    "Imaara",
    "Galleria",
    "Garden City",
    "Village Market",
    "Karen",
    "Diani",
    "Likoni",
    "Kisumu",
    "Eldoret",
    "CBD",
    "Riara",
    "Nyali",
    "Sarit",
    "Yaya",
  ];
  ```

  _(Maintain as an extensible array constant (e.g. in assets.ts) for future location additions)._

- **Real-time Derived Calculations (Reactive UI State):**
  $$\text{Engagement Days} = (\text{Period To} - \text{Period From} + 1 \text{ day})$$
  $$\text{Total Rate (Kshs)} = \text{Number of Casuals} \times \text{Casual Rate Per Day} \times \text{Engagement Days}$$
  _Display this total dynamically in an interactive stat card/summary section as the user inputs values._

- **Validation Hard Stops (Block Submission):**
  - Reject submission if `number_of_casuals <= 0`.
  - Reject submission if to-date is less than from date for casual engagement period.
  - Reject submission if any mandatory field is missing or empty.

---

### C. 3-Step Approval Workflow Logic

```
[ Requestor Submits ]
          │
          ▼
    ┌───────────┐      Approve      ┌────────────────┐      Approve      ┌────────────┐      Approve      ┌────────────┐
    │ Stage 1:  │ ────────────────> │    Stage 2:    │ ────────────────> │  Stage 3:  │ ────────────────> │  APPROVED  │
    │    HOD    │                   │    Finance     │                   │     HR     │                   └────────────┘
    └───────────┘                   └────────────────┘                   └────────────┘
          │ Decline                       │ Decline                            │ Decline
          ▼                               ▼                                    ▼
    ┌───────────┐                   ┌────────────────┐                   ┌────────────┐
    │ REJECTED  │                   │    REJECTED    │                   │  REJECTED  │
    └───────────┘                   └────────────────┘                   └────────────┘
```

1. **Stage 1: HOD Approval**
   - **Actions:** `Approve` | `Decline`
   - **Field:** Optional `comments` (Text Area) - Defaults to no comments if not provided.

2. **Stage 2: Finance Approval**
   - **Approver Source:** Retrieved dynamically from `finance_array` which is not yet existing - will need to be created.
   - **Actions:** `Approve` | `Decline`
   - **Field:** Optional `comments` (Text Area) - Defaults to no comments if not provided.

3. **Stage 3: HR Approval (Final Stage)**
   - **Actions:** `Approve` | `Decline`
   - **Approver Source:** Retrieved dynamically from `hr_array` which is already existing.
   - **Fields:**
     - Optional `comments` (Text Area) - Defaults to no comments if not provided.
     - **REQUIRED Field:** `hr_approved_casuals` (Number input, min 0).
   - **Calculation Update:** If HR modifies `hr_approved_casuals`, re-calculate the final authorized amount:
     $$\text{Final Authorized Amount} = \text{HR Approved Casuals} \times \text{Rate Per Day} \times \text{Engagement Days}$$

---

### D. Email Notification & PDF Deliverables

1. **HTML Email Template:**
   - Standardized header/footer matching current notification branding.
   - Clear tabular summary of requisition details: Requestor Name, Department, Location, Engagement Dates, Number of Casuals, Daily Rate, and Computed Total Amount (Kshs).
   - Direct call-to-action button - Review Request.

2. **Dedicated PDF Page / Download View:**
   - Clean printable summary view mimicking the IT and Travel Requisition PDF downloads.

---

## 3. Where to render the form and the button that triggers it

1. The form will wrapped inside ModalWrapper
2. In DashboardSidebar, replace the guidelines link at the bottom with a `more...` button which opens up a menu modal that opens to the right.
   The new modal will now hold any future buttons and links for other dashboard links and buttons in dashboard sidebar - This makes sure the original sidebar scroll area does not get too long. You'll give it a min and max height with overflow auto as you see fit for best implementation.
3. In MobileHeader - See how to replicate the new modal for holding future links and buttons e.g a `more...` button which opens up the new dedicated area for future dashboard links and buttons just below the last dashboard button/link - As you see fit for the best implementation

## 4. Implementation Clarifications & Edge Cases

Some operational edge cases:

1. **Date Inclusivity:** Ensure date difference math counts inclusive calendar days (e.g., _May 1 to May 1 = 1 day_).

2. **HR Adjustments:** Ensure both the original requested count (`number_of_casuals`) and HR's finalized count (`hr_approved_casuals`) remain stored for audit history.
3. **PDF Engine Alignment:** Utilize the project's existing PDF generation library (e.g., `@react-pdf/renderer` used in Travel Requisition.

This is the implementation plan currently as I see it. Improve it during execution as you see fit for best practices. Ask more follow-up questions if you need further clarification
