## PMP · OPS — Information Architecture

This document maps the primary pages, entities, and flows in the PMP · OPS application.

---

### 1. Top-level navigation and modes

**Global navigation (main app shell):**

- `JOBS`
- `FLOOR`
- `LOG`
- `NOTES`
- `AUDIT` (admin only)

**Station shells / modes:**

- **Launcher screen**:
  - Admin
  - Floor Manager
  - Press Station
  - QC Station
- **Press Station shell** (`#pressStationShell`)
- **QC Station shell** (`#qcStationShell`)
- **TV / display modes** (variants on Jobs/Floor views; toggled by context/role rather than a sepfarate nav item).

**Auth:**

- Login screen (`#loginScreen`) appears when Supabase Auth is active and user is unauthenticated.

---

### 2. Primary entities and relationships

- **Job**
  - Core node of the model.
  - Connected to:
    - **Presses** (assignment).
    - **Progress log entries** (qty, stage).
    - **QC log entries** (rejects, types).
    - **Job notes / assembly notes** (append-only).
    - **Floor view rows** (status/location).
- **Press**
  - Represents a physical press.
  - Connected to:
    - Current job(s) (one primary at a time).
    - Press Station UI for that press.
    - Floor view (asset row).
- **Progress log entry**
  - Linked to a job via `job_id`.
  - Summarized into:
    - Total pressed.
    - Total QC passed.
    - Total rejected.
  - Drives progress bars and percentages on Jobs/Floor/TV.
- **QC log entry**
  - Linked to job and date.
  - Categorized by defect type.
  - Feeds:
    - QC Station summaries.
    - LOG / QC pages.
- **Notes**
  - **Job-scoped notes**:
    - `notesLog` and `assemblyLog` on jobs.
    - Shown in job panel and job-specific views.
  - **NOTES channels** (`notes_channels`):
    - Channel-specific logs of `{ text, person, timestamp }`.
    - Channels include job IDs and special channels (`!TEAM`, `!ALERT`).
    - Rendered in the NOTES terminal by selected channel/job.
- **Todos**
  - Operational checklists grouped into:
    - Daily
    - Weekly
    - Standing
  - Surfaced as a side utility for operations rather than a core navigation item.
- **Audit entries**
  - Represent changes to important entities (especially jobs).
  - Exposed via `audit_log_with_actor` view.

---

### 3. Page-by-page structure

#### 3.1 Jobs page (`#pg-jobs`)

- **Audience:** Admin, floor leadership.
- **Primary components:**
  - Jobs toolbar (filters, actions like import/export).
  - Jobs table (`#jobsTbl`):
    - Identity columns: Catalog, Artist, Album, Client, Specialty.
    - Operational columns: Status, Press, Location, Due, Quantities, Overages.
    - Support columns: Notes, QC status, invoice flags.
  - Slide-in job panel:
    - Detailed view and edit form for a single job.
    - Sections: core identity, quantities, schedule, notes, assembly, assets, etc.
  - Optional job cards (for smaller screens).
- **Key information emphasized:**
  - **Job identity and spec**.
  - **Status**, **press assignment**, and **due dates**.
  - **Notes and special handling**.

#### 3.2 Floor page (`#pg-floor`)

- **Audience:** Floor manager, leadership, sometimes press/QC.
- **Primary components:**
  - Floor toolbar (filters by state, press, etc.).
  - Floor table:
    - One row per job on the floor.
    - Emphasis on:
      - Which press.
      - Where (location).
      - State (queue/pressing/assembly/hold/done).
      - Progress (pressed vs QC passed).
  - Quick links to open the job panel or press station for a selected row.
- **Key information emphasized:**
  - **What’s running where right now**.
  - **Throughput and bottlenecks**.
  - **Near-term obligations** (due dates).

#### 3.3 LOG page (`#pg-log`)

- **Audience:** Operators logging press and QC events, and floor manager monitoring the day’s log.
- **Primary components:**
  - **LOG console shell** (`.log-page-shell`):
    - Section labels (“SELECT JOB”, “LOG”).
    - Job picker (`#logJobPicker`) framed as a console control.
    - Faceplate console:
      - Mode buttons (PRESS / PASS / REJECT).
      - Job label line.
      - Numeric pad for quantity entry.
      - LOG button (enter).
  - **Date navigation**:
    - Previous / Next / Today buttons.
    - Date label.
  - **Daily log feed** (`#logDailyFeed`):
    - Lists per-entry logs for the selected date.
- **Key information emphasized:**
  - **Units moved**, by type (pressed, QC passed, rejected).
  - **Temporal context** (per day).
  - **Associated job and operator**.

#### 3.4 NOTES page (`#pg-notes`)

- **Audience:** Whole plant; particularly floor staff and leadership.
- **Primary components:**
  - **NOTES terminal** (`.notes-terminal`):
    - **Control rail**:
      - “CHANNEL” label.
      - Job / channel select (`#notesJobSelect`).
      - `+` (add note) and `⌕` (search) buttons.
    - **Utility rows**:
      - Add note row (textarea + ADD button).
      - Search row (search input + SEARCH button).
    - **Feed section label** (“NOTES”).
    - **Notes feed** (`#notesFeed`):
      - Each row:
        - Identity (catalog + artist).
        - Payload (note text).
        - Provenance (person + timestamp).
- **Key information emphasized:**
  - **What people are saying about jobs and the plant**, at an operational level.
  - **Who said it and when** (provenance).
  - **Which job/channel it belongs to** (identity).

#### 3.5 Audit page (`#pg-audit`)

- **Audience:** Admin, operations leadership, sometimes engineering.
- **Primary components:**
  - Audit toolbar:
    - Limit selector.
    - Load button.
    - Status/hint label.
  - Audit table:
    - When, Table, ID, Action, By, Changed fields.
  - Empty state message.
- **Key information emphasized:**
  - **Who changed what, when**, across operational tables.
  - **Which fields were affected**, to support investigation.

#### 3.6 Station shells

##### Press Station (`#pressStationShell`)

- **Audience:** Press operators.
- **Primary components:**
  - Header with press name and back button.
  - Main content area (current job and controls).
  - Local log area.
- **Key information emphasized:**
  - **Current job for this press**.
  - **Immediate logging controls** (press events).

##### QC Station (`#qcStationShell`)

- **Audience:** QC operators.
- **Primary components:**
  - “QC STATION” header.
  - Current job section.
  - Today summary (units, pills, events by type).
  - Defect buttons for quick logging.
- **Key information emphasized:**
  - **Current QC workload**.
  - **Defect breakdown by type and job**.

---

### 4. Data flow and page interactions

- **Jobs → Floor**
  - Jobs table is the source of truth.
  - Floor view filters and reshapes this list to a more operational view (press, status, location).
- **Jobs / Presses → LOG / QC**
  - LOG page selects a job via job picker.
  - Press Station selects a job via press assignment.
  - Logging events write to `progress_log` and `qc_log`, which in turn:
    - Update job-level progress stats (via aggregation).
    - Update floor and jobs views.
- **Jobs / Logs → TV / Displays**
  - TV-oriented modes (not a separate nav entry) use the same derived data:
    - `getFloorStats`
    - `progressDisplay`
    - etc.
  - These are mostly **read-only** views.
- **Jobs → Notes (job-scoped)**
  - Job panel collects append-only notes and assembly/location notes.
  - These are stored on the job and displayed where appropriate (e.g., job panel, some cards).
- **NOTES channels (job or plant-wide)**
  - NOTES page reads `notes_channels` + derived entries from jobs.
  - Adding a note:
    - Updates `S.notesChannels` and calls `Storage.saveNotesChannels` (Supabase or local).
    - In Supabase mode, this writes to `notes_channels` table and triggers Realtime.
- **Audit**
  - Backed by Supabase audit schema and view.
  - Read-only from the client; used for investigation and traceability.

---

### 5. Role-to-surface mapping

- **Admin**
  - Jobs (full CRUD).
  - Floor.
  - LOG.
  - NOTES.
  - Audit.
  - Station shells (mainly for testing or emergency use).
- **Floor Manager**
  - Floor (primary).
  - Jobs (limited editing).
  - LOG / NOTES (monitoring and some input).
- **Press Operator**
  - Press Station shell for their assigned press.
  - Floor / Jobs mostly read-only.
- **QC Operator**
  - QC Station shell.
  - LOG / QC views as needed.
- **TV / Passive display**
  - Uses Floor or a specialized TV mode to present read-only status.

---

### 6. Information priorities by surface

- **Jobs**
  - Comprehensive job detail and planning fields.
  - Upstream view: “What work exists and how is it configured?”
- **Floor**
  - Shortened view focusing on **state, location, press, and progress**.
  - Real-time view: “What is currently happening on the floor?”
- **LOG**
  - Event-centric view: volumes and outcomes per job per day.
  - Focus: “What happened today and who logged it?”
- **NOTES**
  - Narrative-centric view: contextual, human-readable notes.
  - Focus: “What do we know or need to remember about jobs and the plant?”
- **Audit**
  - Governance-centric view: changes, actors, timestamps, and fields.
  - Focus: “How did we get here, and can we trust this data?”

---

### 7. Summary

The PMP · OPS information architecture is **job-centric** but diversified into surfaces that match distinct operational questions:

- **Jobs** — What exists?
- **Floor** — What’s running where, right now?
- **LOG / QC** — What units moved and what defects occurred?
- **NOTES** — What narrative context surrounds the work?
- **Audit** — Who changed what, when?

The navigation, data flows, and role mappings are all aligned to preserving a **single operational truth** while allowing each station and role to see just the slice of that truth they need to act effectively.