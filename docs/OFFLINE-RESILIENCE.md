# PMP OPS — Offline resilience (narrow scope)

## What this is

A **minimal** resilience layer for temporary network drops on the press floor. It is **not** full offline-first. The app remains a connected Supabase client; when the network is back, we sync.

## What IS supported offline

- **App shell load:** Service worker caches `index.html`, `styles.css`, `app.js`, `supabase.js`. If the network is down when you open or refresh, the app can still load from cache.
- **Read:** After at least one successful load while online, the last snapshot is stored in localStorage. If a later load fails (e.g. network drop), the app shows that cached data and displays **● OFFLINE** and a red banner.
- **Queued writes (replay on reconnect):**
  - **Progress log** — `logProgress` (pressed / qc_passed / rejected) is queued and replayed in order.
  - **QC log** — `logQC` (reject type, job, time, date) is queued and replayed.
  - **Job status** — `saveJob` when offline queues a status-only update (e.g. hold/resume); on replay we re-apply that status to the current job and call `saveJob`.
- **Indicators:** Sync bar shows **● OFFLINE** or **● STALE** (during replay). Red banner shows “Offline — showing cached data. N change(s) queued.”

## What is NOT supported offline (v1)

- **Full job editing** — Creating or editing job fields (catalog, artist, due date, etc.) while offline is **not** queued. Only the narrow set above is queued.
- **Press assignment changes** — Assigning a job to a press or changing press status is not queued.
- **Todos** — Todo checkoffs are not queued.
- **Deletes** — Deleting a job is not queued.
- **First load without cache** — If you have never loaded the app while online in this browser, going offline gives you no data (no snapshot yet).

## Local queue design

- **Storage:** `localStorage`: `pmp_offline_snapshot` (last successful payload), `pmp_offline_queue` (array of queue items).
- **Queue item:** `{ id, type, payload, createdAt }`. `type` is `'progress'` | `'qc'` | `'job_status'`. `payload` is the same shape as the Supabase call (e.g. `logProgress(entry)` → `payload = entry`). `job_status` payload is `{ jobId, status }`.
- **Cap:** Queue is trimmed to the last **100** items (oldest dropped) to avoid unbounded growth.

## Replay strategy

1. On **online** event (and when the app UI is visible and using Supabase), we run: `loadAll()` → `replayQueue()` → `loadAll()`.
2. **replayQueue():** For each item in order: call Supabase directly (`logProgress`, `logQC`, or `saveJob` for job_status). On **success**, remove that item from the queue and persist. On **failure** (e.g. network), **stop** and leave the rest in the queue for the next reconnect.
3. After replay we run `loadAll()` again so the UI reflects server state (including any conflicts or server-generated values).

## Duplicate prevention

- **Remove on success only:** We remove a queue item only after a successful Supabase response. If the request fails or the response is lost, we keep the item and retry on next reconnect.
- **No server-side idempotency in v1:** Progress and QC inserts do not use idempotency keys. If a replay is retried after an ambiguous response (e.g. server applied the change but we didn’t get the response), the same insert could run twice, resulting in a duplicate row. v1 accepts this small risk; a future version could add a client_request_id and server-side dedupe.

## File changes summary

| File | Change |
|------|--------|
| `sw.js` | New. Cache shell (index.html, styles.css, app.js, supabase.js). Fetch: network-first, fallback to cache. Navigate: serve cached index.html when offline. |
| `index.html` | Register `sw.js`. Add `#offlineBanner` (text + queue count). |
| `styles.css` | `.offline-banner` (red bar). |
| `app.js` | `OFFLINE_*` keys, `getOfflineSnapshot` / `setOfflineSnapshot`, `getOfflineQueue` / `setOfflineQueue` / `pushToOfflineQueue`, `isOffline()`, `updateOfflineBanner()`, `replayQueue()`, `onOnline()`. `SYNC_STATES`: `offline`, `stale`. `loadAll`: on success save snapshot; on failure and useSupabase() use snapshot and set offline. `Storage.logProgress` / `logQC` / `saveJob`: when useSupabase() and isOffline(), queue and return. `window.addEventListener('online', onOnline)`. |

## Manual QA (short)

- [ ] **Shell:** Disconnect network, refresh app → app loads from cache; login/launcher may fail (expected). Reconnect, reload → normal.
- [ ] **Snapshot + read:** Load app with Supabase, wait for SYNCED. Disconnect. Trigger a load (e.g. switch tab back or wait for next poll/realtime attempt) → UI shows cached data, **● OFFLINE**, red banner.
- [ ] **Queue + replay:** While offline (after having loaded once), log progress or QC or change job status (hold/resume). See “N change(s) queued.” Reconnect → within a short time (online event + loadAll + replay) queue drains, **● SYNCED**, banner hides. Check Supabase that the rows/updates are present.
- [ ] **Local mode:** With Supabase disabled, no offline snapshot/queue; behavior unchanged (local only).
