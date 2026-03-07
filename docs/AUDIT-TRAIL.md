# PMP OPS — Audit trail

## Recommendation: DB-trigger-based logging

**Use database triggers**, not app-write-based logging.

| Approach | Pros | Cons |
|----------|------|------|
| **DB triggers** | Cannot be skipped by the app; runs in same transaction (atomic); works for direct SQL/API writes; single source of truth | Slightly more setup; no custom “reason” field unless we add it to tables |
| **App-write** | Easy to add “reason” or context in code | Can be skipped if the app forgets to call audit; direct DB writes bypass it; less trustworthy for production |

**Conclusion:** For production trust (“logging cannot be skipped by a normal app write”), triggers are required. Any INSERT/UPDATE/DELETE on the audited tables writes to `audit_log` in the same transaction. No JS change can bypass it.

---

## Design

- **Table:** `public.audit_log` (append-only)
  - `table_name`, `entity_id` (PK of the row), `action` (insert/update/delete)
  - `changed_by` = `auth.uid()` at write time (who did it)
  - `occurred_at` = `now()`
  - `changed_fields` = array of column names (updates only)
  - `old_values` / `new_values` = jsonb (for update: only changed columns; for insert/delete: full row)

- **Storage:** On UPDATE we store only changed columns in `old_values` and `new_values` to keep volume reasonable. No automatic truncation of long strings; add later if needed (e.g. cap text at 2k chars).

- **Triggers:** One generic function `audit_trigger_func()` attached AFTER INSERT OR UPDATE OR DELETE on:
  - `jobs`
  - `presses`
  - `todos`
  - `progress_log`
  - `qc_log`

- **RLS:** Authenticated users can INSERT (the trigger runs as the invoking user). Only **admin** can SELECT (policy uses `get_my_role() = 'admin'`). No UPDATE/DELETE policies → append-only.

- **Identity:** `changed_by` is set from `auth.uid()` inside the trigger, so it always reflects the current authenticated user. Service-role or anon writes would not set a user; we do not allow anon writes on audited tables after RLS migration.

---

## SQL to run

Run **after** schema and RLS roles migration:

- `supabase/audit-log-migration.sql`

This creates:

- `audit_log` table and indexes
- `audit_trigger_func()` and triggers on the five tables
- RLS (insert authenticated, select admin only)
- Policy so admin can read all `profiles` (for “who did it” in views)
- View `audit_log_with_actor` (join to profiles for email/display_name)

---

## Minimal admin retrieval path

1. **In the app (admin):** Open **AUDIT** in the nav (only visible when Supabase + admin role). Choose limit, click **LOAD**. Table shows: when, table, entity id, action, changed_by (uuid prefix), changed fields.

2. **Supabase SQL Editor (admin):** Run queries against `audit_log` or `audit_log_with_actor` (RLS applies; only admin sees rows).

   Examples:

   ```sql
   -- Last 100 entries (with actor email/name)
   SELECT * FROM public.audit_log_with_actor LIMIT 100;

   -- By table
   SELECT * FROM public.audit_log WHERE table_name = 'jobs' ORDER BY occurred_at DESC LIMIT 50;

   -- By entity (e.g. one job)
   SELECT * FROM public.audit_log WHERE table_name = 'jobs' AND entity_id = 'JOB-123' ORDER BY occurred_at DESC;

   -- By user (replace with user uuid)
   SELECT * FROM public.audit_log WHERE changed_by = '...' ORDER BY occurred_at DESC LIMIT 100;

   -- Since date
   SELECT * FROM public.audit_log WHERE occurred_at >= '2025-01-01' ORDER BY occurred_at DESC;
   ```

3. **From JS (admin):** `PMP.Supabase.getAuditLog({ limit, table_name, entity_id, since })` — used by the Audit page. RLS ensures only admin gets rows.

---

## File changes summary

| File | Change |
|------|--------|
| `supabase/audit-log-migration.sql` | New: table, trigger function, triggers, RLS, profiles admin-select policy, `audit_log_with_actor` view |
| `supabase.js` | `getAuditLog(opts)` added |
| `index.html` | Nav item AUDIT (admin only), pg-audit with toolbar + table |
| `app.js` | `loadAuditPage()`, `escapeHtml()`; goPg('audit'), updateFAB for audit; show navAudit when admin |
| `styles.css` | .audit-toolbar, .audit-hint, .audit-tbl |

No changes to write paths: auditing is entirely trigger-based.
