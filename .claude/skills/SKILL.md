<!-- Skills.md file -->

# New Online Form Workflow Automation: Employee Requisition

This document holds the guidelines - including form fields, approval workflow, and other related logic for implementing a new online form workflow for Employee Requisition. You can refer to a previous recently implemented workflow e.g; for casual requisition or access requisition for UI styling, and approval workflow data and similarities

## Form Fields And Related Form Logic During Initial Submission

- All form fields are required, with some fields required to meet certain criteria.
- The general form fields which will go in the main parent table are:
  - Submitter Department
  - Submitter HOD (HOD Approver)
- The submitter basically submits a requisition which includes one or more positions.
- Each position has the following form field properties where all are required
  - Position Title (text field, maximum of 100 characters),
  - Number Required (Number, minimum is 1)
  - Position Justification (Text area - Brief description of why the position is being filled)
  - Position Reporting To (Text field, maximum of 100 characters)
  - Date the position should be filled (Date - Uses the current DatePicker component)
  - Attachment(s) - At least one attachment should be provided. These are document attachments regarding the Job Description and KPIs for the requested position. Allowed document file types are: microsoft word, excel, and pdf. Maximum size for all attached documents per position is 5MBs
- As other previous requisitions have done. There will also be a preview modal before final submission.
- For the form image to be displayed in the form and other areas, use the employee_form_image from assets in assets.ts

## Approval Modal and Workflow

- The approval workflow is Submitter -> HOD -> CEO (fetched from the director's array) -> HR.
- Each approver has an optional comments section (defaults to "No comments" if no comment is provided) when approving or declining a request.
- All submitted positions along with their properties are displayed in the approval modal.
- The attachments in the approval modal when clicked, opens up in a new browser pop-up window. You can decide on the dimensions of the pop-up window.
- This workflow's view/pdf route will not support a pdf download export since it involves document attachments, just normal requisition viewing

## Email Sending

- Attachments will not be included in the sent email payload, only the links to the attachments per submitted position due to Microsoft Graph API email payload limits.
- Email template UI follows previous email template UI theming used by previous requisitions.
- I have already added a new email sender called **EMPLOYEE_EMAIL_SENDER** for the employee requisition email sender which will be used in the new employee email sender function.

## New Table Schemas

- You'll create a new folder under the migrations folder for the new table schemas involved in this implementation
- I believe the new schemas will include the main parent requisitions table holding the approval workflow metadata and other details like request_created_at, a table for holding attachments metadata (We will use an upload directory which is defined in our env variables folder as **D:\Employee_File_Uploads**), Another table for holding the submitted positions metadata.

## Other Related Logic Implementation Areas

- The form modal toggle will be included in the MoreMenuModal component props both in the DashboardSidebar and the mobile menu drawer.
- Update the home page area for the available apps and online forms and also the guidelines page to include the new guideline for the new online requisition workflow.
- Update also README.md and CLAUDE.md accordingly for the newly added workflow if required, also check if there is a requisition workflow that exists in the project that has not been added to both README and CLAUDE.md files - This will help for future references.

## Follow-Up Questions and Recommendations

- Ask any follow-up queries or questions you might have, including any implementation parts I may have missed, among other areas.
- You can also suggest your recommendations tied to the implementation so that I can decide whether to go with your suggested recommendations or not.

## Planning and Execution

- After you get feedback for the questions and recommendations you have, create an implementation plan after which we execute against the generated plan.
