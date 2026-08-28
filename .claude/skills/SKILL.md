<!-- Skills.md file -->

# Changes to make to the Salary Advance Workflow

Outlines the changes to make to the salary advance workflow.

## Removing the salary advance lock

- Currently the form is blocked on the 10th of every month at 5.00pm. We want to remove this check and let users submit requests at any time (Both the check in the UI and endpoint). You can also include a migration query to delete the salary advance metadata table since we will not need it after this.
- This change will also require us to change other areas of the salary advance logic, including the send-advance-requests endpoint under the triggers folder where we will now require another column (perhaps boolean) to track whether a record has been exported or not (Both in the advance requests and advance alterations). This way, the trigger will not export based on time (current month), but rather based on the export flag. Since now users can submit requests or alterations at any time, time based query conditions will no longer be needed.
- Indexes can be created (If previous salary advance migrations have not created them) for the frequently used columns like request type, and the column which determines if a record has been exported or not.
- Continous requests are still included in the exported excel whether they have been exported or not.

## New logic and changes

- Currently, salary advance alterations and advance submission delete the short-lived session cookie at the end. This is an inconvenience especially when say a user wants to submit an alteration and then submit an advance request after.
- We can remove the cookie deletion and let it expire naturally.
- For the alert being used for submission and alteration requests, we can change it to the toast alert used in the salary advance dashboard for approve/reject operations. This toast-type alert will ensure the user is notified while still staying in the current section they are in, instead of replacing the whole UI with an alert UI.
- Due to the new flag we will add for checking whether a request has been exported or not, we can edit how users submit alterations. If the alteration submission touches a record which has not yet been exported, we update the advance request record only without also inserting the alteration record in the alterations table. Alteration requests that touch already exported data is what we will now record in the alterations table.
- We can add a new alteration logic for the user to delete an advance request that has not yet been exported (Meaning it hasn't been exported for review, so deleting it generally causes no harm).

## Migration File Location

- Create a new migration file for the changes containing all the migration query. For the default export flag for existing records, we can set it to false.

## README.md, CLAUDE.md, and Guidelines Updates

- Based on the changes that will be made, update the documentation and guidelines accordingly.

## Left-out hanging questions on other affected areas, and recommendations

- Check the current flow for any areas that may be left out, yet are also affected with the changes that will be made, and seek clarification on those areas.
- Ask any other follow-up question that you might have regarding other related information.
- Give your recommendations regarding the required changes.

## Planning and Execution

- Create a plan for required changes and execute against the plan.
