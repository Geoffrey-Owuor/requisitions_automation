<!-- File to define proposed changes to features and logic within the project -->

# New required input field in salary advance (Phone number)

- Add a new required input field for the advance submitter to enter their phone number.
- Add a simple and clear disclaimer (Somewhere beside the phone number input fields) that the phone number provided should be correct, and should belong to the submitter.
- Generate a migration sql schema script for adding the new required column which defaults to `not provided` to cater for previous submissions.
- Add the new field in the related modals where it needs to be displayed (Confirmation modal, the hr admin dashboard table modal, the sent advance email templates particularly the submitter related ones, the send-advance-requests api excel export, the manual excel export, the submitter history table modal, and any other salary advance related tables and modals I might have forgotten).
- Ask follow-up questions, clarifications, or recommendations that you might have regarding these proposed changes.

# Switching exported flag to true for approved or declined requests (requests that are no longer pending)

- When a hr admin acts on a submitted advance request (single or in batch) - Add logic to switch exported flag to true for those requests, since they have already been acted upon - You can advise on what is easier: re-writing true for already exported ones or only switching the flag for non-exported ones.
- Ask follow-up questions, clarifications, or recommendations that you might have regarding this proposed change.

# Add a disclaimer in the casual budget estimate component

- The casual budget spending against provided budget only projects spending estimates, which in a large part may differ from the actual budget spending which is recorded and tracked by finance. Some factors include: approved casuals numbers might change due to external factors like workforce related emergencies e.g. sickness, accidents...,among other factors.
- Add a clear disclaimer to the modal (displayed before the budget and spending estimates), something that is simple to understand and clearly explains why the spendings are estimates and not actual/accurate.
- Ask follow-up questions, clarifications, or recommendations that you might have regarding this proposed change.
