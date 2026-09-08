<!-- File to define proposed changes to features and logic within the project -->

# Changes to the automatic HOD details selection based on department in various forms

- In most forms (including IT Requisition, Access Requisition, Travel Requisition, etc) where the user selects a department and their HOD approver, the HOD details is automatically selected based on the selected department.
- This is efficient, however, the downside comes when the user submitting is an HOD, ideally in this scenario, the hod details should not be auto selected, and the current hod should not see themselves in the hod list (filtering out their details/name).
- Most endpoints have an automatic HOD approval to handle this scenario when the selected HOD is the same as the submitter, we can leave that logic for now - but as for the UI side, we put in place the logic to detect if the current submitter is part of the HOD list so that we do not allow them to select themselves as well as the auto-select.
- Your suggestions, follow-up questions and recommendations are strongly encouraged
- Create a plan for this change, then execute against the created plan

# CLAUDE.md and README.md update

- This can be done in phase two. There have been numerous updates to logic flows and features in various areas of the project. Update these readme files to reflect the current state of the project after implementing our HOD gating logic given some information is out-dated or reflected wrongly to what is actually true.
