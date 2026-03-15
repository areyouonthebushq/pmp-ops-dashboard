## PMP · OPS — Developer Report

This document is a high-level technical overview of the PMP · OPS dashboard as observed from the current codebase. It focuses on modules, data flows, storage, sync, auth, and architectural patterns — not line-by-line details.

---

### 1. High-level architecture

- **Client-only SPA** rendered in the browser:
  - Entry in `index.html`.
  - Core behavior in `app.js`, `render.js`, `core.js`, `stations.js`.
  - Styling in `styles.css`.
  - Data access and sync in `storage.js` and `supabase.js`.

- **Backend:**
  - **Supabase** (Postgres + Auth + Realtime) is the primary backend when configured.
  - A **local storage layer** acts as both:
    - A fallback when Supabase is offline/unavailable.
    - A simple local/demo mode when running without remote services.

- **State model:**
  - `S` (global state object) holds jobs, presses, todos, qcLog, notesChannels, and runtime flags (sync state, offline, etc.).
  - UI pages (`.pg` divs) are switched using `goPg` and related helpers.
  - Rendering is driven by `render.js` functions that read from `S` and write HTML into specific containers.

---

### 2. Main modules and responsibilities

#### 2.1 `index.html`

- Declares the **overall page structure**, including:
  - Navigation bar and page shells (`#pg-jobs`, `#pg-floor`, `#pg-log`, `#pg-notes`, `#pg-audit`, station shells).
  - Key containers for dynamic content (`jobsTbl`, `floorTbl`, `logDailyFeed`, `notesFeed`, etc.).
  - Mode launcher (Admin, Floor Manager role-gated, QC Station). Press Station launcher and shell purged — see `purgatory-protocol.md`.
  - Login screen (for Supabase auth).
  - Station shells (QC Station, Floor Manager). Press Station shell purged — see `purgatory-protocol.md`. Overlays.
- Loads:
  - Fonts, Sentry, Supabase client.
  - `supabase.js`, `styles.css`, and the main JS bundle(s).

#### 2.2 `styles.css`

- Defines the **design system** (color tokens, spacing, typography).
- Provides layout rules for:
  - Navigation, toolbar, tables, progress bars.
  - LOG console faceplate.
  - NOTES terminal and notes feed.
  - Station shells (QC, Floor Manager). Press Station purged.
  - Auth and launcher views.
- Emphasizes an **industrial console aesthetic** with:
  - Dark surfaces, narrow borders, and clear typographic hierarchy.
  - Special Elite for section labels, Inconsolata for data.

#### 2.3 `core.js`

- Core job and data helpers:
  - Normalizing jobs.
  - Ensuring `notesLog`, `progressLog`, and related structures exist.
  - Utility functions to compute derived data (e.g., counts, status).
  - Job import/export logic (e.g., CSV parsing/serialization).

#### 2.4 `app.js`

- **Application controller**:
  - Initializes state `S`.
  - Handles navigation between pages (`goPg`).
  - Wires up event handlers for:
    - Job panel editing.
    - Logging actions (press, QC pass/reject).
    - Notes and NOTES page interactions.
    - Mode launcher and station entry.
  - Coordinates with `Storage` for loading and saving.
  - Coordinates with `Supabase` for Realtime event handling.

- **Key responsibilities:**
  - `loadAll()` — main bootstrap and refetch routine:
    - Calls `Storage.loadAllData()` (Supabase or local).
    - Applies conflict detection against `pendingWrites`.
    - Updates `S.jobs`, `S.presses`, `S.todos`, `S.qcLog`, `S.notesChannels`.
    - Maintains offline snapshots when Supabase is active.
  - LOG interactions:
    - Numeric pad handling and mode selection.
    - Calling unified logging functions for progress and QC.
  - NOTES page:
    - Handling job/channel selection.
    - Add / Search utilities.
    - Delegating to `renderNotesPage` and storage for persistence.
  - Mode / station selection:
    - Launcher actions.
    - Enter/exit for QC Station and Floor Manager shells. (Press Station shell purged — LOG console and Floor press grid cover that workflow.)

#### 2.5 `render.js`

- Houses most **view-layer rendering functions**, including:
  - Jobs table.
  - Floor view.
  - LOG feed and progress entries.
  - Panel views (single job editor).
  - **Notes page rendering**, including:
    - Per-job and per-channel notes.
    - NOTES feed composition (identity, payload, provenance).
  - Station UIs (QC Station, Floor Manager subsets). Press Station purged.

- Rendering is mostly **string-based templating**: functions create HTML strings and assign them to `innerHTML` of specific containers.

#### 2.6 `stations.js`

- Encapsulates **station profiles and permissions**:
  - `getStationEditPermissions(context)`:
    - Accepts a context (role, station type, etc.).
    - Returns booleans for:
      - `canUseFullPanel`
      - `canUseFloorCard`
      - `floorCardFields`
      - `canLogPressProgress`
      - `canLogQC`
  - Separate logic for Admin, Floor Manager, Press, QC, etc.

- This is the primary place where **front-end role behavior** is encoded.

#### 2.7 `storage.js`

- **Abstraction over local storage and Supabase**:
  - `useSupabase()` detects whether Supabase is configured and reachable.
  - When Supabase is active:
    - Loads and saves via `Supabase` helper functions.
    - Maintains offline snapshot and queue.
  - When Supabase is inactive:
    - Persists all data via `window.storage` (if provided) or `localStorage`.

- Features:
  - **Offline snapshot**:
    - Periodic snapshots of full state for fallback when Supabase fails.
  - **Offline queue**:
    - Queue of operations (e.g., `progress_log` inserts, QC inserts, job status changes, assets updates) that can be replayed when back online.
  - **Sync state indicator**:
    - Tracks `loading`, `saving`, `synced`, `error`, `local`, `offline`, `stale` with a small UI element.

#### 2.8 `supabase.js`

- **Data access layer for Supabase**:
  - `initSupabase()` — bootstraps the Supabase client with URL and anon key.
  - `loadAllData()` — main multi-query data fetch:
    - `jobs` table (with `notes` and `notes_log`).
    - `progress_log`.
    - `presses`.
    - `todos`.
    - `qc_log`.
    - `notes_channels`.
  - `saveJob`, `updateJobAssets`, `deleteJob`.
  - `savePresses`, `saveTodos`.
  - `logProgress` (progress_log insert).
  - `logQC` (qc_log insert).
  - `saveNotesChannels` (upsert into `notes_channels`).
  - `getAuditLog` (view over audit tables).

- **Realtime:**
  - `subscribeRealtime(onChange)`:
    - Subscribes to Postgres changes on:
      - `jobs`
      - `presses`
      - `todos`
      - `progress_log`
      - `qc_log`
      - `notes_channels`
    - On any change, triggers an `onChange` callback that ultimately calls `loadAll()`, with protections against self-echo and mid-edit disruptions.

---

### 3. Data model and Supabase schema (high level)

Based on migrations and API usage, key tables include:

- `jobs`
  - Core job metadata:
    - Identity: id, catalog, artist, album, format, client, specialty, etc.
    - Quantities: order qty, overage, weights.
    - Scheduling: due date, created_at, updated_at.
    - State: status (queue/pressing/assembly/hold/done), location, press assignment.
    - Notes: `notes` (current scratch), `notes_log` (append-only log of note entries).
    - Assembly/location-specific notes (log).

- `presses`
  - Press entities with:
    - Name / id.
    - Current job assignment.
    - Status and any extra metadata.

- `progress_log`
  - Append-only:
    - `job_id`
    - `qty`
    - `stage` (`pressed`, `qc_passed`, `rejected`, etc.).
    - `person`
    - `timestamp`

- `qc_log`
  - Append-only QC events:
    - Time, type (defect), job, date, and metadata used for QC summaries.

- `notes_channels`
  - Plant-wide notes:
    - `id` (channel name, e.g., `!TEAM`, `!ALERT`, job-specific keys).
    - `log` (JSONB array of `{ text, person, timestamp }`).

- `todos`
  - Operational checklist items:
    - `id`, `category` (`daily`, `weekly`, `standing`), `text`, `done`, `who`, `sort_order`.

- `audit_log_with_actor` (view)
  - Flattened view of audit entries with associated actors.

RLS policies and publication configuration:

- **RLS** is enabled on operational tables with policies that allow:
  - Authenticated users to read/write within defined constraints.
  - Audit tables to be read only by admins.
- **Realtime publication** (`supabase_realtime`) includes:
  - `jobs`, `presses`, `todos`, `progress_log`, `qc_log`, `notes_channels`.

---

### 4. Storage and sync behavior

- **Local vs Supabase:**
  - `useSupabase()` chooses mode.
  - In Supabase mode:
    - Reads/writes go through `supabase.js`.
    - Offline queue collects operations when offline; they are replayed when connectivity is restored.
    - Offline snapshot is used when Supabase queries fail.
  - In local mode:
    - `pmp_ops_data` is stored in `window.storage` or `localStorage`.
    - Notes channels and job logs are stored locally in full.

- **Conflict detection:**
  - `pendingWrites` / `pendingPressWrites` track hashes and timestamps of recent local writes.
  - On `loadAll()`, server jobs are compared against `pendingWrites` within a conflict window.
  - If mismatched, conflicts are logged and pending entries cleared; the user is warned via toast.

- **Realtime:**
  - Any relevant change from other clients triggers a **debounced refetch**.
  - The app tries hard not to disturb users while they are mid-edit (e.g., if the panel just opened or a numpad is active) — in those cases it sets a “data changed” flag and shows a notice instead of silently re-rendering.

---

### 5. Auth, roles, and permissions

- **Auth:**
  - Uses Supabase Auth (email/password) when configured.
  - Login screen is shown if auth is required and the user is not authenticated.
  - When running locally or with no Supabase credentials, the app falls back to **local mode** without auth.

- **Profiles and roles:**
  - User profile (including `role` and `assigned_press_id`) comes from Supabase `profiles` table and is attached to `window.PMP.userProfile`.
  - Roles influence:
    - Navigation options (what launcher buttons are visible).
    - Station behavior (`getStationEditPermissions`).
    - Editing capabilities in Jobs/Floor.
    - Access to certain actions (e.g., gating `!ALERT` channel writes).

- **Permission patterns:**
  - **Admin**: full CRUD on jobs, can log, can use all stations.
  - **Floor manager**: constrained editing, little/no logging.
  - **Press**: logging only for assigned press; minimal global editing.
  - **QC**: QC-only logging, no job editing.

The front-end enforcement and the Supabase RLS policies must stay in sync conceptually, but the codebase is clearly structured to make that mapping visible.

---

### 6. UX and design patterns (from a dev’s eye)

- **Append-only logs**:
  - Progress and notes are append-only arrays, which simplifies reasoning about history and audits.
  - Jobs carry both their mutable fields and attached log arrays.

- **Shared helpers for derived data**:
  - Progress counts and QC summaries are calculated through shared helper functions, reducing duplication.

- **Station shells**:
  - QC Station and Floor Manager reuse core logic but present **role-specific subsets** of UI and actions. Press Station shell purged — see `purgatory-protocol.md`; LOG console and Floor press grid cover that workflow.
  - This pattern reduces risk of cross-role mistakes while keeping the codebase unified.

- **Console-like surfaces**:
  - The LOG and NOTES pages are designed as terminals/faceplates:
    - LOG: numeric pad + mode buttons + compact log feed.
    - NOTES: control rail + feed inside a framed terminal.
  - This maps well to hardware and mental models on the floor.

---

### 7. Observed risks and recommendations (technical)

- **Role / RLS coupling**:
  - Ensure any changes to Supabase policies are reflected in `stations.js` and related UI gating, and vice versa.

- **Notes conceptual model**:
  - There are three primary “places” for notes: job notes, assembly/location notes, and NOTES channels.
  - As the app grows, it will help to clearly document:
    - When to use job notes vs channels.
    - How notes are surfaced back into Jobs/Floor views.

- **CSV import robustness**:
  - The importer is intentionally pragmatic, but as volume grows:
    - Consider adding more explicit validations and user feedback.
    - Consider a dedupe strategy or idempotent import design (e.g., based on job IDs or external order IDs).

- **Error reporting and observability**:
  - Sentry is present but DSN is a placeholder.
  - Once wired, consider tagging events by station/role and page to understand where friction arises.

---

### 8. How to explain this codebase to a new engineer

- **Start with `index.html`**:
  - See how pages are structured, what containers exist, and which IDs are important.

- **Then read `app.js`**:
  - Understand global state `S`, navigation, and the main control flow (`init`, `loadAll`, event handlers).

- **Study `render.js` and `styles.css` together**:
  - Each functional surface (Jobs, Floor, LOG, NOTES, Stations) has a render function and corresponding CSS section.
  - This shows how the conceptual model is reflected visually.

- **Review `storage.js` and `supabase.js`**:
  - Understand how data moves in and out, how offline and Realtime work, and what tables exist.

- **Finally, inspect `stations.js` and migrations**:
  - See how roles and RLS align.
  - Confirm Supabase schema expectations.

The app is **modular without being over-abstracted**: each file has a clear purpose, and most business logic is centralized in a small number of helpers. This makes it a good candidate for incremental change without large rewrites.

