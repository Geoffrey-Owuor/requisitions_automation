<!-- Second CHANGES.md file -->

Alternate HODs are now built into all five requisition types (IT, Access, Travel, Casual, Employee), exactly as planned. The typecheck (tsc --noEmit) and npm run lint both pass. Nothing has been run against a database or tested end to end yet, and there's no test suite in the repo.

Before you deploy

- Run the migration first. The new code reads the new columns, so it will fail until schemas/migrations/018_hod_alternates.sql has been run. It adds is_alternate_only to hod_array, creates the hod_alternates table, adds a "who acted" email column to each of the five requisition tables, and backfills that column on past decisions from the assigned HOD's email.
- The migration file isn't tracked by git. Your .gitignore excludes /schemas/, same as the earlier migrations, so it won't go up with a commit.

What changed

- Who can act: the assigned HOD or any of their alternates can approve at the HOD stage; the first to act wins. The submitter can never approve their own request. The check is in getHodActionError in lib/hodAssignment.ts, used by all five Update\*Status actions.
- Assigned HOD is kept: the assigned HOD's email is no longer overwritten when someone acts. Whoever acted goes in the new "acted by" column, and their name still goes in the existing name column, so what's shown on screen doesn't change.
- Emails:
  - "Action Required" goes to the HOD and all alternates, leaving out the submitter. This applies to new submissions and to Travel/Casual amendments.
  - Only whoever acted gets the HOD-stage confirmation.
  - Every later-stage email, including Travel push-backs, goes to whoever acted.
- Dashboard: pending queues include requests assigned to HODs you cover. History shows an assigned HOD everything assigned to them, and an alternate only what they acted on. The HOD tables now appear for anyone in hod_array instead of anyone with the hod role.
- Detail views and attachments: the assigned HOD, whoever acted, and (while it's still pending) any alternate can open a request's details and Employee attachments.
- Dropdown: alternate-only HODs are left out of the HOD dropdown and department auto-select, and the server rejects them if they're submitted anyway.
- Amendments: they now pre-fill and compare against the assigned HOD's name, so they're unaffected when an alternate was the one who acted. An amendment also clears the "acted by" column.
- Travel Director skip: skipping the Director stage now depends on whether the person who approved at HOD is a Director, not the assigned HOD.

Worth knowing

- Alternates' email addresses stay server-side. The lookup for alternates lives in lib/hodAssignment.ts, not the "use server" data file, so their tokens can't be fetched from the browser. The existing approver lists (IT, HR, etc.) in lib/loadAppDataV2.ts can be fetched that way and include tokens. That was already the case, but you may want to look at it separately.
- The hod role no longer does anything, so it can be removed from user_roles whenever convenient.
- The IT export has no new column. I left the "acted by" email out, so the export's layout is unchanged.
- CLAUDE.md is updated to describe how the HOD stage works now.

Setting up an alternate is done directly in the database:
INSERT INTO hod_array (hod_name, hod_email, is_alternate_only) VALUES ('Jane Deputy', 'jane@hotpoint.co.ke', true);
INSERT INTO hod_alternates (hod_id, alternate_id)
SELECT h.id, a.id FROM hod_array h, hod_array a
WHERE h.hod_email = 'hod@hotpoint.co.ke' AND a.hod_email = 'jane@hotpoint.co.ke';
Then refresh the GetHodArray cache tag via /api/revalidate-tag so the change shows up in the dropdown straight away.
