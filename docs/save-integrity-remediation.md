# Save Integrity — Remediation Plan

**Date**: 2026-03-06
**Source**: Elegance Audit §3 (Save Integrity)
**Priority**: P0-P1
**Scope**: Save-path correctness only. No state architecture rewrite. No naming changes. No UI changes.

---

## Executive Summary

Seven distinct save-integrity problems were identified in the elegance audit. Three of them — manual field preservation, fire-and-forget saves, and the card zone not saving — can cause **silent, unrecoverable data loss in normal production use** (not edge cases, not race conditions — normal button clicks). Two more — the `curAssets` split brain and offline queue dropping fields — can cause data loss under specific but realistic conditions. The remaining two (mutate-before-save, global `saveInFlight`) are lower severity but compound the others.

This plan turns those findings into a sequenced set of patches. Each patch is designed to be small, isolated, and safe to deploy independently. None of them require architectural changes to `S`, the overlay system, or the rendering pipeline.

---

## Issue Matrix

| ID | Issue | Risk Type | Severity | Affected | Why It's Dangerous |
|----|-------|-----------|----------|----------|-------------------|
| S1 | Manual field preservation in `saveJob()` | **Data loss** | CRITICAL | `app.js:2319-2392` | Every new job field must be manually added to a 12+ field preservation block or it silently drops to `undefined` on panel save. One missed field = permanent data loss. |
| S2 | Fire-and-forget saves (11 of 23 call sites) | **Silent failure** | CRITICAL | `app.js:2470, 2483, 2532, 3389, 3439, 3455, 3858` / `render.js:763` / `stations.js:457, 467, 478` | User sees success toast. Backend may have rejected the write. No retry, no feedback, no revert. |
| S3 | `closeCardZone` doesn't save | **Data loss** | CRITICAL | `render.js:946-961` | Asset/pack changes flushed to memory but never persisted. A realtime event or poll between card-zone close and the next explicit save silently erases the changes. |
| S4 | `curAssets` vs `job.assets` split brain | **Overwrite** | CRITICAL | `app.js:147, 1291, 2330` / `render.js:950` | Panel save uses a stale snapshot (`curAssets`). If card zone wrote to `job.assets` after panel opened, panel save overwrites those changes. |
| S5 | Mutate-before-save | **Trust** | HIGH | `app.js:2367` | `S.jobs[i] = job` runs before `await Storage.saveJob(job)`. On save failure, in-memory state diverges from server. Next `loadAll()` may silently overwrite or user may re-save stale data. |
| S6 | Offline queue drops fields | **Data loss** | CRITICAL | `storage.js:233-234` | Offline `saveJob` only queues `{ type: 'job_status', jobId, status }`. All other fields — notes, assets, caution, packCard, fulfillment_phase — are silently lost. |
| S7 | Global `saveInFlight` boolean | **Race condition** | MEDIUM | `storage.js:240, 258` | Single flag for all entity types. Concurrent saves (job + presses) can clear the flag early, allowing a poll-triggered `loadAll()` to overwrite in-flight data. |

---

## Remediation Order

### Phase 1 — Stop the bleeding (P0, days 1-2)

These are the fixes where normal user actions can cause silent data loss *today*.

| Order | Fix | Issue | Effort | Dependencies |
|-------|-----|-------|--------|-------------|
| 1.1 | **Add `await` and error handling to all 11 fire-and-forget saves** | S2 | 1-2 hours | None |
| 1.2 | **Add `Storage.saveJob()` call in `closeCardZone`** | S3 | 15 min | None |
| 1.3 | **Sync `curAssets` after card zone close** — re-snapshot `curAssets` from `job.assets` after card zone writes back | S4 | 15 min | Depends on 1.2 |

### Phase 2 — Structural patch (P1, days 3-4)

These fix the most dangerous long-term pattern without requiring a rewrite.

| Order | Fix | Issue | Effort | Dependencies |
|-------|-----|-------|--------|-------------|
| 2.1 | **Refactor `saveJob()` to merge-on-write** — start from `existing`, apply only changed fields from DOM, instead of building from scratch and manually preserving | S1 | 3-4 hours | None (but test carefully) |
| 2.2 | **Move `S.jobs[i] = job` to after successful save** | S5 | 15 min | Depends on 2.1 (same function, test together) |

### Phase 3 — Harden edges (P1, days 5-6)

These fix less-frequent but still dangerous paths.

| Order | Fix | Issue | Effort | Dependencies |
|-------|-----|-------|--------|-------------|
| 3.1 | **Expand offline queue to store full job snapshot** | S6 | 2-3 hours | None |
| 3.2 | **Replace global `saveInFlight` with per-entity tracking** | S7 | 1-2 hours | None |

---

## Detailed Patch Strategies

### Patch 1.1 — Await fire-and-forget saves

**Goal**: Every `Storage.saveJob()` call either awaits and handles failure, or passes through a standard error handler.

**Strategy**: Create a thin helper:

```js
function saveJobSafe(job, label) {
  return Storage.saveJob(job).catch(function (e) {
    toastError(label + ' save failed');
    console.error('[PMP] ' + label + ' saveJob error', e);
  });
}
```

Then at each of the 11 call sites, replace `Storage.saveJob(j);` with `await saveJobSafe(j, 'CONTEXT')` (or `.then()` chain if the function isn't async).

**Call sites to patch** (in priority order based on user frequency):

| # | Function | File:Line | Currently | Change to |
|---|----------|-----------|-----------|-----------|
| 1 | `setCaution` (set) | `app.js:2483` | `Storage.saveJob(j);` | `await saveJobSafe(j, 'Caution');` (make fn async) |
| 2 | `setCaution` (clear) | `app.js:2470` | `Storage.saveJob(j);` | `await saveJobSafe(j, 'Caution');` |
| 3 | `cycleStatus` (apply) | `app.js:3439` | `Storage.saveJob(j);` | `await saveJobSafe(j, 'Status');` (make fn async) |
| 4 | `cycleStatus` (undo) | `app.js:3455` | `Storage.saveJob(j);` | `await saveJobSafe(j, 'Undo');` |
| 5 | `setFulfillmentPhase` | `app.js:2532` | `Storage.saveJob(j);` | `await saveJobSafe(j, 'Phase');` (make fn async) |
| 6 | `applySuggestedStatus` | `app.js:3389` | `Storage.saveJob(j);` | `await saveJobSafe(j, 'Status');` |
| 7 | `saveFloorCardQuickEdit` | `render.js:763` | `Storage.saveJob(j);` | `saveJobSafe(j, 'Floor edit');` (render.js isn't async — use fire-with-catch) |
| 8 | `pressStationHold` | `stations.js:457` | `Storage.saveJob(job);` | `saveJobSafe(job, 'Hold');` |
| 9 | `pressStationResume` | `stations.js:467` | `Storage.saveJob(job);` | `saveJobSafe(job, 'Resume');` |
| 10 | `pressStationSaveNote` | `stations.js:478` | `Storage.saveJob(job);` | `saveJobSafe(job, 'Note');` |
| 11 | `addNoteFromPackCard` | `app.js:3858` | `.catch(function () {})` | `.catch(function (e) { toastError('Pack note save failed'); })` |

**Caution**: Making `setCaution`, `cycleStatus`, and `setFulfillmentPhase` async means their callers need to not depend on synchronous completion. Audit each caller — current callers treat them as fire-and-forget already, so making them async is safe (the returned promise is ignored at the call site).

**Caution**: `cycleStatus` has an undo timer callback. The undo callback should also use `saveJobSafe`. The timer is a `setTimeout` so `await` inside it is fine (it's a new execution context).

---

### Patch 1.2 — Save on card zone close

**Goal**: When the user closes the asset/pack card zone, persist the changes immediately instead of leaving them only in memory.

**Strategy**: After the existing memory flush in `closeCardZone`, add a `Storage.saveJob()` call:

```js
function closeCardZone() {
  if (assetsOverlayState) {
    flushAssetsOverlayInputs();
    var job = S.jobs.find(function(j) { return j.id === assetsOverlayState.jobId; });
    if (job) {
      job.assets = JSON.parse(JSON.stringify(assetsOverlayState.data));
      Storage.saveJob(job).catch(function(e) {     // <-- ADD
        toastError('Asset changes may not have saved');
      });
    }
  }
  // ... rest of existing cleanup
}
```

Similarly, if `packCardState` has changes, save those too.

**Caution**: This adds a save call that didn't exist before. Verify that `Storage.saveJob` with a partially-built job object (just assets changed, panel fields untouched) doesn't overwrite other fields. Since fire-and-forget saves throughout the app already do this (e.g., `setCaution` mutates `j.caution` and saves the whole `S.jobs[i]`), this is consistent with the current pattern. The job object in `S.jobs` is complete — it's the same reference the panel would save.

**Caution**: If the panel is also open and the user is mid-edit, saving the job from card-zone close could race with a subsequent panel save. However, this is already the case with every other fire-and-forget save. The panel save uses `S.jobs.find(j => j.id === S.editId)` to get the latest in-memory state, so the asset changes from card-zone close will be included.

---

### Patch 1.3 — Re-snapshot `curAssets` after card zone close

**Goal**: After the card zone writes back to `job.assets`, update the panel's `curAssets` snapshot so a subsequent panel save doesn't overwrite the changes.

**Strategy**: At the end of the card-zone-close block (after `job.assets = ...`), add:

```js
if (panelOpen && S.editId === assetsOverlayState.jobId) {
  curAssets = JSON.parse(JSON.stringify(job.assets));
}
```

This must run **before** `assetsOverlayState = null`.

**Caution**: This is the simplest fix for the split-brain. A more robust fix would eliminate `curAssets` entirely and always read from `S.jobs[i].assets`, but that touches `saveJob()` deeply and belongs in Phase 2.

---

### Patch 2.1 — Merge-on-write `saveJob()`

**Goal**: Instead of building a new job object from scratch and manually preserving 12+ fields, start from the existing job and only overwrite the fields the panel can edit.

**Current pattern** (dangerous):
```
const job = { id: S.editId };       // empty shell
FIELD_MAP.forEach(...)               // add DOM fields
job.assets = curAssets;              // add snapshot
// manually preserve 12+ fields     // fragile
```

**Proposed pattern** (safe):
```
const existing = S.jobs.find(j => j.id === S.editId);
const job = existing
  ? JSON.parse(JSON.stringify(existing))  // deep clone — all fields preserved
  : { id: 'j' + Date.now() };             // new job

FIELD_MAP.forEach(f => {                   // overwrite only editable fields
  const el = document.getElementById(f.id);
  if (!el) return;
  let val = el.value;
  if (f.type === 'text' && f.transform === 'upper') val = val.trim().toUpperCase();
  else if (f.type === 'text') val = val.trim();
  job[f.key] = val;
});

job.assets = JSON.parse(JSON.stringify(curAssets));

// PO contract: overwrite text fields, preserve image refs (already in clone)
if (typeof PO_CONTRACT_FIELDS !== 'undefined') {
  if (!job.poContract) job.poContract = {};
  PO_CONTRACT_FIELDS.forEach(function (f) {
    const el = document.getElementById(f.id);
    if (el && el.value !== undefined) job.poContract[f.key] = el.value.trim() || '';
  });
}

// notes/assembly: read from DOM if available
const notesEl = document.getElementById('jNotesInput');
if (notesEl && notesEl.value !== undefined) job.notes = notesEl.value.trim();
const assemblyEl = document.getElementById('jAssemblyInput');
if (assemblyEl && assemblyEl.value !== undefined) job.assembly = assemblyEl.value.trim();
```

**What this eliminates**:
- The 12+ manual preservation lines (lines 2340-2365)
- The risk of forgetting to preserve a new field
- The `S.jobs.find()` calls that run 5 times in the current function (cloned once at the top)

**What this preserves**:
- All current behavior — DOM fields still overwrite their corresponding job keys
- `curAssets` still applied (until `curAssets` is eliminated in a later pass)
- PO image refs preserved (they're in the clone and not overwritten by PO_CONTRACT_FIELDS)
- `notesLog`, `assemblyLog`, `progressLog`, `caution`, `packCard`, `fulfillment_phase`, `archived_*` — all preserved automatically via the clone

**Caution — must verify**:
1. Ensure `JSON.parse(JSON.stringify(existing))` doesn't silently drop any field type (it won't for JSON-safe types, which is all the job schema uses).
2. Ensure `FIELD_MAP` contains only fields that the panel DOM can edit. If any FIELD_MAP key maps to a field that should be preserved (not overwritten), it will be overwritten by the DOM value. Audit `FIELD_MAP` entries before implementing.
3. The new-job path (`!S.editId`) should explicitly initialize `progressLog: []`, `notesLog: []`, `assemblyLog: []` as before.

---

### Patch 2.2 — Move mutate-after-save

**Goal**: Don't update `S.jobs[i]` until the save succeeds.

**Strategy**: Move `S.jobs[i] = job` into the `.then()` / `try` success block:

```js
try {
  await Promise.all([Storage.savePresses(S.presses), Storage.saveJob(job)]);
  const i = S.jobs.findIndex(j => j.id === job.id);  // <-- move here
  if (i >= 0) S.jobs[i] = job;                        // <-- move here
  else S.jobs.unshift(job);                            // <-- new job case
  closePanel();
  renderAll();
  toast(S.editId ? 'JOB UPDATED' : 'JOB ADDED');
} catch (e) {
  toastError('Save failed');
}
```

**Caution**: This changes user-visible behavior on save failure. Currently, if save fails, the in-memory state reflects the user's edits (so the panel shows them and they can retry). After this change, on failure the in-memory state reverts to the pre-edit version. This is actually *safer* (no divergence), but the user loses their unsaved edits if the panel closes. Since the panel stays open on failure (`closePanel` is inside the try block), the user can still see and retry — but the DOM fields are the source of truth, not `S.jobs[i]`. Verify this doesn't cause a visual glitch on retry.

---

### Patch 3.1 — Full-snapshot offline queue

**Goal**: When offline, queue the full job object, not just `{ type: 'job_status', jobId, status }`.

**Strategy**: In `storage.js:233-234`, change:

```js
// BEFORE
pushToOfflineQueue('job_status', { jobId: job.id, status: job.status });

// AFTER
pushToOfflineQueue('job_full', { jobId: job.id, job: JSON.parse(JSON.stringify(job)) });
```

Then update the offline queue replay logic (`replayOfflineQueue` or equivalent) to handle `job_full` entries by calling `PMP.Supabase.saveJob(entry.payload.job)`.

**Caution**: Full job snapshots are larger. With 100 queued entries of 2KB each, that's 200KB — well within localStorage limits. But if the queue also holds other entity types, audit the combined size.

**Caution**: The replay logic must handle both `job_status` (legacy) and `job_full` (new) entry types during the transition period, in case old-format entries exist in a user's queue at deploy time.

---

### Patch 3.2 — Per-entity `saveInFlight`

**Goal**: Replace the single boolean with a `Set` of entity keys currently being saved.

**Strategy**:

```js
// BEFORE
let saveInFlight = false;

// AFTER
const savesInFlight = new Set();
```

Each save call adds its entity key (`'job:' + job.id`, `'presses'`, `'todos'`, etc.) to the set on start and removes it in `.finally()`. The poll guard becomes `if (savesInFlight.size > 0) return`.

**Caution**: This is a low-risk mechanical change, but it touches `storage.js` internals. The poll guard in `app.js:476` reads `saveInFlight` — it would need to read the new `Set`. Either export a helper (`Storage.isSaving()`) or check the set directly.

---

## Implementation Cautions

### What could break if touched carelessly

| Area | Risk | Mitigation |
|------|------|------------|
| **Making functions async** (Patch 1.1) | If a caller checks the return value synchronously (e.g., `if (setCaution(...))`) it will get a Promise instead of `undefined`. | Audit every call site for each function being made async. Current callers all ignore the return value. |
| **Adding save to `closeCardZone`** (Patch 1.2) | Could trigger a save while the panel is rebuilding, creating a visual flicker or a save conflict with a simultaneous panel save. | The save is async and non-blocking. The card zone is already closing by the time the save resolves. Test with slow network simulation. |
| **Merge-on-write refactor** (Patch 2.1) | If `FIELD_MAP` contains a key that shouldn't be overwritten (e.g., a display-only field that maps to a DOM element that reads as empty string), the clone's value gets replaced with `''`. | Audit every `FIELD_MAP` entry. Print a comparison table of `existing[key]` vs `dom.value` for a sample job before committing. |
| **Offline queue size** (Patch 3.1) | Full job snapshots are 10-50x larger than the current status-only payload. If many jobs are edited offline, the queue could contribute to the localStorage size pressure identified in the elegance audit. | Cap at existing `OFFLINE_QUEUE_MAX = 100`. At 2KB/job, 100 entries = 200KB — safe. Add a size check if entries grow larger. |
| **Mutate-after-save** (Patch 2.2) | On save failure, the panel DOM shows edits but `S.jobs[i]` doesn't reflect them. If `renderAll()` fires (e.g., from a realtime event while the error toast is showing), the jobs table could flash back to pre-edit state while the panel still shows edits. | This is acceptable — the panel is the source of truth during editing. Add a comment explaining this intentional divergence. |

---

## Bundle vs. Separate?

**Recommendation: Separate.**

| Phase | Ship as | Reason |
|-------|---------|--------|
| Phase 1 (1.1, 1.2, 1.3) | **One prompt, one commit** | These three patches are small, mechanical, low-risk, and interdependent (1.3 depends on 1.2). Total effort: 2-3 hours. |
| Phase 2 (2.1, 2.2) | **One prompt, one commit** | Both touch `saveJob()`. Testing them together avoids opening the function twice. But isolate from Phase 1 so Phase 1 can ship and soak first. |
| Phase 3 (3.1, 3.2) | **Two separate prompts** | 3.1 (offline queue) and 3.2 (`saveInFlight`) are independent and touch different parts of `storage.js`. Ship separately to isolate risk. |

**Total: 4 prompts, 4 commits, sequenced over 1 week.**

---

## Highest-Risk Area

**`saveJob()` merge-on-write refactor (Patch 2.1)** is the highest-value fix but also the highest-risk change. It touches the most critical function in the app and changes its fundamental approach. A bug here silently drops or corrupts job data.

**Mitigation**: Before implementing, produce a `FIELD_MAP` audit table that lists every entry and confirms whether its DOM element is always present, always editable, and never empty when it shouldn't be. Run the existing `saveJob` with a `console.log` diff between the old approach and the new approach for 5-10 real jobs to verify field parity.

---

## What Should Be Isolated Next

**Phase 1 (Patches 1.1 + 1.2 + 1.3)** is the immediate next prompt. It is:
- Lowest risk (additive — adds `await`/`.catch()` and one save call)
- Highest frequency impact (every caution set, every status cycle, every card zone close)
- Zero dependencies on other changes
- Deployable and testable in under 3 hours

After Phase 1 soaks for a day, proceed to Phase 2.
