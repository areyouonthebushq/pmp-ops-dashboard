# PMP OPS — Stabilization checklist

Use this after running the Supabase SQL in the order given in [SUPABASE-RUNBOOK.md](./SUPABASE-RUNBOOK.md). Mark each item pass/fail. Do not add features; verify only.

**Source of truth:** [STATE-SNAPSHOT.md](./STATE-SNAPSHOT.md).

---

## Part A: Supabase SQL run order

Run in Supabase SQL Editor in this exact order. Verify after each step as in [SUPABASE-RUNBOOK.md](./SUPABASE-RUNBOOK.md).

| # | File | Pass after run |
|---|------|----------------|
| 1 | `supabase/schema.sql` | [ ] |
| 2 | `supabase/auth-and-profiles.sql` | [ ] |
| 3 | `supabase/policies.sql` | [ ] |
| 4 | `supabase/rls-roles-migration.sql` | [ ] |
| 5 | `supabase/realtime-publication.sql` | [ ] |
| 6 | `supabase/audit-log-migration.sql` | [ ] |
| 7 | `supabase/seed.sql` (optional) | [ ] |

**Do not** run only `rls-roles-migration.sql` without running `policies.sql` first: RLS must be enabled on the five app tables (done in policies.sql). See runbook for policy conflict details.

---

## Part B: Pre-QA setup

- [ ] Supabase project has **Email** auth enabled (Dashboard → Authentication → Providers).
- [ ] At least four test users created (Auth → Users): e.g. admin@test.com, floor@test.com, press1@test.com, qc@test.com.
- [ ] Profiles exist for all four (trigger or backfill). In Table Editor → profiles: one row per user.
- [ ] Roles and press assignment set in `profiles`:
  - [ ] One user with `role = 'admin'`, `assigned_press_id` NULL.
  - [ ] One user with `role = 'floor_manager'`, `assigned_press_id` NULL.
  - [ ] One user with `role = 'press'`, `assigned_press_id = 'p1'` (or p2/p3/p4).
  - [ ] One user with `role = 'qc'`, `assigned_press_id` NULL.
- [ ] App loaded with valid `SUPABASE_URL` and `SUPABASE_ANON_KEY` in index.html (or env).
- [ ] At least one job exists (from seed or manual insert) and one press (e.g. p1) has that job assigned so press user has something to log.

---

## Part C: Manual QA — in order

### C1. Login and launcher

- [ ] Open app; login screen appears (email/password).
- [ ] Sign in as **admin** user; launcher appears with **Admin**, **Floor Manager**, **Press**, **QC** visible.
- [ ] No console errors on load after login.

### C2. Admin — full shell

- [ ] From launcher choose **Admin**; main app loads (bar, nav: Floor, Jobs, Todos, QC Log, Audit).
- [ ] Sync bar shows (no need to verify “synced” yet).
- [ ] **Floor** page: stats row and press cards and floor table visible; at least one job row.
- [ ] **Jobs** page: job list visible.
- [ ] **Todos** page: todos visible (daily/weekly/standing if seed run).
- [ ] **QC Log** page: qc log visible (may be empty).
- [ ] **Audit** page: click AUDIT in nav; LOAD loads rows (or empty); no error.
- [ ] Bar shows **EXPORT** and **💾 BACKUP** buttons (admin-only).
- [ ] Click a job **OPEN →**; slide panel opens with full job fields.
- [ ] Close panel; no crash.

### C3. Logout and session restore

- [ ] Click logout (or bar logout control); login screen appears.
- [ ] Sign in again as admin; launcher appears.
- [ ] Refresh the page (F5) while still “logged in”; after reload, launcher or app appears **without** asking for password (session restore).
- [ ] Log out again before next role test.

### C4. Floor Manager

- [ ] Sign in as **floor_manager** user.
- [ ] Launcher shows only **Floor Manager** (no Admin, no Press, no QC).
- [ ] Choose Floor Manager; floor view loads (stats, press cards, floor table).
- [ ] No **EXPORT** or **💾 BACKUP** in bar; no **Audit** in nav.
- [ ] Click a job’s **EDIT** (or equivalent) to open **floor card** (quick edit overlay), not full panel.
- [ ] Change one field (e.g. status or notes), save; change persists after refresh or re-open floor card.
- [ ] Log out.

### C5. Press

- [ ] Sign in as **press** user (assigned to p1).
- [ ] Launcher shows only **Press** (picker for p1–p4 or direct to station if single press).
- [ ] Enter Press Station; current job for that press shown (or “no job”).
- [ ] Log pressed: tap +10 (or +25/+50/+100); count updates; sync bar or UI indicates save.
- [ ] Refresh or re-open station; logged count is still there.
- [ ] (If hold/resume in UI) Set job to HOLD, then resume; state persists.
- [ ] Log out.

### C6. QC

- [ ] Sign in as **qc** user.
- [ ] Launcher shows only **QC**.
- [ ] Enter QC Station; job list and defect buttons visible.
- [ ] Select a job; tap a reject type; log entry appears (today summary or recent log).
- [ ] Refresh; QC log entry still present.
- [ ] Log out.

### C7. Realtime — two tabs

- [ ] Tab A: sign in as admin, open Admin, go to Floor (or Jobs).
- [ ] Tab B: open app in second tab (or incognito), sign in as same admin (or second user with access).
- [ ] Tab B: change something (e.g. job status or a note), save.
- [ ] Tab A: within a few seconds, data updates **without** refreshing (realtime push). Sync bar or list reflects change.
- [ ] Tab A: open job panel (OPEN →). Tab B: change same job again. Tab A: “Data updated elsewhere” (or equivalent) notice appears; no silent overwrite. Close panel and refresh or reload to get latest.

### C8. Offline fallback

- [ ] Sign in as admin; load Admin; wait until data is loaded (one good load).
- [ ] Open DevTools → Network; set throttling to **Offline** (or disconnect network).
- [ ] Refresh or navigate; app shows **OFFLINE** banner/state; last-loaded data still visible (from snapshot).
- [ ] (Optional) Make a change while offline (e.g. add a note); it queues.
- [ ] Set Network back to **Online**; app detects online; queued change replays; data refreshes. No crash.
- [ ] Re-enable network for remaining checks.

### C9. Local fallback (no Supabase)

- [ ] In index.html temporarily comment out or remove `SUPABASE_URL` / `SUPABASE_ANON_KEY` (or load from env that omits them).
- [ ] Reload app; launcher appears **without** login (local mode); all stations visible.
- [ ] Enter Admin; data loads from localStorage (or empty); no auth errors.
- [ ] Restore URL/key for normal use.

---

## Part D: Pass/fail summary

| Area | Pass | Fail | Notes |
|------|------|------|--------|
| SQL run order (Part A) | [ ] | [ ] | |
| Pre-QA setup (Part B) | [ ] | [ ] | |
| Login / launcher (C1) | [ ] | [ ] | |
| Admin shell (C2) | [ ] | [ ] | |
| Logout / session restore (C3) | [ ] | [ ] | |
| Floor Manager (C4) | [ ] | [ ] | |
| Press (C5) | [ ] | [ ] | |
| QC (C6) | [ ] | [ ] | |
| Realtime two-tab (C7) | [ ] | [ ] | |
| Offline fallback (C8) | [ ] | [ ] | |
| Local fallback (C9) | [ ] | [ ] | |

---

## If something fails

- **Login fails:** Check Email provider enabled; check profile exists and has correct email.
- **Launcher shows wrong buttons:** Check `profiles.role` and `profiles.assigned_press_id` in DB.
- **RLS errors (e.g. 0 rows):** Ensure `rls-roles-migration.sql` was run after `policies.sql`; ensure user has a profile with `role` set (not NULL for app/RLS).
- **Realtime not updating:** Run `realtime-publication.sql`; check Realtime enabled for project; check console for subscription errors.
- **Audit page empty or error:** Run `audit-log-migration.sql`; ensure `profiles_admin_select_all` exists so view can join profiles.

Do not refactor or add features; document failures and fix only blocking issues.
