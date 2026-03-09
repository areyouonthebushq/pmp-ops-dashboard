# Audit: Right-side panel notes persistence write path

Facts from code only.

---

## 1. Production notes

| Step | Fact |
|------|------|
| **1. DOM / UI control** | `jNotesInput` (textarea, id `jNotesInput`, placeholder "Add a production note..."). Button "+ LOG NOTE" calls `addProductionNote()`. There is no separate single “current production notes” field in the slide panel (unlike floor card’s `fcNotes`). |
| **2. Function that reads from UI** | `addProductionNote()` (app.js): reads `document.getElementById('jNotesInput').value`, trims to `text`. No other function reads `jNotesInput` on save. |
| **3. Variable / property assigned** | `job.notes = text`; `job.notesLog.push({ text, person, timestamp })` (same `job` reference from `S.jobs.find(j => j.id === S.editId)`). |
| **4. Function that writes to in-memory state** | `addProductionNote()`: mutates `job.notes` and `job.notesLog`, then calls `Storage.saveJob(job)`. `saveJob()` (app.js): for existing job, sets `job.notes = existing.notes != null ? existing.notes : job.notes` (does not read `jNotesInput`). |
| **5. Function that sends to Supabase** | `Storage.saveJob(job)` → `window.PMP.Supabase.saveJob(job)` → `jobToRow(job)` → `client.from('jobs').upsert(row)`. |
| **6. DB column** | `notes` (text). |
| **7. Function that hydrates from Supabase** | `loadAllData()` → `rowToJob(row)` (supabase.js): `job.notes = row.notes`. |
| **8. Function that re-populates panel when reopened** | `openPanel()`: calls `ensureNotesLog(j)` and `renderNotesSection()`. `renderNotesSection()` fills `notesLogList` from `job.notesLog`; it does **not** set `jNotesInput.value`. So the current `job.notes` text is **not** written into any panel input on reopen. |

---

## 2. Assembly / location notes

| Step | Fact |
|------|------|
| **1. DOM / UI control** | `jAssemblyInput` (textarea, id `jAssemblyInput`, placeholder "Add an assembly/location note..."). Button "+ LOG NOTE" calls `addAssemblyNote()`. No separate “current assembly notes” field in the slide panel (unlike floor card’s `fcAssembly`). |
| **2. Function that reads from UI** | `addAssemblyNote()` (app.js): reads `document.getElementById('jAssemblyInput').value`, trims to `text`. No other function reads `jAssemblyInput` on save. |
| **3. Variable / property assigned** | `job.assembly = text`; `job.assemblyLog.push({ text, person, timestamp })`. |
| **4. Function that writes to in-memory state** | `addAssemblyNote()`: mutates `job.assembly` and `job.assemblyLog`, then `Storage.saveJob(job)`. `saveJob()` (app.js): `job.assembly = existing.assembly != null ? existing.assembly : job.assembly` (does not read `jAssemblyInput`). |
| **5. Function that sends to Supabase** | Same as production notes: `Storage.saveJob(job)` → Supabase `saveJob` → `jobToRow` → upsert. |
| **6. DB column** | `assembly` (text). |
| **7. Function that hydrates from Supabase** | `rowToJob(row)`: `job.assembly = row.assembly`. |
| **8. Function that re-populates panel when reopened** | `openPanel()` → `renderNotesSection()`: fills `assemblyLogList` from `job.assemblyLog`; does **not** set `jAssemblyInput.value`. So `job.assembly` is **not** shown in any panel input on reopen. |

---

## Answers

- **Does editing production notes in the right-side panel persist after save + close + reopen?**  
  **Only if the user clicks “+ LOG NOTE”** before save. The value is then in `job.notes` and is persisted. If the user only types in `jNotesInput` and clicks the main Save without “+ LOG NOTE”, `saveJob()` never reads `jNotesInput`, so that text is not persisted.  
  **On reopen:** `job.notes` is restored from DB via `rowToJob`, but nothing sets `jNotesInput.value = j.notes`, so the persisted production notes are **not** shown in the panel.

- **Does editing assembly / location notes in the right-side panel persist after save + close + reopen?**  
  Same as above: persists only when “+ LOG NOTE” is used; on reopen, `job.assembly` is in memory but **not** written into `jAssemblyInput`, so it is not shown.

---

## Fix applied (minimal)

1. **openPanel()**  
   When opening an existing job, set `jNotesInput.value = j.notes || ''` and `jAssemblyInput.value = j.assembly || ''` so the current notes/assembly text is visible when the panel is reopened.

2. **saveJob()**  
   When saving an existing job, read `jNotesInput` and `jAssemblyInput` and set `job.notes` and `job.assembly` from those values so that typing in the textareas and clicking Save (without “+ LOG NOTE”) also persists.

Notes log / assembly log behavior (append-only log display and “+ LOG NOTE”) is unchanged; only the single `notes` / `assembly` text persistence and reopen display are fixed.
