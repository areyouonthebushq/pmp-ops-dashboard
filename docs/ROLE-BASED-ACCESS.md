# PMP OPS — Role-based access

## Overview

Access is enforced at the **database** (Supabase RLS) and reflected in the **UI** (launcher visibility, edit permissions). Profiles store `role` and, for press users, `assigned_press_id` (p1–p4).

## Permission matrix (read / write)

| Table / action | admin | floor_manager | press | qc |
|----------------|-------|---------------|-------|-----|
| **jobs** | R W (all) | R, W (no delete) | R, W (only row where job on my press) | R |
| **progress_log** | R W (all) | R, I | R, I (stage in pressed/qc_passed, job on my press) | R, I (stage = rejected only) |
| **presses** | R W (all) | R, W | R, W (only my row) | R |
| **todos** | R W (all) | R, W | R | R |
| **qc_log** | R W (all) | R | R | R, I |
| **profiles** | — | — | R/W own | — |

- **R** = SELECT, **W** = UPDATE (and INSERT/DELETE where noted), **I** = INSERT only.
- Press “my press” = row in `presses` where `id = profiles.assigned_press_id` for the current user.
- “Job on my press” = `presses.job_id = job.id` and `presses.id = get_my_press_id()`.

## Assumptions

1. **Profile and role**  
   Every authenticated user has a `profiles` row (created by trigger on signup). Role is set by an admin (e.g. in Supabase Dashboard or a future admin UI). Default role is `NULL`; RLS treats NULL role as no access to role-scoped policies.

2. **Press assignment**  
   For `role = 'press'`, `assigned_press_id` must be one of `p1`, `p2`, `p3`, `p4`. Only that press row can be updated by the user, and only progress for the job on that press can be written.

3. **No anon access**  
   The migration drops anon policies. All access is via authenticated users; role comes from `profiles.role`.

4. **UI vs DB**  
   The app derives launcher visibility and `getStationEditPermissions()` from `window.PMP.userProfile.role` (and `assigned_press_id`). The DB enforces the same rules; UI hides/disabled does not replace RLS.

5. **Local mode**  
   When Supabase is not configured or not in use, `getAuthRole()` is null and the app allows all actions (no RLS); behavior matches pre-auth.

## SQL to run

1. `supabase/schema.sql`
2. `supabase/auth-and-profiles.sql`
3. `supabase/rls-roles-migration.sql` (adds `assigned_press_id`, helpers, and role-based policies; drops broad authenticated/anon policies)

## Setting roles

Set `profiles.role` (and for press, `profiles.assigned_press_id`) in Supabase:

- **Dashboard** → Table Editor → `profiles` → edit row.
- Or SQL:  
  `UPDATE public.profiles SET role = 'press', assigned_press_id = 'p1' WHERE id = auth.uid();`  
  (Run as the user or via a service role / admin tool.)

## File-level changes (summary)

| File | Change |
|------|--------|
| `supabase/rls-roles-migration.sql` | New: profiles.assigned_press_id, get_my_role/get_my_press_id/job_on_my_press, drop old policies, add role-based policies. |
| `supabase.js` | getProfile selects `assigned_press_id`. |
| `app.js` | getAuthRole, getAuthAssignedPressId, mayEnterStation; getStationEditPermissions from role; applyLauncherByRole; enterByLauncher enforces role and uses assigned_press_id for press. |
