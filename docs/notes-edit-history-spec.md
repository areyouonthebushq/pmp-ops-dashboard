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

"Original author" is matched by `note.person === currentUserDisplayName`. This is intentionally loose (no user-id foreign key) to match the current auth model. If user identity hardens later, switch to UID comparison.

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

## What this spec does NOT cover

- Threaded replies or comment chains
- Rich text or markdown in notes
- Batch editing or bulk delete
- Version restore ("undo edit")
- Notification of edits to other users

These are explicitly out of scope. Notes is a logbook, not a collaboration tool.
