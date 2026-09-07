<!-- SKILL.md file -->

# New tables and modals for certain requisitions that currently do not have

- Currently, only travel requisition, and IT Requisition have submitter and approver related tables and modals.
- Salary Advance has the approver dashboard which has the approver table and modal.

## Requisitions which require tables and modals

- They include Casual Requisition, Employee Requisition, Key & Access Requisition.
- For the salary advance table and modal, we can add a toggle in the main salary advance form to show the user-focused table and related modal, given the salary advance logic uses a different short-lived session cookie.
- Given the tables will be quite a number in the dashboard, we can add a UI logic for each table where, as an example, we use an arrow to hide or show a specific table (Applies to tables which will be added in the main user dashboard).

## Any other areas that will be affected by this change

- You can include in the plan other code specific areas which will be affected by the required changes.

## Recommendations and follow-up questions (Strongly recommended)

- Give your recommendations regarding the proposed changes, as well as any follow-up questions that you might have.

## Planning and Execution

- Create a plan for the changes and execute against that plan (Use Claude Opus for code exploration planning, and Claude Sonnet for execution, hope the automatic model switching is possible).
