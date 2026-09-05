<!-- SKILL.md file -->

# Changes to make to requisition workflows that have HR Approval (uses the hr_array table)

- Currently, any approver added to the hr_array table can approve any form that requires a HR Approval given that is the major table which retrieves valid HR approvers.
- We want to add a new column specifically in the hr_array table which specifies the specific forms an approver can act on (key names are: casual, employee, and travel. Salary advance is left out since it has a specific email gotten from the env file to send an excel report).
- If an hr approver tries to approve a form which they should not approve (not in the allow list of their approval forms), a relevant access error is thrown.
- Guide on the best way to implement this change, including the new column schema, and the areas where this change will affect (Basically any form requiring a hr approval excluding salary advance).
- Ask any follow-up questions or recommendations that you might have
- You can create a plan for this change and execute against the plan based on the scope changes
