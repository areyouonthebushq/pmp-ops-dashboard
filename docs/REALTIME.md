# PMP OPS — Supabase Realtime (replaces polling)

## Overview

When Supabase is active, the app uses **Realtime** postgres_changes instead of 15-second polling. When Supabase is unavailable, the 15-second polling loop is used unchanged (local mode).

## Subscription lifecycle

1. **Start:** When the user enters the app from the launcher (`enterByLauncher` or equivalent), `startPolling()` runs.
   - If `useSupabase()` is true: `startRealtime()` runs. It calls `stopDataSync()` first (clears any existing timer and unsubscribes any existing channel), then `PMP.Supabase.subscribeRealtime(callback)` and stores the returned `unsubscribe` function in `realtimeUnsubscribe`.
   - If `useSupabase()` is false: `startPollInterval()` runs (same as before: 15s interval that calls `loadAll()` when the panel is not open).

2. **During session:** One Realtime channel subscribes to postgres_changes (INSERT/UPDATE/DELETE) on: `jobs`, `presses`, `todos`, `progress_log`, `qc_log`. Each event is debounced (300ms); after the debounce, either `loadAll()` runs (panel closed) or a “Data updated elsewhere” notice is shown (panel open).

3. **Stop:** On logout (`doLogout()`), `stopDataSync()` runs: it clears the poll timer, clears the debounce timeout, and calls `realtimeUnsubscribe()` (which removes the channel). No subscriptions remain after logout.

4. **No double subscriptions:** `startPolling()` always calls `stopDataSync()` before starting Realtime or the interval, so there is only one active sync path at a time.

## Conflict strategy (open panel / in-progress edit)

- **Panel closed:** A Realtime change triggers a single debounced `loadAll()` (which re-fetches and then `renderAll()`). The UI updates with the latest data.
- **Panel open:** We do **not** overwrite the form. We set `S.dataChangedWhileEditing = true` and show a non-destructive notice bar at the top of the panel: “Data updated elsewhere. [Refresh view]”.
  - **Refresh view:** The user can click “Refresh view” to run `loadAll()` and re-render the rest of the app (floor, lists, etc.). The panel stays open; the form is **not** repopulated from the new data (so in-progress edits are not clobbered). When the user closes the panel, they see the updated list.
  - **Close panel:** Closing the panel hides the notice and clears the flag. No stale notice on next open.

## Enabling Realtime in Supabase

Tables must be in the `supabase_realtime` publication. Run in SQL Editor (once):

```sql
-- Add operational tables to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.presses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.progress_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.qc_log;
```

(If a table is already in the publication, you may see an error; that’s fine.)

## Manual QA checklist (two-browser testing)

Use two browsers (or two profiles): **A** (e.g. admin) and **B** (e.g. another admin or station).

- [ ] **Realtime on, panel closed**
  - A: Open app, go to Floor. B: Change a job (e.g. status) or add a QC log.
  - Within a few seconds, A’s floor/list should update without refresh. No polling delay.

- [ ] **Realtime on, panel open (no clobber)**
  - A: Open a job in the panel (edit form open). B: Change that same job (e.g. status or note).
  - A should **not** see the form fields change. A should see the yellow “Data updated elsewhere. [Refresh view]” bar.
  - A: Click “Refresh view”. List/floor should update; panel form unchanged.
  - A: Close panel. List should show B’s changes.

- [ ] **Realtime on, panel open, different job changed**
  - A: Open job X in the panel. B: Change job Y (or add a new job).
  - A should see the notice. After “Refresh view”, the list shows the new/updated job Y; panel still shows job X.

- [ ] **Logout cleans up**
  - A: Open app (Realtime active). A: EXIT / logout.
  - In DevTools or network, confirm no further Realtime traffic (channel removed). Reload and log in again; only one channel should be created.

- [ ] **Local mode unchanged**
  - With Supabase URL/key disabled or unavailable, open app. No Realtime; 15s polling should still run (e.g. change data in another tab via Supabase Dashboard and wait up to 15s to see it, or confirm no WebSocket for realtime).

- [ ] **No duplicate renders**
  - With Realtime on, have B make several quick changes. A’s UI should update once per burst (debounce), not flash multiple times.

- [ ] **Stations**
  - A: Enter as Press station. B: Assign a job to that press or log progress. A’s press view should update in near real time (and still respect “panel open” if a panel were open there).
