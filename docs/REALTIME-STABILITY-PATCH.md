# Realtime / sync stability patch

Patch to prevent duplicate realtime subscriptions, self-echo “Data updated elsewhere” notices, and sync bar stuck on LOADING. No SQL, schema, auth, RLS, or UI redesign.

---

## Root causes

1. **Self-echo “Data updated elsewhere”**  
   Realtime receives postgres_changes for this client’s own writes. With the panel open, the callback showed “Data updated elsewhere” immediately after a save.  
   **Fix:** Self-echo guard: when the realtime callback runs with the panel open, if `Date.now() - S.lastLocalWriteAt < 1000`, we skip showing the notice (treated as our own write). We still run `loadAll()` when the panel is closed.

2. **Sync bar stuck on LOADING**  
   If `loadAll()` ever failed to set a terminal state (synced / local / offline / error), the bar could stay on “loading”.  
   **Fix:** At the end of `loadAll()`, if the sync status element still shows “loading”, we set state to `synced` as a safety net. The normal try/catch already sets a terminal state in every path.

3. **Duplicate realtime subscriptions**  
   Audit showed that `startPolling()` (and thus `startRealtime()`) is only called from `enterByLauncher()` and the unused `enterApp()`. Each call runs `stopDataSync()` first, which clears the poll timer and calls `realtimeUnsubscribe()` before creating a new subscription. So only one subscription is active at a time.  
   **Fix:** No code change; behavior confirmed and left as-is.

---

## Files and functions changed

**app.js only.**

| Area | Change |
|------|--------|
| **State** | Added `S.lastLocalWriteAt: 0` to the initial state object. |
| **stopDataSync()** | Added console log when realtime unsubscribes: `[PMP] Realtime unsubscribed`. |
| **startRealtime()** | (1) Log when realtime starts: `[PMP] Realtime started`. (2) In the debounced callback: when `panelOpen`, if `Date.now() - (S.lastLocalWriteAt \|\| 0) < 1000` then return without showing the notice. (3) Log when showing the notice: `[PMP] showDataChangedNotice (panel open, external change)`. (4) Log when a realtime event is received: `[PMP] Realtime event received`. |
| **loadAll()** | (1) Log at start: `[PMP] loadAll start`. (2) On success, log: `[PMP] loadAll finish (synced)`. (3) In catch, log: `[PMP] loadAll error` with error. (4) After `renderAll()`, if `#syncStatus` text is still `'loading'`, call `setSyncState('synced')`. |
| **showDataChangedNotice()** | Added console log: `[PMP] showDataChangedNotice`. |
| **Storage.saveJob** | On successful Supabase save, set `S.lastLocalWriteAt = Date.now()` before `setSyncState('synced')`. |
| **Storage.deleteJob** | On successful chain, set `S.lastLocalWriteAt = Date.now()` before `setSyncState('synced')`. |
| **Storage.savePresses** | On success, set `S.lastLocalWriteAt = Date.now()` before `setSyncState('synced')`. |
| **Storage.saveTodos** | On success, set `S.lastLocalWriteAt = Date.now()` before `setSyncState('synced')`. |
| **Storage.logProgress** | On success, set `S.lastLocalWriteAt = Date.now()` before `setSyncState('synced')`. |
| **Storage.logQC** | On success, set `S.lastLocalWriteAt = Date.now()` before `setSyncState('synced')`. |
| **Storage.saveJobs** | On success, set `S.lastLocalWriteAt = Date.now()` before `setSyncState('synced')`. |

**Temporary console logs** (can be removed for production):  
`[PMP] Realtime started`, `[PMP] Realtime unsubscribed`, `[PMP] Realtime event received`, `[PMP] loadAll start`, `[PMP] loadAll finish (synced)`, `[PMP] loadAll error`, `[PMP] showDataChangedNotice`, `[PMP] showDataChangedNotice (panel open, external change)`.

---

## Final event lifecycle

1. **Entry**  
   User chooses station from launcher → `enterByLauncher(choice, pressId)` → `loadAll()` then `startPolling()`.  
   `startPolling()` calls `stopDataSync()` (clears any existing interval and realtime subscription), then either `startRealtime()` (Supabase) or `startPollInterval()` (local).

2. **Realtime (Supabase)**  
   `startRealtime()` calls `stopDataSync()` again (no-op if already clean), then `PMP.Supabase.subscribeRealtime(callback)` and stores the returned unsubscribe in `realtimeUnsubscribe`.  
   Only one subscription is active; a new `startPolling()` tears down the previous one first.

3. **Realtime event**  
   Postgres change → callback runs (debounced 300 ms).  
   - If **panel closed:** run `loadAll()` (sets loading → then synced/offline/local).  
   - If **panel open:** if within 1 s of `S.lastLocalWriteAt`, do nothing (self-echo). Otherwise set `S.dataChangedWhileEditing = true` and `showDataChangedNotice()`.

4. **Local write**  
   Any successful Supabase write (saveJob, savePresses, saveTodos, logProgress, logQC, saveJobs, deleteJob) sets `S.lastLocalWriteAt = Date.now()` in its `.then()` before `setSyncState('synced')`.  
   The next realtime event from that write (within 1 s) does not show “Data updated elsewhere” when the panel is open.

5. **loadAll()**  
   Sets `loading`, then in try: fetches data, assigns state, `setSyncState('synced')`. In catch: applies offline snapshot or local, `setSyncState('offline')` or `setSyncState('local')`. After `renderAll()`, if sync bar is still “loading”, `setSyncState('synced')`.  
   So the sync bar always ends in synced, local, offline, or error.

6. **Logout**  
   `doLogout()` calls `stopDataSync()`: clears poll interval, clears debounce timeout, calls `realtimeUnsubscribe()`. No subscription remains.

---

## Manual QA steps

1. **Single subscription**  
   Open app, sign in, enter Admin. In console, expect one `[PMP] Realtime started` and no further “Realtime started” until you leave and re-enter. Log out; expect `[PMP] Realtime unsubscribed`.

2. **No self-echo notice**  
   Enter Admin, open a job (slide panel). Edit and save (e.g. change status, SAVE). Within 1 s you should **not** see “Data updated elsewhere”. Console may show `[PMP] Realtime event received` but should not show `[PMP] showDataChangedNotice (panel open, external change)` for that event.

3. **External change notice**  
   Tab A: Admin, panel open on a job. Tab B: change the same job (or another) and save. Within a few seconds Tab A should show “Data updated elsewhere”. Console: `[PMP] showDataChangedNotice` / `(panel open, external change)`.

4. **Sync bar not stuck**  
   Enter Admin; wait for initial load. Sync bar should show “● SYNCED” (or OFFLINE/LOCAL if applicable), not “loading”. Trigger a realtime update (e.g. from another tab) with panel closed; after load, bar should return to “● SYNCED”.

5. **Panel closed refresh**  
   With panel closed, cause a change from another tab. This client should run `loadAll()` (console: `[PMP] loadAll start` then `[PMP] loadAll finish (synced)`), and the list/view should update without showing “Data updated elsewhere”.

6. **Logout cleans up**  
   Log out. Console: `[PMP] Realtime unsubscribed`. Sign in again and enter Admin; expect a new `[PMP] Realtime started`. No duplicate channels.

Remove or gate the `[PMP]` console logs for production if desired.
