<!-- File to define proposed changes to features and logic within the project -->

## Travel Requisition Pushback by HR after HR Approves

### Original proposal

- The idea is to allow HR to push back their previous act on a travel requisition e.g. if they previously approved, and now want to decline - or vice-versa.
- We'll need a new table to track pushbacks made by HR on a certain requisition - including who made the pushback, when, previous status, previous comments, new status, new comments, push-back reason, and so forth.
- Only HR can perform a travel requisition push-back, a maximum limit of 5 pushbacks will be enacted for every travel requisition. A pending travel requisition on the hr stage cannot be pushed back.
- Travel requisitions that require a director approval cannot be pushed back - ideally for those ones, one will have to raise a new requisition instead.
- We'll add a push-back button in the travel details modal (Only accessible to hr approvers). Clicking it, ideally reverts the approval status to pending, and redirects to the hr approval modal (with a new url parameter perhaps for aiding in identifying it is a push-back - but you'll advise on the best approach for this) so that they can act on it again. A required conditional push-back reason text area will also be shown for pushed-back requests (Just before the comments area).
- We'll also add a push-back history section in all related travel requisition modals, view pages and pdfs, which shows the push-back history for travel requisitions which have push-back history.
- Seek clarifications and critic the proposed changes.
- Your recommendations are strongly encouraged.

### Agreed specification (supersedes the proposal where they differ)

- **Atomic, no intermediate "pending" state.** Clicking Push-back does not touch the requisition. It opens the existing HR approval page in push-back mode (`/travelapproval/{uuid}?token=…&stage=hr&mode=pushback`). The requisition is only changed when HR submits: a single transaction (`serverActions/PushbackTravelHrDecision.ts`) locks the row, re-validates every rule, writes the history row, overwrites the `travel_hr_*` columns and increments the counter. `mode=pushback` is presentation only - every rule is enforced server-side.
  - _Why:_ reverting to pending first would erase the original decision if HR abandoned the page, expose the item to every HR member's pending queue (first click wins, with no reason recorded), and burn cap slots without a completed push-back.
- **Must flip the status.** approved → declined or declined → approved only; comment-only revisions are not allowed. The page only offers the opposite decision.
- **Eligibility** (all must hold):
  - HR status is `approved` or `declined` (never `pending`).
  - `travel_approval_tier` is not `Tier 3` - including Tier 3 requests whose Director stage was auto-approved (HOD is a Director) and Tier 3 requests HR declined (reversing to approved would need the Director).
  - Fewer than **3** push-backs so far (`travel_requisitions.travel_hr_pushback_count`).
  - Today (Africa/Nairobi) is on or before `travel_departure_date` - i.e. allowed until 23:59 EAT on the departure day.
- **Who:** any member of `hr_array` with `travel` in `hr_forms` (consistent with first-click-wins). The acting member is recorded on the history row.
- **Concurrency:** `travel_hr_pushback_count` doubles as an optimistic-concurrency token - the page submits the count it was rendered with and the action rejects if it changed (mirrors `casual_requisitions.amendment_count`).
- **Reason:** required, shown just above the comments box, stored on the history row and included in the emails.
- **History table:** `travel_hr_pushbacks` (migration `016_travel_hr_pushbacks.sql`) - pushback number, actor name/email, reason, the previous HR status/approver/email/comments/date, the new status/comments, and timestamp.
- **Emails** (every push-back, either direction): acting HR member, submitter, and HOD (skipped when the HOD is the submitter, as elsewhere).
  - **Finance**, approved → declined: a dedicated "Reversed" email carrying the reason, so any payment/booking can be stopped.
  - **Finance**, declined → approved: the normal "Final Update: Approved" email with the PDF link, same as a first-time Tier 1/2 HR approval.
- **Push-back history section** shown in the travel details modal (dashboard), the approval page, the PDF view page and generated PDF, and the travel email template. The PDF always shows the current HR status plus this history, so a PDF link from an older "Approved" email reflects the current state when opened.
- **Hardening done alongside:** `getTravelApproverLink` now resolves the approver from the session instead of a client-supplied email, and validates the stage before interpolating it into SQL.
