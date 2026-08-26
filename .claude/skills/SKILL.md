<!-- Skills.md file -->

# Changes to make to the Employee Requisition Workflow

Outlines the changes to make to the employee requisition workflow.

## New fields (UI & Schema)

- Add the following employee position fields

1.  Replacement/New - A drop-down with two options (Replacement or New).
2.  Job Grade - A drop-down containing job grade options (The list is from grade 1 to 9 in the provided order, the value stored in the db is the grade name, the grade number can be displayed in the UI alongside the grade name as you see fit). Here is the list:
    - Assistant Officer
    - Officer
    - Supervisor
    - Executive
    - Senior Executive
    - Manager
    - Senior Manager
    - Head
    - Director

3.  Salary Range (In Kenya Shillings) - The UI will have a min value and max value fields. The db stores the salary range as a combination of typed min value and max value e.g: "10000 to 20000" as an example. Min value cannot be 0 and max value cannot be less than min value.

4.  Create a migration schema file in the migrations folder for new additional columns required. Since they will probably be required fields and not null, we can fill existing data with placeholder values (It's a test DB).

## Templates, Approval Modals and View modals

- New fields will need to be included in the related approval modals, email templates, and view modals

## Guidelines and Documentation Update

- Any related changes required in the employee requisition guidelines, README.md and CLAUDE.md, as well as any other related areas.

## Planning and execution

- Create a plan and execute against the plan

## Follow-up questions and recommendations

- Ask any follow-up questions, or suggest recommendations if you have any.
