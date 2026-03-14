# Elegance Audit — PMP OPS Dashboard

**Date**: 2026-03-06
**Scope**: Full codebase inspection — architecture, state, data flow, images, CSS, naming, fragility
**Priority**: P2
**Constraint**: Findings only. No code changes.

---

## Executive Summary

The app works, but it's held together by convention rather than contract. A single mutable object (`S`) owns all state, 13+ overlays manage themselves independently, half the save calls are fire-and-forget, and the panel save function manually preserves 12+ fields that would silently vanish if missed. The image pipeline has zero compression and zero thumbnails — a crew page with photos can trigger 30-60MB of downloads for 36px circles. The data layer fetches every row from every table on every load with no pagination, and the render layer rebuilds all 13 pages on every state change. None of these are individually fatal, but they compound.

This audit goes deeper than the existing `performance-audit.md` (which covers render/fetch/image performance). This one covers **architectural fragility, state management risks, save-path integrity, code debt, and naming inconsistencies** — the stuff that makes the next feature harder or the next bug invisible.

---

## Part 1 — State Architecture

### 1.1 The `S` Object: God State

**File**: `app.js:108-145`

`S` is a flat mutable object that holds everything: data arrays (8), UI mode flags (6), transient editor state (6), sort preferences (6), sync metadata (3), and import session state. Any function anywhere can read or write any field at any time. There are **~120 write sites** to `S.*` across `app.js` alone.

**Risk**: No isolation between data and UI state means a rendering function could accidentally mutate data, and a data-loading function could clobber active UI state. This is currently held together by discipline, not by design.

**Severity**: CRITICAL (structural — everything builds on this)

### 1.2 Shadow State Outside `S`

**File**: `app.js:147-149`

Three critical variables live *outside* `S` as bare `let` globals:

| Variable | Purpose | Couples with |
|----------|---------|--------------|
| `curAssets` | Snapshot of `job.assets` at panel open | `S.editId`, `S.jobs[i].assets` |
| `panelOpen` | Whether RSP is visible | `S.editId`, `S.panelOpenedAt` |
| `panelEditMode` | Whether RSP is in edit mode | `S.editId` |

Additional shadow state in other files: `psNumpadValue` (`stations.js`), `cardZoneFace`, `assetsOverlayState`, `packCardState` (`render.js`).

**Risk**: You have to check two different sources to know panel state. `curAssets` and `job.assets` can diverge silently (see §3.4).

**Severity**: HIGH

### 1.3 No Overlay Coordination

There are **13+ distinct overlay/modal layers**, each with its own open/close mechanism:

| Overlay | State Tracking | Has Conflict Guard? |
|---------|---------------|---------------------|
| Panel (RSP) | `panelOpen` + `S.editId` | Partial (poll guard) |
| Floor Card | `S.floorCardJobId` | No |
| Card Zone (Asset/Pack) | `assetsOverlayState` + `cardZoneFace` | No |
| New Job Wizard | `wizardStep` + `wizardData` + DOM class | No |
| Import Review | `S.importSession` + DOM class | No |
| Caution Popup | DOM class + `dataset.jobId` | No |
| PO Upload Prompt | DOM class | No |
| PO Image Lightbox | DOM class + `dataset.*` | No |
| Compound Wizard | `S.compoundEditId` + DOM class | No |
| Employee Wizard | `S.employeeEditId` + DOM class | No |
| Schedule Wizard | `S.scheduleEntryEditId` + DOM class | No |
| Confirm Dialog | `confCb` callback + DOM class | No |
| Duplicate Job Modal | `pendingWizardJob` + DOM class | No |

There is no modal stack or manager. The Escape key handler (`app.js:4170+`) imposes a priority order across **16+ checks** in a 215-line cascade. Adding any new overlay requires manually inserting into the right position.

**Most dangerous overlap**: Panel + Card Zone for the same job — both track assets through different state objects (`curAssets` vs `assetsOverlayState`).

**Severity**: HIGH

---

## Part 2 — Data Loading

### 2.1 Everything, Every Time

**File**: `supabase.js:249-262`

`loadAllData()` issues 10 parallel `select('*')` queries with no pagination, no field projection, and no delta sync.

| Table | Growth Pattern | Estimated Mature Size |
|-------|---------------|----------------------|
| `jobs` | Linear (new jobs) | 200-500 rows, 0.4-3MB (JSONB columns: `notes_log`, `assets`, `pack_card`, `po_contract`) |
| `progress_log` | **Unbounded** (every press/ship action) | 5,000+ rows, 1-5MB |
| `qc_log` | **Unbounded** (every QC check) | 2,000+ rows, 0.5-2MB |
| `notes_channels` | Channels accumulate notes | 200KB-1MB |
| `dev_notes` | Unbounded | 100-500KB |
| `schedule_entries` | Historical, no pruning | 100-500KB |

**Total estimated payload for a mature instance: 3-12MB per `loadAll()` call.**

**Severity**: CRITICAL (the single biggest contributor to "feels slower")

### 2.2 O(n×m) Progress Log Join

**File**: `supabase.js:266-272`

After fetching all jobs and all `progress_log` rows, each progress row is matched to its job via `jobs.find(j => j.id === row.job_id)` — an O(n×m) loop. With 300 jobs and 5,000 entries, that's 1.5M comparisons.

**Fix**: Build a `Map<jobId, job>` before the loop. Two minutes of work, eliminates a scaling bottleneck.

**Severity**: HIGH

### 2.3 `loadAll()` Writes Todos on Every Read

**File**: `app.js:~245`

`if (S.todos) Storage.saveTodos(S.todos)` runs inside `loadAll()`, meaning every data fetch triggers a write-back. This can create feedback with Realtime events (mitigated by a 1-second self-echo guard, but still a read-triggers-write antipattern).

**Severity**: MEDIUM

### 2.4 Conflict Detection Without Enforcement

**File**: `app.js:162-182`

The conflict detection block compares local pending writes against incoming server data. If a conflict is found, it toasts a warning and deletes the pending entry. But the next line (`S.jobs = data.jobs`) **overwrites in-memory state regardless**. Detection without enforcement.

**Severity**: HIGH

---

## Part 3 — Save Integrity

### 3.1 Manual Field Preservation in `saveJob()`

**File**: `app.js:2319-2392`

The panel `saveJob()` builds a job by reading `FIELD_MAP` from DOM inputs, then manually grafts on **12+ sub-fields** from the existing job:

- `progressLog`, `archived_at`, `archived_by`, `archive_reason`
- `fulfillment_phase`, `caution`, `packCard`
- `poContract.imagePath`, `poContract.imageUrl`
- `notes` (complex ternary), `assembly` (complex ternary)
- `notesLog`, `assemblyLog`

Each field has its own preservation pattern — some use `||`, some use explicit `null` checks, some use nested ternaries. **If any new field is added to the job schema and not added to this preservation block, that field is silently dropped to `undefined` on every panel save.**

This is the single most dangerous pattern in the codebase.

**Severity**: CRITICAL

### 3.2 Fire-and-Forget Saves

11 of 23 `Storage.saveJob()` call sites do **not** await the result or handle errors:

| Call Site | What's Saved | Awaited? | Error Handled? |
|-----------|-------------|----------|----------------|
| `setCaution` (clear) | Caution flag | No | No |
| `setCaution` (set) | Caution flag | No | No |
| `setFulfillmentPhase` | Phase | No | No |
| `applySuggestedStatus` | Status | No | No |
| `cycleStatus` (apply) | Status + press | No | No |
| `cycleStatus` (undo) | Status + press | No | No |
| `addNoteFromPackCard` | Notes | No | `.catch(() => {})` — explicitly swallowed |
| `logJobProgress` chain | Status | Chained, not directly awaited | Partial |
| `saveFloorCardQuickEdit` | Bulk fields | No | No |
| `pressStationHold` | Status | No | No |
| `pressStationResume` | Status | No | No |

The user sees success toasts while the backend may silently reject the write.

**Severity**: CRITICAL

### 3.3 `closeCardZone` Doesn't Save

**File**: `render.js:946-961`

When the asset/pack card zone is closed, changes are flushed from the overlay inputs into `job.assets` in memory — but **no `Storage.saveJob()` is called**. The data survives only until the next `loadAll()` replaces `S.jobs`. If the user closes the card zone and a realtime event fires before they save the panel, their asset changes vanish.

**Severity**: CRITICAL

### 3.4 `curAssets` vs `job.assets` Split Brain

**File**: `app.js:147, 1291, 2330` / `render.js:950`

- Panel open: `curAssets = JSON.parse(JSON.stringify(job.assets))` — snapshot
- Card zone close: `job.assets = overlayData` — writes directly to `S.jobs[i].assets`
- Panel save: `job.assets = JSON.parse(JSON.stringify(curAssets))` — uses the *snapshot*

If both panel and card zone are open for the same job, panel save will overwrite card zone changes with the stale `curAssets` snapshot.

**Severity**: CRITICAL

### 3.5 Mutate-Before-Save

**File**: `app.js:2367`

`S.jobs[i] = job` runs *before* `await Storage.saveJob(job)`. If the save fails, in-memory state is already changed. The panel stays open (good), but `S.jobs` now holds data the server doesn't have.

**Severity**: HIGH

### 3.6 Offline Queue Drops Fields

**File**: `storage.js:~106`

When offline, `saveJob` only queues `{ type: 'job_status', jobId, status }` — not the full job object. All other field changes (notes, assets, caution, fulfillment_phase, packCard) are **silently lost** in the offline queue.

**Severity**: CRITICAL

### 3.7 `saveInFlight` Is Global, Not Per-Entity

**File**: `storage.js:~229`

A single `saveInFlight` boolean covers all save operations across all entity types. Two concurrent saves (e.g., a job and presses) both toggle the same flag. The poll guard (`if (saveInFlight) return`) can be prematurely cleared.

**Severity**: MEDIUM

---

## Part 4 — Image Pipeline

### 4.1 Upload: No Limits, No Processing

All four image upload paths share identical problems:

| Type | Handler | Size Limit | Client Resize | Compression |
|------|---------|-----------|---------------|-------------|
| PO images | `app.js:2213` | None | None | None |
| Crew photos | `app.js:1720` | None | None | None |
| Compound images | `app.js:1561` | None | None | None |
| Note attachments | `app.js:3716` | None | None | None |

A user can upload a 20MB DSLR photo for a 36px avatar circle. The raw file goes directly to Supabase Storage with no processing.

**Severity**: CRITICAL

### 4.2 Display: Full-Size Originals Everywhere

| Type | Display Size | Source | Lazy Loading? |
|------|-------------|--------|--------------|
| Crew avatars | 36×36 CSS circle | Full original | No (CSS `background-image`) |
| Compound thumbnails | 40×40 CSS circle | Full original | No (CSS `background-image`) |
| PO panel preview | max-height 200px | Full original | No |
| Note attachments | 28×28 | Full original | **Yes** (`loading="lazy"`) |

Note attachments are the only type with lazy loading. Crew/compound images use CSS `background-image` which loads eagerly and can't use the native `loading` attribute.

**15 crew members with photos = potentially 30-60MB of image downloads for a page of 36px circles.**

**Severity**: CRITICAL

### 4.3 Cache-Bust URLs Stored Permanently

**File**: `supabase.js:456, 479, 495`

After upload, `?t=Date.now()` is appended to image URLs and **stored in the database**. This means every browser session downloads the full image again — no CDN or browser cache sharing.

**Severity**: MEDIUM

---

## Part 5 — Rendering

### 5.1 Full 13-Page Rebuild on Every Change

**File**: `render.js:183-203`

`renderAdminShell()` unconditionally calls render functions for all 13 page surfaces regardless of which one is visible. `renderAll()` is called ~31 times across the codebase — after every save, page switch, and poll tick.

**Severity**: HIGH (covered in prior audit — still the top render fix)

### 5.2 5-Second Poll Amplifies Everything

**File**: `app.js:472-478`

In local/offline mode, `loadAll()` → `renderAll()` fires every 5 seconds. This re-reads localStorage, re-parses state, and rebuilds all 13 pages for a single-user mode where nothing external is changing.

**Severity**: HIGH

### 5.3 `renderJobs` Computes Everything Twice

**File**: `render.js:1388-1545`

Both table and card views compute identical per-job metrics (assetHealth, progressDisplay, recentLogActivity, jobPressInfo, live dots, caution dots, press cells). The "dots" HTML string (~7 lines of live-indicator logic) is duplicated verbatim across both blocks.

**Severity**: MEDIUM

### 5.4 18+ Infinite CSS Animations

Press glows, live dots, caution pulses — when the Floor page is visible with active presses, 10-20+ independent `@keyframes` loops run concurrently. Most animate `box-shadow` or `filter`, which trigger repaints.

**Severity**: MEDIUM

---

## Part 6 — Code Quality Debt

### 6.1 Structural Duplication

| Area | File:Lines | Description |
|------|-----------|-------------|
| Job search filter | `render.js:37-41, 306-310, 1407-1413` | Same multi-field `.toLowerCase().includes(q)` filter written 3 times |
| Asset/Pack card renderer | `render.js:1019-1116 vs 1200-1298` | ~80% identical structure. Same caution-lock pulse timer, same row rendering, same note composer. Only DEFS array and CSS prefixes differ. |
| Pulse timer management | `render.js:1041-1067 vs 1234-1260` | Identical `setTimeout` + elapsed-time check duplicated for assets and packing |
| Format pill class | `render.js:75, 400, 1473, 1526` | `j.format.includes('7"') ? 'seven' : 'go'` appears 4 times |
| Save-then-toast pattern | `app.js:2383-2391 vs 3362-3370` | `await Promise.all` + close + renderAll + toast duplicated |
| Notes entry mapping | `render.js:3229-3248 vs 3252-3274` | Identical ~20-line entry builder for "selected job" vs "all jobs" |
| TV mode daily stats | `render.js:2908-2922` | Recalculates daily pressed/passed/rejected from progressLog, duplicating `getEngineData()` logic |

**Severity**: MEDIUM (maintenance burden, not correctness)

### 6.2 Monster Functions

| Function | File | Lines | What It Does |
|----------|------|-------|-------------|
| `renderLog()` | render.js:1804-2044 | ~240 | Badge, mode toggles, job picker, numpad, button config, date picker, daily feed |
| `renderJobs()` | render.js:1388-1545 | ~157 | Table + card views with duplicated logic |
| `openPanel()` | app.js:1246-1393 | ~147 | DOM hydration + field mapping + assets + caution + notes + billing + PO |
| `drawEngineChart()` | render.js:2421-2566 | ~145 | Canvas drawing mixed with data transformation |
| `renderTV()` | render.js:2865-3008 | ~143 | Stats + press cards + job table + ticker |
| `loadAll()` | app.js:154-282 | ~128 | Data loading + conflict detection + offline fallback + normalization |
| `saveJob()` | app.js:2295-2392 | ~97 | Field assembly + preservation + save + close |

**Severity**: MEDIUM

### 6.3 Error Handling Gaps

| Pattern | Location | Issue |
|---------|----------|-------|
| Silent swallow | `app.js:90, 95, 1168` | `catch (e) {}` on localStorage — no logging, no user feedback |
| Silent swallow | `app.js:1547` | `.catch(function () {})` on compound save |
| Silent swallow | `app.js:3858` | `.catch(function () {})` on asset note save |
| Silent swallow | `app.js:2231` | `try { await deletePoImage(...) } catch (_) {}` |
| typeof guard fallback | 50+ sites | `typeof escapeHtml === 'function'` — defensive checks suggesting load-order fragility |

**Severity**: HIGH (fire-and-forget saves are the critical subset)

### 6.4 Dead Code

| Item | Location | Status |
|------|----------|--------|
| `addProductionNote()` | `app.js:3690` | Empty function body — was once the notes write path |
| `statusMicro` variable | `render.js:1462, 1507` | Always set to `''`, concatenated into HTML |
| `renderQC()` | `render.js:2046-2048` | Just calls `renderLog()` — dead indirection |
| `.progress-bar-outer/fill` | `styles.css:1750-1752` | CSS selectors not referenced by any JS or HTML |

**Severity**: LOW

### 6.5 Naming Inconsistencies

| Concept | Code Term(s) | UI Term(s) |
|---------|-------------|-----------|
| Late-stage movement | `ship`, `fulfillment`, `outbound` | OUTBOUND (log), SHIP (hidden page), fulfillment_phase (data) |
| Boxed action | `packed` (data value) | BOXED (button label) |
| Incoming materials | `asset`, `assets`, `receiving` | ASSETS (tab) |
| Finishing readiness | `pack`, `packCard`, `packing` | PACKING (tab) |
| Attention flag | `caution` (code) | ACHTUNG (UI) |
| Variable style | `var` (older functions) | `const`/`let` (newer functions) — mixed within same files |

**Severity**: MEDIUM (confusion tax on every new feature)

---

## Part 7 — localStorage Risk

### 7.1 Unbounded Payload

**File**: `storage.js:486-503`

`flushLocalSave()` serializes the entire `S` object (all jobs, all logs, all channels) into localStorage under `pmp_ops_data`. A second near-identical copy goes to `pmp_offline_snapshot`. Combined payload estimate: **6-24MB** for a mature instance.

Most browsers cap localStorage at 5-10MB. When exceeded, `setItem()` throws `QuotaExceededError`. The code wraps this in `try/catch` and **fails silently** — the user thinks they saved, but the write was rejected.

**Severity**: CRITICAL

### 7.2 No Pruning

Neither `pmp_ops_data` nor `pmp_offline_snapshot` have any TTL, size limit, or pruning logic. They grow unbounded with data volume.

**Severity**: HIGH

---

## Part 8 — Network & Load Waterfall

### 8.1 All Scripts Are Parser-Blocking

**File**: `index.html` head + body

8+ `<script>` tags with no `defer` or `async`. Load order:

1. Google Fonts (render-blocking CSS)
2. Sentry SDK (~70KB gz) — blocking
3. `styles.css` (~186KB) — render-blocking
4. Supabase JS SDK (~50KB gz) — blocking
5. Local scripts: `supabase.js`, `core.js`, `storage.js`, `render.js`, `stations.js` — blocking
6. **pdf.js** (~400KB gz) + **Tesseract.js** (~100KB gz) — blocking, used only for rare import flows
7. `app.js` — blocking

Items 6 alone add ~500KB of gzipped JS that parse-blocks every page load for features used <1% of sessions.

**Severity**: HIGH

### 8.2 No Preconnect Hints

The page hits 5+ external origins (fonts.googleapis.com, fonts.gstatic.com, browser.sentry-cdn.com, cdn.jsdelivr.net, cdnjs.cloudflare.com) with no `<link rel="preconnect">`.

**Severity**: LOW

---

## Recommended Actions

### Quick Wins (hours)

| # | Fix | Effort | Impact | Addresses |
|---|-----|--------|--------|-----------|
| Q1 | **Guard `renderAdminShell`** — only render the visible page | 30 min | ~90% less wasted render work | §5.1 |
| Q2 | **Build a `Map` for progress_log join** | 15 min | O(n+m) instead of O(n×m) | §2.2 |
| Q3 | **Lazy-load pdf.js + Tesseract.js** via dynamic import | 30 min | 500KB off initial load | §8.1 |
| Q4 | **Add `defer` to Sentry + Supabase scripts** | 5 min | Unblock initial HTML parse | §8.1 |
| Q5 | **Increase local-mode poll to 30s** | 5 min | 6x less idle CPU churn | §5.2 |
| Q6 | **`await` the 11 fire-and-forget saves** and add `.catch(toastError)` | 1 hour | Prevent silent data loss | §3.2 |
| Q7 | **Add `Storage.saveJob()` call to `closeCardZone`** | 15 min | Prevent asset data loss on close | §3.3 |

### Medium-Term Fixes (days)

| # | Fix | Effort | Impact | Addresses |
|---|-----|--------|--------|-----------|
| M1 | **Client-side image resize on upload** (max 1200px + 200px thumb) | 1-2 days | Massive payload reduction | §4.1, §4.2 |
| M2 | **Refactor `saveJob` to merge-on-write** — start from existing job, apply only changed fields | 1 day | Eliminates field-loss risk | §3.1 |
| M3 | **Add pagination/date filter to `progress_log` and `qc_log`** | 1 day | Prevents unbounded payload growth | §2.1 |
| M4 | **Add localStorage size guard + pruning** — check payload size before write, prune old logs | 0.5 day | Prevents silent localStorage overflow | §7.1 |
| M5 | **Consolidate overlay state** into a simple stack/manager | 1-2 days | Prevents overlay conflicts, simplifies Escape handler | §1.3 |
| M6 | **Extract shared card renderer** for Asset/Pack card zone | 1 day | Cuts ~150 lines of duplication | §6.1 |
| M7 | **Break up `renderLog`** into 5 focused functions | 0.5 day | Maintainability | §6.2 |

### What Not to Touch Yet

| Area | Why |
|------|-----|
| Replace `S` object with proper state management | Foundational rewrite — high risk, unclear payoff at current scale |
| Switch to a framework (React, Svelte, etc.) | The app works. The issues are architectural, not framework-shaped. |
| Rewrite the data layer with delta sync | Design it when the performance fixes above prove insufficient |
| Normalize all naming (`ship`→`outbound`, etc.) | Do it as part of a terminology pass, not as drive-by renames |
| Migrate away from localStorage | Only after localStorage overflow is mitigated with the size guard |

---

## Files Inspected

| File | Lines | Focus Areas |
|------|-------|------------|
| `app.js` | 4,397 | State object, loadAll, saveJob, panel management, overlays, event chains, fire-and-forget saves |
| `render.js` | 3,333 | renderAll, renderJobs, renderLog, renderAssetsOverlay, renderPackCard, closeCardZone |
| `core.js` | ~750 | Helpers, constants, DEFS, computed health functions |
| `storage.js` | ~525 | localStorage, offline queue, saveInFlight, scheduleSave |
| `supabase.js` | ~560 | loadAllData, saveJob, image upload handlers, cache-bust URLs |
| `stations.js` | ~500 | Press/QC station fire-and-forget saves |
| `styles.css` | 4,340 | Dead selectors, animation count, !important usage, duplicate bar systems |
| `index.html` | ~1,100 | Script loading order, overlay HTML, input elements |

---

## Severity Legend

| Level | Meaning |
|-------|---------|
| **CRITICAL** | Data loss, silent failure, or scaling wall. Fix before adding features. |
| **HIGH** | Fragility that will break under stress or growth. Fix soon. |
| **MEDIUM** | Maintenance burden or subtle inefficiency. Fix when touching nearby code. |
| **LOW** | Cosmetic or minor. Fix opportunistically. |
