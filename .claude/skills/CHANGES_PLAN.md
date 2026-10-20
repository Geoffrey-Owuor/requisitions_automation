<!-- Plan agreed for the changes in CHANGES.md (2026-10-20). Each phase is one commit. -->

# Decisions

- Users: upserted on every sign-in (name/email); config-admins can also pre-add an email.
- Roles: fixed set defined in code/migrations. config-admin assigns/removes them and edits descriptions only. Guards: cannot remove the last config-admin, cannot remove your own config-admin role.
- Approver-gated roles `hod`, `it`, `director`, `hr-travel` are dropped; dashboard access comes from the `_array` tables only (`it_array` = full IT access incl. all-history + export; travel HR = `hr_array` with `travel` in `hr_forms`).
- Approvers: per-array add/remove; removal refused while the approver has pending work; email never edited (remove + re-add). Per-approver "Regenerate link" (old emailed links stop working). `rotate-approver-ids` cron fixed to cover every array.
- Email change requests + staff data: hr-advance, in the Salary Advance HR dashboard. Approve & apply (updates company_staff_data, resolves, emails new address + notice to old) or Reject (reason). Terminal statuses. Reminder that the source HR system must be updated too (the table is re-imported periodically).
- Extras in Settings: departments + flags, travel tiers, job grades, casual budgets/statutory/baseline, salary advance extension, audit log viewer.
- Migrations 028+ are applied to the local dev DB (affected tables backed up first).

# Phases

1. Roles -> arrays: replace `it`/`hr-travel`/`director` role checks with ApproverMemberships; migration drops `hod`/`it`/`director`/`hr-travel`; fix rotation cron.
2. Settings shell (URL `?tab=`, grouped tabs) + users upsert on sign-in + Users & Roles tab.
3. Approvers tab: all arrays, HOD department/alternate-only/alternates, HR forms, pending-guarded removal, regenerate link.
4. Departments, travel tiers, job grades tabs.
5. Casual budgets and salary advance extension tabs.
6. Email change requests + staff data in the HR advance dashboard.
7. Audit log viewer (config_changes, report_downloads).
