# Plant Feedback Synthesis

**Purpose:** Organize recent plant feedback into a clear product/roadmap document so we can separate what fits the current prototype, what is a strong next-phase extension, and what is a larger architectural/scope expansion.

**Current scope:** A real-time dashboard that visually represents the job summary form (jobs, presses, progress, QC, todos). Plant feedback expands into broader operations-system needs.

---

## 1. Executive summary

### What the plant is really asking for

The plant is asking for **three layers at once**:

1. **Better execution in the room** — More accurate counting (spindles, QC, rejects from press vs packing), a console/machine feel, and the ability to log without being blocked by edge cases (e.g. rejects exceeding early press count). This is “make the dashboard we have feel right and handle real production events.”

2. **Richer context and traceability** — Photos/mockups, running comments per job, alerts when a job changes, and a clear change log. This is “we need to see why and when things changed, and attach evidence.”

3. **Integration and source of truth** — Bitrix integration, full stage tracking (from upstream docs/exports), and a decision about where the “real” record lives. This is “we have another system; we need one place that wins.”

### What this means for product direction

- **Now:** The prototype should stay focused on **floor execution and visibility** — job state, press assignment, progress/QC logging, and a stable real-time view. Improvements should be **in-scope refinements** (e.g. counting rules, UI feel, non-blocking reject logging).
- **Next:** The strongest phase-2 bets are **counting accuracy** (spindles, reject types, no artificial blocking), **comments/notes per job**, and **change visibility** (alerts, simple change log) without yet committing to Bitrix or full stage taxonomy.
- **Later:** **Source-of-truth architecture** (Bitrix vs PMP OPS), **full stage pipeline** (many stages from upstream systems), **file/media storage**, and **integrations** are operations-system scope. They should be planned explicitly, not folded into the current dashboard scope.

---

## 2. Organized feedback themes

### 2.1 Visual / UI identity

| Theme | Plain-language summary |
|-------|-------------------------|
| “Make it look more like Pip-Boy” | Request for a distinct, “console” or “machine” aesthetic — high contrast, monospace/technical feel, not generic SaaS. |
| Console / machine feel | UI should feel like equipment: immediate, readable, at-a-glance. Aligns with existing LOG console and status-rail work. (Press Station purged — see `purgatory-protocol.md`.) |
| Detail view on assets / mockups | Need to see assets (and ideally mockups) in context — not just checkmarks, but “what does this look like?” in a detail view. |

**Product takeaway:** Visual identity and “machine feel” fit the current prototype (tone, typography, layout). Asset *detail* view (expand to see more) fits now; full mockup/photo upload and storage is a larger feature.

---

### 2.2 Counting / production events

| Theme | Plain-language summary |
|-------|-------------------------|
| Spindle counting | Physical reality: ~90–120 records per spindle. Production events may be logged by spindle or by count; conversion and display matter. |
| QC counts | QC pass/reject counts need to be first-class and visible; already partially there (qc_passed, rejected in progress log). |
| Rejects from press vs packing | Rejects have **origin** (press vs packing). Today we have reject type (FLASH, BLEMISH, etc.) but not necessarily “where” in the pipeline. |
| Rejects may exceed early press count | Early press runs might show fewer “pressed” than later reject totals (rejects can come from multiple sources or later stages). Logging should not be blocked by “rejects > pressed” validation. |
| Center labels / reject counts | If center-label or other line-item reject counts are available, they are useful for operations. |

**Product takeaway:** The prototype can support **richer counting semantics** (spindle-aware display or entry, reject origin, no hard block when rejects exceed pressed) without becoming a full ERP. Full stage-by-stage reconciliation is later scope.

---

### 2.3 Change tracking / source of truth

| Theme | Plain-language summary |
|-------|-------------------------|
| Bitrix integration question | “Does Bitrix drive us, or do we drive Bitrix?” Need a clear decision: sync from Bitrix, push to Bitrix, or keep separate with manual handoff. |
| Alerts when a job changes | When a job is updated (especially from “elsewhere”), users want to know — e.g. “Data updated elsewhere” already exists; may need in-context alerts or history. |
| Where source of truth lives | Which system is authoritative for job definition, status, and production data? Affects sync direction, conflict handling, and feature set. |
| How to create a change log | Auditable record of who changed what and when. Audit table exists; may need job-level “change history” or “activity” view and clearer exposure in UI. |

**Product takeaway:** Change *visibility* (alerts, job-level history) fits next phase. Source-of-truth *decision* and Bitrix *integration design* are architectural and belong to a dedicated “operations layer” phase.

---

### 2.4 Files / media

| Theme | Plain-language summary |
|-------|-------------------------|
| Upload/store photos for mockups | Attach photos (e.g. mockups, reference art) to jobs or assets so the floor can see “what we’re making.” |
| Asset/media handling in app | Broader need: store and display files (art, specs, photos) in the app rather than only in external tools. |

**Product takeaway:** This is **new capability** — storage, upload UX, and linking to jobs/assets. Fits “next” for a first cut (e.g. one photo per job or per asset type) or “later” if done as full media library and permissions.

---

### 2.5 Comments / communication

| Theme | Plain-language summary |
|-------|-------------------------|
| Running comments page | A dedicated surface (or view) for “running comments” — ongoing notes that accumulate over time. |
| Sortable/filterable by job | Comments should be viewable and filterable by job so the floor can see “what’s been said about this job.” |

**Product takeaway:** Notes and assembly log already exist per job. “Running comments” could be: (a) a **view** over existing notes/assembly (filter by job, sort by time), or (b) a **first-class comments/activity feed** with job filter. (a) fits now/next with minimal new model; (b) is a stronger next-phase feature (e.g. comments table, job_id, timestamps, optional “page” or “channel”).

---

### 2.6 Full stage tracking

| Theme | Plain-language summary |
|-------|-------------------------|
| Represent all intricate stages | Upstream docs/exports (e.g. Bitrix, internal trackers) describe many production stages. Question: how much of that pipeline should PMP OPS model and display? |

**Product takeaway:** The current model (queue → pressing → assembly → hold → done, plus progress log and QC) is a **simplified pipeline**. “Full stage tracking” means either: (a) mapping a subset of upstream stages into our status + progress, or (b) modeling many stages and transitions in PMP OPS. (a) is next-phase (mapping); (b) is later (new stage engine and UI).

---

## 3. Now / Next / Later

### NOW — Fits current prototype direction

- **Console / machine feel** — Continue refining LOG console, status rails, and typography so the app feels like floor equipment. (Press Station purged.)
- **Rejects must not block logging** — Allow logging when rejects exceed current pressed count (or cap validation); treat as “needs reconciliation” instead of hard block.
- **Asset detail view** — Expand asset row or add a simple detail view (e.g. overlay or panel) to see more than checkmarks (labels, who received, dates) using existing asset data.
- **Change visibility in-place** — Improve existing “Data updated elsewhere” and refresh flow; optional: show “recent changes” or last-edited on job/panel without new backend.
- **Comments view by job** — Use existing notes/assembly log; add a way to view and sort “all notes for this job” (and optionally filter by job in a list). No new comments table required for a first cut.

### NEXT — Strong phase-2 features

- **Spindle-aware counting** — Support spindle as unit (e.g. “1 spindle ≈ 100” or configurable); display and optionally log by spindle; keep pressed/QC in same event model.
- **Reject origin (press vs packing)** — Add origin (or “stage”) to reject events; keep existing defect types; show in QC log and job summary.
- **Center labels / reject counts** — If data exists (from QC or manual entry), store and show; may need one or more fields or a small structure per job.
- **Job-level change history** — Expose audit/change log filtered by job (and maybe “recent changes” in panel); may require indexing or a simple activity view.
- **Alerts when a job changes** — Extend “data updated elsewhere” to be job-scoped (e.g. “This job was updated” when panel is open) or a small in-app notification list.
- **Running comments / activity feed** — First-class comments or activity entries with job_id, sortable/filterable by job; new table and UI.
- **First-cut mockup/photo** — One photo per job (or per asset type), upload + store (e.g. Supabase storage), display in panel or asset detail. No full media library yet.

### LATER — Broader scope / architecture

- **Bitrix integration** — Sync direction, conflict resolution, and which system is source of truth. Requires API design, auth, and possibly a sync service.
- **Full stage pipeline** — Model many stages from upstream docs/exports; stage transitions and permissions; new data model and stage-driven UI.
- **Full media/library** — Multiple files per job, versioning, permissions, and browsing. New storage and asset-file model.
- **Plant operating system** — PMP OPS as the central execution and visibility layer (or Bitrix as central with PMP OPS as execution layer); integrations, workflows, and org-wide source of truth.

---

## 4. Architecture implications

| Area | New data model? | Reuse current? | Bigger “plant OS” signal? | Source-of-truth impact |
|------|------------------|----------------|----------------------------|-------------------------|
| Spindle counting | Optional (config or field) | Yes — progress_log, job.qty | No | No |
| Reject origin | Yes — extend qc_log or progress_log | Partially | No | No |
| Change history / alerts | Optional (index over audit) | Yes — audit table | Slight | No |
| Comments feed | Yes — comments/activity table | Notes/assembly as fallback | Slight | No |
| Mockup/photo | Yes — file refs + storage | job or assets link | No | No |
| Full stage pipeline | Yes — stages, transitions | Job status as subset | **Yes** | Maybe (stage ownership) |
| Bitrix integration | Yes — sync state, mappings | Jobs, presses as sync targets | **Yes** | **Yes** |

- **Reuse current models:** Counting tweaks, reject origin, change visibility, and “comments view” can mostly reuse jobs, progress_log, qc_log, audit, and notes/assembly.
- **New but local:** Comments table, file refs + storage, spindle config — extend the app without yet defining a plant-wide source of truth.
- **Source-of-truth decision needed:** Bitrix vs PMP OPS, sync direction, and conflict handling. Full stage pipeline may also force a decision about who “owns” stage transitions.

---

## 5. Source-of-truth options

### Option A: Bitrix as source of truth, dashboard as execution/view layer

- **Idea:** Bitrix holds jobs, stages, and high-level status; PMP OPS syncs down, displays, and writes back **production events** (pressed, QC, rejects) and possibly status updates.
- **Pros:** One place for “what we’re supposed to do”; Bitrix stays master for CRM/tasks; plant uses dashboard for execution only.  
- **Cons:** Dependency on Bitrix API and availability; sync and conflict design; may not support real-time floor needs if Bitrix is slow or coarse-grained.

### Option B: PMP OPS as source of truth for plant execution, Bitrix as upstream

- **Idea:** PMP OPS owns job state and production data on the floor; Bitrix is upstream (import jobs, receive status/production summaries) or read-only reference.
- **Pros:** Dashboard can be optimized for real-time execution and reliability; plant has full control over counting and stages for floor work.  
- **Cons:** Two sources of “job” truth unless sync is well defined; Bitrix may need regular updates from PMP OPS (export or API).

### Option C: Separate with manual handoff (current implicit state)

- **Idea:** No deep integration; Bitrix and PMP OPS stay separate; jobs are created/updated in one place and manually reflected in the other (or via CSV).
- **Pros:** No integration build; clear boundaries.  
- **Cons:** Duplication, drift, and no single “live” view across systems.

**Recommendation:** Do not decide in the current prototype. Ship dashboard improvements (counting, comments, change visibility) and optional “first photo” without Bitrix. In a dedicated **integration/roadmap** phase, compare Bitrix API and plant workflow to choose A, B, or a hybrid (e.g. Bitrix for job creation, PMP OPS for execution and events, sync job status back).

---

## 6. Recommended roadmap

### Top 5 highest-value next additions (phase 2)

1. **Do not block on “rejects > pressed”** — Allow logging; surface “needs reconciliation” if needed. Quick win, removes a real pain.
2. **Reject origin (press vs packing)** — Small schema/UI extension; high operational value for understanding where defects come from.
3. **Job-level change history / “what changed”** — Use or index audit data; show in panel or a simple “activity” view. Builds trust and traceability.
4. **Running comments or activity feed by job** — Either a comments table + job filter or a unified “notes + assembly + comments” view. Improves communication without full Bitrix.
5. **Spindle-aware counting** — Config or field for “records per spindle”; display and optionally log by spindle. Closer to how the floor actually counts.

### Top 5 important but phase-2 (after the five above)

1. **First-cut mockup/photo per job** — One upload per job (or key asset); store and show in panel/asset detail.
2. **Alerts when “this job” changes** — Job-scoped “data updated elsewhere” or a small notification list.
3. **Center labels / reject counts** — If data is available, add fields and show in QC/job summary.
4. **Asset detail view** — Richer view of existing asset data (and later, linked photo) without full media library.
5. **Map a subset of Bitrix/upstream stages** — Document Bitrix (or export) stages; map a few key stages into our status + progress; do not yet build full pipeline in PMP OPS.

### What not to try to solve all at once

- **Do not** build full Bitrix sync and source-of-truth in the same release as counting and comments. Do discovery and a one-page “Bitrix + PMP OPS” options doc first.
- **Do not** implement the full intricate stage list from upstream docs inside PMP OPS until the stage model and ownership are designed (later phase).
- **Do not** promise “Pip-Boy” as a full visual overhaul; treat it as direction (console/machine feel) and iterate on existing screens.
- **Do not** add a full media library and permissions in the first cut; one photo per job (or similar) is enough for “mockups in app.”

---

## 7. Product framing

**How to talk about scope honestly: dashboard now, operations layer later**

- **Now:** “PMP OPS is a **real-time floor dashboard**: you see jobs, presses, and progress at a glance, and you log production and QC here. We’re tightening that — better counting, no blocking on edge cases, and a more console-like feel. We’re not yet the single system of record for the whole operation; we’re the best place to see and log what’s happening on the floor.”
- **Next:** “The next phase is **smarter execution and traceability**: spindle-aware counting, where rejects come from (press vs packing), who said what about a job (comments/activity), and what changed (change history). We might add a first way to attach a mockup or photo to a job. We’re still not replacing Bitrix or the full pipeline — we’re making the dashboard the right tool for the room and giving you a clear trail of what was done and said.”
- **Later:** “The **operations layer** question is separate: how PMP OPS and Bitrix (or other systems) work together, who is the source of truth for what, and whether we ever model the full stage pipeline from upstream. We’ll decide that with you once the dashboard is solid and we’ve seen how you use it and what you need from the other systems.”

---

## Appendix: Bitrix export / upstream workflow (when available)

*No Bitrix export or copied text was found in the repo at the time of this document. When you have a sample export or stage list, add a short appendix here and:*

1. **List the workflow/stage complexity** — Enumerate stages and transitions (e.g. “Order received → Art approved → In production → QC → Packing → Shipped” and any sub-steps).
2. **Map vs don’t copy** — Identify which stages are “floor-visible” (we show and maybe update) vs “upstream-only” (we don’t model yet). Map a small set (e.g. 5–7) into current status + progress; leave the rest in Bitrix or for a later stage engine.
3. **Note data shape** — Which fields come from Bitrix (catalog, artist, dates, stage) and which are plant-only (pressed, QC, rejects, comments). That split informs source-of-truth and sync design.

Once the export is available, this appendix can be updated with concrete “map these stages” and “don’t copy these yet” bullets.
