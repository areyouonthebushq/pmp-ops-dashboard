# PMP OPS — State Snapshot

*Inspection-only snapshot for handoff. “Present in code” does not mean “confirmed working.”*

---

## 1. File inventory

### Core app

| Path | Purpose |
|------|--------|
| `index.html` | Single-page shell: login screen, launcher, TV view, app (#app), nav, floor/jobs/todos/qc/audit pages, slide panel, floor card overlay, confirm dialog, FAB; script/config for Supabase and app.js; SW registration. |
| `app.js` | All app logic: state (S), storage layer, sync/realtime/polling, launcher, auth bootstrap, stations (press/QC/floor manager), admin shell, panel/floor card, CSV import/export, backup export, audit page, offline snapshot/queue/replay, theme. |
| `styles.css` | Design system (vars), layout, shell/mode/launcher, bar/nav, panels, floor card, station shells, TV, audit/offline/data-changed styles, minimal theme. |
| `sw.js` | Service worker: precache shell (index.html, styles.css, app.js, supabase.js); fetch network-first with cache fallback for same-origin shell. |

### Supabase

| Path | Purpose |
|------|--------|
| `supabase.js` | Supabase API layer: initSupabase, getSession/signInWithPassword/signOut/onAuthStateChange, getProfile, getClientOrNull, loadAllData, saveJob/deleteJob, savePresses, saveTodos, logProgress, logQC, subscribeRealtime, getAuditLog. Expects window.SUPABASE_URL, SUPABASE_ANON_KEY, and CDN-loaded supabase-js. |
| `supabase/schema.sql` | Tables: jobs, progress_log, presses, todos, qc_log; indexes. |
| `supabase/auth-and-profiles.sql` | profiles table (id, email, display_name, role); RLS (read/update own); trigger to create profile on auth.users insert. |
| `supabase/policies.sql` | RLS enable on all five tables; “authenticated full access” and “anon full access” policies (broad). |
| `supabase/rls-roles-migration.sql` | Adds profiles.assigned_press_id; get_my_role/get_my_press_id/job_on_my_press(); drops broad policies; role-based policies (admin/floor_manager/press/qc) per table. |
| `supabase/realtime-publication.sql` | Adds jobs, presses, todos, progress_log, qc_log to supabase_realtime publication. |
| `supabase/audit-log-migration.sql` | audit_log table; audit_trigger_func(); triggers on jobs, presses, todos, progress_log, qc_log; RLS (insert authenticated, select admin); profiles_admin_select_all; audit_log_with_actor view. |
| `supabase/seed.sql` | Demo data: sample jobs, presses, todos, progress_log, qc_log (optional run). |

### Docs

| Path | Purpose |
|------|--------|
| `docs/AUTH-SETUP.md` | Auth setup, file changes, SQL to run, QA checklist. |
| `docs/ROLE-BASED-ACCESS.md` | Permission matrix, assumptions, setting roles, file summary. |
| `docs/REALTIME.md` | Realtime vs polling, subscription lifecycle, conflict strategy (panel open), enabling Realtime, QA. |
| `docs/AUDIT-TRAIL.md` | DB-trigger recommendation, audit design, SQL, retrieval, file summary. |
| `docs/OFFLINE-RESILIENCE.md` | What is/isn’t supported offline, queue design, replay, duplicate prevention, file summary, QA. |
| `docs/BACKUP-RECOVERY.md` | In-app BACKUP export, Supabase backup/PITR recommendations, runbook draft, gaps. |
| `docs/STATION-WORKFLOW-AUDIT.md` | Workflow audit of Press/QC/Floor Manager (UX priorities, not code). |
| `docs/INFORMATION-ARCHITECTURE.md` | IA/UX notes (not code). |

### Other

| Path | Purpose |
|------|--------|
| `README.md` | Project overview and usage. |
| `.env.local.example` | Example env (if present). |
| `DEPLOYMENT_CONSISTENCY_REPORT.md` | Deployment/report artifact (if present). |

---

## 2. What appears implemented in code

*Based only on current files. “Present” = logic and UI exist in code; not verified at runtime.*

### Launcher / station entry

- **Present.** `#modeScreen` with Admin, Floor Manager, Press (picker p1–p4), QC; `enterByLauncher(choice, pressId)`; last choice persisted in localStorage; `applyLauncherByRole()` shows/hides buttons by `getAuthRole()`. Main files: `index.html`, `app.js`.

### Admin shell

- **Present.** `#app` with bar, nav (Floor, Jobs, Todos, QC Log, Audit), sync bar, FAB; pages pg-floor, pg-jobs, pg-todos, pg-qc, pg-audit; `renderAdminShell()` → renderStats, renderPresses, renderFloor, renderJobs, renderTodos, renderQC, renderTV. Main files: `index.html`, `app.js`, `styles.css`.

### Press Station

- **Present.** `#pressStationShell`, `openPressStation(pressId)`, `renderPressStationShell()`, log pressed (+10/+25/+50/+100), hold/resume, save note; `getStationContext()` / `getStationPress()` / `getStationJob()`; permissions from `getStationEditPermissions()` (press: canLogPressProgress only when on assigned press when role is press). Main files: `app.js`, `index.html`, `styles.css`.

### QC Station

- **Present.** `#qcStationShell`, `openQCStation()`, `renderQCStationShell()`, job picker, reject-type buttons, today summary, log; `logQC()`; permissions (qc role: canLogQC). Main files: `app.js`, `index.html`, `styles.css`.

### Floor Manager

- **Present.** `#floorManagerShell`, `openFloorManager()`, `renderFloorManagerShell()`, stats row, press grid, floor table with EDIT → floor card; floor card overlay with quick edit (status, press, location, due, notes, assembly) gated by `canEditField()` / `getStationEditPermissions()`. Main files: `app.js`, `index.html`, `styles.css`.

### Auth UI / auth flow

- **Present.** `#loginScreen` (email, password, error div, SIGN IN); `authBootstrap()`: if no URL/key → show launcher; else init Supabase, getSession; if session → fetch profile, show launcher, onAuthStateChange; else show login, `wireLoginForm()`; form submit → signInWithPassword, fetch profile, show launcher. `doLogout()`: stopDataSync, signOut when Supabase auth, show login. Main files: `index.html`, `app.js`, `supabase.js`, `styles.css`.

### Realtime / polling

- **Present.** When `useSupabase()`: `startRealtime()` subscribes to postgres_changes (jobs, presses, todos, progress_log, qc_log) via `PMP.Supabase.subscribeRealtime()`; debounced callback: if panel open → show “Data updated elsewhere” notice, else `loadAll()`. Otherwise `startPollInterval()` (15s). `stopDataSync()` on logout. Main files: `app.js`, `supabase.js`.

### Role-based UI behavior

- **Present.** `getAuthRole()`, `getAuthAssignedPressId()` from `window.PMP.userProfile`; `mayEnterStation(choice, pressId)`; `getStationEditPermissions()` derives from role (admin/full, floor_manager/floor card only, press/log progress on own press only, qc/log QC only); `applyLauncherByRole()` shows/hides launcher buttons by role; `enterByLauncher` enforces `mayEnterStation`, uses assigned_press_id for press role. Main files: `app.js`, `index.html`.

### Floor card / panel behavior

- **Present.** Slide panel for full job edit (admin) or floor card for quick edit (floor manager); `openPanel(id)` vs `openFloorCard(id)` by `canUseFullPanel`; `panelOpen` guard for realtime (no overwrite when open, show notice); `closePanel()` hides data-changed notice. Main files: `app.js`, `index.html`, `styles.css`.

### CSV import/export

- **Present.** `exportCSV()`: jobs to CSV (catalog, artist, album, …), download; `importCSV(input)`: parse CSV, push jobs to S, `Storage.saveJobs()`. Main files: `app.js`, `index.html`.

### Theme / minimal mode

- **Present.** `toggleMinimalTheme()`, `applyMinimalThemeFromStorage()`; `themeMinimal` in localStorage; `body.theme-minimal` in CSS (bar, mode, syncbar, fab, TV). Main files: `app.js`, `index.html`, `styles.css`.

### Offline (snapshot + queue + replay)

- **Present.** Snapshot in localStorage after successful load; on load failure (Supabase) use snapshot, set offline, show banner; queue for progress, qc, job_status when offline; `onOnline` → loadAll, replayQueue, loadAll. Main files: `app.js`, `index.html`, `styles.css`.

### Audit (admin)

- **Present.** Nav item “AUDIT” (admin only), pg-audit with limit dropdown and LOAD; `loadAuditPage()` calls `PMP.Supabase.getAuditLog({ limit })`, renders table. Main files: `app.js`, `index.html`, `styles.css`, `supabase.js`.

### Backup export

- **Present.** Bar button “💾 BACKUP” (admin), `exportBackup()`: JSON with jobs, presses, todos, qc_log, progress_log, version, exportedAt; download. Main files: `app.js`, `index.html`.

---

## 3. Supabase / SQL files present

| File | What it does | Classification |
|------|--------------|----------------|
| `supabase/schema.sql` | Creates jobs, progress_log, presses, todos, qc_log and indexes. | Foundational. |
| `supabase/auth-and-profiles.sql` | Creates profiles, RLS on profiles, handle_new_user trigger on auth.users. | Foundational for auth. |
| `supabase/policies.sql` | Enables RLS on all five tables; adds “authenticated full access” and “anon full access” policies. | Foundational (broad access). |
| `supabase/rls-roles-migration.sql` | Adds assigned_press_id; get_my_role, get_my_press_id, job_on_my_press; drops policies from policies.sql; adds role-based policies. | Follow-up (replaces broad with role-based). |
| `supabase/realtime-publication.sql` | ALTER PUBLICATION supabase_realtime ADD TABLE for the five tables. | Follow-up (required for Realtime). |
| `supabase/audit-log-migration.sql` | audit_log table, audit_trigger_func, triggers, RLS on audit_log, profiles_admin_select_all, audit_log_with_actor view. | Follow-up. |
| `supabase/seed.sql` | Inserts demo jobs, presses, todos, progress_log, qc_log. | Optional (demo data). |

### Recommended run order

1. **schema.sql** — base tables.
2. **auth-and-profiles.sql** — profiles and trigger (requires Auth enabled in Dashboard).
3. **policies.sql** — RLS and broad policies.  
   *If you will use role-based RLS, you can skip policies.sql and go straight to rls-roles-migration.sql after auth-and-profiles; rls-roles-migration drops the policies that policies.sql creates. Running policies.sql then rls-roles-migration is also valid.*
4. **rls-roles-migration.sql** — role-based RLS (drops anon/authenticated full access; requires profiles.role and optionally assigned_press_id set for users).
5. **realtime-publication.sql** — Realtime subscriptions.
6. **audit-log-migration.sql** — audit trail (depends on get_my_role from rls-roles-migration).
7. **seed.sql** — optional, for demo data.

*Uncertainty:* If `policies.sql` has already been run in production and you want to keep anon for a while, running `rls-roles-migration.sql` will drop those policies; confirm intent before running.

---

## 4. Runtime dependencies and integration points

- **Supabase auth:** Email/password; session in Supabase client. Config: `window.SUPABASE_URL`, `window.SUPABASE_ANON_KEY` (set in index.html before supabase.js). Auth used for: login gate, profile fetch (role, assigned_press_id), RLS (authenticated vs anon).
- **Supabase data API:** All reads/writes go through `PMP.Supabase` (loadAllData, saveJob, deleteJob, savePresses, saveTodos, logProgress, logQC). Client created in `initSupabase()`; used after launcher entry when `useSupabase()` is true.
- **RLS:** Enforced in DB. App assumes: with role-based migration, only admin sees audit_log; press can update only own press and jobs on that press; qc can insert qc_log and progress_log (rejected). UI hides actions by role but does not replace RLS.
- **Realtime:** Single channel `pmp-ops-data` for postgres_changes on five tables; subscription created in `startRealtime()`, removed in `stopDataSync()`. Requires realtime-publication.sql and Realtime enabled.
- **Local fallback:** When `!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY` or `initSupabase()` returns false, `useSupabase()` is false; Storage uses `safeGet/safeSet(STORE_KEY)` (localStorage) and `scheduleSave()`; no auth gate, launcher shows all stations.
- **Polling fallback:** When not using Supabase, `startPollInterval()` runs 15s interval → `loadAll()` (skipped when panel open). When using Supabase, Realtime is used instead (no 15s poll).
- **localStorage:** STORE_KEY (pmp_ops_data) for local data; themeMinimal; launcher last choice (pmp_launcher_last); offline snapshot (pmp_offline_snapshot), offline queue (pmp_offline_queue).
- **Globals / scripts:** Expects `window.SUPABASE_URL`, `window.SUPABASE_ANON_KEY`, `window.supabase` (from CDN), then `supabase.js` sets `window.PMP.Supabase`. App relies on `window.PMP.userProfile` (role, assigned_press_id) after login.

Wiring: index.html loads config → Supabase CDN → supabase.js → app.js. On load, app.js runs theme apply, then authBootstrap (if URL/key set) or showLauncher. After login (or in local mode), enterByLauncher runs loadAll and startPolling (Realtime or interval).

---

## 5. Known risk areas from inspection

- **Role logic split:** Permissions are enforced in both UI (getStationEditPermissions, applyLauncherByRole, mayEnterStation) and DB (RLS). If RLS is not applied or out of sync with app (e.g. policies.sql still active with anon full access), DB may allow more than the UI suggests. Manual confirmation of RLS is required.
- **policies.sql vs rls-roles-migration.sql:** Running both leaves “anon full access” in place until rls-roles-migration runs (it drops them). If only policies.sql is run, any anon client can read/write everything. Run order and intent must be clear.
- **profiles.role and assigned_press_id:** App and RLS depend on profiles rows and correct role/assigned_press_id. Null role or missing profile → RLS may return no rows (get_my_role() null). No in-app UI to set role; must be done in Dashboard or SQL.
- **Realtime publication:** If realtime-publication.sql is not run, subscribeRealtime will not receive events; app will not break but updates will not push until next load or (if polling were used) next poll. Easy to forget.
- **Panel open / data-changed notice:** Realtime applies only when panel is closed; when open, a notice is shown and user must “Refresh view.” If they ignore it and save, their save overwrites server state; no merge logic.
- **Offline replay and duplicates:** Queue replay removes item only on success. Ambiguous success (e.g. server applied but response lost) can lead to retry and duplicate progress_log/qc_log rows. No idempotency keys in schema.
- **Audit view and profiles_admin_select_all:** audit_log_with_actor joins profiles; admin must be able to read other users’ profiles. audit-log-migration adds “profiles_admin_select_all”. If that policy is missing, view may return null for changed_by_email/display_name.
- **Launcher visibility and role:** applyLauncherByRole() runs when showLauncher() runs; if userProfile is not yet loaded (e.g. race), role can be null and launcher may show all buttons. Same for “No role assigned” (hasProfileNoRole): depends on userProfile.role being explicitly null vs undefined.
- **Export button visibility:** exportBtn and backupBtn visibility are set in enterByLauncher and enterApp; if another code path shows the app without setting these, they could be wrong. Single place (enterByLauncher/enterApp) reduces but does not eliminate risk.
- **No automated tests:** No test files found. All behavior is only as good as manual QA.

---

## 6. Things that need manual confirmation

- [ ] Supabase schema.sql has been run
- [ ] auth-and-profiles.sql has been run
- [ ] policies.sql has been run (or intentionally skipped in favor of rls-roles-migration)
- [ ] rls-roles-migration.sql has been run
- [ ] realtime-publication.sql has been run
- [ ] audit-log-migration.sql has been run (if audit is required)
- [ ] Email auth enabled in Supabase Dashboard
- [ ] profiles rows exist for test users (trigger or backfill)
- [ ] roles assigned to users (profiles.role)
- [ ] assigned_press_id set for press users
- [ ] login works (with Supabase URL/key set)
- [ ] logout works
- [ ] session restore on refresh works
- [ ] RLS behaves correctly per role (admin/floor_manager/press/qc)
- [ ] Realtime updates appear across two browsers/tabs
- [ ] Local fallback works when Supabase URL/key removed or init fails
- [ ] Station launcher shows only allowed stations per role
- [ ] Press station logging works (and only for assigned press when role is press)
- [ ] QC reject logging works
- [ ] Floor manager inspect/edit (floor card quick edit) works and is gated by role
- [ ] Audit page loads for admin and shows rows (and fails or is hidden for non-admin)
- [ ] Backup export downloads JSON with all five data areas
- [ ] Offline: snapshot used when network fails after one good load; queue replays on online
- [ ] Service worker: app loads from cache when offline (after one prior load)

---

## 7. Immediate next steps

1. **Verify in code / repo**  
   - Confirm SQL run order in docs matches the intended deployment (schema → auth-and-profiles → policies or rls-roles → realtime → audit → seed).  
   - Confirm no duplicate or conflicting RLS policies (e.g. policies.sql anon still present after rls-roles-migration).

2. **SQL in Supabase**  
   - Run schema.sql, auth-and-profiles.sql, then either policies.sql or rls-roles-migration.sql (and ensure anon is disabled if production).  
   - Run realtime-publication.sql if Realtime is required.  
   - Run audit-log-migration.sql if audit is required.  
   - Create at least one user (Auth → Users), confirm profile exists, set role (and assigned_press_id for press).

3. **Manual test**  
   - Login → launcher → Admin: full nav, export, backup, audit.  
   - Logout → login again; refresh with session → launcher without login.  
   - Second role (e.g. press with assigned_press_id): launcher shows only Press, enter and log progress.  
   - Two browsers: change data in one, confirm Realtime in the other (and panel-open notice when panel is open).  
   - Turn off network after one load: confirm OFFLINE and cached data; queue a write; turn on network and confirm replay.

4. **Defer until stable**  
   - Restore from backup JSON (no in-app restore).  
   - Idempotent offline replay.  
   - In-app role/assigned_press_id management.  
   - Automated tests.

---

## 8. Open questions / blockers

- **Production anon policy:** policies.sql adds anon full access “for demo.” If that file was run and rls-roles-migration is not run, production is wide open. Blocker until clarified and fixed.
- **Role assignment workflow:** Roles are set in Supabase (Table Editor or SQL) only. No documented “who sets roles” or “how to onboard a new press user” in-app. Process blocker for operations.
- **PITR / backup ownership:** BACKUP-RECOVERY.md names runbook owners as placeholders. Blocker for production handoff until owners are assigned and runbook is adopted.
- **Realtime vs polling fallback:** If Realtime subscription fails (e.g. CHANNEL_ERROR), app does not automatically fall back to 15s polling; it only logs. Could leave user with stale data until refresh or next explicit action. Unclear if intentional.
- **Audit table and RLS:** audit_log INSERT is allowed for any authenticated user (trigger runs as invoker). If a non-admin could trigger a write on an audited table, they would also insert into audit_log. Acceptable; only SELECT is admin-only. No blocker but worth noting.
