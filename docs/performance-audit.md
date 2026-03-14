# Performance & Elegance Audit

## Executive Summary

The app feels slower because of a compounding effect: every state change triggers a full rebuild of all 13 pages, images are served at original resolution for 36px thumbnails, data fetching pulls every row from every table with no caching, and the 5-second local-mode poll amplifies all of the above. None of these are individually fatal, but together they create a drag that scales with data volume.

---

## Findings

### TIER 1 — High Impact

#### 1. `renderAll()` rebuilds all 13 pages on every state change

`renderAdminShell()` unconditionally calls 13 render functions (Floor, Jobs, Log, Engine, Notes, Ship, Crew, Compounds, Dev, TV, Todos, Stats, Presses) regardless of which page is visible. This is called ~31 times across the codebase — after every save, every page switch, every poll tick.

**Likely cause**: The app started with few pages and grew; no one added visibility guards.  
**Impact**: 90%+ of render work is wasted on invisible pages.

#### 2. No data caching — every `loadAll()` re-fetches everything

`loadAllData()` in `supabase.js` issues 10 parallel `select('*')` queries (jobs, progress_log, presses, todos, qc_log, dev_notes, compounds, notes_channels, employees, schedule_entries). No pagination, no field projection, no delta sync, no ETag. The entire dataset is re-fetched and re-parsed on every load.

**Likely cause**: Simplicity-first architecture; caching wasn't needed when the dataset was small.  
**Impact**: Scales poorly. Progress logs grow indefinitely. 200 jobs x 25 progress entries = 5,000 rows fetched every cycle.

#### 3. Full-size images served as thumbnails

All four image types (PO images, crew photos, compound images, note attachments) are uploaded at the user's original file resolution. Compound thumbnails (40x40 CSS) and crew avatars (36x36 CSS) download potentially multi-megabyte originals and let CSS downscale them. No Supabase Storage transforms, no client-side resize, no thumbnails.

**Likely cause**: Upload pipeline was built for "get it working" with no resize step.  
**Impact**: A crew page with 15 photos could fetch 30-60MB of images for 36px display.

#### 4. 5-second poll interval in local mode

`startPollInterval()` runs `loadAll()` → `renderAll()` every 5 seconds in local/offline mode. This re-reads localStorage, re-parses state, and rebuilds all 13 pages — for a single-user mode where nothing external is changing.

**Likely cause**: Interval was set aggressively during development for responsiveness.  
**Impact**: Continuous CPU churn even when idle.

---

### TIER 2 — Medium Impact

#### 5. Every `saveJob()` triggers full re-render

Nearly every `Storage.saveJob()` call is followed by `renderAll()`. A single-field toggle (e.g., clearing a caution flag) triggers a complete 13-page DOM rebuild. ~15 call sites follow this pattern.

#### 6. `renderJobs` computes everything twice (table + cards)

Both the table body and card view are always rendered with full per-job computation (assetHealth, progressDisplay, recentLogActivity, jobPressInfo), even though only one view is visible at a time.

#### 7. `renderNotesPage` scans all jobs' notes on every call

When no job is selected, it flattens all notesLog arrays from all non-archived jobs, sorts by timestamp, and rebuilds the feed. This runs even when Notes isn't the active page.

#### 8. N+1 join pattern in data loading

After fetching all jobs and all progress_log rows, each progress row is matched to its job via `jobs.find(j => j.id === row.job_id)` — O(n*m). With 200 jobs and 5,000 entries, that's up to 1M comparisons.

#### 9. `transition: all` used in ~50 selectors

Forces the browser to check every CSS property for changes during transitions, including layout-triggering properties. Should be narrowed to specific properties.

#### 10. 18 infinite CSS animations running simultaneously

Press cards, live dots, caution pulses, glow effects — when the Floor page is visible with multiple active presses, 10-20+ independent infinite animations run concurrently. Most use `box-shadow` which can cause repaints.

#### 11. Heavy libraries loaded eagerly

`pdf.js` (~450KB) and `tesseract.js` (~170KB + WASM) are loaded synchronously on every page load even though they're only needed for the Import Photo/PDF flow. Sentry and Supabase JS are also render-blocking in `<head>`.

#### 12. `loadAll()` writes todos back on every read

Line 245 in `app.js`: `if (S.todos) Storage.saveTodos(S.todos)` runs inside `loadAll()`, meaning every data fetch also triggers a write. This can create a feedback loop with Realtime events (mitigated by a 1-second self-echo guard, but still wasteful).

#### 13. No lazy loading on compound/crew thumbnails

These use CSS `background-image` inline styles, which load eagerly. No IntersectionObserver. Only note attachment thumbnails have `loading="lazy"`.

---

### TIER 3 — Low Impact

#### 14. Cache-bust URLs persisted in database

After upload, `?t=Date.now()` is appended to image URLs and stored permanently, preventing CDN/browser cache sharing across sessions.

#### 15. No lightbox loading state

`openPoImageLightbox()` sets `img.src` directly with no skeleton or placeholder. On slow connections the lightbox is blank until loaded.

#### 16. Matrix rain canvas runs continuously

Full-viewport canvas animation runs under the entire UI at all times (pauses on `visibilitychange`). Consumes GPU/CPU even when barely visible.

#### 17. Realtime debounce only 300ms

Multi-table saves can generate 2-6 Realtime events. The 300ms debounce coalesces the first burst but sequential table writes can still produce multiple `loadAll()` calls.

---

## Recommended Fixes — Priority Order

### Quick Wins (hours, not days)

| # | Fix | Effort | Impact |
|---|---|---|---|
| Q1 | **Add `currentPage` guards to `renderAdminShell`** — only call the render function for the visible page | 30 min | Eliminates ~90% of wasted render work |
| Q2 | **Debounce `renderAll`** with `requestAnimationFrame` to coalesce rapid-fire calls | 15 min | Prevents double/triple renders from save+realtime |
| Q3 | **Increase local-mode poll to 30 seconds** (or use `storage` event for cross-tab sync) | 5 min | 6x reduction in idle CPU churn |
| Q4 | **Replace `renderAll()` after `saveJob`** with targeted render calls at the ~15 call sites | 1 hour | Avoids full rebuild for micro-changes |
| Q5 | **Skip inactive view in `renderJobs`** — only render table OR cards, not both | 15 min | Halves jobs-page render cost |
| Q6 | **Lazy-load pdf.js and tesseract.js** via dynamic `import()` on demand | 30 min | ~620KB off initial page load |
| Q7 | **Move Sentry/Supabase scripts to `defer`** | 5 min | Unblocks initial HTML parse |

### Deeper Work (days)

| # | Fix | Effort | Impact |
|---|---|---|---|
| D1 | **Generate thumbnails on upload** — resize to max 200px before uploading, or use Supabase Storage transforms if available | 1-2 days | Massive image payload reduction for Crew/PVC pages |
| D2 | **Index progress_log join** — build a Map on load instead of `find()` per row | 2 hours | O(n+m) instead of O(n*m) |
| D3 | **Add timestamp-based delta fetch** — only pull progress_log/notes rows newer than last fetch | 1-2 days | Prevents unbounded payload growth |
| D4 | **Replace `transition: all`** with specific properties across ~50 selectors | 1-2 hours | Reduces layout recalculation during animations |
| D5 | **Add `loading="lazy"` / IntersectionObserver** for crew/compound thumbnails | 2-3 hours | Prevents eager loading of off-screen images |
| D6 | **Cache computed aggregates** for Engine/TV pages; invalidate on data change | 3-4 hours | Avoids re-scanning all progress logs on every render |
| D7 | **Remove saveTodos from loadAll** — move to explicit save-on-change only | 30 min | Eliminates read-triggers-write feedback loop |
| D8 | **Consider killing or pausing the matrix rain** when opaque content is fully covering it | 30 min | Frees GPU resources |

---

## Image / Thumbnail Strategy Review

**Current state**: Every image (PO, crew, compound, note attachment) is stored at upload resolution. There is no thumbnail pipeline. CSS handles all downsizing.

**Recommended strategy**:

1. **On upload**: Client-side resize to max 1200px longest edge before uploading (preserves detail for lightbox while cutting file size 3-10x). Use a `<canvas>` resize or a tiny library like `pica`.

2. **Thumbnail generation**: Create a second copy at max 200px for use in lists, cards, and feeds. Store as `thumbUrl` alongside `imageUrl`.

3. **Serve thumbnails everywhere except lightbox**: Crew table (36px), compound cards (40px), note feed (28px), and JOBS PO star tooltip should all use `thumbUrl`.

4. **Lightbox uses `imageUrl`**: The 1200px version is loaded on-demand when the user taps to view full size.

5. **Progressive lightbox**: Show the thumbnail immediately in the lightbox container, then swap to full-size once loaded (blur-up pattern).

6. **Cache-bust cleanup**: Strip `?t=` from stored URLs; use ETags or versioned paths instead.

This would reduce typical page image payloads from ~2-5MB to ~50-200KB for list views.
