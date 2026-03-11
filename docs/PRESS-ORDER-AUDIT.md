# Press Order & Unintended Change Audit

**Audit-only. No patches applied.**

---

## PHASE 1 — Press order regression audit

### 6. Where press order is determined

| View | Source | Code location |
|------|--------|----------------|
| **Floor page press cards** | `S.presses` array order → `renderPresses()` maps over `S.presses` | render.js L204–209: `el.innerHTML = S.presses.map(p => buildPressCardHTML(...)).join('')` |
| **Launcher press selection** | Hardcoded in HTML; not from `S.presses` | index.html L99–102: buttons in order p1, p2, p3, p4 |
| **TV press strip** | `S.presses` array order | render.js L1071: `pe.innerHTML = S.presses.map(p => ...).join('')` |
| **Floor Manager press grid** | `S.presses` array order | stations.js L561: `pressEl.innerHTML = S.presses.map(p => buildPressCardHTML(...)).join('')` |

So every press view that uses data uses **the raw order of `S.presses`**. There is no separate “display order” or sort step.

### 7. Where the order comes from

| Source | Details |
|--------|--------|
| **Hardcoded array** | `DEFAULT_PRESSES` in core.js L54–59 is `[p1, p2, p3, p4]` → Press 1, Press 2, Press 3, 7" PRESS (7" last). |
| **S.presses** | Set in app.js `loadAll()`: if `data.presses && data.presses.length > 0` then `S.presses = data.presses` (L145); else `S.presses = DEFAULT_PRESSES` (L148). So when using Supabase, order = **whatever the DB returns**. |
| **DB row order** | supabase.js L188: `client.from('presses').select('*')` — **no `.order(...)`**. So Postgres returns rows in **undefined** order (often heap or index scan order, not guaranteed). |
| **Sort by name/id** | **None.** No `.sort()` is applied to presses anywhere in the codebase. |
| **Render-time** | No reordering; render just maps `S.presses` in place. |

So when data comes from Supabase, **press order is undefined**. When data is local-only (no presses from DB), order is DEFAULT_PRESSES: p1, p2, p3, p4 (7" fourth).

### 8. Expected historical order vs current logic

- **DEFAULT_PRESSES / seed.sql:** p1 (PRESS 1), p2 (PRESS 2), p3 (PRESS 3), p4 (7" PRESS) — 7" is **fourth** (rightmost).
- **Launcher (index.html):** Same: Press 1, Press 2, Press 3, 7" Press — 7" last.
- **User expectation (from report):** “7" PRESS … expected far-left position … now appearing third.” So expected = 7" **first** (far left); current = 7" **third** (or fourth, depending on interpretation).
- **Current logic:** No guaranteed order when using Supabase. Order can be anything the DB returns (e.g. p1, p2, p4, p3 would put 7" third; or p1, p2, p3, p4 would put 7" fourth).

So “expected” (7" far left) does **not** match the only defined order in code (DEFAULT_PRESSES and launcher have 7" last). The codebase has never encoded “7" first.” The regression is that **order from the DB is unstable**, so 7" can appear in different positions (e.g. third) instead of a single, predictable position.

### 9. How 7" PRESS could move to third position

- Supabase returns `presses` with **no ORDER BY**. So the order can change between runs or after writes (e.g. upsert can change physical row order).
- If the returned array is, for example, `[p1, p2, p4, p3]` (by id string, or by storage order), then the display order is: Press 1, Press 2, **7" PRESS**, Press 3 — i.e. 7" in **third** position.
- So 7" appears in third (or any) position because **press order is never explicitly defined when loading from the DB**.

### 10. Patch / logic area responsible

- **Not a single recent patch.** Order has always been “whatever `data.presses` is” from `loadAllData()`.
- **Root cause:** `client.from('presses').select('*')` in **supabase.js** has **no `.order('id')`** (or any other ordering). So the regression is “undefined DB order,” which can surface as 7" moving when:
  - Switching to/from Supabase,
  - After saves/upserts,
  - Or different Postgres versions/plans.

**Exact files/functions involved in press ordering:**

- **supabase.js** — `loadAllData()`: `client.from('presses').select('*')` (no order).
- **app.js** — `loadAll()`: `S.presses = data.presses` when length > 0 (no sort).
- **core.js** — `DEFAULT_PRESSES` order: p1, p2, p3, p4.
- **render.js** — `renderPresses()`: uses `S.presses.map(...)` (no sort).
- **stations.js** — Floor Manager grid: same, `S.presses.map(...)` (no sort).

---

## PHASE 2 — Unintended change sweep

### 11. Recent behavior/layout/ordering that could be affected

| Area | Change in recent work | Intentional? | Accidental? |
|------|------------------------|-------------|-------------|
| **Press order** | No code change to press order. Order is undefined from DB. | N/A | **Regression is latent:** DB order was never stabilized; it can surface as “7" moved.” |
| **Floor arrangement** | No change to floor layout; still `S.presses.map()`. | Yes | No |
| **Archive** | Archive lifecycle + ARCHIVED filter + restore; active views exclude archived. | Yes | No |
| **Job hiding/showing** | `isJobArchived(j)` used in filters; duplicate check and CSV import use non-archived only. | Yes | No |
| **Tab return** | Auth callback no longer calls `showLauncher()` when app or station shell is visible. | Yes | No |
| **Press Station** | Job dropdown + console wrap width; station shell visibility preserved on tab return. | Yes | No |

### 12. Intentional vs likely accidental

- **Intentional:** Archive fields, archive/restore UI, tab-return fix (auth + station shell), Press Station dropdown and bar width, duplicate/import using non-archived jobs.
- **Likely accidental:** None of the recent patches touch press ordering. The 7" “move” is due to **existing behavior**: no ORDER BY on presses and no client sort, so order is undefined when using Supabase.

---

## OUTPUT

### 1. Does archive still require manual SQL?

**Yes.** The app expects `jobs.archived_at`, `jobs.archived_by`, `jobs.archive_reason`. If the project’s `jobs` table was created before archive support, those columns must be added by running the migration in the Supabase SQL Editor (no automated runner in repo).

### 2. Exact SQL to verify/fix archive schema

**Verify** (run in Supabase SQL Editor):

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'jobs'
  AND column_name IN ('archived_at', 'archived_by', 'archive_reason')
ORDER BY column_name;
```

If any of the three columns are missing, **fix** by running:

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS archived_by text DEFAULT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS archive_reason text DEFAULT NULL;
```

(Optionally add the COMMENTs from `supabase/archive-columns-migration.sql`.)

### 3. Exact root cause of press order change

**Root cause:** Press order when using Supabase is **undefined**. `loadAllData()` does `client.from('presses').select('*')` with **no `.order(...)`**, and no code sorts `S.presses` after load. So the order is whatever Postgres returns, which can vary (e.g. p1, p2, p4, p3), producing 7" in third (or another) position. This is not introduced by a recent patch; it is the existing design.

### 4. Exact files/functions involved in press ordering

- **supabase.js** — `loadAllData()`: `client.from('presses').select('*')` (no order).
- **app.js** — `loadAll()`: assigns `S.presses = data.presses` when `data.presses.length > 0` (no sort).
- **core.js** — `DEFAULT_PRESSES`: [p1, p2, p3, p4].
- **render.js** — `renderPresses()`: `S.presses.map(...)` for press grid.
- **stations.js** — Floor Manager: `S.presses.map(...)` for press list.

### 5. Smallest safe fix for press order

**Option A (recommended):** Stabilize order from DB. In **supabase.js** in `loadAllData()`, change:

```js
client.from('presses').select('*')
```

to:

```js
client.from('presses').select('*').order('id', { ascending: true })
```

That yields a stable order by id (e.g. p1, p2, p3, p4). That matches DEFAULT_PRESSES and the launcher (7" last).

**Option B (if plant wants 7" first):** Keep or add Option A for stability, then in the client after assigning `S.presses`, sort by a canonical display order, e.g. a constant `PRESS_DISPLAY_ORDER = ['p4','p1','p2','p3']` and sort `S.presses` so that order is used for display. (Requires a single place that runs after every load, e.g. in `loadAll()` after `S.presses = data.presses`, or in `renderPresses()`.)

### 6. Other unintended regressions

**None identified.** Recent changes do not modify press order, floor arrangement, or archive filtering logic in a way that would explain 7" moving. The only issue found is the pre-existing undefined press order when loading from Supabase.
