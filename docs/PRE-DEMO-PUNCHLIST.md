# PMP OPS — Pre-Demo Punchlist

**Goal:** Synthesize all audits into one prioritized pre-demo action list. No feature ideas, no redesigns, no patching — synthesis only.

**Source docs:** FULL-SYNC-BLOCKER-AUDIT, PAGE-BY-PAGE-STYLE-AUDIT, STYLE-NORMALIZATION-PLAN, TASK-FLOW-AUDIT, PROTOTYPE-SPINE-AUDIT, WRITE-PATH-AUDIT, ROLE-BOUNDARY-AUDIT, INTERACTION-CONSISTENCY-AUDIT, MICROCOPY-AUDIT.

---

## 1. Must fix before demo

Blocker or trust-breaking issues only. Smallest realistic set.

| # | Item | Source audit(s) | Why it matters | Smallest likely fix category | Risk level | Estimate |
|---|------|-----------------|----------------|------------------------------|------------|----------|
| 1.1 | **Confirm delete job — unhandled promise rejection** | FULL-SYNC-BLOCKER, WRITE-PATH | When delete fails (network/RLS), callback throws; panel closes; user sees generic "Sync error" and may believe job was deleted. | State handling: await/catch in confirm callback; do not close panel on failure; toastError on reject. | Low | Small |
| 1.2 | **LOG write (press/pass/reject) — fire-and-forget** | FULL-SYNC-BLOCKER, WRITE-PATH | logJobProgress does not await Storage; success toast and numpad clear before persistence; failures only via unhandledrejection. | State handling: have LOG entry points await write; on failure toastError and do not clear numpad. | Low | Small |
| 1.3 | **onOnline — unhandled rejection** | FULL-SYNC-BLOCKER | loadAll().then(replayQueue).then(loadAll) has no .catch(); reconnect failure leaves queue/banner inconsistent and no user feedback. | State handling: add .catch() on chain; setSyncState('error', { toast: 'Sync failed after reconnect' }). | Low | Tiny |
| 1.4 | **Assets overlay: Cancel / ✕ / backdrop save instead of discard** | INTERACTION-CONSISTENCY, TASK-FLOW, PROTOTYPE-SPINE | Cancel and close are expected to discard; all three currently persist and close. Major breach of trust. | State handling: call closeAssetsOverlay(true) for Cancel, ✕, and backdrop (skipSave = discard). | Low | Small |
| 1.5 | **Offline queue: job_assets not replayed** | FULL-SYNC-BLOCKER, WRITE-PATH | User edits assets offline; on reconnect, job_assets items in queue are never replayed; edits lost. | State handling: in replayQueue(), add branch for type === 'job_assets'; call updateJobAssets with payload. | Medium | Small |

---

## 2. Should fix before demo if time

Meaningful improvements that increase confidence/coherence. Not required for basic demo success.

| # | Item | Source audit(s) | Why it matters | Smallest likely fix category | Risk level | Estimate |
|---|------|-----------------|----------------|------------------------------|------------|----------|
| 2.1 | **QC can add jobs (FAB visible to QC)** | ROLE-BOUNDARY, PROTOTYPE-SPINE, TASK-FLOW | QC sees + ADD JOB on Floor/Jobs; can complete wizard and save; weakens "role-aware" and "QC only logs" story. | Role visibility: gate FAB (and optionally wizard) by getAuthRole() === 'admin' or !getAuthRole() (guest). | Low | Small |
| 2.2 | **Floor manager cannot enter Floor Manager** | ROLE-BOUNDARY, TASK-FLOW, PROTOTYPE-SPINE | FM launcher button hidden for floor_manager; no path to FM shell. Blocker if FM is in demo story. | Role visibility: in applyLauncherByRole for floor_manager, show(fmBtn, true). | Low | Tiny |
| 2.3 | **Auth: fetchAndStoreProfile rejection on sign-in** | FULL-SYNC-BLOCKER | No .catch() on fetchAndStoreProfile; launcher can show with null profile; getAuthRole() null can be over-permissive. | State handling: .catch() on profile fetch; showLoginScreen + toastError; do not show launcher until profile stored. | Low | Tiny |
| 2.4 | **Data changed notice: panel not re-filled after Refresh** | FULL-SYNC-BLOCKER | User clicks "Refresh view"; loadAll runs but open panel content is not re-built from updated S.jobs; stale until re-open. | State handling: in dismissDataChangedNotice, after loadAll() re-run panel fill for S.editId or close panel with toast. | Low | Small |
| 2.5 | **Asset save failure swallowed (overlay/panel)** | FULL-SYNC-BLOCKER, WRITE-PATH | updateJobAssets .catch(() => {}); user may think save succeeded; only sync bar may show ERR. | State handling: replace empty catch with toastError/setSyncState; do not clear overlay on failure. | Low | Tiny |
| 2.6 | **Escape does not close assets / progress detail / floor card** | INTERACTION-CONSISTENCY | Users expect Escape to close any overlay; these three do not close on Escape. | State handling: in keydown Escape handler, if overlay open call closeAssetsOverlay(true) / closeProgressDetail() / closeFloorCard(); preventDefault. | Low | Small |
| 2.7 | **EXIT (bar) vs SIGN OUT (launcher)** | INTERACTION-CONSISTENCY, MICROCOPY | Same "leave" gesture; different labels and semantics (exit to launcher vs sign out of account); confuses. | Copy: unify label (e.g. "EXIT TO LAUNCHER" on bar or both "SIGN OUT" with tooltip). | Low | Tiny |
| 2.8 | **ACTIVE ORDERS vs jobs** | MICROCOPY, PROTOTYPE-SPINE | Floor/FM/TV use "orders"; rest of app uses "jobs"; one concept should use one word. | Copy: replace "ACTIVE ORDERS" with "ACTIVE JOBS" (floor, FM, TV queue title). | Low | Tiny |
| 2.9 | **LOG submit: no role check** | ROLE-BOUNDARY, WRITE-PATH | unifiedLogEnter / logJobProgress don't check canLogPressProgress/canLogQC; floor_manager on LOG could submit. | Role visibility: before logJobProgress for press/pass/reject, check getStationEditPermissions().canLogPressProgress / .canLogQC. | Low | Small |
| 2.10 | **Import CSV visible to QC** | ROLE-BOUNDARY | QC on Jobs page sees "↑ IMPORT CSV"; can trigger bulk flow. | Role visibility: hide Import CSV when getAuthRole() !== 'admin' (or !canUseFullPanel). | Low | Tiny |

---

## 3. Do not touch before demo

Risky or broad changes that could destabilize the app.

- **Containment / layout:** Do not add wrappers or change bar/nav/panel/stations to a new containment model. Do not wrap floor/jobs in a single bordered box. (STYLE-NORMALIZATION-PLAN, PAGE-BY-PAGE-STYLE.)
- **Section label refactor:** Do not change .sec, .log-shell-sec, .station-sec, .form-section sizes or margins (Phase 2 mapping touches many selectors and every page). (STYLE-NORMALIZATION-PLAN.)
- **Button rhythm:** Do not introduce new button classes or change padding/min-height of launcher-btn, bar-btn, .btn, station-back, log-enter-btn, ps-numpad-log (except already-done 2px→1px). (STYLE-NORMALIZATION-PLAN.)
- **Width scale:** Do not change panel width, LOG shell width, or numpad/console widths. (STYLE-NORMALIZATION-PLAN.)
- **Auth/session flow:** Do not change bootstrap, getSession, onAuthStateChange logic; only add .catch for profile load. (FULL-SYNC-BLOCKER.)
- **Realtime subscription:** Do not change event list or debounce logic; only consider re-fill panel on dismissDataChangedNotice. (FULL-SYNC-BLOCKER.)
- **Storage layer signatures:** Do not change saveJob/savePresses/logProgress/logQC/deleteJob signatures; add replay for job_assets and fix confirm delete handler only. (FULL-SYNC-BLOCKER, WRITE-PATH.)
- **LOG console layout:** Do not revert to single-column on mobile; do not change grid or faceplate structure. (FULL-SYNC-BLOCKER.)
- **Role/permissions logic:** getAuthRole, mayEnterStation, getStationEditPermissions — no logic change; only gate UI (FAB, nav, import) and add LOG role check. (ROLE-BOUNDARY.)
- **Audit page structure:** Do not add wrapper or section label to audit unless trivial one-line; avoid HTML/structure change close to demo. (STYLE-NORMALIZATION-PLAN.)
- **Station shell background (QC/FM vs press):** Do not change var(--b1) vs var(--bg) before demo. (STYLE-NORMALIZATION-PLAN.)
- **Todos / Backup:** Keep navTodos and backupBtn hidden; do not enable. (PROTOTYPE-SPINE.)
- **Fire-and-forget hardening (beyond LOG):** Cycle status, assign job, floor card quick edit, panel notes, hold/resume — fixing all before demo is broad; defer to post-demo. (WRITE-PATH.)

---

## 4. Demo-safe surfaces

What we should actively show.

- **Launcher by role** — "As admin I see Admin, Press, QC; as press I only see Press; as QC I only see QC."
- **One job end-to-end** — FAB → Manual Entry wizard → catalog/artist/status → Save → job on Floor and Jobs.
- **Floor view** — Press status cards, active jobs table, assign job (admin), click catalog → panel or floor card.
- **Panel: edit + progress** — Open job → EDIT → change status or field → SAVE JOB; + LOG STACK (person, stage, qty); show recent entries.
- **LOG page** — Select job → PRESS (or PASS/REJECT) → numpad → LOG PRESS → toast and recent; REJECT with defect type and QC log.
- **LOG + Floor (Press Station purged)** — Press operators use LOG console and Floor; LOG +N PRESSED → toast.
- **QC (LOG or QC station)** — Enter as QC → LOG or QC station → select job → log pass or reject with type.
- **Sync bar** — After save or log, point to "● SYNCED" (or SAVING → SYNCED) for persistence.
- **Progress detail** — From floor or panel, open progress breakdown for one job (pressed/QC/rejected/remaining).
- **Delete confirmation (optional)** — "If I try to delete, we ask for confirmation" then cancel; shows we don’t lose data by accident.
- **Guest demo (no auth)** — Launcher, floor, jobs, panel open, LOG UI; writes go to local when Supabase not inited.
- **Signed-in admin** — Full flow: launcher → admin → floor, jobs, panel save, LOG, export; realtime and sync bar.

---

## 5. Demo-risky surfaces

What to avoid or only show carefully.

- **TV mode** — Hide or don’t click; theatrical/kiosk view distracts from spine. (TV button already nerfed to logo click.)
- **Floor Manager** — FM role can’t enter (launcher hides button); keep hidden until fixed and in scope.
- **Todos** — Nav hidden; keep hidden; task lists are off-story.
- **Backup button** — Keep hidden.
- **Import CSV** — Don’t demo; partial failure and bulk story weaken spine; optional hide on Jobs for QC.
- **Assets overlay** — Don’t open in demo until Cancel/discard is fixed; or show only "we track assets" without editing.
- **Audit page** — Don’t open if backend isn’t ready or shows errors; use as optional trust-builder at end only if it works.
- **Leading with Audit or CSV** — Don’t start demo with "here’s audit/import."
- **QC creating jobs** — Gate FAB for QC before demo so QC doesn’t add a job during demo.
- **Delete job when network is flaky** — Rejection not surfaced cleanly until confirm handler is fixed.
- **Asset saves while offline** — job_assets queue not replayed; avoid demonstrating offline asset edits.
- **"Refresh view" after data changed** — Do not assume open panel content is re-filled; it is not until 2.4 is fixed.

---

## 6. Recommended demo story

A short suggested flow using the strongest surfaces.

1. **Role-aware entry** — Sign in (or Guest) → Launcher. Show: "As admin I get Admin, Press, QC; as press only Press; as QC only QC."
2. **One job** — Admin → FAB → Manual Entry → fill catalog, artist, status → Save. Job appears on Floor and Jobs.
3. **Floor** — Point to press status cards and active jobs table; assign a job to a press (dropdown); click a catalog → panel or floor card.
4. **Panel** — Open job → EDIT → change a field → SAVE JOB. Then + LOG STACK (person, stage, qty); show recent progress.
5. **LOG** — Nav → LOG → select same job → PRESS → numpad → LOG PRESS → toast. Then PASS or REJECT with defect type; show recent/QC log.
6. **LOG (Press Station purged)** — Launcher → Admin or QC; use LOG console for job → PRESS → numpad → LOG +N PRESSED → toast.
7. **Sync bar** — After any save or log, point to "● SYNCED" (or SAVING → SYNCED): "Everything persists here."
8. **Optional** — Progress detail for one job; or "If I try to delete, we confirm first" (then cancel). Audit only at the end if it works: "Admins can see change history."

**Do not:** Lead with TV, Audit, or Import CSV. Do not open Assets overlay to edit until Cancel/discard is fixed. Do not demo as QC adding a job (gate FAB first if time).

---

*End of punchlist. No patches applied; synthesis only.*
