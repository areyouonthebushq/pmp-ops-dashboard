# PMP OPS — Prototype Spine Audit

**Goal:** Audit the product for **spine vs sprawl**: what is core to the prototype story, what supports it, what distracts or weakens trust, and what should be hidden or deferred before demo. No patches applied.

**Lens — a credible prototype spine should clearly show:**
- **Role-aware entry** — who you are determines where you land (admin vs press vs QC).
- **Job records** — create, view, edit jobs; catalog/artist/status/format/progress.
- **Production logging** — log pressed quantities (floor/LOG/press station).
- **Quality logging** — log QC pass and rejects (with defect type).
- **Persistence** — saves hit storage/DB; sync/offline behavior is understandable.
- **Operational visibility** — floor view, press status, job list, progress.

---

## 1. Classification by surface/feature

### Launcher

| Classification | Notes |
|----------------|--------|
| **Core spine** | Yes. Single entry point; role drives which buttons are visible (admin/press/QC); "Last: … OPEN" reinforces station choice. |
| **Supporting** | Sign out, local-mode banner, "No role assigned" — all support credibility. |
| **Distracting** | "◇ PIZZAZ" and TV are not on launcher but bar; launcher itself is clean. |
| **Should hide** | — |
| **Defer** | Floor Manager button is hidden for all roles (and broken for floor_manager); FM is non-core for minimal spine. |

**Verdict:** Core. Role-aware entry is the spine. Fix FM for floor_manager if FM is part of story; otherwise keep hidden.

---

### Login

| Classification | Notes |
|----------------|--------|
| **Core spine** | Yes, if auth is on. Establishes identity and role (profile). |
| **Supporting** | Guest demo button for "no login" tryout. |
| **Distracting** | — |
| **Should hide** | If demo is guest-only, login can be skipped (already optional when !authRequired()). |
| **Defer** | — |

**Verdict:** Core when Supabase auth is required; supporting (guest path) when not.

---

### Floor page

| Classification | Notes |
|----------------|--------|
| **Core spine** | Yes. Press status (cards), active jobs table, search/filter, assign job (admin). Directly shows "operational visibility" and job records in context. |
| **Supporting** | Stats row (presses, active, queued, overdue), recent done, + ADD JOB. |
| **Distracting** | — |
| **Should hide** | — |
| **Defer** | — |

**Verdict:** Core. Lean into floor as the main "what’s running" view.

---

### Jobs page

| Classification | Notes |
|----------------|--------|
| **Core spine** | Yes. Full job list; status filter; search; sort; open job (panel or floor card). Job records + visibility. |
| **Supporting** | + ADD JOB, Import CSV, table vs cards layout. |
| **Distracting** | Import CSV is powerful but secondary; can confuse "is this about single jobs or bulk?" |
| **Should hide** | Import CSV before demo if story is "one job at a time" and you don’t want to explain bulk. |
| **Defer** | — |

**Verdict:** Core. Optional: hide or downplay Import CSV for a tight "job lifecycle" story.

---

### Right-side panel (job detail)

| Classification | Notes |
|----------------|--------|
| **Core spine** | Yes. Edit job, progress section (+ LOG STACK), assets, notes. Shows "job records" and "production logging" (progress) in one place. |
| **Supporting** | Billing (collapsed), suggested status, DELETE (admin). |
| **Distracting** | Many sections can feel dense; billing is optional and can dilute focus. |
| **Should hide** | Billing already collapsed; DELETE only for admin. No need to hide more if demo stays on one job. |
| **Defer** | Billing details until "phase 2" story. |

**Verdict:** Core. Panel is the spine for "edit job + log progress." Lean into one job, EDIT, SAVE, + LOG STACK.

---

### Press station

| Classification | Notes |
|----------------|--------|
| **Core spine** | Yes. Single-press view; job; progress; LOG PRESSED numpad. Pure "production logging" for press operator. |
| **Supporting** | Hold/resume, note field; BACK to launcher/admin. |
| **Distracting** | — |
| **Should hide** | — |
| **Defer** | — |

**Verdict:** Core. Ideal for "press operator logs qty" story. Stable and focused.

---

### LOG page

| Classification | Notes |
|----------------|--------|
| **Core spine** | Yes. Select job → PRESS / PASS / REJECT → numpad → enter. Production + quality logging in one place; recent entries and QC log below. |
| **Supporting** | Date nav for QC log, reject defect picker. |
| **Distracting** | Two section styles (shell vs below-fold); RECENT vs QC LOG can be explained in one sentence. |
| **Should hide** | — |
| **Defer** | — |

**Verdict:** Core. LOG is the spine for "log press and QC in one screen." Lean into job picker → action → numpad → success toast.

---

### Audit page

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. Visibility into *history* of changes, not live ops. |
| **Supporting** | Yes. Shows "we persist and we can see who changed what" — supports trust in persistence. |
| **Distracting** | If broken (no Supabase or no RLS), empty/error weakens trust. Technical ("LOAD", "Limit") can distract from job/floor/LOG. |
| **Should hide** | Only if Supabase/audit isn’t ready; otherwise keep for admin as supporting. |
| **Defer** | Don’t lead with audit in demo; use as "and we can see change history" at the end. |

**Verdict:** Supporting. Valuable for credibility; hide or avoid in demo if not working.

---

### New job chooser + wizard

| Classification | Notes |
|----------------|--------|
| **Core spine** | Yes. "Add a job" is part of job records. Manual Entry wizard is the main path. |
| **Supporting** | Import CSV option in chooser. |
| **Distracting** | Duplicate-job modal and "Create Anyway" can derail a clean demo if you hit a duplicate. |
| **Should hide** | — |
| **Defer** | Don’t demo bulk import in spine story; keep wizard as the only create path for demo. |

**Verdict:** Core (wizard). Use "Manual Entry" as the only create path in demo; avoid CSV.

---

### Floor card (statboard / quick edit)

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. It’s a detail view of one job from floor/jobs. |
| **Supporting** | Yes. Quick edit (status, press, location, due, notes) without opening full panel; supports "operational visibility" and light edits. |
| **Distracting** | If QUICK EDIT is buggy or save is fire-and-forget (see write-path audit), failure can weaken trust. |
| **Should hide** | No. |
| **Defer** | Demo can stay on "click catalog → panel" for edit; use floor card as "we can also do quick edit from floor." |

**Verdict:** Supporting. Good for "quick tweak from floor"; don’t lean on it if you haven’t hardened save feedback.

---

### Assets overlay

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. Assets are part of job record but not the main "logging" story. |
| **Supporting** | Yes. "Tap to mark received" and expand for details; supports job completeness. |
| **Distracting** | Cancel/✕/backdrop **saving** instead of discarding (interaction audit) — wrong mental model and can confuse. |
| **Should hide** | No. |
| **Defer** | Fix Cancel/discard before demo; otherwise avoid opening assets overlay in demo or show read-only "we track assets" only. |

**Verdict:** Supporting. Use only after fixing discard behavior; don’t lead with it.

---

### Progress detail overlay

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. It’s a read-only breakdown of progress. |
| **Supporting** | Yes. Shows pressed/QC/rejected/remaining; supports "operational visibility" and trust in numbers. |
| **Distracting** | — |
| **Should hide** | — |
| **Defer** | — |

**Verdict:** Supporting. Good one-click "show me the breakdown" for a job.

---

### Confirm dialog (delete / mark done / duplicate)

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. It’s a pattern, not a feature. |
| **Supporting** | Yes. Delete and "Mark as DONE?" confirmations support safe destructive actions. |
| **Distracting** | — |
| **Should hide** | — |
| **Defer** | — |

**Verdict:** Supporting. Keep; don’t demo delete unless you want to show "we don’t lose data by accident."

---

### Bar (EXIT, TV, QC, CSV, BACKUP, MIN)

| Classification | Notes |
|----------------|--------|
| **Core spine** | EXIT and mode badge support "role-aware" and "where I am." |
| **Supporting** | ↓ CSV (export), QC (quick jump to LOG for admin). |
| **Distracting** | **⬛ TV** — theatrical/kiosk mode; "◇ PIZZAZ" inside TV. Fun but not spine; can look half-finished or gimmicky. **💾 BACKUP** (when shown) is for power users, not first story. **MIN** (minimal theme) is polish. |
| **Should hide** | **TV** before demo if you don’t want to explain kiosk mode. **BACKUP** already hidden by default. |
| **Defer** | TV, BACKUP, MIN until "we also have TV view and export" story. |

**Verdict:** Bar is supporting; TV is distracting for spine. Hide TV button or don’t click it in demo.

---

### TV mode

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. |
| **Supporting** | Could be "we can show a big screen for the floor" — optional. |
| **Distracting** | Yes. Theatrical effect (PIZZAZ), ticker, "ORDERS IN PROGRESS" — feels like a different product slice; unfinished or niche. |
| **Should hide** | Yes, for a tight spine demo. Hide bar button "⬛ TV" or don’t use. |
| **Defer** | Yes. Introduce only as "we also have a TV/kiosk view" after spine. |

**Verdict:** Distracting. **Should hide before demo** if spine is "roles, jobs, logging, persistence, visibility."

---

### QC station shell

| Classification | Notes |
|----------------|--------|
| **Core spine** | Partially. Same "quality logging" as LOG page but in a dedicated shell (job list + reject buttons). |
| **Supporting** | Yes. Alternative to LOG for QC-only role; reinforces role-aware entry. |
| **Distracting** | Section label "TODAY (total = units · pills = events by type)" is developer-speak; can confuse. |
| **Should hide** | No. |
| **Defer** | Fix copy on TODAY section; otherwise QC station is good for "QC role lands here and logs rejects." |

**Verdict:** Supporting / secondary spine. Use for "QC role" demo; fix TODAY label.

---

### Floor Manager shell

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. Not in minimal spine. |
| **Supporting** | Could be "floor overview for FM role" — but launcher **hides FM for all roles** (see role audit), so FM is currently unreachable for floor_manager. |
| **Distracting** | — |
| **Should hide** | Already effectively hidden (button not shown). |
| **Defer** | Yes. Fix launcher to show FM for floor_manager only when FM is part of roadmap; else keep hidden. |

**Verdict:** **Should defer.** Currently broken (FM can’t enter); keep hidden until fixed and product wants FM in story.

---

### Audit (nav + page)

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. |
| **Supporting** | Yes. "We have an audit log" supports persistence and trust. |
| **Distracting** | If load fails or "Audit requires Supabase and admin role" shows, it’s a downer. |
| **Should hide** | Only if audit backend isn’t ready. |
| **Defer** | Don’t lead demo with it; use as closing "and admins can see change history." |

**Verdict:** Supporting. **Don’t demo first;** use as trust-builder at end if it works.

---

### Todos page

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. |
| **Supporting** | No for spine. Task lists are orthogonal to "job records + production/quality logging." |
| **Distracting** | Yes. Nav item is **display:none**; if enabled, adds a whole other concept (daily/weekly/standing tasks). |
| **Should hide** | Yes. Keep navTodos hidden. |
| **Defer** | Yes. Todos are a separate product thread. |

**Verdict:** **Distracting / should hide.** Already hidden; keep it that way for spine demo.

---

### CSV import / export

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. |
| **Supporting** | Export supports "we can get data out"; import supports bulk onboarding. |
| **Distracting** | Import can fail partially (write-path audit); "IMPORT CSV" on Jobs can suggest bulk is primary. |
| **Should hide** | Import: optional hide for "single-job" demo. Export: keep for "we can export" but don’t lead. |
| **Defer** | Don’t demo import in spine; defer to "bulk onboarding" story. |

**Verdict:** Supporting (export); import **defer or hide** for spine. Don’t demo import unless you’re ready to explain partial failure.

---

### Backup export (JSON)

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. |
| **Supporting** | Power-user safety net. |
| **Distracting** | Button hidden by default; if shown, "backup" can confuse with "export." |
| **Should hide** | Yes. Keep backupBtn hidden for demo. |
| **Defer** | Yes. |

**Verdict:** **Should hide / defer.** Already hidden; keep.

---

### Offline banner + replay

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. |
| **Supporting** | Yes. "Offline — showing cached data" + "N change(s) queued" and replay on online support **persistence** and "it works when the network is flaky." |
| **Distracting** | If replay fails or queue grows and never drains, trust drops. |
| **Should hide** | No. Don’t hide; but don’t demo offline unless you’ve tested replay. |
| **Defer** | Demo online first; mention "we queue writes when offline and sync when back" as supporting. |

**Verdict:** Supporting. Lean into it only if you’ve validated replay; otherwise avoid triggering offline in demo.

---

### Sync bar (READY / SYNCED / SAVING / ERR / OFFLINE)

| Classification | Notes |
|----------------|--------|
| **Core spine** | No. |
| **Supporting** | Yes. Makes **persistence** visible (saving, synced, error). |
| **Distracting** | Initial "● READY" doesn’t match state machine (see style/microcopy audits); minor. |
| **Should hide** | No. |
| **Defer** | — |

**Verdict:** Supporting. Keep; good for "see, it saved" moment.

---

### FAB (+ ADD JOB)

| Classification | Notes |
|----------------|--------|
| **Core spine** | Yes. Primary way to add a job (with wizard). |
| **Supporting** | — |
| **Distracting** | Shown to QC on Floor/Jobs (role audit); QC can add jobs. Weakens "role-aware" story. |
| **Should hide** | For QC: yes (gate by role). For admin: no. |
| **Defer** | — |

**Verdict:** Core for admin. **Hide or gate for QC** before demo so QC doesn’t see + ADD JOB.

---

### Login (auth)

| Classification | Notes |
|----------------|--------|
| **Core spine** | Yes when auth is on. Role comes from profile after sign-in. |
| **Supporting** | Guest demo when auth optional. |
| **Distracting** | — |
| **Should hide** | — |
| **Defer** | — |

**Verdict:** Core when using Supabase auth; supporting (guest) when not.

---

## 2. Non-core items: why they weaken or distract, stability, hide/disable/ignore

| Item | Why it weakens or distracts | Unstable? | Action |
|------|-----------------------------|-----------|--------|
| **TV mode** | Different mental model (kiosk/theatrical); PIZZAZ and ticker feel like a second product. | Not unstable, but niche. | **Hide** bar TV button before demo; or **ignore** (don’t click). |
| **Floor Manager** | FM role can’t enter FM (launcher hides button); weakens "role-aware entry." | Broken. | **Hide** (already); **defer** until launcher fixed and FM in scope. |
| **Todos** | Adds task-list concept; not part of "jobs + logging" spine. | Stable but off-story. | **Hide** (nav already hidden). **Ignore.** |
| **Backup export** | Power-user; "backup" vs "export" can confuse. | Stable. | **Hide** (button already hidden). |
| **Import CSV** | Bulk and partial-failure behavior; distracts from single-job flow. | Partial failure possible. | **Defer** or **don’t demo**; optional hide on Jobs for spine. |
| **Assets overlay Cancel** | Cancel saves instead of discarding; wrong mental model. | Interaction bug. | **Fix** before demo or **don’t open** assets overlay in demo. |
| **Audit page** | If Supabase/audit not ready, empty or error weakens trust. | Can be broken if backend missing. | **Don’t demo** if not working; **ignore** or hide nav for demo. |
| **QC station TODAY label** | "units · pills = events by type" is developer language. | Copy only. | **Fix** or **ignore** (don’t read it aloud). |
| **FAB for QC** | QC sees + ADD JOB on Floor/Jobs; weakens role story. | Boundary bug. | **Hide** (gate FAB by role) before demo. |
| **Billing section (panel)** | Optional; dilutes "job + progress" focus. | Stable. | **Ignore** (keep collapsed); **defer** in narrative. |

---

## 3. Recommended prototype spine (one paragraph)

**Note:** Press Station shell purged. These paths are now accessed via LOG console and Floor. See `purgatory-protocol.md`.

The prototype spine is: **role-aware entry** (launcher shows Admin, Floor Manager, QC by role; optional login); **job records** (create one job via FAB → Manual Entry wizard, edit in panel, view on Floor and Jobs); **production logging** (log pressed qty from LOG page; Press Station purged — use LOG console); **quality logging** (log QC pass and rejects with defect type on LOG page or QC Station); **persistence** (every save hits Supabase with sync bar feedback, optional offline queue and replay); and **operational visibility** (Floor = press status + active jobs + assign; Jobs = full list and filters; panel and floor card for detail and quick edit). Anything that doesn’t directly support this — TV, Todos, Floor Manager (until fixed), backup, and leading with Audit or CSV import — should be hidden, deferred, or not demoed so the spine reads clearly.

---

## 4. Top 10 things to avoid / demo-hide

1. **TV mode** — Hide bar "⬛ TV" or don’t click; theatrical/kiosk view distracts from spine.
2. **Floor Manager** — Keep launcher FM hidden; FM role can’t enter anyway; defer until fixed and in scope.
3. **Todos** — Keep nav hidden; task lists are off-story.
4. **Backup button** — Keep hidden.
5. **Import CSV** — Don’t demo; partial failure and bulk story weaken spine; optional hide on Jobs.
6. **Assets overlay** — Don’t open in demo until Cancel/discard is fixed, or show only "we track assets" without editing.
7. **Audit page** — Don’t open if backend isn’t ready or shows errors.
8. **Leading with Audit or CSV** — Don’t start demo with "and here’s audit/import"; use as optional trust-builder at end.
9. **QC creating jobs** — Gate FAB for QC so demo doesn’t accidentally show QC adding a job.
10. **PIZZAZ / TV ticker** — Don’t enter TV or toggle effects; keep focus on floor/jobs/LOG/panel.

---

## 5. Top 10 things to lean into in a live demo

1. **Launcher by role** — Show "as admin I see Admin, Floor Manager, QC Station; as QC I only see QC." (Press Station launcher purged.)
2. **One job end-to-end** — FAB → Manual Entry → fill catalog/artist/status → Save → job appears on Floor and Jobs.
3. **Floor view** — Press status cards, active jobs table, assign job (admin), click catalog → panel or floor card.
4. **Panel: edit + progress** — Open job → EDIT → change status or field → SAVE JOB; then + LOG STACK (person, stage, qty) and show recent entries.
5. **LOG page** — Select job → PRESS → numpad → LOG PRESS → toast and recent; then PASS or REJECT with defect type and show QC log.
6. **LOG + Floor (Press Station purged)** — Press operators use LOG console and Floor; no dedicated Press Station shell.
7. **QC Station or LOG for QC** — Enter as QC → LOG page or QC station → select job → log reject with type; show "we log quality."
8. **Sync bar** — After a save or log, point to "● SYNCED" (or SAVING → SYNCED) to show persistence.
9. **Progress detail** — From floor or panel, open progress breakdown for one job to show pressed/QC/rejected/remaining.
10. **One destructive confirmation** — Optional: "If I try to delete, we ask for confirmation" (then cancel) to show we don’t lose data by accident.

---

*End of audit. No patches applied.*
