# PMP OPS — Supabase runbook

Exact SQL files, run order, what each changes, and what to verify. Use with [STABILIZATION-CHECKLIST.md](./STABILIZATION-CHECKLIST.md).

---

## 1. Exact SQL run order

Run these in **Supabase Dashboard → SQL Editor**, in this order, one file per run (or one logical block per run).

| Step | File | Required |
|------|------|----------|
| 1 | `supabase/schema.sql` | Yes |
| 2 | `supabase/auth-and-profiles.sql` | Yes |
| 3 | `supabase/policies.sql` | Yes |
| 4 | `supabase/rls-roles-migration.sql` | Yes |
| 5 | `supabase/realtime-publication.sql` | Yes (for Realtime) |
| 6 | `supabase/audit-log-migration.sql` | Yes (for Audit page) |
| 7 | `supabase/seed.sql` | Optional (demo data) |

**Do not reorder.** Step 3 must run before step 4 (see Policy conflict audit below).

---

## 2. What each file does and verify after

### Step 1: `schema.sql`

- **Changes:** Creates tables `jobs`, `progress_log`, `presses`, `todos`, `qc_log` and indexes. No RLS.
- **Verify:** Table Editor shows all five tables. No errors in SQL output.

### Step 2: `auth-and-profiles.sql`

- **Changes:** Creates `profiles` (id, email, display_name, role, created_at, updated_at); enables RLS on `profiles`; policies so users read/update own profile; trigger `on_auth_user_created` on `auth.users` to insert a profile row on signup.
- **Verify:** Table `profiles` exists. RLS enabled on `profiles`. Trigger exists on `auth.users` (Dashboard → Database → Triggers or run `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`).
- **Requires:** Auth enabled (Email provider). New users will get a profile row with `role = NULL` until you set it.

### Step 3: `policies.sql`

- **Changes:** Enables RLS on `jobs`, `progress_log`, `presses`, `todos`, `qc_log`. Creates 5 “Authenticated users full access to *” policies and 5 “Anon full access to *” policies (broad access).
- **Verify:** All five app tables have RLS enabled. Policies list shows 10 new policies (5 authenticated, 5 anon).
- **Important:** This is the **only** file that turns on RLS for the five app tables. If you skip it and run only step 4, the role-based policies from step 4 apply to tables that do **not** have RLS enabled, so everyone has full access. So step 3 is required.

### Step 4: `rls-roles-migration.sql`

- **Changes:** Adds `profiles.assigned_press_id` (nullable, check p1–p4). Creates `get_my_role()`, `get_my_press_id()`, `job_on_my_press(job_id)`. **Drops** the 10 policies created by `policies.sql` (by exact name). Creates role-based policies (admin / floor_manager / press / qc) on jobs, progress_log, presses, todos, qc_log.
- **Verify:** Policies “Authenticated users full access to *” and “Anon full access to *” are **gone**. New policies like `jobs_admin_all`, `jobs_floor_manager_select`, etc. exist. Column `profiles.assigned_press_id` exists. Functions `get_my_role`, `get_my_press_id`, `job_on_my_press` exist.
- **After this step:** Anonymous users have **no** access to the five tables. Authenticated users see/change only what their role allows. Production-safe from a policy perspective once this has run.

### Step 5: `realtime-publication.sql`

- **Changes:** Adds the five tables to the `supabase_realtime` publication so Postgres changes are broadcast.
- **Verify:** No SQL error. (Realtime is verified by two-tab test in stabilization checklist.)
- **If skipped:** Realtime subscriptions in the app will not receive events; UI will not update live until next manual load or refresh.

### Step 6: `audit-log-migration.sql`

- **Changes:** Creates `audit_log` table; `audit_trigger_func()` and triggers on jobs, presses, todos, progress_log, qc_log; enables RLS on `audit_log` (insert authenticated, select admin only); adds `profiles_admin_select_all` so admins can read all profiles for the audit view; creates view `audit_log_with_actor`.
- **Verify:** Table `audit_log` exists. Triggers on the five tables exist. Policy `profiles_admin_select_all` on `profiles` exists. View `audit_log_with_actor` exists.
- **If skipped:** Audit page in app will fail or return no rows (no table/view or no admin read).

### Step 7: `seed.sql` (optional)

- **Changes:** Inserts demo jobs, presses, todos, progress_log, qc_log rows.
- **Verify:** Rows appear in each table. Safe to run once; duplicate runs may conflict on primary keys (check seed content for ON CONFLICT or idempotency).
- **Do not run** if you already have production data you want to keep; seed is for empty/dev DBs.

---

## 3. Files that should NOT be run (or run only once)

- **Do not run `policies.sql` again** after you have run `rls-roles-migration.sql` unless you intend to re-enable broad anon/authenticated access (not recommended for production). Re-running policies.sql would recreate the 10 broad policies; you would then need to run rls-roles-migration again to drop them and restore role-based only.
- **Do not run only `rls-roles-migration.sql`** without having run `policies.sql` first. RLS would never be enabled on the five app tables, so all access would remain unrestricted.
- **Do not run `audit-log-migration.sql`** before `rls-roles-migration.sql`; it uses `get_my_role()` which is created in rls-roles-migration.
- **Seed.sql:** Run only once per environment, or skip in production if you have real data.

---

## 4. Policy conflict audit: policies.sql vs rls-roles-migration.sql

### What each file defines

**policies.sql:**

- Enables RLS on: `jobs`, `progress_log`, `presses`, `todos`, `qc_log`.
- Creates 5 policies named exactly:  
  `"Authenticated users full access to jobs"`,  
  `"Authenticated users full access to progress_log"`,  
  `"Authenticated users full access to presses"`,  
  `"Authenticated users full access to todos"`,  
  `"Authenticated users full access to qc_log"`.
- Creates 5 policies named exactly:  
  `"Anon full access to jobs"`,  
  `"Anon full access to progress_log"`,  
  `"Anon full access to presses"`,  
  `"Anon full access to todos"`,  
  `"Anon full access to qc_log"`.

**rls-roles-migration.sql:**

- Does **not** enable RLS (no `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on the five tables).
- Drops policies by the exact names above:  
  `DROP POLICY IF EXISTS "Authenticated users full access to jobs" ON jobs;`  
  … and same for the other 9.
- Creates role-based policies (e.g. `jobs_admin_all`, `jobs_floor_manager_select`, etc.) for authenticated users only; no anon policies.

### Can broad anon/authenticated access still remain?

- **If you run policies.sql then rls-roles-migration.sql in that order:** No. The migration drops all 10 broad policies by name. After step 4, only role-based policies exist; anon has no access to the five tables; authenticated access is limited by role.
- **If you run only policies.sql and never run rls-roles-migration.sql:** Yes. All 10 broad policies remain. Anonymous and any authenticated user have full CRUD on all five tables. **Not safe for production.**
- **If you run only rls-roles-migration.sql (skip policies.sql):** The five tables never get RLS enabled. In Postgres, when RLS is off, policies are not enforced and everyone has full access. So effectively “broad access” remains until RLS is enabled. **Not safe for production.**

### Production-safe posture

1. Run **policies.sql** (enables RLS and temporarily adds broad policies).
2. Run **rls-roles-migration.sql** immediately after (drops those 10 policies, adds role-based ones).
3. Ensure every authenticated user has a `profiles` row with `role` set (`admin`, `floor_manager`, `press`, or `qc`) and, for `press`, `assigned_press_id` set to the correct press id (e.g. `p1`).
4. Do **not** run policies.sql again after that unless you intentionally re-add broad access and then re-run the migration to remove it.

After steps 1–2 above: no anon access; authenticated access is role-based only. That is the intended production-safe state.
