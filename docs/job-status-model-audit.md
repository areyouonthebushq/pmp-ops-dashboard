# Job Status Model Audit (Read-Only)

**Purpose:** Audit the current job status model and identify where it should be tightened or clarified in light of the pipeline taxonomy (`docs/pipeline-taxonomy.md`).

**Scope:** Read-only. No code changes. Optimizes for clarity, not “more statuses.”

*Nashville · Press Floor Operations · physicalmusicproducts.com*

---

## 1. Current status inventory

### 1.1 Job status (single source of truth)

| Source | Location | Values |
|--------|----------|--------|
| **STATUS_ORDER** | `core.js` L95 | `['queue', 'pressing', 'assembly', 'hold', 'done']` |
| **STATUS_OPTS** | `core.js` L129–134 | Same five, with labels: Queued, Pressing, Assembly, On Hold, Done |

**Display labels (UI):**

- **statusPill()** (`core.js`): PRESSING (green), QUEUED, ASSEMBLY (warn), ON HOLD (red), DONE.
- **statusTapClass()** (`core.js`): CSS classes `go`, `queue`, `warn`, `red`, `done` for pill styling.
- **Fallback:** If `status` is missing or unknown, pill shows `(s||'?').toUpperCase()` with class `queue` — i.e. unknown values render as a queued-style pill.

**Default when creating a job:** `status: 'queue'` (e.g. `app.js` import flow, wizard; `supabase.js` row mapping uses `job.status || 'queue'`).

### 1.2 Where job status appears

| Surface | How status is shown | How status is changed |
|---------|---------------------|------------------------|
| **Floor (stats)** | Not raw status. Stats are: ACTIVE (pressing+assembly), QUEUED (queue), OVERDUE, TOTAL OPEN. “Open” = not done, not archived. | — |
| **Floor (table)** | Status column: pill (id `st-${j.id}`), title “Open job to change status.” Row click → panel. | Open panel → change in panel. No tap-to-cycle on pill. |
| **Floor (recent done)** | Only jobs with `status === 'done'` (slice of 5). | — |
| **Jobs (toolbar filter)** | Dropdown: ALL JOBS, PRESSING, QUEUED, ASSEMBLY, ON HOLD, DONE, ARCHIVED. | Filter only. |
| **Jobs (table / cards)** | Column/card: status pill; `data-status`, class `st-${j.status}`. | Row/card click → panel. |
| **Panel** | Status dropdown (`jStat`): Queued, Pressing, Assembly, On Hold, Done. Optional **suggested status** (Apply button) from `suggestedStatus()`. | Dropdown change + SAVE JOB; or Apply suggested. |
| **Floor card** | Status dropdown (`fcStatus`), same five options. Pill in header. | Dropdown change; save on Floor card save. |
| **LOG (job picker)** | Job option text includes `(status)` in parentheses. | — |
| **NOTES (job picker)** | Same. | — |
| **TV** | Status pill in queue table; “blockers” = count of jobs with status `hold` + offline presses. | — |
| **Press Station / QC** | Assign dropdowns and job lists show only jobs with `status !== 'done'` (and not archived). | Hold/Resume in Press Station set `job.status` to hold / pressing. |

**Press status (different concept):** Presses have their own `status`: `online`, `warning`, `offline`, `idle`. This is **machine state**, not job status. No overlap in the code (different field on different entity), but the word “status” is overloaded in the product.

### 1.3 Related concepts (not job status)

- **Progress stages** (`core.js` PROGRESS_STAGES): `pressed`, `qc_passed`, `rejected` — **per log entry** in `progressLog`, not job-level status.
- **Asset status** (per asset key): `received`, `na`, `caution` — in `job.assets[key]`; **not** job status.
- **Archived:** `job.archived_at` (and `archived_by`, `archive_reason`). Jobs are filtered by `isJobArchived(j)`; “ARCHIVED” in Jobs filter shows archived jobs. **Not** a value of `job.status`.
- **Import review row status:** `conflict`, `found`, `needs_review`, `notfound` — per import row; **not** job status.

### 1.4 Status-driven logic (summary)

- **Open jobs:** `!isJobArchived(j) && j.status !== 'done'` (Floor table, LOG picker, TV, on-deck/assign dropdowns).
- **Active (in flow):** `['pressing','assembly'].includes(j.status)` (Floor “active” stat, Press Station/QC job list, TV).
- **Blockers (TV):** `(j.status || '').toLowerCase() === 'hold'` plus offline presses.
- **Suggested status:** `suggestedStatus(job, isAssignedToPress)` suggests pressing/assembly/done from progress and assignment; **never suggests hold** (returns null for hold).
- **Cycle:** `nextStatus(current)` cycles through STATUS_ORDER; `cycleStatus(jid)` applies next status, syncs press assignment (release on leave pressing, assign on enter pressing), saves job + presses, shows undo toast. The pill with `id="st-${jid}"` is flashed after cycle; **cycleStatus is not wired to a direct click** in the audited code (panel/card use dropdowns; Floor table cell opens panel).

---

## 2. Confusing or overlapping areas

### 2.1 “Assembly” — status vs field vs log

- **job.status = 'assembly'** means “post-press, in assembly/packing” (production stage).
- **job.assembly** is a **free-text field** (assembly/location notes), e.g. in Floor card “Assembly / location notes.”
- **job.assemblyLog** is an **append-only log** of assembly notes (NOTES section in panel).

**Risk:** Same word “assembly” for (1) a lifecycle status and (2) a notes field can confuse. Pipeline taxonomy uses “IN PACKING RIGHT NOW” → status = assembly or notes. Recommendation: keep status as-is; document that “Assembly” status = post-press / packing phase; “assembly” field = free-form notes for that phase (and optionally location).

### 2.2 “Hold” — one bucket for all blockers

- **job.status = 'hold'** is used for: intentional hold, stuck, billing issue, traffic jam, art holding, etc.
- There is **no** `hold_reason` or subtype. “Why” is only in **notes** (or assembly/notes log).
- **suggestedStatus** never suggests hold; UI does not surface “reason for hold” in status UI.

**Risk:** Operationally, “On Hold” is clear; “why” requires opening the job or reading notes. Pipeline taxonomy recommends hold + notes for all blocker types. No structural overlap, but **hold reason** is a future improvement (see §5).

### 2.3 Job status vs progress stages

- **Job status:** queue → pressing → assembly → hold → done (where the job is in the pipeline).
- **Progress stages:** pressed, qc_passed, rejected (what was logged in a single event).

These are **not** overlapping: one is job-level, one is event-level. Code and UI keep them separate (progress in LOG, progress bar, progress detail overlay; status in pill and dropdowns). No change needed for clarity.

### 2.4 Job status vs asset status vs press status

- **Job status:** the five values above.
- **Asset status:** received/na/caution per asset key (assets overlay).
- **Press status:** online/warning/offline/idle.

Same word “status” in three places. The code uses different paths (`job.status`, `job.assets[key].status` / getAssetStatus, `p.status` for press). For docs and training, explicitly naming “job status,” “asset status,” and “press status” avoids conflation.

### 2.5 Jobs filter: “DONE” and “ARCHIVED”

- **DONE** = filter by `job.status === 'done'`.
- **ARCHIVED** = filter by `isJobArchived(j)` (archived_at set). Archived jobs can have any status (often done).

So “archived” is **orthogonal** to status. The filter correctly treats them as separate dimensions. No overlap bug; only a reminder that “done” and “archived” are not the same.

### 2.6 Fulfillment / shipping

- There is **no** job-level fulfillment or shipping status (no “Ready to ship,” “Shipped,” etc.).
- Pipeline taxonomy says: use **notes** for now; optional **fulfillment_phase** later, **outside** core job status.

So there is **no** current overlap between job status and fulfillment; the only risk would be adding something like “Ready to ship” as a sixth status. Recommendation: keep fulfillment out of STATUS_ORDER (see §4).

---

## 3. Recommended simplifications

1. **Keep exactly five job statuses.** No new values (no “packing,” “ready to ship,” “stuck”). Aligns with pipeline taxonomy.
2. **Document “Assembly” in one place.** In docs/glossary or IA: “Assembly (status) = post-press phase including packing; assembly (field) = free-text notes for that phase.”
3. **Treat “On Hold” as a single bucket.** Continue using notes (and optional future hold_reason) for why; do not add status subtypes.
4. **Normalize unknown/missing status in one place.** All reads already default with `(j.status || 'queue').toLowerCase()` or equivalent; statusPill maps unknown to a queued-style pill. Ensure any new reader (e.g. CSV import, API) also normalizes to one of the five or defaults to `queue`.
5. **Do not add tap-to-cycle on Floor table** unless product explicitly wants it; current “open panel to change status” is consistent and avoids accidental cycles. If tap-to-cycle is added later, use `cycleStatus(jid)` and keep a single source of truth for transitions.

---

## 4. Future states that should stay outside core job status

Per pipeline taxonomy and this audit:

- **Fulfillment / shipping:** “Ready to ship,” “Shipped,” “Local pick up” → **notes** today; optional later **fulfillment_phase** (or similar) as a **separate field**, not part of STATUS_ORDER. Job status should remain “done” when production is complete.
- **Pre-production / billing:** “Print ordered,” “Deposit paid,” “Awaiting final payment,” etc. → **Bitrix or notes**. Not new job statuses.
- **Blocker reason:** “Billing issue,” “Stuck – client,” “Traffic jam” → **notes**; optional **hold_reason** (or short text) when status = hold, for filtering only.
- **Asset readiness:** “All assets in-house” → derived from **asset health** (ASSET_DEFS), not a new status.
- **Progress stages:** pressed / qc_passed / rejected stay as **event** stages in progress log, not job status.

---

## 5. Highest-value cleanup moves (if any)

1. **Document the “assembly” double meaning** (status vs field) in `informationarchitecturev3.md` or a short glossary so future changes don’t blur the line.
2. **Optional hold_reason (or “reason on hold”)** — When status = hold, a short optional field (text or enum) for “Billing,” “Client,” “Traffic jam,” etc. Enables “Show all billing holds” without parsing notes. Low code cost, high clarity; can be phased in later.
3. **Suggested status copy** — Panel already shows “Suggested: ASSEMBLY — Off press at qty; QC pending.” No structural change; ensure copy stays aligned with pipeline taxonomy (e.g. “Assembly” = post-press/packing).
4. **Do not add statuses** — Resist adding “packing,” “ready to ship,” or “stuck” as statuses. Use notes + optional hold_reason / fulfillment_phase instead.
5. **cycleStatus usage** — If product wants tap-to-cycle on the Floor table status pill, wire a single click handler (e.g. on the pill with `id="st-${j.id}"`) to `cycleStatus(j.id)` and prevent propagation so the panel doesn’t open. If not, leave as-is (open panel to change status).

---

*End of Job Status Model Audit. See `docs/pipeline-taxonomy.md` for stage mapping and `core.js` (STATUS_ORDER, STATUS_OPTS, suggestedStatus) for implementation.*
