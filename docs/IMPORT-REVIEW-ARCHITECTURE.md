# Staged Import-Review Architecture (Read-Only Design)

**Goal:** Design a safe staged import-review model for job creation and source-document ingestion so that import assists rather than auto-creates gospel, with human review and confirmation before any job record is created or updated.

**Constraints (this pass):** Read-only; no code changes; no magic OCR certainty; grounded in existing app.

---

## 1. Recommended Data Model for Staged Import Review

### 1.1 Import session object

A single **import session** represents one user-initiated import (one file or one photo/PDF). It is the container for extraction results and review state until the user confirms or abandons.

**Suggested shape (in-memory or short-lived persisted):**

```js
{
  id: string,              // e.g. 'imp_' + Date.now() + _random
  type: 'csv' | 'photo' | 'pdf',
  createdAt: string,       // ISO timestamp
  createdBy: string,       // person label (from currentDevPersonLabel or auth)
  sourceRef: { ... },      // see 1.4
  extractedRows: [ ... ],  // array of extracted field sets (see 1.2)
  status: 'draft' | 'reviewing' | 'confirmed' | 'abandoned',
  resolvedJobIds: []       // after confirm: job ids created/updated from this session
}
```

- **CSV:** One session can yield multiple **extracted rows** (one per data row in the file); each row becomes one “candidate job” in the review table.
- **Photo/PDF:** One session typically yields **one** extracted row (one document → one job candidate); multiple pages could be one doc or multiple sessions (phase 1: one doc = one row).

### 1.2 Extracted fields shape (per row / per candidate job)

Each **extracted row** holds suggested values and per-field confidence. Field keys align with existing job shape (FIELD_MAP / jobToRow) so the same form and storage path can be used after confirm.

**Suggested shape:**

```js
{
  rowIndex: number,        // 0-based (CSV line index or 0 for single-doc)
  fields: {
    [fieldKey: string]: {  // e.g. 'catalog', 'artist', 'qty', 'due'
      value: string | number | null,
      confidence: 'high' | 'low' | 'not_found' | 'conflict',
      conflictWith?: string // optional: e.g. existing job id or "duplicate catalog"
    }
  },
  suggestedId: string | null  // optional: e.g. 'csv_...' or null until confirm
}
```

- **value:** Parsed or extracted value for that field (string for text/date, number for qty where applicable).
- **confidence:**  
  - **high:** Parsed cleanly (e.g. CSV column matched, or OCR with high certainty).  
  - **low:** Inferred or low-certainty extraction.  
  - **not_found:** No value extracted; user can fill.  
  - **conflict:** Value conflicts with existing data (e.g. catalog already exists); user must accept, change, or skip.
- **suggestedId:** Only set when creating a new job; leave null when update of existing job is intended (phase 1 can be create-only).

### 1.3 Confidence / status shape (summary)

- **Per field:** `confidence` as above.
- **Per row:** Derive a row-level status for UI (e.g. “Ready”, “Review”, “Conflict”):
  - If any field is `conflict` → row status = **Conflict**.
  - Else if any field is `low` or `not_found` → **Review**.
  - Else → **Ready** (all high).
- **Session:** `status` = draft → reviewing → confirmed | abandoned.

### 1.4 Source reference shape

Preserve “where did this come from?” for audit and for re-attachment to the job later (e.g. “PO image” or “source document”).

**Suggested shape:**

```js
sourceRef: {
  type: 'csv' | 'photo' | 'pdf',
  name: string,           // file name or "Photo capture"
  size?: number,          // bytes if file
  capturedAt: string,     // ISO timestamp when ingested
  storageRef?: string     // optional: path or blob id if stored (phase 2)
}
```

- **Phase 1:** `name` + `type` + `capturedAt` are enough. No requirement to store file bytes or PDF in app storage; optional `storageRef` can be added later (e.g. Supabase storage path) so the job can point to “source document” in `po_contract` or a small provenance object.

---

## 2. Recommended UI Flow

### 2.1 Add job entry point

- **Keep:** `+ ADD JOB` opens the existing **New Job Chooser** modal.
- **Extend chooser:** Add two more options alongside “Manual Entry” and “Import CSV”:
  - **Import from photo** (phase 1: triggers file input `accept="image/*"`; later can be camera).
  - **Import from PDF** (phase 1: triggers file input `accept=".pdf"`).
- **Manual:** Unchanged; goes to existing wizard (no staging).
- **CSV:** Change behavior from “parse and save immediately” to “parse → stage → open review screen” (see below).
- **Photo/PDF:** “Select file → ingest → extract (phase 1 can be minimal or manual-only) → open review screen”.

### 2.2 Import type selection

- User chooses **Manual** | **CSV** | **Photo** | **PDF** in the chooser.
- For CSV/Photo/PDF: file picker opens; on file selected, run ingestion (and extraction when implemented). No job is created yet.
- After ingestion, **close the chooser** and **open the Import Review screen** with the import session in state (e.g. `S.importSession = { ... }`).

### 2.3 Review screen

- **New surface:** “Import Review” (e.g. a dedicated overlay or a full-screen step, consistent with wizard/overlay pattern).
- **Title:** e.g. “Review import — [filename]” and “Confirm before creating jobs.”
- **Table (or card list):** One row per **extracted row** (CSV: one per data row; Photo/PDF: one row).
  - Columns: **Field name** | **Extracted value** | **Confidence** | **Edit** (inline or pencil).
  - Confidence shown as badge or icon: high = check/green, low = question/yellow, not_found = dash/gray, conflict = warning/red.
  - User can edit any value; editing can set confidence to “user_confirmed” or leave as-is for audit.
- **Row-level actions:** “Use this row” (include in confirm) / “Skip this row” (do not create job for this row). For conflicts: “Create anyway” or “Open existing” (similar to duplicate modal).
- **Bulk:** “Accept all” / “Skip all” for power users; default is row-by-row.
- **No “Save job” yet:** Only “Confirm and create jobs” (or “Update jobs”) at the bottom.

### 2.4 Final confirm action

- **Button:** e.g. “CREATE JOBS” (or “CREATE 3 JOBS” when 3 rows are accepted).
- **On confirm:**
  1. For each accepted row, build a **job** object from the extracted (and user-edited) fields, using same shape as `buildWizardJob()` / FIELD_MAP.
  2. Assign a new `id` (e.g. `j` + Date.now() or per-row id for bulk).
  3. Run duplicate check per row if desired (catalog/artist/album); optionally show one more “duplicate — create anyway?” for any conflict.
  4. Call same persistence as today: `Storage.saveJob(job)` (and press assignment if present). No new write path.
  5. Attach **source reference** to the job (see section 5) so the job records “verified from [type] [name] at [time]”.
  6. Set `session.status = 'confirmed'` and store `resolvedJobIds`.
  7. Close review screen; run `renderAll()`; toast “N jobs created.”
- **Cancel/Abandon:** Close review without creating jobs; set `session.status = 'abandoned'`. Optionally keep session in memory for “Resume” (phase 2).

---

## 3. Recommended Field List for Phase 1 Extraction

Only the **highest-value** fields that matter for recognition, scheduling, and floor ops. Align with FIELD_MAP and wizard so the same job shape is used.

**Suggested phase 1 extraction set:**

| Field key   | Job field | Rationale |
|-------------|-----------|-----------|
| catalog     | catalog   | Primary identifier; duplicate detection. |
| artist      | artist    | Identity; duplicate detection. |
| album       | album     | Identity. |
| qty         | qty       | Critical for production. |
| format      | format    | 1LP, 2LP, 7", etc. |
| color       | color     | Floor/compound reference. |
| due         | due       | Scheduling. |
| status      | status    | queue/pressing/assembly/hold/done. |
| client      | client    | Optional but high value. |
| notes       | notes     | Free text; often on PO. |

**Defer to later phases:** invoice, email, location, lastContact, vinylType, weight, specialty, labelType, sleeve, jacket, outer_pkg, cpl, inv_date, deposit, inv2, pay2, po_contract subfields. Phase 1 can show these as “not_found” and allow manual fill in review or in panel after create.

**CSV:** Map CSV headers (lowercase) to these keys; any column not in the set can still be mapped to job fields if header matches FIELD_MAP (as today), but confidence for unmapped columns can be “low” until explicitly mapped.

**Photo/PDF:** Phase 1 can be “manual only” (user fills fields in review table) or very limited extraction (e.g. one or two fields from text if a simple pattern exists). No promise of magic OCR; document is “source of truth” attachment, extraction is best-effort assistance.

---

## 4. Recommended Storage Strategy

### 4.1 Temporary in-memory vs persisted staging

- **Phase 1 recommendation:** **In-memory only** for the import session and extracted rows.
  - Store in `S.importSession` (and clear when review is confirmed or abandoned).
  - No new Supabase table for “import_sessions” in phase 1.
  - Pros: No schema change; no cleanup job; simple. Cons: Refresh or navigation loses the session; user must re-import.
- **Optional phase 2:** Persist `import_sessions` (e.g. one row per session in a new table or in a single “staging” blob) with TTL or manual “Clear drafts” so the user can leave and come back. Then “Resume” can reopen the review screen.

### 4.2 What should become audit-visible later

- **Job creation/update:** Already audited via existing `audit_log` triggers on `jobs`. No change needed; when we call `Storage.saveJob(job)`, the trigger records the insert/update.
- **Provenance on the job:** Store a minimal “source” on the job so that later we can show “Created from CSV 'orders.csv' at [time]” or “Verified from PO image at [time]”. This can live in `job.poContract.sourceImport` or a dedicated `job.sourceRef` (see section 5). That is **job data**, not a separate audit table; the audit log already records who changed the job and when.
- **Import session itself:** If in phase 2 you persist import sessions, you can add a small “import_audit” or leave sessions out of audit and rely on job audit + sourceRef on the job.

---

## 5. Recommended Separation: Draft vs Verified Source-Document Data

### 5.1 Two truths

- **Draft / pre-PO:** Data entered by hand (wizard, panel) with no document attached. No “source” ref.
- **Verified / contract / source-document:** Data that came from an import (CSV/photo/PDF) and was **confirmed** by a human in the review step. The job should record that it was “verified from [source]”.

### 5.2 Where to store “verified from” on the job

- **Option A (recommended phase 1):** Use existing `po_contract` jsonb. Add a single key, e.g. `sourceImport`:
  - `job.poContract.sourceImport = { type: 'csv' | 'photo' | 'pdf', name: string, capturedAt: string }`.
  - No schema change; `jobToRow` already sends `po_contract` through.
- **Option B:** Add a dedicated column `source_ref jsonb` on `jobs` and map it in jobToRow/rowToJob. Slightly cleaner separation from PO-specific contract data but requires migration.

Recommendation: **Option A** for phase 1 so that “this job was created/verified from this document” is visible and no migration is required. If later you want a stricter split between “PO contract” and “import provenance”, move to Option B.

### 5.3 What is not draft

- Once the user clicks “CREATE JOBS” and the job(s) are saved, the data is **committed**. The “draft” is only the in-memory import session and extracted rows; the job itself is the same as a manually created job, plus optional `poContract.sourceImport`. No separate “draft job” table is recommended; the staging is the import session, not a copy of the job.

---

## 6. Suggested Implementation Sequence (Small Safe Passes)

1. **Pass 1 — CSV staging only (no UI change yet)**  
   - Add `S.importSession` and a function `parseCSVToImportSession(file)` that returns an import session with `type: 'csv'`, `extractedRows` (one per data row), and per-field confidence. For CSV, all fields can be “high” when column header matches, “low” when inferred, “not_found” when missing.  
   - Do **not** change `importCSV()` to create jobs yet; either call the new parser and set `S.importSession` and leave a stub “open review” for next pass, or keep current import path and add a second path “Import CSV (with review)” in the chooser.

2. **Pass 2 — Import Review overlay (CSV only)**  
   - Add “Import Review” overlay: title, table of extracted rows with columns (field, value, confidence), row actions (Use / Skip), and “CREATE JOBS” / “CANCEL”.  
   - Wire “Import CSV” to: parse → set `S.importSession` → close chooser → open review overlay.  
   - On “CREATE JOBS”: build jobs from accepted rows (same shape as today), run duplicate check per row (reuse duplicate modal pattern if needed), call `Storage.saveJob(job)` for each, set `poContract.sourceImport` from session.sourceRef, then clear session and close overlay.

3. **Pass 3 — Chooser: add Photo and PDF entry points**  
   - In New Job Chooser, add “Import from photo” and “Import from PDF” that open file inputs. On select: create an import session with one extracted row; all fields “not_found” (or manual). Open same review overlay so user can fill and confirm one job. Optionally store file name and capturedAt in sourceRef; no file storage required in phase 1.

4. **Pass 4 — Optional: persist session for “Resume”**  
   - If desired, persist `S.importSession` to localStorage or a staging table so that closing the tab doesn’t lose the session; add “Resume import” in chooser when a draft session exists.

5. **Pass 5 — Optional: simple extraction for photo/PDF**  
   - If you introduce a minimal extraction (e.g. one or two fields from text), run it when the file is selected and set confidence to “low” or “high” accordingly. Still require review and confirm; no auto-create.

---

## Summary

| Topic | Recommendation |
|-------|----------------|
| **Import session** | In-memory object: id, type, sourceRef, extractedRows, status, resolvedJobIds. |
| **Extracted row** | Per-field value + confidence (high/low/not_found/conflict); rowIndex; optional suggestedId. |
| **Source ref** | type, name, capturedAt; optional storageRef later. |
| **UI flow** | Chooser → Manual / CSV / Photo / PDF → (for import) ingest → Review overlay → Accept/Skip per row → CREATE JOBS / CANCEL. |
| **Phase 1 fields** | catalog, artist, album, qty, format, color, due, status, client, notes. |
| **Storage** | Session: in-memory (phase 1). Jobs: existing save path; add `poContract.sourceImport` for provenance. |
| **Audit** | Existing audit_log on jobs; no new audit table for imports in phase 1. |
| **Draft vs verified** | Draft = import session only. Verified = job saved with sourceImport set. |
| **Sequence** | CSV staging → Review overlay + CSV wire-up → Photo/PDF entry + one-row review → optional persist/Resume → optional extraction. |

This keeps the app grounded, avoids auto-import as gospel, and leaves room for better extraction and document storage in later phases without redesign.
