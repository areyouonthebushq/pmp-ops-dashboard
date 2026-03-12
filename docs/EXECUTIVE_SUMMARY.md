## PMP · OPS — Executive Summary

### What this app is

PMP · OPS is a **floor-focused operations console** for a physical music products plant. It is designed as a **single-screen operations surface** that:

- Tracks **press-floor work-in-progress** as jobs (orders) move from pressing through assembly and QC.
- Provides **append-only operational logs** (press events, QC events, production/assembly notes).
- Gives the floor and management a **shared situational picture** (what’s running, where, how far along, what’s blocked).
- Coordinates work across different **stations** (Admin, Floor, Press Station, QC Station, TV/statboard).

It runs entirely in the browser, with data persisted either:

- **Locally** (offline / demo mode), or
- In **Supabase** (Postgres + Auth + Realtime), including RLS-based access control and audit logging.

The visual language is **industrial, console-like**, and deliberately non-consumer: it favors dense tabular layouts, explicit labels, and append-only logs over “app-like” animations or chat UIs.

---

### Core entities & mental model

- **Jobs** — Units of work / titles being pressed and assembled. Each job carries catalog/artist/format details, quantities, due dates, locations, notes, and state.
- **Presses** — Individual presses with current assignment and status.
- **Progress log** — Append-only records of units pressed, QC-passed, and rejected, keyed to jobs.
- **QC log** — Append-only QC events by type/defect, often summarized separately.
- **Notes**
  - **Job notes** (`notesLog`, `assemblyLog`) — Append-only, scoped to single jobs.
  - **Plant-wide NOTES channels** (`notes_channels`) — Feed-style, cross-job memory and communication, with channels like `!TEAM` and `!ALERT`.
- **Audit log** — Derived view of all significant changes (for admins).

Operationally, the app assumes:

- The **job** is the central unit of coordination.
- **Press and QC events** are never edited, only appended and summarized.
- The **floor needs a “now” view** (what’s running, how far through, where are the problems), plus minimal history to understand context and trend.

---

### Main faces / audiences

The app serves several distinct but overlapping roles:

- **Admin / Operations leadership**
  - Owns job creation, assignment, editing, and imports/exports.
  - Uses **Jobs**, **Floor**, **Audit**, and optionally **NOTES** and **LOG** for high-level tracking.

- **Floor manager**
  - Orchestrates which jobs are on which presses, and watches overall progress.
  - Uses **Floor view**, **LOG (unified log)**, and **NOTES** as day-to-day tools.

- **Press operators**
  - Log units pressed and sometimes QC outcomes from a **press-specific station shell**.
  - Interact with a simplified, **single-press view**, not the whole admin UI.

- **QC operators**
  - Rapidly log rejects by defect type at a **QC Station** with a defect palette.
  - Contribute to both the unified LOG and the QC summary surfaces.

- **TV / passive displays**
  - “Read-only” dashboards on the floor showing queue, current jobs, progress, and status at a glance.
  - Optimized for **glanceable status pills and progress bars**, not editing.

- **Plant-wide team**
  - Uses **NOTES (channels)** as a cross-station “factory memory” feed: short operational annotations, alerts, and shared observations.

---

### Page-level behavior (high level)

- **Jobs page**
  - Admin-oriented **table of all jobs**, sortable and filterable, with status, quantities, due dates, customer and spec details.
  - Acts as the main CRUD surface: create, edit, duplicate, archive, and export jobs.

- **Floor view**
  - A **live floorboard**: which jobs are on which presses, state (queue/pressing/assembly/hold/done), and key dates.
  - Offers quick adjustments where safe (e.g., move job between presses) within role constraints.

- **Unified LOG page**
  - A **faceplate console** for **logging units and QC events**.
  - One **numeric pad** + **mode buttons** (PRESS / PASS / REJECT) → logs entries for the selected job.
  - Below: a **daily log feed** summarizing events.

- **NOTES page**
  - A **plant-wide notes terminal** with:
    - **Job / channel picker** (including `!TEAM` / `!ALERT`).
    - A compact **control rail** with “Add note” and “Search” utilities.
    - A **notes feed** with job identity (catalog/artist), note payload, and provenance (who/when).
  - Acts as **factory memory** and a place for operational narrative, not chat.

- **QC page / QC Station**
  - Focused tools for **logging QC rejects** by defect type with minimal friction.
  - Summaries and breakdowns by type, date, and job where relevant.

- **Press Station shell**
  - A **mode-locked environment** for a single press, with:
    - Current job identity and status.
    - A localized logging console for that press only.
  - Reduces cognitive noise for operators who only care about “their press.”

- **Audit page**
  - **Admin-only** view into a Supabase-backed audit log.
  - Used to investigate **who changed what, when**, especially around job edits and critical flags.

---

### What information the app elevates (and why)

Across pages, the app consistently emphasizes:

- **Job identity and status**
  - Catalog, artist, format, weight, quantity.
  - State (queue/pressing/assembly/hold/done).
  - Assignment to specific presses and locations.

- **Throughput & quality**
  - Units **pressed vs QC passed vs rejected** (counts and percentages).
  - Defect types and QC outcomes.

- **Time & due dates**
  - Due dates.
  - Timestamps on logs and notes.

- **Operational notes**
  - Production and assembly notes per job.
  - Plant-wide notes and alerts.

This alignment is deliberate: these are exactly the levers plant staff use to answer:

- What are we running right now?
- Are we on track for today / this week?
- Where is capacity blocked or quality slipping?
- What special handling or caveats exist for a given job?
- What changed recently that might explain a current issue?

The system **does not** try to be a CRM, chat tool, or deep workflow engine. It’s intentionally constrained to **floor operations, throughput, and quality**.

---

### Alignment with human needs (by role)

- **Floor manager / admin**
  - Needs a **complete job list**, the ability to reprioritize, and a clear view of “what’s on which press” → provided by Jobs + Floor.
  - Needs **throughput and quality signals** that can be trusted → provided by unified LOG, QC stats, and progress bars.
  - Needs to **backtrack history** when something goes wrong → append-only logs + Audit + NOTES.

- **Press operator**
  - Needs to know **“what should I be running right now?”** → Press Station + Floor.
  - Needs a **simple way to log counts** without fear of breaking the system → faceplate-style console, single-number input, append-only logging.

- **QC operator**
  - Needs to **classify rejects fast** → QC Station with big defect buttons and minimal fields.
  - Needs the system to enforce basic **count invariants** while remaining usable → guarded but practical validation.

- **Leadership / management**
  - Needs an **at-a-glance sense** of how the day is going → Floor / TV-style views.
  - Needs **auditability** for significant changes → Audit log and append-only structures.

Overall, the app’s information priorities are very tightly aligned with what humans on the floor need: **where are the jobs, how far through are they, what’s breaking, and what special context matters.**

---

### Key expert insights

- The app embodies a **“single source of operational truth”** philosophy:
  - Jobs, progress, QC, and notes all live in a single, cohesive model.
  - Supabase provides backend persistence, RLS, and audit; front-end logic is careful about sync, offline, and conflict handling.

- The design takes **industrial constraints seriously**:
  - Low-friction logging, dense but legible tables, and conservative typography.
  - Station-specific shells reduce mode errors (e.g., a press operator accidentally editing jobs they shouldn’t).

- **Append-only thinking** is a strength:
  - Production and QC are represented as streams of events, not mutable “remaining counts.”
  - This matches how physical systems behave and preserves forensic history.

- **Risks / tensions**:
  - Role-based access is enforced both in the UI and in Supabase; these must evolve together to avoid drift.
  - Dual note systems (job-specific logs vs plant-wide channels) require clear narrative about “what goes where” as the system grows.
  - CSV import and potential external integrations will need careful deduping and authority decisions to keep jobs clean.

---

### How to explain this to someone (non-technical)

> “PMP · OPS is the **control room for the press floor**.  
> It shows every job we’re running, which press it’s on, how far along it is, and whether QC is happy.  
> Operators use it to **log every batch they press and every defect they find**, and the system builds a running history of what happened.  
> There’s a **jobs table** for planning, a **floor view** to see what’s running where, a **log console** to record events, and a **NOTES terminal** where the team can leave short, permanent notes about jobs or plant-wide alerts.  
> It’s not a chat app or a CRM — it’s an **operations console** designed to tell the floor, at a glance, **what’s happening right now and what needs attention.**”

