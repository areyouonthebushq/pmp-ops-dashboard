# PMP OPS — Task Flow Audit

**Goal:** Audit main task flows: where the app is smooth, where it’s clumsy, and where workflow breaks product trust. Workflow/task audit, not style.

**Roles:** admin, press, qc, floor_manager, guest/demo.

---

## 1. Top real tasks per role

| Role | Top tasks (most likely) |
|------|-------------------------|
| **Admin** | Sign in and reach useful overview; find a specific job; create a new job; edit an existing job; log production (or delegate); log QC (or delegate); assign job to press; inspect plant state (floor/presses); return to launcher or switch context. |
| **Press** | Sign in (or skip if guest); choose press and enter work surface; see what job is active; log pressed quantity; hold/resume or add note; return to launcher. |
| **QC** | Sign in; enter logging surface; choose a job; log pass; log reject with defect type; review recent QC activity; return to launcher. |
| **Floor manager** | Sign in; inspect jobs/presses; spot bottlenecks or risk; make lightweight changes (status, press, due) if allowed; return to launcher. |
| **Guest/demo** | Skip login; reach launcher; try Admin (full app) or Press/QC; same tasks as the chosen role. |

---

## 2. Flow audits (structured)

### 2.1 Admin: Sign in and reach useful overview

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Login screen (if auth on) → email/password → Sign in; then launcher. Launcher → Admin. |
| 2 | **Required screens** | Login → Launcher → App (default Floor). |
| 3 | **Steps** | Login: 2 fields + 1 click. Launcher: 1 click (Admin). Total ~4–5 actions. |
| 4 | **Obvious or hidden** | Obvious. Single path. |
| 5 | **Context switches** | Login → Launcher (context: "choose where to go") → App (context: "you’re in admin"). |
| 6 | **Smooth** | Default page is Floor; immediate value (press status + active jobs). |
| 7 | **Friction** | If auth fails, generic "Sign in failed"; no "forgot password" or clear next step. |
| 8 | **Think too hard** | Minimal. "Admin" vs "Floor Manager" (hidden) — no choice overload. |
| 9 | **Redundant/confusing** | — |
| 10 | **Smallest improvement** | Copy (clearer sign-in error); optional "Forgot password?" if in scope. |

---

### 2.2 Admin: Find a specific job

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Already in app (Floor or Jobs). Floor: table + search. Jobs: table + filter + search. |
| 2 | **Required screens** | Floor page or Jobs page; optional: open panel or floor card for detail. |
| 3 | **Steps** | Option A: Floor → use search "FILTER BY CATALOG, ARTIST, ALBUM…" → scan table → click catalog. Option B: Jobs → filter (e.g. PRESSING) + search "SEARCH JOBS…" → click row. 2–4 actions. |
| 4 | **Obvious or hidden** | Obvious. Search and filter are visible. |
| 5 | **Context switches** | None if staying on same page; click opens panel (slide-over) or floor card (overlay). |
| 6 | **Smooth** | Search is instant (debounced); filter is one dropdown; table sort by catalog. |
| 7 | **Friction** | Floor filter is stat chips (presses, active, queued, overdue, total) — not a text filter; "find by catalog" requires typing in search. Jobs has both filter and search; Floor has search + stat filter. Slight inconsistency. |
| 8 | **Think too hard** | "Do I go to Floor or Jobs?" — Floor = "on the floor" view, Jobs = full list. Acceptable. |
| 9 | **Redundant/confusing** | Two places to find jobs (Floor vs Jobs); both valid but user may not know which to use first. |
| 10 | **Smallest improvement** | Copy/layout: clarify in nav or hint "Floor = active view, Jobs = full list." |

---

### 2.3 Admin: Create a new job

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Floor or Jobs → FAB (+) → New Job chooser → "Manual Entry". |
| 2 | **Required screens** | Chooser modal → Wizard (5 steps: Identity, Production, Spec, Ops, Review) → Save. |
| 3 | **Steps** | 1 (FAB) + 1 (Manual Entry) + 5 wizard steps (Next/Save) + optional duplicate modal. ~8–10 clicks/taps. |
| 4 | **Obvious or hidden** | FAB is visible on Floor/Jobs; "Manual Entry" is clear. Wizard steps are labeled (Step 1 — Identity, etc.). |
| 5 | **Context switches** | App → modal (chooser) → modal (wizard) → possibly duplicate modal → back to app. |
| 6 | **Smooth** | Wizard collects in chunks; Review step shows summary; Save closes and shows toast. |
| 7 | **Friction** | 5 steps can feel long for "quick add"; duplicate-job modal interrupts flow ("Create Anyway" vs "Open Existing"); no "Save and add another." |
| 8 | **Think too hard** | Step names (Identity, Production, Spec, Ops) are a bit abstract; fields are clear. |
| 9 | **Redundant/confusing** | "Import CSV" next to Manual Entry — two create paths; chooser is fine but can distract. |
| 10 | **Smallest improvement** | Copy (step names or single "Quick add" path); optional "Add another" after save; state handling (duplicate modal less alarming). |

---

### 2.4 Admin: Edit an existing job

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Floor table (click catalog) or Jobs table (click row) → panel opens. Or floor card from Floor click → QUICK EDIT. |
| 2 | **Required screens** | Panel (slide-over) or Floor card (overlay). Panel: must click EDIT to enable fields; then SAVE JOB. |
| 3 | **Steps** | Find job (1–2) + open (1) + EDIT (1) + edit fields + SAVE JOB (1). 4–6+ actions. |
| 4 | **Obvious or hidden** | Opening job is obvious (click); EDIT toggle is visible but "view first" is not obvious to everyone — some may expect to edit immediately. |
| 5 | **Context switches** | Table → panel (context: "this job"); or table → floor card (lighter context). |
| 6 | **Smooth** | Panel scrolls; all sections in one place; SAVE closes panel and refreshes. |
| 7 | **Friction** | Two entry points (panel vs floor card) with different depth; "why can’t I edit?" until they see EDIT. Footer (SAVE/CANCEL) only visible in edit mode — good, but EDIT must be discovered. |
| 8 | **Think too hard** | Minimal once EDIT is found. |
| 9 | **Redundant/confusing** | Panel has many sections (Details, Format, Assets, Progress, Notes, Billing); can feel overbuilt for "change status." Floor card is simpler for status/press/due only. |
| 10 | **Smallest improvement** | Copy/button naming: e.g. "Edit job" or tooltip "Click EDIT to change fields"; or optional "Open in quick edit" from table. |

---

### 2.5 Admin: Log production (from LOG page or panel)

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Nav → LOG. Then: select job (dropdown "Choose job"), choose mode PRESS, numpad, LOG PRESS. Or: Panel → Progress → + LOG STACK (person, stage, qty). |
| 2 | **Required screens** | LOG page (job picker + mode + numpad + enter) or Panel Progress section. |
| 3 | **Steps** | LOG: 1 (go LOG) + 1 (select job) + 1 (PRESS already default or tap) + numpad + 1 (LOG PRESS) = 4–5+. Panel: open job + EDIT (if needed) + scroll to Progress + fill person/stage/qty + + LOG STACK = 5–7. |
| 4 | **Obvious or hidden** | LOG page is obvious; job dropdown and PRESS/PASS/REJECT are clear. Panel progress is one of several sections — slightly hidden. |
| 5 | **Context switches** | From Floor/Jobs to LOG (nav); or stay in panel and scroll. |
| 6 | **Smooth** | LOG: select job → tap qty → enter; toast confirms. Numpad is fast. |
| 7 | **Friction** | LOG: "Choose job" dropdown can be long; no recent-job shortcut. Panel: must open job first; progress is below fold. |
| 8 | **Think too hard** | "PRESS vs PASS vs REJECT" — clear once learned. Stage in panel ("PRESSED", "QC PASSED", "REJECTED") matches. |
| 9 | **Redundant/confusing** | Two ways to log production (LOG page vs panel); both valid — LOG is dedicated, panel is "while editing." |
| 10 | **Smallest improvement** | Routing/layout: default LOG to last-used job or "most active"; or copy "Last: Job X" on LOG. |

---

### 2.6 Admin: Log QC (pass or reject)

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | LOG page → select job → PASS or REJECT → numpad → LOG PASS or (for reject) defect picker → choose type. |
| 2 | **Required screens** | LOG page; for reject: sub-overlay (defect type buttons) + CANCEL. |
| 3 | **Steps** | Pass: same as production (select job, PASS, qty, LOG PASS). Reject: + 1 (LOG REJECT) + 1 (defect type) = one more step. |
| 4 | **Obvious or hidden** | Obvious. PASS and REJECT are next to PRESS. |
| 5 | **Context switches** | Reject opens defect picker (modal) — clear context "choose type." |
| 6 | **Smooth** | Pass is same flow as press. Reject: defect buttons are labeled (FLASH, BLEMISH, etc.); CANCEL exits. |
| 7 | **Friction** | After entering qty and LOG REJECT, user must then pick defect — two-phase; could be one screen (qty + type) for reject. |
| 8 | **Think too hard** | Defect types are domain terms; fine for QC users. |
| 9 | **Redundant/confusing** | — |
| 10 | **Smallest improvement** | Layout: optional combined reject screen (qty + type) to reduce steps; or keep as-is and add copy "Enter qty, then choose defect type." |

---

### 2.7 Admin: Inspect current plant state

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Floor page (default after Admin). Stats row + press cards + active jobs table. |
| 2 | **Required screens** | Floor only for high-level; Jobs for full list; LOG for recent activity; optional Progress detail overlay per job. |
| 3 | **Steps** | 0 (already on Floor) or 1 (click Jobs/LOG). Click job → panel or floor card or progress detail. |
| 4 | **Obvious or hidden** | Very obvious. Floor is first screen; stats and table are visible. |
| 5 | **Context switches** | None if staying on Floor; nav to Jobs/LOG is one click. |
| 6 | **Smooth** | Single glance: press status, counts, table. Click catalog → detail. |
| 7 | **Friction** | Stats row uses stat chips (presses, active, queued, overdue, total) — clicking filters table but label may not say "click to filter." |
| 8 | **Think too hard** | Minimal. |
| 9 | **Redundant/confusing** | — |
| 10 | **Smallest improvement** | Copy: "Click a stat to filter" or similar. |

---

### 2.8 Admin: Return to launcher or switch context

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Bar → EXIT. |
| 2 | **Required screens** | Launcher. |
| 3 | **Steps** | 1 click (EXIT). |
| 4 | **Obvious or hidden** | Obvious. EXIT in bar. |
| 5 | **Context switches** | App → Launcher. |
| 6 | **Smooth** | One tap; launcher shows "Last: Admin" (or Press/QC) and OPEN. |
| 7 | **Friction** | Label "EXIT" vs launcher "SIGN OUT" — same area, different words; minor. |
| 8 | **Think too hard** | — |
| 9 | **Redundant/confusing** | — |
| 10 | **Smallest improvement** | Copy: unify EXIT vs SIGN OUT or add tooltip. |

---

### 2.9 Press: Sign in → choose press → enter work surface

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Login (if auth) → Launcher. Launcher shows only "Press" (picker); tap Press → row of presses (Press 1, 2, 3, 7") → tap one. |
| 2 | **Required screens** | Launcher → press picker row → Press station shell. |
| 3 | **Steps** | 1 (Press) + 1 (Press 1/2/3/7") = 2. |
| 4 | **Obvious or hidden** | Obvious. One button then four press buttons. |
| 5 | **Context switches** | Launcher → full-screen press station (no app nav). |
| 6 | **Smooth** | Minimal steps; press operator lands on their press and job. |
| 7 | **Friction** | If role is press with assigned_press_id, launcher might auto-select that press (code uses effectivePressId); otherwise picker is clear. |
| 8 | **Think too hard** | — |
| 9 | **Redundant/confusing** | — |
| 10 | **Smallest improvement** | Routing: if role has single assigned press, consider going straight to station (one less click). |

---

### 2.10 Press: Identify active job and log pressed quantity

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Already on press station. Job name and progress at top; numpad below. |
| 2 | **Required screens** | Press station only. |
| 3 | **Steps** | Read job (0) + enter qty on numpad + 1 (LOG +N PRESSED). 2 actions. |
| 4 | **Obvious or hidden** | Very obvious. Job title and "X REMAINING"; numpad and one primary button. |
| 5 | **Context switches** | None. |
| 6 | **Smooth** | Best flow in app: dedicated surface, one job, one action. |
| 7 | **Friction** | If no job assigned, message says "Assign a job from Admin" — press can’t fix that themselves. |
| 8 | **Think too hard** | — |
| 9 | **Redundant/confusing** | — |
| 10 | **Smallest improvement** | Copy: "No job on this press. Ask admin to assign one." |

---

### 2.11 Press: Recover if wrong surface / return to launcher

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | ← BACK (top of station). |
| 2 | **Required screens** | Launcher (or Admin if admin). |
| 3 | **Steps** | 1 (BACK). |
| 4 | **Obvious or hidden** | Obvious. |
| 5 | **Context switches** | Station → Launcher. |
| 6 | **Smooth** | One tap. |
| 7 | **Friction** | If they chose wrong press (e.g. Press 2 instead of 1), they must BACK → Launcher → Press → other press. No "switch press" on station. |
| 8 | **Think too hard** | — |
| 9 | **Redundant/confusing** | — |
| 10 | **Smallest improvement** | Routing: optional "Switch press" on station that returns to launcher picker without full logout. |

---

### 2.12 QC: Sign in → enter logging surface

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Login → Launcher. Launcher shows only "QC" → tap QC. |
| 2 | **Required screens** | Launcher → App with LOG page active. |
| 3 | **Steps** | 1 (QC). |
| 4 | **Obvious or hidden** | Obvious. One button. |
| 5 | **Context switches** | Launcher → App (nav visible: Floor, Jobs, LOG). |
| 6 | **Smooth** | One tap; LOG is default page. |
| 7 | **Friction** | QC sees full nav (Floor, Jobs, LOG). They may click Floor or Jobs and see FAB and full list — role boundary issue; for "enter logging surface" the flow is fine. |
| 8 | **Think too hard** | — |
| 9 | **Redundant/confusing** | Nav suggests QC can do more than log (Floor, Jobs); can distract. |
| 10 | **Smallest improvement** | Role visibility: hide or de-emphasize Floor/Jobs for QC, or keep LOG as only actionable page. |

---

### 2.13 QC: Choose job → log pass or reject with defect

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | LOG page: dropdown "Choose job", then PRESS/PASS/REJECT, numpad, enter. Reject: then defect picker. |
| 2 | **Required screens** | LOG page; defect overlay for reject. |
| 3 | **Steps** | Select job (1) + mode (1 if not default) + numpad + LOG (1). Reject: + defect (1). 4–5. |
| 4 | **Obvious or hidden** | Obvious. |
| 5 | **Context switches** | Defect picker for reject. |
| 6 | **Smooth** | Same as admin LOG flow; job list is alphabetical (catalog). |
| 7 | **Friction** | Job dropdown can be long (all non-done jobs); no "recent" or "pressing only" shortcut. |
| 8 | **Think too hard** | — |
| 9 | **Redundant/confusing** | — |
| 10 | **Smallest improvement** | Layout/routing: optional filter for job dropdown (e.g. pressing/assembly only for QC). |

---

### 2.14 QC: Review recent QC activity / return to launcher

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | LOG page: "RECENT" (per-job log) and "QC LOG" (date-based) below shell. Return: bar EXIT (same as admin). |
| 2 | **Required screens** | LOG page (scroll or already visible). |
| 3 | **Steps** | 0 (RECENT and QC LOG on same page). EXIT: 1. |
| 4 | **Obvious or hidden** | RECENT and QC LOG sections are below the LOG shell; may need scroll. |
| 5 | **Context switches** | None for review. EXIT → Launcher. |
| 6 | **Smooth** | Same page; date nav for QC LOG. |
| 7 | **Friction** | "RECENT" is per selected job; "QC LOG" is global by date. Two different "recent" concepts. |
| 8 | **Think too hard** | "RECENT" vs "QC LOG" — first is "this job’s log," second is "all QC today." Copy could clarify. |
| 9 | **Redundant/confusing** | Slight: two lists with similar names. |
| 10 | **Smallest improvement** | Copy: e.g. "This job’s log" vs "QC log (by date)." |

---

### 2.15 Floor manager: Sign in → inspect / lightweight changes → return

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Login → Launcher. **Floor Manager button is hidden** for floor_manager role. They can only choose Admin (rejected), Press, or QC. |
| 2 | **Required screens** | N/A — FM cannot reach FM shell. If they enter QC they get LOG; if Press they get press station. |
| 3 | **Steps** | **Blocker:** No path to "inspect jobs/presses as FM" or "lightweight changes." |
| 4 | **Obvious or hidden** | FM option is hidden. |
| 5 | **Context switches** | — |
| 6 | **Smooth** | — |
| 7 | **Friction** | Entire flow is broken for FM role. |
| 8 | **Think too hard** | — |
| 9 | **Redundant/confusing** | — |
| 10 | **Smallest improvement** | Routing/role visibility: show Floor Manager launcher button for floor_manager and enter FM shell. |

---

### 2.16 LOG / unified logger: Choose job → mode → quantity → commit; reject defect flow

| # | Aspect | Detail |
|---|--------|--------|
| 1 | **Entry point** | Nav LOG → dropdown "Choose job" → PRESS/PASS/REJECT (mode) → numpad → LOG PRESS / LOG PASS / LOG REJECT. Reject: sub-modal with defect buttons. |
| 2 | **Required screens** | LOG page; reject defect overlay. |
| 3 | **Steps** | Job (1) + mode (0–1) + numpad + enter (1). Reject: + defect (1). |
| 4 | **Obvious or hidden** | Obvious. |
| 5 | **Context switches** | Reject adds one modal layer. |
| 6 | **Smooth** | Mode is always visible; numpad is consistent; enter button updates label (LOG PRESS / LOG PASS / LOG REJECT). |
| 7 | **Friction** | Enter button disabled until job + qty; no default job (e.g. last used). Reject: two steps (qty then type) could be one. |
| 8 | **Think too hard** | Minimal. |
| 9 | **Redundant/confusing** | — |
| 10 | **Smallest improvement** | State handling: remember last-selected job for LOG; optional single screen for reject (qty + type). |

---

## 3. Per-flow summary: role, task, path, friction, severity, fix category

| Role | Task | Current path | Friction points | Severity | Smallest fix category |
|------|------|--------------|------------------|----------|-----------------------|
| Admin | Sign in, reach overview | Login → Launcher → Admin → Floor | Generic sign-in error; no forgot password | Low | Copy |
| Admin | Find a job | Floor or Jobs → search/filter → click row/catalog | Two places (Floor vs Jobs); stat filter vs search | Low | Copy / layout |
| Admin | Create job | FAB → Manual Entry → wizard 5 steps → Save | 5 steps feel long; duplicate modal interrupts | Medium | Copy / state handling |
| Admin | Edit job | Floor/Jobs → click → panel → EDIT → edit → SAVE | EDIT not obvious; two entry points (panel vs card) | Medium | Button naming / copy |
| Admin | Log production | LOG: job → PRESS → qty → enter; or Panel Progress + LOG STACK | Panel progress below fold; LOG no "last job" | Low | Layout / state handling |
| Admin | Log QC | LOG: job → PASS or REJECT → qty → (reject) defect | Reject is two-phase (qty then type) | Low | Layout |
| Admin | Inspect plant | Floor (default); Jobs; LOG; progress detail | Stat chips not obviously clickable filter | Low | Copy |
| Admin | Return / switch | Bar EXIT → Launcher | EXIT vs SIGN OUT wording | Low | Copy |
| Press | Sign in, choose press | Launcher → Press → pick Press 1/2/3/7" | Two clicks; could be one if single assigned press | Low | Routing |
| Press | Identify job, log qty | Station: read job → numpad → LOG +N PRESSED | None | — | — |
| Press | Wrong press / return | BACK → Launcher → Press → other press | No "switch press" without full exit | Medium | Routing |
| QC | Enter logging | Launcher QC → LOG page | Sees Floor/Jobs nav; FAB on those pages | High (role) | Role visibility |
| QC | Choose job, log pass/reject | LOG: job dropdown → mode → qty → enter; reject + defect | Long job list; no "pressing only" | Medium | Layout / routing |
| QC | Review recent, return | LOG page RECENT + QC LOG; EXIT | RECENT vs QC LOG naming | Low | Copy |
| Floor manager | Inspect / light edit | **No path** — FM button hidden | Cannot reach FM shell | **Blocker** | Routing / role visibility |
| LOG (any) | Full flow | LOG → job → mode → qty → commit; reject → defect | No last-job default; reject two steps | Medium | State handling / layout |

---

## 4. Top 10 most important task flows

1. **Press: Enter station → see job → log pressed qty** — Core production logging; currently smooth.
2. **Admin: Reach Floor overview** — Core operational visibility; smooth (default page).
3. **Admin: Create one job (wizard)** — Core job records; medium friction (steps, duplicate modal).
4. **Admin: Edit one job (panel)** — Core job records; medium friction (discover EDIT).
5. **QC: Enter LOG → select job → log pass or reject** — Core quality logging; friction from nav/FAB and long job list.
6. **Admin: Log production from LOG page** — Core; low friction.
7. **Admin: Assign job to press (Floor)** — Core ops; smooth (dropdown on card).
8. **Admin: Find a job (search/filter)** — Core; low friction, slight inconsistency Floor vs Jobs.
9. **Floor manager: Inspect jobs/presses and light edit** — Important for FM role; **blocked** (no FM entry).
10. **Any: Return to launcher / switch context** — Core; smooth (EXIT / BACK).

---

## 5. Top 10 friction points across the app

1. **Floor manager cannot enter Floor Manager** — Launcher hides FM for FM role; no path to FM shell. **Blocker** for FM. Fix: routing / role visibility.
2. **QC sees Floor and Jobs and FAB** — Weakens "QC only logs" story; QC can add jobs. **High.** Fix: role visibility (hide FAB; optional hide nav for QC).
3. **Panel: EDIT not obvious** — New users may not see that they must click EDIT to change fields. **Medium.** Fix: button naming / copy.
4. **Assets overlay: Cancel saves** — Cancel/✕/backdrop save instead of discard; wrong mental model. **High** (trust). Fix: state handling.
5. **Create job: 5-step wizard + duplicate modal** — Feels long; duplicate interrupt is jarring. **Medium.** Fix: copy / state handling (e.g. "Already exists: open or add anyway?").
6. **Press: No "switch press" without exiting** — Wrong press = BACK → Launcher → Press → pick again. **Medium.** Fix: routing.
7. **LOG: No last-job or recent-job default** — Every time: open dropdown, find job. **Medium.** Fix: state handling.
8. **Reject flow: Two steps (qty then defect)** — Could be one screen. **Low.** Fix: layout.
9. **Two places to find jobs (Floor vs Jobs)** — Unclear which to use when. **Low.** Fix: copy.
10. **EXIT vs SIGN OUT** — Same area, different labels. **Low.** Fix: copy.

---

## 6. Smoothest flows

- **Press: Land on station → log pressed qty** — One surface, one job, one action; numpad + one button.
- **Admin: Land on Floor** — Immediate value; press cards + table; one click to job (panel or card).
- **Admin: Assign job to press** — Dropdown on card; select job; done.
- **Return to launcher (EXIT / BACK)** — One click.
- **QC: Enter LOG** — One tap on launcher; LOG page is default.
- **LOG: Log pass** — Same as press log; select job, qty, enter; toast.
- **Search/filter on Floor and Jobs** — Instant (debounced); clear.

---

## 7. Clumsiest flows

- **Floor manager: Any task** — No entry to FM shell; flow is missing.
- **Admin: Create job** — Many steps; duplicate modal in the middle.
- **Admin: Edit job (first time)** — Open job → look for how to edit → find EDIT → then edit.
- **QC: Navigate to Floor/Jobs** — They see full app and FAB; can drift from "just log."
- **Reject with defect** — Enter qty → LOG REJECT → then choose type (two-phase).
- **Assets overlay: Cancel or close** — User expects discard; app saves (trust).

---

## 8. What the app currently does best

- **Role-aware entry** — Launcher shows the right options per role (except FM).
- **Press operator experience** — Focused station, one job, one action, minimal steps.
- **Operational visibility** — Floor as default with press status and active jobs in one view.
- **Unified LOG** — One page for press/pass/reject with clear mode and numpad.
- **Finding jobs** — Search and filter on Floor and Jobs; sort by catalog.
- **Return/exit** — One-tap EXIT or BACK to launcher.
- **Panel depth** — One place for full job edit, progress, assets, notes (once EDIT is found).

---

## 9. Where task design is still fighting the product spine

- **Floor manager** — Spine says "role-aware entry" and "operational visibility," but FM role has no task path (FM entry hidden). Task design for FM is absent.
- **QC scope** — Spine says "QC logs quality"; task design exposes Floor/Jobs and FAB, so "just log" is not enforced by the UI.
- **Create job** — Spine is "job records"; task is supported but wizard length and duplicate modal make the flow feel heavy compared to "log qty in two taps" on press.
- **Edit job** — Spine is "edit existing job"; task is supported but view-first + EDIT is an extra discovery step that power users may not need.
- **Assets** — Spine is "job records (including assets)"; task is supported but Cancel-saves breaks trust and makes the flow feel unsafe.
- **Two ways to log production** — LOG page vs panel Progress; both valid but no guidance on when to use which (spine is clear: "production logging" — having two entry points is okay but could be clarified).

---

*End of audit. No patches applied.*
