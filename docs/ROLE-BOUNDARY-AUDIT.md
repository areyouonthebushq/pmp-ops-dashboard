# PMP OPS — Role Boundary Audit

**Goal:** Audit what each role can see and do, and identify mismatches between intended behavior, visible UI, and DB/RLS expectations. No patches applied.

**Roles:** admin, floor_manager, press, qc, guest/demo (no role or profile.role null).

**Source of role:** `window.PMP.userProfile.role` from Supabase `profiles` (id = auth.uid()). `getAuthRole()` in stations.js; `getStationEditPermissions()` and `mayEnterStation()` drive launcher and panel/floor-card behavior.

---

## 1. Per-role summary

### 1.1 Admin

| Area | Behavior |
|------|----------|
| **Launcher access** | Admin, Press (picker), QC visible. Floor Manager button **hidden** (show(fmBtn, false)). |
| **Visible pages/tabs** | After "Admin": full app — Floor, Jobs, LOG, Audit (navAudit shown). |
| **Visible controls** | FAB on Floor/Jobs; ↓ CSV export; bar EXIT; full panel (EDIT, SAVE, DELETE); press cards with assign dropdown; floor card QUICK EDIT; Audit LOAD. |
| **Allowed writes** | Jobs (CRUD), presses (assign/status), progress log, QC log, assets, todos; audit read-only fetch. |
| **Hidden but reachable** | Floor Manager only via launcher if FM button were shown (currently not). TV, backup (backupBtn display:none in HTML). |
| **RLS mismatch risk** | If Supabase RLS allows only admin to write jobs/presses, aligned. If RLS is permissive, UI is stricter than DB. |
| **Intentional vs accidental** | Admin = full access is intentional. FM button hidden for admin may be intentional (admin uses full app, not FM shell). |

### 1.2 Floor manager

| Area | Behavior |
|------|----------|
| **Launcher access** | Admin, Press, QC visible. **Floor Manager button hidden** (show(fmBtn, false) in applyLauncherByRole). |
| **Visible pages/tabs** | Cannot enter Floor Manager from launcher (button hidden). If they enter Admin, they see full nav (Floor, Jobs, LOG, Audit when role admin — but role is floor_manager so they don’t enter as admin). So they only enter via Admin/Press/QC. When they choose Admin they get mayEnterStation('admin') → false (role === 'floor_manager' allows only choice === 'floor_manager'). So they **cannot enter Admin**. So they can only enter Press (if they pick a press) or QC. So effectively launcher shows Admin but "Not allowed for your role" on Admin; Press works; QC works; **no way to enter Floor Manager** because FM button is hidden. |
| **Visible pages/tabs** | If they enter Press: press station shell only. If they enter QC: LOG page in app. **They never see Floor Manager shell** because the launcher never shows the FM option. |
| **Visible controls** | In QC: LOG page, FAB hidden (LOG page). In Press: press station only. |
| **Allowed writes** | When in QC: canLogPressProgress false, canLogQC true — can log QC. When in FM shell (unreachable): would have canUseFloorCard true. |
| **Hidden but reachable** | N/A — FM shell is not reachable. |
| **RLS mismatch risk** | Same as others; UI blocks FM entry. |
| **Intentional vs accidental** | **Accidental:** Floor Manager role cannot open Floor Manager; launcher hides FM for this role. |

### 1.3 Press

| Area | Behavior |
|------|----------|
| **Launcher access** | Only **Press** (picker) visible. Admin, FM, QC hidden. |
| **Visible pages/tabs** | Press station shell only (no app nav). |
| **Visible controls** | Press name, job info, progress, LOG PRESSED numpad, hold/resume, note. BACK exits to launcher (or admin if admin). |
| **Allowed writes** | canLogPressProgress only when in press station (ctx.stationType === 'press'). Writes: progress log (pressed). Hold/resume/note update job and save. assignJob/setPressStatus are only rendered when S.mode === 'admin', so press never sees them. |
| **Hidden but reachable** | Cannot reach Floor/Jobs/LOG/Audit (no app shell). |
| **RLS mismatch risk** | If RLS restricts progress_log by assigned_press_id or role, must align. |
| **Intentional vs accidental** | Intentional: single-station, log-only for press. |

### 1.4 QC

| Area | Behavior |
|------|----------|
| **Launcher access** | Only **QC** visible. Admin, FM, Press hidden. |
| **Visible pages/tabs** | After "QC": app shell with **LOG** page by default. Nav: FLOOR, JOBS, LOG (AUDIT hidden). So QC **can click FLOOR and JOBS** and see those pages. |
| **Visible controls** | On LOG: job picker, PRESS/PASS/REJECT, numpad, enter. On Floor/Jobs (if they navigate): **FAB (+ ADD JOB)** visible (updateFAB only checks currentPage, not role). Press grid without assign dropdown (S.mode !== 'admin'). |
| **Allowed writes** | canUseFullPanel false → clicking a job opens **floor card**, not panel. canLogQC true. **No UI gate on FAB or wizard:** QC can tap + on Floor/Jobs, open new job chooser, "Manual Entry", complete wizard, and **save a new job** (saveJob/doWizardSave have no role check). |
| **Hidden but reachable** | Floor page, Jobs page, FAB, new job chooser, wizard, job creation. |
| **RLS mismatch risk** | If RLS allows only admin to INSERT jobs, wizard save would fail for QC. If RLS allows any authenticated user to insert jobs, QC can create jobs via UI. |
| **Intentional vs accidental** | **Accidental:** QC is meant to log rejects only; they can currently add jobs and view full job list/floor. |

### 1.5 Guest / demo (no role or profile with role null)

| Area | Behavior |
|------|----------|
| **Launcher access** | When **!role && !hasProfileNoRole**: Admin, Press, QC visible (FM hidden). When **hasProfileNoRole** (logged in, profile exists, role == null): all launcher buttons hidden, "No role assigned" banner. |
| **Visible pages/tabs** | Guest (no profile): can enter Admin, Press, QC. getAuthRole() null → getStationEditPermissions() with !ctx returns **full** (canUseFullPanel true, etc.). So guest in Admin gets full app and full panel. |
| **Visible controls** | Full admin-like when in app (no station context). |
| **Allowed writes** | Same as admin from UI perspective (no role checks). |
| **RLS mismatch risk** | Guest often uses anon or no auth; if Supabase requires auth for writes, guest writes fail. If guest is "demo" with a real user, RLS may allow writes. |
| **Intentional vs accidental** | Intentional for demo: guest = try everything. |

---

## 2. Launcher

| # | Role | Expected boundary | Current behavior | Issue type | Smallest fix |
|---|------|-------------------|------------------|------------|--------------|
| 2.1 | floor_manager | Can enter Floor Manager. | **FM button is hidden** (show(fmBtn, false)). They can only enter Press or QC; Admin is rejected by mayEnterStation. | UI-only | In applyLauncherByRole case 'floor_manager', set **show(fmBtn, true)** so they can enter Floor Manager. |
| 2.2 | admin | Can enter Floor Manager if desired. | FM button hidden for admin too. | UI-only | Optional: show(fmBtn, true) for admin if product wants admin to use FM shell. |
| 2.3 | press | Only own press. | Launcher shows only Press; mayEnterStation enforces pressId; getAuthAssignedPressId() used when choice is press. | — | Aligned. |
| 2.4 | qc | Only QC. | Launcher shows only QC; mayEnterStation('qc') true. | — | Aligned. |
| 2.5 | No role (guest) | Demo full access. | Full launcher (Admin, Press, QC); can enter any; permissions full when !ctx. | — | Aligned. |
| 2.6 | Profile with role null | No access until role assigned. | All launcher buttons hidden; "No role assigned." | — | Aligned. |

---

## 3. Admin shell / nav

| # | Role | Expected boundary | Current behavior | Issue type | Smallest fix |
|---|------|-------------------|------------------|------------|--------------|
| 3.1 | admin | Audit tab visible. | navAudit.style.display = '' when choice === 'admin' and getAuthRole() === 'admin'. | — | Aligned. |
| 3.2 | qc | No Audit; optionally no Floor/Jobs. | Audit hidden. Floor and Jobs **visible**; QC can switch to them and see FAB. | UI-only | Hide FAB for non-admin (e.g. updateFAB: show FAB only if getAuthRole() === 'admin' or !getAuthRole()). Optionally hide Floor/Jobs nav for QC (goPg only to 'log'). |
| 3.3 | floor_manager | N/A (never in app shell). | When entering Admin they are rejected. When entering QC they get LOG. When entering FM they can’t (button hidden). | — | See 2.1. |
| 3.4 | Todos | Nav item id="navTodos" display:none in HTML. | No code found that shows it by role. | — | Either wire to role/feature or leave hidden. |

---

## 4. Floor page

| # | Role | Expected boundary | Current behavior | Issue type | Smallest fix |
|---|------|-------------------|------------------|------------|--------------|
| 4.1 | admin | Full floor; assign job on press cards. | S.mode === 'admin' → isAdmin true; press cards get assign dropdown and link to press station. | — | Aligned. |
| 4.2 | qc | View only; no assign; no + ADD JOB. | S.mode === 'floor'; no assign on cards; **FAB visible** (updateFAB only checks page). Clicking job → openFloorCard (canUseFullPanel false). | UI-only | Gate FAB by role (see 3.2). |
| 4.3 | floor_manager | Would see floor in FM shell. | FM shell not reachable. | — | Fix launcher 2.1. |

---

## 5. Jobs page

| # | Role | Expected boundary | Current behavior | Issue type | Smallest fix |
|---|------|-------------------|------------------|------------|--------------|
| 5.1 | admin | Full jobs; + ADD JOB; Import CSV. | FAB and Import CSV visible. | — | Aligned. |
| 5.2 | qc | View only or no access; no add/import. | QC can navigate to Jobs; **FAB visible**; Import CSV in DOM (no role hide). So QC can add job and could trigger CSV input. | UI-only | Gate FAB; optionally hide Import CSV for non-admin (e.g. by role or canUseFullPanel). |

---

## 6. Right-side panel

| # | Role | Expected boundary | Current behavior | Issue type | Smallest fix |
|---|------|-------------------|------------------|------------|--------------|
| 6.1 | admin | Full panel; EDIT, SAVE, DELETE. | openPanel(id) runs; canUseFullPanel true; DELETE shown when S.mode === 'admin'. | — | Aligned. |
| 6.2 | floor_manager / qc / press | No full panel; open job as floor card. | **openPanel(id)** when id and !perm.canUseFullPanel → **openFloorCard(id)**. So they never see panel for existing job. | — | Aligned. |
| 6.3 | New job | Only admin (or guest) should open panel for new job. | New job is only via wizard (FAB → Manual Entry). openPanel(null) not used from FAB. Wizard and saveJob have **no role check**. | UI-only | Gate FAB (and optionally wizard open) so only admin (or canUseFullPanel) can add job; or add role check in saveJob/doWizardSave and show toast if not allowed. |
| 6.4 | DELETE | Admin only. | delBtn.style.display = S.mode === 'admin' ? '' : 'none'. | — | Aligned. |

---

## 7. Press station

| # | Role | Expected boundary | Current behavior | Issue type | Smallest fix |
|---|------|-------------------|------------------|------------|--------------|
| 7.1 | press | Only assigned press; log pressed only. | mayEnterStation('press', pressId) requires role === 'press' and pressId; getAuthAssignedPressId() can force single press. Launcher for press shows only press picker (no choice of other stations). | — | Aligned. |
| 7.2 | admin | Can open any press from floor. | S.mode === 'admin'; link to press station; no role check in openPressStation. | — | Aligned. |
| 7.3 | canLogPressProgress | Only in press station for press role. | getStationEditPermissions(): press gets canLogPressProgress only when ctx.stationType === 'press'. pressStationLogPressed checks canLogPressProgress. | — | Aligned. |

---

## 8. LOG page

| # | Role | Expected boundary | Current behavior | Issue type | Smallest fix |
|---|------|-------------------|------------------|------------|--------------|
| 8.1 | qc | Can use LOG (press/pass/reject). | canLogQC true; LOG page shown on QC entry. | — | Aligned. |
| 8.2 | admin | Can use LOG. | Full access. | — | Aligned. |
| 8.3 | floor_manager | If in app, LOG might be view-only or no log. | canLogPressProgress false, canLogQC false for floor_manager. So they could view LOG but not submit (unifiedLogEnter calls logJobProgress; no explicit role check there — but LOG page is only shown when they enter QC, and then they have canLogQC from context? No — when floor_manager enters QC, choice is 'qc', so getStationEditPermissions() is for role 'qc'... but role is floor_manager. So when floor_manager is on LOG page (they can’t get there normally because they can’t enter Admin and FM is hidden; if they enter QC they get goPg('log'). When they’re in QC entry, they’re still role floor_manager. getStationEditPermissions() for floor_manager returns canLogQC: false. So they see LOG but shouldn’t be able to log. Is there a check in unifiedLogEnter? No role check in unifiedLogEnter — it just calls logJobProgress. So floor_manager could log if they could get to LOG with a job selected. They can get to LOG by choosing QC from launcher. So floor_manager can open QC, see LOG page, and potentially submit press/pass/reject because there’s no role check in the LOG submit path. | UI + possible DB | Add role/capability check in unifiedLogEnter (and LOG submit path): e.g. require getStationEditPermissions().canLogPressProgress for press, canLogQC for pass/reject, or equivalent. |
| 8.4 | press | No LOG in app (they’re in station). | Press uses press station only. | — | Aligned. |

---

## 9. Audit page

| # | Role | Expected boundary | Current behavior | Issue type | Smallest fix |
|---|------|-------------------|------------------|------------|--------------|
| 9.1 | admin | Can load audit. | loadAuditPage() checks useSupabase() && getAuthRole() === 'admin'; else shows "Audit requires Supabase and admin role." | — | Aligned. |
| 9.2 | Non-admin | No audit tab; no data. | navAudit hidden for non-admin. If they reach audit (e.g. goPg('audit')), loadAuditPage() clears body and shows same hint. | — | Aligned. |
| 9.3 | RLS | Audit read by admin only. | Comment in supabase.js: "RLS enforces". If RLS is not admin-only, non-admin could call getAuditLog from console. | DB | Ensure Supabase audit table/function has RLS allowing only admin role. |

---

## 10. Hidden / non-core areas

| # | Area | Role | Expected boundary | Current behavior | Issue type | Smallest fix |
|---|------|------|-------------------|------------------|------------|--------------|
| 10.1 | TV mode | Admin / operator. | enterTV() from bar; no role check. Any role that sees the bar can enter TV. | Bar only visible in admin shell; QC sees bar when on LOG. So QC can click ⬛ TV. | UI-only | Optional: hide TV button for non-admin. |
| 10.2 | QC bar button | Admin quick jump to LOG. | Button in HTML style="display:none"; no code shows it. So hidden for everyone. | — | Aligned (or intentionally hidden). |
| 10.3 | Backup export | Admin. | backupBtn display:none; only set to '' for admin in returnToAdmin. | — | Aligned. |
| 10.4 | CSV export | Admin. | exportBtn shown when choice === 'admin'. | — | Aligned. |
| 10.5 | goPg / direct nav | QC can call goPg('floor') etc. | No route guard; nav items are in DOM. So QC can click FLOOR, JOBS. | UI-only | Optionally guard goPg: if role === 'qc' and id !== 'log', ignore or redirect to log. |
| 10.6 | Floor card quick edit | canUseFloorCard only. | getStationEditPermissions().canUseFloorCard; QUICK EDIT and edit row only when perm.canUseFloorCard. | — | Aligned. |

---

## 11. RLS / DB expectations

| # | Area | Expected boundary | Current behavior | Issue type | Smallest fix |
|---|------|-------------------|------------------|------------|--------------|
| 11.1 | jobs | Only admin (and allowed roles) insert/update/delete. | App uses anon key + auth; writes go through Supabase client. **No role check in saveJob/deleteJob** — UI prevents panel/delete for non-admin, but QC can create via wizard. | Both | 1) Enforce RLS on jobs so only admin (or intended roles) can INSERT/UPDATE/DELETE. 2) Gate FAB/wizard so QC cannot open add-job flow. |
| 11.2 | presses | Only admin assign/update. | assignJob/setPressStatus only rendered for S.mode === 'admin'. If RLS allows any user to update presses, press operator could call from console. | DB | RLS on presses: only admin (or service role) can update. |
| 11.3 | progress_log / qc_log | press/qc can insert own logs. | No role check in app before logProgress/logQC. RLS should restrict by role or assigned_press_id. | DB | RLS: allow insert for authenticated user with appropriate role or press assignment. |
| 11.4 | profiles | Read by own user; role from profile. | getProfile(userId) with auth.uid(); no write in app. | — | RLS: select own profile only. |
| 11.5 | audit | Read admin only. | loadAuditPage only when getAuthRole() === 'admin'. Supabase comment says RLS enforces. | DB | Confirm audit read RLS is admin-only. |

---

## 12. Mismatch summary table

| # | Role | Page/flow | Expected boundary | Current behavior | UI / DB / Both | Smallest fix |
|---|------|-----------|-------------------|------------------|----------------|--------------|
| M1 | floor_manager | Launcher | Can enter Floor Manager | FM button hidden; cannot enter FM | UI | show(fmBtn, true) for floor_manager |
| M2 | qc | Floor / Jobs | No add job | FAB visible; can open chooser and wizard and save job | UI (+ DB if RLS permissive) | Gate FAB (and wizard) by canUseFullPanel or role === 'admin' |
| M3 | qc | Nav | LOG only (optional) | Can open Floor and Jobs | UI | Optional: restrict goPg for qc to 'log' only |
| M4 | floor_manager | LOG (if entered as QC) | Cannot log | canLogQC false but no check in unifiedLogEnter; could submit | UI (+ DB) | Check canLogPressProgress/canLogQC in LOG submit path |
| M5 | All non-admin | Jobs | No CSV import (optional) | Import CSV visible to anyone on Jobs page | UI | Optional: hide import CSV for !admin |
| M6 | qc | Panel | Never full panel | openPanel redirects to floor card | — | Aligned |
| M7 | admin | Floor Manager | Optional entry | FM button hidden for admin | UI | Optional: show FM for admin |
| M8 | - | RLS jobs | Only admin (or intended) write | UI blocks but wizard/saveJob have no role check | Both | RLS + UI gate on add job |
| M9 | - | RLS audit | Admin read only | loadAuditPage checks role; comment says RLS | DB | Verify RLS |
| M10 | qc | TV | Optional hide | QC sees bar and can enter TV | UI | Optional: hide TV for non-admin |

---

## Permission matrix by role

| Capability | admin | floor_manager | press | qc | guest (no role) |
|------------|-------|----------------|-------|-----|------------------|
| Launcher: Admin | ✓ | ✗ (rejected) | ✗ | ✗ | ✓ |
| Launcher: Floor Manager | ✗ (hidden) | ✗ (hidden) | ✗ | ✗ | ✗ |
| Launcher: Press | ✓ | ✓ | ✓ (only) | ✗ | ✓ |
| Launcher: QC | ✓ | ✓ | ✗ | ✓ (only) | ✓ |
| Nav: Floor | ✓ | N/A | N/A | ✓ (reachable) | ✓ |
| Nav: Jobs | ✓ | N/A | N/A | ✓ (reachable) | ✓ |
| Nav: LOG | ✓ | N/A | N/A | ✓ (default) | ✓ |
| Nav: Audit | ✓ | N/A | N/A | ✗ | ✗ |
| FAB (+ ADD JOB) | ✓ | N/A | N/A | ✓ (bug) | ✓ |
| Full panel (open job) | ✓ | ✗ → floor card | ✗ | ✗ → floor card | ✓ |
| Floor card quick edit | ✓ | ✓ (if in FM) | ✗ | ✗ | ✓ |
| Delete job | ✓ | N/A | N/A | N/A | ✓ |
| Press assign / status | ✓ | N/A | N/A | N/A | ✓ |
| Log press (progress) | ✓ | ✗ | ✓ (in station) | ✗ | ✓ |
| Log QC (pass/reject) | ✓ | ✗ (no check in submit) | ✗ | ✓ | ✓ |
| Import CSV | ✓ | N/A | N/A | ✓ (visible) | ✓ |
| Export CSV | ✓ | N/A | N/A | ✗ | ✗ |
| Audit load | ✓ | N/A | N/A | ✗ | ✗ |
| TV mode | ✓ | N/A | N/A | ✓ (can enter) | ✓ |

---

## Top 10 role-boundary mismatches

1. **floor_manager cannot enter Floor Manager** — Launcher hides FM button for floor_manager. **Fix:** show(fmBtn, true) for role floor_manager.
2. **QC can add jobs** — FAB and wizard have no role check; QC can complete "Manual Entry" and save. **Fix:** Show FAB only when getAuthRole() === 'admin' or !getAuthRole() (guest); or check canUseFullPanel. Optionally block wizard open for QC.
3. **QC sees Floor and Jobs** — QC can switch to Floor/Jobs and see full list and FAB. **Fix:** Gate FAB (fixes add); optionally restrict nav for QC to LOG only.
4. **LOG submit has no role check** — unifiedLogEnter / logJobProgress path doesn’t check canLogPressProgress/canLogQC; floor_manager on LOG could submit. **Fix:** In unifiedLogEnter (or before logJobProgress), require getStationEditPermissions().canLogPressProgress for press, .canLogQC for pass/reject.
5. **Floor Manager button hidden for admin** — Admin cannot use FM shell from launcher. **Fix:** Optional: show(fmBtn, true) for admin if product wants that.
6. **Import CSV visible to QC** — Jobs page shows "↑ IMPORT CSV" for any role that can see Jobs. **Fix:** Hide import CSV when getAuthRole() !== 'admin' (or !canUseFullPanel).
7. **RLS may allow QC to insert jobs** — If Supabase jobs table has permissive INSERT, QC could write via wizard or console. **Fix:** RLS: allow job INSERT/UPDATE/DELETE only for admin (or intended roles).
8. **Guest has full UI access** — No role → full permissions when !ctx. **Fix:** Intentional for demo; if not, treat !role as restricted.
9. **TV button visible to QC** — QC sees bar with ⬛ TV. **Fix:** Optional: hide TV for non-admin.
10. **Panel EDIT visibility** — New job opens panel in edit mode with EDIT button hidden; existing job shows EDIT. No role-based hide for EDIT (non-admin never get panel). **Fix:** None needed; aligned.

---

## What should be hidden or disabled before demo

- **Fix before demo (high impact):**
  - **Floor Manager for floor_manager role:** Show Floor Manager launcher button for role floor_manager so they can enter FM shell.
  - **FAB for QC:** Hide FAB when role is qc (or when !canUseFullPanel) so QC cannot open new job chooser or add jobs.
- **Recommended (medium impact):**
  - **LOG submit role check:** Ensure only users with canLogQC can submit pass/reject and only canLogPressProgress can submit press (prevents floor_manager on LOG from logging if they get there).
  - **Import CSV:** Hide for non-admin so QC doesn’t see it on Jobs.
- **Optional (polish):**
  - Restrict QC nav to LOG only (hide Floor/Jobs tabs for qc).
  - Hide TV for non-admin.
  - Show Floor Manager launcher button for admin if product wants admin to use FM view.
- **DB/RLS (verify, not UI):**
  - Ensure RLS on jobs restricts INSERT/UPDATE/DELETE to admin (or intended roles).
  - Ensure audit read is admin-only.
  - Ensure progress_log / qc_log allow insert only for appropriate roles or assignment.

---

*End of audit. No patches applied.*
