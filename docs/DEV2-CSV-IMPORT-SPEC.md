# DEV 2.0 CSV Import Spec

**Status:** Spec (ready for TESTING)  
**Entity:** DEV  
**Type:** think  
**Stage:** TEST  

---

## Purpose

Allow batch import of notes into the DEV 2.0 system via CSV. This covers two use cases:

1. **Backlog import:** Bringing in the Pass E working set (and similar structured backlogs) from Numbers/Excel/CSV so they live in the same feed and board as handwritten DEV notes.
2. **Historical note import:** Categorizing and importing older unstructured notes with retroactive entity/type/stage tags.

---

## CSV shape

### Required columns

| Column | Type | Rules |
|--------|------|-------|
| `text` | string | The note body. Required. Cannot be empty. |

### Optional columns

| Column | Type | Rules |
|--------|------|-------|
| `entity` | string | Must match a key in `DEV_ENTITIES` (e.g. `floor`, `card`, `dev`). Case-insensitive on import; stored lowercase. Empty = no entity. |
| `type` | string | Must match a key in `DEV_WORK_TYPES` (e.g. `bug`, `polish`, `think`, `tune_up`). Case-insensitive. Empty = no type. |
| `stage` | string | Must match a key in `DEV_STAGES` (e.g. `note`, `playground`, `testing`, `live`, `the_shop`, `purgatory`). Case-insensitive. Empty = defaults to `note`. |
| `person` | string | Who created the note. Empty = defaults to current logged-in user. |
| `timestamp` | string | ISO 8601 or parseable date string. Empty = defaults to import time. |
| `notes` | string | Secondary/context field (e.g. from the Pass E "Notes" column). If present, append to `text` as a second line separated by ` — ` or store as a separate field if the data model supports it. |
| `priority` | string | Ignored on import. DEV 2.0 does not use priority. Column is accepted but not stored — this prevents import errors from spreadsheets that have it. |

### Column name matching

Case-insensitive. Trim whitespace. Accept common aliases:

| Canonical | Also accept |
|-----------|-------------|
| `text` | `item`, `body`, `note`, `content` |
| `entity` | `surface`, `area` |
| `type` | `work_type`, `worktype` |
| `stage` | `status`, `phase` |
| `person` | `author`, `user`, `created_by` |
| `timestamp` | `date`, `created_at`, `time` |

---

## Validation rules

1. **Unknown entity/type/stage values:** Do not reject the row. Import with the field set to empty string and flag a warning: `"Row 3: unknown entity 'FACTORY' — imported without entity tag."` The user can fix tags in-app later.

2. **Empty text:** Reject the row. A note with no text is not a note.

3. **Duplicate detection:** None for v1. Every row creates a new note. Deduplication is a future concern.

4. **Row limit:** Warn (not block) above 200 rows. DEV notes are not a data warehouse.

---

## Import flow

### Step 1 — File selection
User clicks an import control on the DEV page (location TBD — could be where EXPORT was, or in a utility row). Accepts `.csv` files only.

### Step 2 — Preview
Parse the CSV. Show a preview table of the first 5–10 rows with:
- Detected columns mapped to DEV fields
- Any validation warnings (unknown values, empty text rows)
- Total row count
- A count of how many rows have entity/type/stage tags vs. plain notes

The preview uses the same quiet, console-style rendering as the rest of the DEV page. Not a modal — render inline, replacing the feed temporarily (or below the console, above the feed).

### Step 3 — Confirm
User clicks IMPORT. All valid rows are written via `Storage.logDevNote()` with the mapped fields. Each row becomes one DEV note, same as if it were typed manually.

### Step 4 — Report
After import, show a short summary:
- Notes imported: N
- Warnings: N (with details expandable)
- Skipped (empty text): N

Then return to normal DEV view. The imported notes appear in the feed and board.

---

## Interaction with existing systems

- **Legacy `area` field:** If the CSV has an `entity` value, also write it to `area` (uppercased) for backward compatibility with legacy display. If no entity, leave `area` empty.
- **Supabase:** If the app is in Supabase mode, imported notes go through the same sync path as manual notes. No special bulk endpoint needed for v1 — loop and write sequentially.
- **Export round-trip:** A CSV exported from DEV EXPORT should be importable back into DEV without modification. This means EXPORT and IMPORT must agree on column names. Verify this before shipping.

---

## What this is not

- Not a general-purpose CSV importer (that's the JOBS import flow — see `IMPORT-REVIEW-ARCHITECTURE.md`).
- Not a migration tool for moving data between Supabase instances.
- Not a bulk editor. Import creates notes; it does not update or replace existing notes.

---

## Open questions (decide before building)

1. **Where does the import button live?** Options: (a) where EXPORT was before it was hidden, (b) a new utility row, (c) behind a `...` or gear menu on the DEV page. Recommendation: put IMPORT and EXPORT together in a small utility pair, visible only in feed mode (not board mode).

2. **Should imported notes get a marker?** E.g., a small `IMPORTED` tag in the feed so you can distinguish batch imports from hand-typed notes. Recommendation: yes, for v1 — add an `imported: true` flag to the note object. Display as a quiet grey marker in the feed meta. Can be removed later once the notes feel native.

3. **Notes column handling:** If the CSV has both `text` (item) and `notes` (context), should they be concatenated into one `text` field, or should `notes` map to a secondary field? Recommendation: concatenate for v1 (`text + ' — ' + notes`). Keep it simple.

---

## Implementation notes (clarifications)

- **EXPORT/IMPORT column contract:** EXPORT always emits canonical column names: `channel`, `stage`, `type`, `entity`, `timestamp`, `person`, `text`. IMPORT accepts those canonicals plus the alias list above. Round-trip: a CSV exported from DEV can be re-imported without renaming columns.
- **Encoding:** Read CSV as UTF-8. If a BOM is present, strip it before parsing.
- **Notes round-trip:** On export, a single `text` column is emitted. The original `notes` segment (if concatenated on import) is not round-tripped as a separate column.
- **Where the buttons live:** IMPORT and EXPORT live together in a small utility strip (icon zone) within the DEV console, mimicking the JOBS page pattern (↑ Import, ↓ Export). The strip is visible only in feed mode; in board mode it is hidden (or shown in a compact strip above the board if preferred — implementer choice: feed-only is recommended).
- **`imported` flag:** When a note is created by import, set `imported: true` on the note object. The flag is persisted with the note (in the same structure as other fields). Display as a quiet grey marker in the feed/board meta. Export may include an `imported` column for round-trip; v1 may omit it.
