# Notes Edit History — Behavior Spec

## Premise

NOTES is the canonical memory surface. Every note is a timestamped, attributed record of truth. Editing must not erase provenance or break trust. The system should feel like a logbook with corrections, not a wiki with rewrites.

---

## Current note entry schema

```
{
  text:           string,
  person:         string,
  timestamp:      ISO 8601,
  assetLabel?:    string,     // tagged receiving/packing item label
  assetKey?:      string,     // tagged item key
  attachment_url?: string,    // image URL
  isCautionAsset?: boolean,   // caution-origin flag
  jobId:          string      // parent job (implicit via notesLog array)
}
```

DEV notes share the same shape minus `assetLabel`/`assetKey`, stored in a separate `dev_notes` table.

---

## Who can edit

| Action | Who | Condition |
|---|---|---|
| Add note | Any authenticated user | Job must be selected |
| Edit own note | Original author only | `note.person` matches current user display name |
| Edit others' note | Admin only | `S.mode === 'admin'` |
| Delete note | Admin only | Soft-delete (see below) |

"Original author" is matched by `note.person === currentUserDisplayName`. This is **intentionally loose** — there is no stable user ID in the current auth model, only a display name string. This works today because display names are unique within the plant, but it is the weakest link in the edit-permission chain.

**Long-term recommendation**: When the auth model hardens, switch to `note.authorId === currentUser.id` (a stable UID from Supabase Auth or equivalent). Until then, display-name matching is the accepted v1 compromise. Do not build additional features (e.g., delegation, role-based editing) on top of display-name matching.

---

## How editing works

1. **Trigger**: Long-press or dedicated edit icon (small pencil) on a note entry. The icon appears on hover/focus only.

2. **Inline edit**: The note text becomes an editable textarea in-place. The original text is pre-filled. The user modifies and confirms (Enter or tap save) or cancels (Escape or tap cancel).

3. **On save**:
   - The `text` field is updated to the new value.
   - An `editHistory` array is appended to the note entry:
     ```
     editHistory: [
       {
         previousText:  string,    // text before this edit
         editedBy:      string,    // display name of editor
         editedAt:      ISO 8601   // timestamp of edit
       }
     ]
     ```
   - The note's original `person` and `timestamp` are never changed.
   - The note gains an `edited: true` flag for fast display checks.

4. **On cancel**: Nothing changes. Textarea closes.

---

## How edited state appears

- An edited note shows a subtle `(edited)` label next to the timestamp, styled in `var(--d3)` at 10px.
- The `(edited)` label is not a link and not interactive by default.
- Hover or tap on `(edited)` reveals a tooltip showing the last edit: `"Edited by {name} · {relative time}"`.
- No inline diff. No strikethrough of old text. The current text is the canonical version.

---

## How history is viewed

- **Primary path**: Tap/click the `(edited)` marker to expand a minimal edit log below the note. Each entry shows:
  ```
  {previousText}
  — {editedBy} · {editedAt relative}
  ```
  Styled as a subdued inset block (`var(--b1)` background, `var(--d3)` text, 11px).

- **Collapse**: Tap again or tap anywhere outside to collapse.

- **No version browser**: There is no side-by-side diff, no "restore previous version" button, no version picker. The edit log is read-only proof that a change happened and what the old text was.

---

## What metadata is preserved

| Field | Mutated on edit? | Notes |
|---|---|---|
| `text` | Yes | Updated to new content |
| `person` | No | Always the original author |
| `timestamp` | No | Always the original creation time |
| `assetLabel` | No | Tag is permanent |
| `assetKey` | No | Tag is permanent |
| `attachment_url` | No | Image reference is permanent |
| `isCautionAsset` | No | Origin flag is permanent |
| `edited` | Set to `true` | Fast display flag |
| `editHistory` | Appended | Grows with each edit; never truncated |

---

## Deletion (soft)

- Admin-only action. Not available to regular users.
- A deleted note gets `deleted: true` and `deletedBy` / `deletedAt` fields.
- Deleted notes are filtered out of the feed by default.
- No "trash" view in v1. Deleted notes remain in the data for audit recovery.

---

## DEV notes

Same rules apply. DEV notes use the same edit/history schema. The only difference is storage location (`dev_notes` table vs `job.notesLog` array).

---

## Implementation Clarifications

These rules tighten the spec above for safer implementation. They do not change doctrine — they make it harder to misread.

### IC-1 — Storage shape defaults

All new fields introduced by this spec are **optional and additive**. A note without them is a valid, unedited, non-deleted note.

| Field | Type | Default if missing | Interpretation |
|---|---|---|---|
| `edited` | `boolean` | `undefined` / `false` | Note has never been edited |
| `editHistory` | `array` | `undefined` / `[]` | No edit history exists |
| `deleted` | `boolean` | `undefined` / `false` | Note is live |
| `deletedBy` | `string` | `undefined` | N/A (not deleted) |
| `deletedAt` | `ISO 8601` | `undefined` | N/A (not deleted) |

**Rule**: Code must treat `undefined`, `null`, `false`, and absent as equivalent for all boolean flags. Use `if (note.edited)` and `if (note.deleted)`, never `=== true`.

### IC-2 — Backward compatibility

All existing notes predate this spec and have no `edited`, `editHistory`, or `deleted` fields. They are valid as-is.

- **Do not migrate** existing notes on deploy. The schema is append-only — fields appear the first time a note is edited or deleted.
- **Do not backfill** `edited: false` or `editHistory: []` onto existing notes. Absence means "never touched."
- **Storage writes**: When saving an edited note, write only the fields that have values. Do not serialize `undefined` fields into the JSONB column.

### IC-3 — History ordering

- `editHistory` is stored **oldest-first** (append-only, newest entry is last).
- The history view displays **newest-first** (reverse the array for display, not storage).
- The `(edited)` tooltip always references the **last** entry in the array (the most recent edit).

### IC-4 — Text-only editing

Editing changes the `text` field and nothing else.

- `attachment_url` is **permanent for v1**. Editing does not remove, replace, or add attachments.
- `assetLabel`, `assetKey`, `isCautionAsset` are **permanent**. Editing does not re-tag a note.
- `person` and `timestamp` are **permanent**. The original author and creation time are never overwritten.

If a note's attachment or tag is wrong, the operational remedy is to soft-delete and re-add — not to edit the metadata.

### IC-5 — ACHTUNG interaction

- Editing an ACHTUNG-origin note (`isCautionAsset: true`) **does not clear or resolve** the ACHTUNG flag on the job.
- ACHTUNG resolution remains a separate, explicit action (via the RSP caution protocol or direct `setCaution` call).
- An edited ACHTUNG note retains its `isCautionAsset: true` flag permanently.
- Soft-deleting an ACHTUNG note also **does not resolve** ACHTUNG. The caution state lives on the job, not on the note.

### IC-6 — Deleted-note behavior

Soft-deleted notes (`deleted: true`) are **excluded by default** from:

- The NOTES feed
- The DEV feed
- Note counts and "recent note" indicators (e.g., blue pulsing dots on JOBS LIVE)
- Card Zone note summaries (asset/packing recent-note displays)
- Any "last note" preview or tooltip

They are **not excluded** from:

- The raw `notesLog` / `dev_notes` data (they remain in storage)
- Future audit/recovery views (not built yet)

**No trash UI in v1.** Deleted notes are invisible but recoverable by an admin with data access.

### IC-7 — Audit relationship

In v1, edit and delete actions are **recorded locally on the note only** (via `editHistory` and `deleted`/`deletedBy`/`deletedAt`). They do **not** write to the AUDIT log table.

This is acceptable because:
- The note itself carries full provenance (who edited, when, what the old text was).
- The AUDIT table is currently focused on job-level state changes, not note-level mutations.

**Later**: When AUDIT is expanded, note edits and deletes should emit audit entries. Design that integration when AUDIT gets its own spec pass — do not bolt it on ad hoc.

---

## What this spec does NOT cover

- Threaded replies or comment chains
- Rich text or markdown in notes
- Batch editing or bulk delete
- Version restore ("undo edit")
- Notification of edits to other users

These are explicitly out of scope. Notes is a logbook, not a collaboration tool.

---

## Changelog

| Date | Change | Section |
|---|---|---|
| 2026-03-06 | Initial spec | All |
| 2026-03-06 | Added Implementation Clarifications (IC-1 through IC-7) | New section |
| 2026-03-06 | Strengthened identity/authority note — marked display-name matching as v1 compromise, added long-term UID recommendation | Who can edit |
| 2026-03-06 | Defined storage shape defaults and missing-field interpretation | IC-1 |
| 2026-03-06 | Defined backward compatibility rules — no migration, no backfill | IC-2 |
| 2026-03-06 | Defined history ordering — oldest-first in storage, newest-first in display | IC-3 |
| 2026-03-06 | Explicitly scoped editing to text-only — attachments/tags permanent | IC-4 |
| 2026-03-06 | Defined ACHTUNG interaction — editing/deleting a note does not resolve caution | IC-5 |
| 2026-03-06 | Defined deleted-note exclusion rules for feeds, counts, and indicators | IC-6 |
| 2026-03-06 | Defined audit relationship — local-only in v1, deferred to future audit spec | IC-7 |
