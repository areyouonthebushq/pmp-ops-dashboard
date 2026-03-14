# localStorage Trust Guard — Spec

**Date**: 2026-03-06
**Priority**: P1
**Type**: Spec (no implementation)
**Source**: Elegance Audit §7 (localStorage Risk)

---

## Premise

The sync bar says "SYNCED" after every local save. But `safeSet()` wraps `localStorage.setItem` in a bare `try/catch {}` that swallows `QuotaExceededError` silently. If the payload exceeds the browser's localStorage limit (typically 5-10MB), the write fails, the sync bar still shows green, and the user has no idea their data didn't persist. This is a trust violation — the one kind of bug that erodes confidence in the whole system.

This spec defines a minimal trust guard: detect failure, tell the user, and give the system a chance to shed weight before the next attempt.

---

## Current State

### Three localStorage keys

| Key | Written by | Contents | Growth pattern |
|-----|-----------|----------|---------------|
| `pmp_ops_data` | `flushLocalSave()`, `scheduleSave()` | Full app state: jobs, presses, todos, qcLog, devNotes, compounds, employees, scheduleEntries, notesChannels | Unbounded — grows with job count and log depth |
| `pmp_offline_snapshot` | `setOfflineSnapshot()` | Near-duplicate of above (minus notesChannels, plus fetchedAt) | Same growth as above |
| `pmp_offline_queue` | `pushToOfflineQueue()` | Queued offline writes | Capped at 100 entries (good) |

### Estimated payload at maturity

| Key | Estimated size |
|-----|---------------|
| `pmp_ops_data` | 3-12MB |
| `pmp_offline_snapshot` | 3-12MB |
| `pmp_offline_queue` | 5-50KB |
| **Combined** | **6-24MB** |

Most browsers allow 5MB. Some allow 10MB. None allow 24MB.

### How failure is hidden

```js
// storage.js:20-31 — safeSet
async function safeSet(k, v) {
  const data = JSON.stringify(v);
  try {
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(k, data, true);
      return;
    }
  } catch {}         // ← swallowed
  try {
    localStorage.setItem(k, data);
  } catch {}         // ← swallowed
}
```

`safeSet` returns successfully whether or not the write worked. The caller (`flushLocalSave`) then calls `setSyncState('synced')`. The sync bar turns green. The data is gone.

---

## Trust Guard Behavior

### Rule 1: `safeSet` must report failure

`safeSet` must return a value or throw on failure so the caller can react. The simplest change: return a boolean.

```
safeSet(key, value) → Promise<boolean>
  true  = write succeeded
  false = write failed (quota, security, or other)
```

No new error types. No complex return shapes. Just a boolean.

### Rule 2: Failed writes must update the sync bar

When a localStorage write fails:

1. Set sync state to a new state: `quota` (or reuse `error` with a specific message)
2. The sync bar shows: **`● STORAGE FULL`** in the error color (`sync-err`)
3. A one-time toast appears: **`Local storage full — data may not be saved`**

This replaces the current silent green "SYNCED" with an honest signal.

### Rule 3: Failed writes must log to Sentry

If Sentry is available, send a breadcrumb (not an exception) on quota failure:

```
Sentry.addBreadcrumb({
  category: 'storage',
  message: 'localStorage quota exceeded',
  level: 'warning',
  data: { key, payloadSize: data.length }
});
```

This gives visibility into how often quota failures occur in production without generating alert noise.

### Rule 4: The offline snapshot is optional — skip it on pressure

`setOfflineSnapshot` is a convenience cache for the offline fallback. If the main `pmp_ops_data` write is already close to the limit, the offline snapshot should be the first thing to skip. It is a **nice-to-have duplicate**, not a critical write.

When `pmp_ops_data` succeeds but the estimated combined payload exceeds 80% of the assumed quota:
- Skip `setOfflineSnapshot` entirely
- Log a Sentry breadcrumb: `'Skipping offline snapshot — storage pressure'`

When `pmp_ops_data` itself fails:
- Do NOT attempt `setOfflineSnapshot` (it would also fail)
- Proceed to pruning (Rule 5)

### Rule 5: Prune before retry

When a write fails, attempt to shed weight and retry once:

1. **Prune** (see Pruning Order below)
2. **Retry** the failed `safeSet` once
3. If retry succeeds → set sync state to `synced` + toast `'Storage recovered — some history pruned'`
4. If retry fails → set sync state to `quota` + toast `'Local storage full — data may not be saved'`

Only one retry. No infinite prune-retry loops.

---

## Pruning Order

Prune from lowest-value to highest-value data. Each step reduces payload. Stop as soon as the write succeeds.

| Order | What to prune | How | Estimated savings | Risk |
|-------|--------------|-----|-------------------|------|
| **1** | `pmp_offline_snapshot` | `localStorage.removeItem(OFFLINE_SNAPSHOT_KEY)` | 3-12MB | Offline fallback lost until next successful loadAll. Acceptable — this key only matters if the network drops before the next fetch. |
| **2** | `qcLog` older than 30 days | Filter `S.qcLog` to last 30 days before serializing | 200KB-1MB | Old QC entries invisible in local mode. They still exist on the server. |
| **3** | `devNotes` older than 30 days | Filter `S.devNotes` to last 30 days | 100-500KB | Same — server has full history. |
| **4** | `progressLog` entries on archived jobs | Strip `job.progressLog` to `[]` for any job where `job.archived_at` exists | 500KB-3MB | Archived job history not available offline. Rarely accessed. |
| **5** | `scheduleEntries` older than 30 days | Filter by date | 50-200KB | Old schedule data invisible locally. |
| **6** | `notesChannels` log entries older than 7 days | Trim each channel's log array | 100KB-500KB | Recent notes still available. Old notes on server. |

**Do NOT prune**:
- `jobs` array (core data — even archived jobs may be needed for lookups)
- `presses` (tiny, 4 rows)
- `todos` (tiny)
- `compounds` (small)
- `employees` (small)
- `pmp_offline_queue` (already capped, and contains unsaved user actions)

### Pruning is read-side trimming, not data deletion

Pruning removes data from the localStorage payload only. It does NOT mutate `S` (the in-memory state) or delete server data. The next `loadAll()` from Supabase restores the full dataset. Pruning only affects what survives a browser refresh in local/offline mode.

---

## Size Estimation

### How to estimate before writing

`JSON.stringify(payload).length` gives the byte count of the serialized payload. This is the exact size that `localStorage.setItem` will attempt to store.

Check this before calling `setItem`:

```
const data = JSON.stringify(payload);
const sizeKB = Math.round(data.length / 1024);
```

### Assumed quota

Use a conservative estimate of **4.5MB** as the safe ceiling (some browsers report 5MB but measure in UTF-16 characters, effectively halving the usable space for ASCII-heavy JSON). If `data.length > 4_500_000`, skip the write and go directly to prune-retry.

### Telemetry

On every write (successful or not), record the payload size in a Sentry breadcrumb:

```
Sentry.addBreadcrumb({
  category: 'storage',
  message: 'localStorage write',
  level: 'info',
  data: { key, sizeKB, success: true/false }
});
```

This builds a baseline of real-world payload sizes before quota becomes a problem.

---

## Relationship: `pmp_ops_data` vs `pmp_offline_snapshot`

| Aspect | `pmp_ops_data` | `pmp_offline_snapshot` |
|--------|---------------|----------------------|
| **Purpose** | Primary local persistence (local mode) | Fallback cache for offline-then-reconnect (Supabase mode) |
| **Written when** | Every local save (800ms debounce) | Every successful `loadAll()` in Supabase mode |
| **Read when** | `loadAllData()` in local mode | `loadAll()` when Supabase fetch fails and `offlineMode` activates |
| **Contains notesChannels** | Yes | No |
| **Contains fetchedAt** | No | Yes |
| **Is a duplicate** | No — this is the source of truth in local mode | Yes — this is a stale copy of what the server had last time we checked |

### Key insight

When running in **Supabase mode** (the production case), `pmp_ops_data` is not written at all — only `pmp_offline_snapshot` is. The dual-key problem only occurs in **local mode**, where both keys could be written. In practice, the most common quota risk is:

- **Supabase mode**: `pmp_offline_snapshot` alone exceeds quota (3-12MB in one key)
- **Local mode**: `pmp_ops_data` alone exceeds quota (same data, different key)

The fix for both cases is the same: size guard + prune + honest sync bar.

---

## Failure UX

### Sync bar states (updated)

| State | Text | Class | When |
|-------|------|-------|------|
| `synced` | `● SYNCED` | `sync-ok` | Write succeeded |
| `saving` | `● SAVING…` | `sync-save` | Write in progress |
| `error` | `● ERR` | `sync-err` | Network or Supabase error |
| **`quota`** | **`● STORAGE FULL`** | **`sync-err`** | localStorage write failed after prune-retry |
| `offline` | `● OFFLINE` | `sync-err` | No network |
| `local` | `● LOCAL` | `sync-ok` | Local mode, no Supabase |

### Toast messages

| Condition | Toast | Type |
|-----------|-------|------|
| Write failed, prune succeeded on retry | `'Storage recovered — some history pruned'` | `toast` (neutral) |
| Write failed, prune+retry also failed | `'Local storage full — data may not be saved'` | `toastError` (red) |
| Offline snapshot skipped due to pressure | None (silent — it's an optimization, not an error) | — |

### No modal, no blocking dialog

The user should not be interrupted. The sync bar and toast are sufficient. If the user is in Supabase mode, the server has the data — the localStorage failure only affects offline fallback. If the user is in local mode, the toast warns them that a refresh may lose recent changes.

---

## What Should Happen When a Write Fails

### In Supabase mode

1. The offline snapshot fails to write.
2. Sync bar stays `synced` (the Supabase write succeeded — the server has the data).
3. A Sentry breadcrumb is logged.
4. No user-facing warning (the server is the source of truth; localStorage is just a cache).

### In local mode

1. The primary save (`pmp_ops_data`) fails.
2. Attempt prune + retry (one attempt).
3. If retry succeeds: sync bar shows `synced`, toast: `'Storage recovered — some history pruned'`.
4. If retry fails: sync bar shows `quota`, toast: `'Local storage full — data may not be saved'`.
5. The in-memory state (`S`) is still correct — the user can continue working. But a browser refresh will lose changes since the last successful write.

### Writes should be warned, not blocked

Do not prevent the user from continuing to use the app. Do not disable buttons. Do not show a modal. The data is still in memory and (in Supabase mode) on the server. The localStorage failure is a degraded-persistence warning, not a hard stop.

---

## Migration / Compatibility

### No schema change

This spec adds no new localStorage keys and changes no existing key shapes. It changes the behavior of `safeSet`, `flushLocalSave`, `scheduleSave`, and `setOfflineSnapshot` — all internal functions.

### New sync state

The `quota` sync state is new. The sync bar element (`#syncStatus`) already supports dynamic text and class changes via `setSyncState()`. No HTML changes needed.

### Pruning is backward-compatible

Pruned data is simply absent from the payload — the same shape, fewer entries. `loadAllData()` already handles missing/empty arrays with `|| []` fallbacks. No read-side changes needed.

---

## Risks and Tradeoffs

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Pruning removes data the user expects to find** | LOW | Pruning only affects localStorage, not `S` or the server. Data returns on next `loadAll()`. Only matters if the user refreshes while offline after a prune. |
| **Size estimation is imprecise** | LOW | `JSON.stringify().length` is exact for the serialized string. The 4.5MB threshold is conservative. |
| **Pruning is not enough** | MEDIUM | If the raw `jobs` array (unpruned) exceeds 4.5MB, no amount of log trimming will help. This is the signal to stop growing the local payload and move to Supabase-only persistence. The spec doesn't solve this — it buys time. |
| **`pmp_offline_snapshot` is lost on prune** | LOW | It's a stale server cache. The next successful `loadAll()` recreates it. If the network is down at that moment, the app falls back to whatever was in `pmp_ops_data` (which just succeeded). |
| **UTF-16 encoding doubles effective size** | MEDIUM | Some browsers store localStorage strings as UTF-16, effectively halving the 5MB quota to ~2.5MB for ASCII JSON. The 4.5MB threshold may need to be lowered to 2.2MB on Safari. Add a one-time probe at startup if needed. |

---

## Implementation Order

| Phase | What | Effort |
|-------|------|--------|
| **1** | Make `safeSet` return boolean (success/failure) | 15 min |
| **2** | Update `flushLocalSave` and `scheduleSave` to check return value and set `quota` sync state | 30 min |
| **3** | Add size check before write (log payload size to Sentry) | 15 min |
| **4** | Add `pruneForQuota()` function with the pruning order | 1 hour |
| **5** | Wire prune-retry into failed write path | 30 min |
| **6** | Skip `setOfflineSnapshot` when under storage pressure | 15 min |
| **7** | Add `quota` state to `SYNC_STATES` and verify sync bar renders | 5 min |

**Total**: ~3 hours. All changes in `storage.js` except the sync state addition (one line in the `SYNC_STATES` object).

---

## What This Spec Does NOT Cover

- Replacing localStorage with IndexedDB or OPFS
- Server-side data pagination to reduce payload
- Compressing localStorage payloads (e.g., LZ-string)
- Cross-tab localStorage coordination
- Automatic migration from localStorage to Supabase-only mode
- Quota probing at startup to detect the exact browser limit

These are valid future work but out of scope for this trust guard.
