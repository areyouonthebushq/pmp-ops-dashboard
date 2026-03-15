# DEV Notes Delete / Purge — Implementation Report

**Spec:** Cursor Prompt — DEV Notes: Delete / Purge Individual Notes  
**Status:** Implemented (including optional "Delete all imported").

---

## 1. Exact files changed

- **storage.js** — Note `id` on create; `ensureDevNoteIds()` when loading from local; `deleteDevNote(id)` (local filter + save, Supabase call); backfill id in getState.
- **supabase.js** — Map `id` (and `imported`) on dev_notes fetch; pass `entry.id` in logDevNote insert; add `deleteDevNote(id)` (DELETE FROM dev_notes WHERE id = ?).
- **app.js** — Backfill missing `id` when applying Supabase state; `onDevEntryDeleteClick`, `onDevEntryConfirmDelete`, `onDevEntryConfirmCancel`; `onDevDeleteImportedClick`, `onDevDeleteImportedConfirm`, `onDevDeleteImportedCancel`.
- **render.js** — Feed: `data-note-id` and `.dev-entry-actions` with × (admin-only); board: `data-note-id` and `.dev-entry-actions` on each card (admin-only); populate `devDeleteImportedWrap` (button or confirm message).
- **index.html** — `<span id="devDeleteImportedWrap" class="dev-delete-imported-wrap">` in dev-util-zone.
- **styles.css** — `.dev-entry` position relative, confirm-delete border; `.dev-entry-actions` (position, opacity, hover); `.dev-entry-delete-btn`, `.dev-entry-confirm-delete` / `.dev-entry-confirm-cancel`; mobile opacity 0.3 for actions; board card same + compact 9px confirm buttons; `.dev-delete-imported-wrap` / `.dev-delete-imported-btn`.

---

## 2. × control position and visibility

- **Position:** `.dev-entry-actions` is `position: absolute; top: 4px; right: 4px` (feed) and `top: 2px; right: 2px` (board).
- **Desktop:** Opacity 0 by default; `opacity: 1` on `#pg-dev .dev-entry:hover .dev-entry-actions` and `#pg-dev .dev-board-card:hover .dev-entry-actions`.
- **Mobile:** `@media (max-width: 720px)` — `#pg-dev .dev-entry-actions { opacity: 0.3 }` so the × is always visible at reduced opacity (no hover on touch).

---

## 3. Inline confirm behavior

- **Click ×:** Entry/card gets class `confirm-delete` (border `var(--r2)`). The × is replaced in the same `.dev-entry-actions` area with two buttons: **DELETE** (red family) and **CANCEL** (muted). No modal.
- **DELETE:** Calls `Storage.deleteDevNote(id)`, then `renderDevPage()`.
- **CANCEL:** Removes `confirm-delete` and restores the × button in `.dev-entry-actions`.

---

## 4. Persistence and note IDs

- **Local:** Delete removes the note from `S.devNotes` by `id`, then `flushLocalSave()` (via `deleteDevNote`).
- **Supabase:** `PMP.Supabase.deleteDevNote(id)` runs `DELETE FROM dev_notes WHERE id = ?`; then the note is removed from `S.devNotes`.
- **Note IDs:** Every note has an `id`. New notes get `id` in `Storage.logDevNote` (`crypto.randomUUID()` or fallback). Supabase insert sends `entry.id` when present. On load from local storage, `ensureDevNoteIds(data.devNotes)` assigns an id to any note missing one. On apply of Supabase state, any note without `id` is backfilled in app.js. Supabase fetch maps `row.id` (and `row.imported`) into each note.

---

## 5. "Delete all imported"

- **Implemented.** In dev-util-zone (feed only), when admin and there is at least one imported note, a button **"Delete imported (N)"** is shown. Click → inline confirm: **"Delete N imported? [DELETE] [CANCEL]"**. DELETE removes all notes with `imported === true` one-by-one via `Storage.deleteDevNote(id)`, then re-renders and toasts. CANCEL clears the confirm state and re-renders.

---

## 6. Feed and board

- Delete (× → confirm → DELETE/CANCEL) works in **feed** (`.dev-entry`) and **board** (`.dev-board-card`). Same handlers use `closest('.dev-entry') || closest('.dev-board-card')`. Board confirm buttons use 9px font for compact layout.

---

## 7. Scope and admin

- All changes are scoped to **`#pg-dev`**. No other pages modified.
- Delete controls (per-note × and "Delete imported") are shown only when **`S.mode === 'admin'`** (same as DEV page visibility). Role gating is in place; if stricter gating is needed later, it can be added in the same condition.
