# Audit: Log & Notes search, sort, and clickability

**Scope:** How LOG and NOTES reference search within their “worlds” and in the broader app; band/catalog click behavior (sort vs panel); borrowing notes logic for Compounds; and enhanced clickability for LOG and NOTES.

**Intent:** Audit only — no code changes. Recommendations at the end.

---

## 1. Search and “world” boundaries

### 1.1 LOG page

| Aspect | Current behavior | Broader app |
|--------|------------------|------------|
| **Search** | No text search. Filtering is by **date** (date picker) and by **job** only for the *numpad/console* (which job you’re logging for). The **feed** is not filtered by the selected job. | LOG does not use the global jobs search (`#jobSearch`). |
| **Scope** | Feed = all active (non-done, non-archived) jobs’ progress for the chosen date, plus QC reject rows for that date. Sorted by **timestamp desc**. | Single “world”: date-scoped activity stream. |
| **Reference to jobs** | Job picker uses `sortJobsByCatalogAsc`; feed entries show `jobLabel` (catalog · artist) in meta. Only **asset_note** rows are clickable → `goToNotesWithFilter(jobId, assetKey)`. PRESS/PASS/REJECT rows show job but are **not** clickable. | No link from log feed to job panel or jobs list. |

So in LOG: **no search**, **no “filter feed by this job”**; the only in-world “reference” is the job dropdown (for logging) and the non-clickable job label in each feed row.

### 1.2 NOTES page

| Aspect | Current behavior | Broader app |
|--------|------------------|------------|
| **Search** | **Text search** in `#notesSearch`: filters entries by substring in `text`, `person`, `catalog`, `artist`, `album`, `jobId`, `assetLabel`, `assetKey`. Live (on input); shows “N match” count. | Search is local to NOTES. `goToNotesWithFilter(jobId, assetKey)` can **preload** NOTES with job + asset filter from Assets overlay / elsewhere. |
| **Scope** | **Channel** = job (or !TEAM / !ALERT). With a job selected, entries = that job’s notes; with “Select job” empty, entries = all jobs’ notes. Sorted by **timestamp desc** only. | Notes are job-scoped or plant-wide; no sort-by-column. |
| **Reference to jobs** | Catalog and artist are rendered (`.notes-entry-cat`, `.notes-entry-artist`) but **not clickable**. No “open job panel” or “filter to this job” from an entry. | Same as LOG: no link from a note row to the right-side panel or to “filter log by this job”. |

So in NOTES: **search exists and works well**; **no click-through** from catalog/artist (or row) to job panel or to LOG.

### 1.3 JOBS page (main list)

- **Search:** `#jobSearch` filters by catalog, artist, album, color, client, location (substring).
- **Sort:** `S.jobsSortBy` / `S.jobsSortDir`; headers (catalog, artist, album, etc.) toggle sort.
- **Click:** Catalog, artist, album, status cell, and card → `openPanel(j.id)` (right-side panel).

So the main “broader world” already has: **search + sort + click catalog/artist → panel**.

---

## 2. Band/catalog click: sort vs panel?

**Question:** In LOG and NOTES, if the user clicks band/catalog, should it **sort by their log** or **go to the right-side panel**?

- **“Sort by their log”** in LOG would mean: filter the **log feed** to entries for that job only. Today the feed is date-only (all jobs); there is no “filter by job” in the feed. So “sort” here is really **“filter feed to this job”**.
- **“Sort by their log”** in NOTES would mean: set **channel** to that job (and maybe focus search). That’s already possible via the channel dropdown; click would just shortcut it.
- **“Go to right-side panel”** means: same as JOBS list — `openPanel(jobId)` so the user sees job details, status, progress, assets, notes, etc.

**Recommendation (audit):**

- **Prefer “click catalog/artist → open panel”** for both LOG and NOTES. Rationale:
  - **Consistency** with JOBS: “catalog/artist = open this job” everywhere.
  - **Clear mental model:** “I see a job name → I can open that job.”
  - “Filter log/notes to this job” is a secondary action (e.g. “Filter to this job” button, or panel could offer “Show in LOG” / “Show in NOTES” links).

**“Can of worms” (design choices, not implemented):**

1. **LOG:** PRESS/PASS entries have `jobId`; REJECT entries come from `qcLog` and only have a **display string** (`job`), no `job_id`. So:
   - **Option A:** Make only PRESS/PASS rows clickable (catalog/artist or whole row) → `openPanel(jobId)`.
   - **Option B:** For REJECT, try to resolve job from “catalog · artist” (fuzzy match); risk of wrong job if duplicates.
   - **Option C:** Leave REJECT rows non-clickable until qc_log stores `job_id` (schema change).
2. **NOTES:** Every entry has `jobId`; making catalog/artist (or row) clickable is straightforward.
3. **Double duty:** Should click also set LOG job picker / NOTES channel to that job? That could be:
   - **Click = panel only** (simplest).
   - **Click = panel + set NOTES channel** when on NOTES (so next note is in context).
   - **Click = panel + set LOG job** when on LOG (so next log action is for that job).  
   All of these are follow-up product choices.

---

## 3. What logic to borrow from NOTES for Compounds

| Notes capability | Compounds today | Borrowable idea |
|-----------------|------------------|------------------|
| **Search** | None. List order = Supabase `created_at` (load order). | Add a **search input**; filter list by substring in `name`, `stock`, `location`, `notes` (same “haystack” pattern as notes). Optional: “N match” count. |
| **Sort** | None (raw array order). | Add **sort**: e.g. by **name** (alpha), **location** (alpha), **stock** (alpha or numeric if consistent). Reuse the pattern: a `S.compoundsSortBy` (and optional `S.compoundsSortDir`) and a small `getCompoundSortValue(c, key)` + sort before render. No need for table headers if UI is cards; could be a dropdown “Sort by: Name / Location / Stock” above the list. |
| **Channel/picker** | N/A (notes are per-job). | Compounds don’t have a “channel”; no direct equivalent. Optional: “Filter by location” dropdown if locations are a finite set. |

So: **search** and **sort** from NOTES are the two pieces that map cleanly to Compounds; implementation can stay minimal (one search box, one sort control).

---

## 4. Enhanced clickability for LOG and NOTES

### 4.1 LOG feed

| Element | Current | Enhancement |
|---------|---------|-------------|
| **PRESS/PASS row** | jobLabel in meta, not clickable | Make **jobLabel** (or entire row) clickable → `openPanel(it.jobId)` when `it.jobId` is present. Add cursor + title “Open job”. |
| **REJECT row** | jobLabel only (no jobId) | Leave non-clickable unless qc_log gains job_id (or add fuzzy resolve; see “can of worms”). |
| **Asset note row** | Already clickable → NOTES with job + asset filter | Keep as is. Optionally add a second action (e.g. “Open job” on catalog/artist) if we split click targets. |

So: **minimal, safe enhancement = make PRESS/PASS rows (or their job label) open the panel when jobId exists.**

### 4.2 NOTES feed

| Element | Current | Enhancement |
|---------|---------|-------------|
| **Catalog / artist** | Plain text | Make **catalog** and/or **artist** (or the whole `.notes-entry-job` block) clickable → `openPanel(e.jobId)` for job-backed entries. Skip or no-op for `e.jobId === '!ALERT'` / `!TEAM` if those appear in the feed. |
| **Row** | No click | Optional: whole row click → open panel (same as above), so the large hit area is consistent with LOG. |

So: **minimal enhancement = make catalog/artist (or row) open the panel for entries that have a real jobId.**

### 4.3 Cross-world

- **From JOBS:** Already has search, sort, and catalog/artist → panel.
- **From LOG/NOTES:** After the above, “click job identity → open panel” would be consistent across all three.
- Optional later: from **panel**, “Show in LOG” could set `logViewDate` to today and `S.logSelectedJob` to current job and navigate to LOG (and optionally filter feed by job if we add that). “Show in NOTES” could call `goToNotesWithFilter(currentJobId, null)` and go to NOTES. Not in scope for this audit.

---

## 5. Summary table

| Page   | Search / filter          | Sort              | Catalog/artist click (today) | Catalog/artist click (recommended)     |
|--------|--------------------------|-------------------|------------------------------|----------------------------------------|
| JOBS   | jobSearch + jobFilter    | jobsSortBy/Dir    | openPanel(j.id)              | (already done)                         |
| LOG    | Date only; no text search | Timestamp desc   | None                         | openPanel(jobId) for PRESS/PASS rows   |
| NOTES  | notesSearch; channel picker | Timestamp desc | None                         | openPanel(e.jobId) for job entries     |
| Compounds | None                  | None (load order) | N/A                          | Add search + sort (borrow notes pattern) |

---

## 6. Follow-up recommendations (no implementation)

1. **LOG:** Add clickability for PRESS/PASS feed rows (or jobLabel only) → `openPanel(it.jobId)`. Leave REJECT as-is unless qc_log gets job_id or a clear “resolve job from label” rule.
2. **NOTES:** Add clickability for catalog/artist (or whole row) → `openPanel(e.jobId)` when `e.jobId` is a job id (not !ALERT/!TEAM).
3. **Compounds:** Add a search input (filter by name, stock, location, notes) and a sort control (e.g. name, location, stock), reusing the notes “search over a list” and “sort by key” patterns.
4. **Product:** Decide whether click should also set LOG job picker / NOTES channel (and document in a small interaction spec).
5. **Optional:** LOG “filter feed by job” (so when a job is selected in the picker, feed shows only that job’s entries for the date). This would make “sort by their log” meaningful as “filter to this job.”

— End of audit —
