# RLS 403 on jobs and todos — root-cause audit (no patch)

Audit-only. Purpose: identify why press and possibly admin are getting 403 on jobs and todos writes.

---

## 1. Every place Storage.saveJob() is called (and whether automatic)

| Location | Call | Automatic? | When |
|----------|------|------------|------|
| app.js ~233 | `Storage.saveJob(job)` | **Yes (triggered by prior action)** | Inside `logJobProgress()` when `suggestedStatus()` suggests `pressing` or `done`; not awaited. Triggered by: Log pressed (Press Station), QC qc_passed, panel/render progress log. |
| app.js ~1154, ~1416 | `Storage.saveJob(job)` (with savePresses) | No | Panel save (user-initiated). |
| app.js ~1442, ~1492, ~1508, ~1704, ~1720 | `Storage.saveJob(j)` / `Storage.saveJob(job)` | No | Various panel/floor-card/wizard flows (user or explicit save). |
| render.js ~295 | `Storage.saveJob(j)` | No | Floor card field blur/save. |
| stations.js ~407, ~417, ~428 | `Storage.saveJob(job)` | No | Press Station: Hold, Resume, Save note. |
| storage.js ~154, ~347 | Supabase saveJob (inside saveAll/replay) | No | saveAll / replay path. |

**Automatic in the sense of “no explicit user click on Save”:** Only the **logJobProgress** path (app.js ~233), when status suggestion changes. That follows a user action (e.g. Log pressed, QC log) but the saveJob itself is not awaited and is a side effect.

**Not called from loadAll() or authBootstrap().**

---

## 2. Every place Storage.saveTodos() is called (and whether automatic)

| Location | Call | Automatic? | When |
|----------|------|------------|------|
| **app.js ~161** | **`if (S.todos) Storage.saveTodos(S.todos);`** | **Yes** | **Inside loadAll()**, after `checkTodoReset()`. Runs on every successful loadAll(). |
| render.js ~755, ~761, ~771 | `Storage.saveTodos(S.todos)` | No | toggleTodo(), removeTodo(), addTodo() — Todos page UI. |

**Automatic:** Only from **loadAll()** (app.js line 161). Every time loadAll() completes (initial load, realtime callback, poll, dismissDataChangedNotice), we run `checkTodoReset()` (which can mutate `S.todos` and `S._lastReset`), then unconditionally `if (S.todos) Storage.saveTodos(S.todos)`.

---

## 3. When these automatic writes can happen

**loadAll() is invoked from:**

- **enterByLauncher(choice, pressId)** (app.js ~425) — when user picks Admin / Floor Manager / Press / QC. First load after app open.
- **Realtime callback** (app.js ~284, ~287) — after a postgres change (debounced 300 ms). So after any write by anyone (or same user), loadAll can run.
- **startPollInterval** (app.js ~299) — every 5 s when not using Supabase realtime.
- **dismissDataChangedNotice()** (app.js ~322) — user clicks to refresh after “data changed elsewhere.”

So **saveTodos** (the only automatic write in loadAll) runs:

- **On loadAll():** yes, every time.
- **After realtime:** yes (realtime triggers loadAll).
- **On station entry:** yes (enterByLauncher calls loadAll() for every choice, including press/QC).
- **On station exit:** no (doLogout/showLauncher does not call loadAll).
- **On auth bootstrap:** no (authBootstrap does not call loadAll; it only showLauncher or showLoginScreen).
- **On launcher transitions:** yes (enterByLauncher → loadAll for every choice).

**saveJob** is not called from loadAll. It is called only from user-driven or follow-up paths (logJobProgress status suggestion, panel/station saves).

---

## 4. Writes before auth/profile is fully ready

**Auth/bootstrap order:**

1. authBootstrap() runs (app load).
2. If auth required: showLoginScreen(true) → initSupabase() → onAuthStateChange registered → getSession().
3. If session exists: **await fetchAndStoreProfile(session.user.id)** then **showLauncher()**.
4. User sees launcher only after step 3. So when the user clicks a launcher choice, **window.PMP.userProfile** has been set (or is null if profile fetch returned nothing).

**When is the first loadAll?**

- Only when the user clicks a launcher option (or OPEN last choice), i.e. after showLauncher() and thus after fetchAndStoreProfile() has completed. So the **first** loadAll runs after profile has been fetched (or known to be null).

**Possible race:**

- **Realtime** is started in **startPolling()**, which is called from **enterByLauncher()** after **loadAll()** is called (same stack). So the first loadAll runs before realtime is subscribed. A later realtime event can trigger loadAll again; by then the user has been in the app and profile is set. So the only realistic “before profile ready” case is if **getAuthRole()** is used and profile is **null** (no row or role not set). Then:
  - **saveTodos** guard is `getAuthRole() === 'press'` → skip. If **getAuthRole() is null**, we do **not** skip → we call Supabase saveTodos → RLS: **todos** has no policy allowing write when **get_my_role()** is null → **403**.

So **writes can happen when the app thinks “no role” (getAuthRole() null)** and we still attempt saveTodos (we only skip for `'press'`). RLS then denies because get_my_role() is null. So **todos 403 for “press”** can also be: **getAuthRole() not yet 'press' (e.g. null)** so we don’t skip and the write is rejected.

---

## 5. getAuthRole() (app) vs get_my_role() (DB)

- **getAuthRole()** (stations.js): returns `window.PMP.userProfile?.role` (client-side, from profile fetch). Used in: storage.js saveTodos guard, stations exit paths, applyLauncherByRole, mayEnterStation, getStationEditPermissions, app.js enterByLauncher, navAudit, audit.
- **get_my_role()** (RLS, SQL): `SELECT role FROM public.profiles WHERE id = auth.uid();` (DB, uses JWT auth.uid()). Used in every RLS policy for jobs, todos, presses, progress_log, qc_log.

So: **UI/permissions** use **getAuthRole()** (profile in memory). **RLS** uses **get_my_role()** (profile in DB for current request’s auth.uid()). They can diverge if:

- Profile not yet loaded → getAuthRole() null, but auth.uid() might be set → get_my_role() could still be 'admin' if the row exists.
- Request sent without session (e.g. client not attaching JWT) → auth.uid() null → get_my_role() null → 403 even if getAuthRole() is 'admin'.

---

## 6. UI thinks admin but DB does not have same auth context

If the **bar shows “ADMIN”** (S.mode / badge) but a **jobs or todos write returns 403**, then either:

- The **Supabase request** for that write is not using the same session (no or wrong JWT), so **auth.uid()** is null or different and **get_my_role()** is not 'admin', or
- The **profiles** row for that user has **role** not equal to `'admin'` (or missing row), so get_my_role() is null or not 'admin'.

The app does not “switch” users; it uses a single Supabase client. So the usual cause would be: **session not attached to the request** (timing/restore) or **profiles.role** not set correctly for that user.

---

## 7. Exact function chain for a failing **jobs** POST (upsert)

**Automatic / side-effect path (status suggestion after log):**

1. User action: e.g. Press Station “Log pressed” or QC “qc_passed”.
2. **pressStationLogPressed(qty)** or QC equivalent → **logJobProgress(jobId, stage, qty, person)** (app.js).
3. **logJobProgress**: updates job.progressLog, **Storage.logProgress(...)** (not awaited), then **suggestedStatus(job, isAssigned)**; if suggestion is `pressing` or `done`, sets **job.status = suggestion.suggested**, then **Storage.saveJob(job)** (not awaited).
4. **Storage.saveJob(job)** (storage.js) → **window.PMP.Supabase.saveJob(job)** (supabase.js) → **client.from('jobs').upsert(row, { onConflict: 'id' })**.

**RLS:** jobs UPDATE (upsert) for authenticated user: **jobs_admin_all** (get_my_role() = 'admin'), **jobs_floor_manager_update**, **jobs_press_update_own** (get_my_role() = 'press' AND job_on_my_press(id) or job_on_any_press(id) if patch applied). If **get_my_role()** is null or no policy matches → **403**.

**Other jobs writes:** Panel save, Hold/Resume/Save note, etc. — same chain from Storage.saveJob → Supabase saveJob → jobs upsert; same RLS.

---

## 8. Exact function chain for a failing **todos** POST (upsert)

**Automatic path (only one):**

1. **loadAll()** (app.js) runs (after enterByLauncher, or realtime, or poll, or dismissDataChangedNotice).
2. **await Storage.loadAllData()** → Supabase loadAllData (reads jobs, presses, todos, etc.); then back in loadAll() we assign **S.todos = data.todos || S.todos**, run **checkTodoReset()** (mutates S.todos if date changed), then **if (S.todos) Storage.saveTodos(S.todos)**.
3. **Storage.saveTodos(S.todos)** (storage.js): if `getAuthRole() === 'press'` → return Promise.resolve() (no write). Else **window.PMP.Supabase.saveTodos(todos)** (supabase.js) → builds rows, **client.from('todos').upsert(rows, { onConflict: 'id' })**.

**RLS:** todos has **todos_admin_all** (get_my_role() = 'admin') and **todos_floor_manager_update**. **Press and QC have only SELECT** on todos. So if **get_my_role()** is null or 'press' or 'qc', the upsert is **forbidden** → **403**.

---

## Report summary

### 1. Failing jobs write path

- **Automatic/side-effect:** User logs progress (e.g. Log pressed, QC) → **logJobProgress** → **Storage.saveJob(job)** when status suggestion is pressing/done → **Supabase saveJob** → **POST/upsert to rest/v1/jobs**.
- **User-initiated:** Panel save, Hold/Resume/Save note, floor card, etc. → **Storage.saveJob** → same Supabase call.
- **Failing:** Request reaches Supabase with JWT; RLS evaluates **get_my_role()**. If get_my_role() is null (no session or no profile row/role), or for press if job_on_my_press(id) / job_on_any_press(id) is false, the UPDATE policy fails → **403**.

### 2. Failing todos write path

- **Only automatic path:** **loadAll()** (after loadAllData + checkTodoReset) → **Storage.saveTodos(S.todos)** → **Supabase saveTodos** → **POST/upsert to rest/v1/todos**.
- **Guard:** We skip the Supabase call only when **getAuthRole() === 'press'**. We do **not** skip when getAuthRole() is **null** or when role is **qc** (qc also has no todos write policy).
- **Failing:** Either (a) press user and getAuthRole() not yet 'press' (e.g. null) so we don’t skip and RLS denies (press has no todos write), or (b) admin/floor_manager and get_my_role() is null or not admin/floor_manager (session/profile not visible to RLS) → **403**.

### 3. Whether the writes are necessary or accidental

- **saveTodos in loadAll:** **Accidental for non–floor-manager/admin.** We call it every loadAll to “persist” the result of checkTodoReset() (daily/weekly reset). Only **admin** and **floor_manager** have RLS permission to write todos. So for **press** and **qc**, this write is unnecessary and should be skipped; for **admin/floor_manager** it is intended.
- **saveJob in logJobProgress:** **Intentional** (status sync when suggestion changes). Necessary for correct state; must be allowed by RLS for the acting role (admin, press with job_on_any_press, etc.).

### 4. Whether the issue is app timing, auth context, DB role resolution, or all

- **Todos 403 (press):** **App logic + role resolution.** We only skip when getAuthRole() === 'press'. If getAuthRole() is null (profile not set or no role), we still write → RLS denies. So: **app** should also skip when role is not a role that can write todos (e.g. skip when getAuthRole() is not 'admin' and not 'floor_manager').
- **Todos 403 (admin):** **Auth context / DB role resolution.** If admin gets 403, the request’s **get_my_role()** is not 'admin'. So either the request has no valid session (auth.uid() null) or the profiles row for that user has role not 'admin'. So: **timing** (request before session attached) or **data** (profiles.role wrong).
- **Jobs 403 (press):** **DB role resolution** (and policy). If press-choose-any-policy is applied, job_on_any_press(id) must hold. If not applied, job_on_my_press(id) can fail for chosen press ≠ assigned_press_id. So: **RLS policy** or **session/role** (get_my_role() = 'press', correct profile).
- **Jobs 403 (admin):** **Auth context / DB role resolution.** Same as todos: get_my_role() must be 'admin' for the request; otherwise session or profiles data.

So: **app timing** (when we call saveTodos vs when profile is set), **auth context** (JWT on request, session restore), and **DB role resolution** (get_my_role() = profiles.role for auth.uid()) can all contribute.

### 5. Smallest likely fix

- **Todos (avoid 403 for press / qc / no-role):** In **storage.js** **saveTodos**, skip the Supabase write when the user is **not** allowed to write todos: e.g. **only call Supabase when getAuthRole() is 'admin' or 'floor_manager'**. If getAuthRole() is null, 'press', or 'qc', return Promise.resolve() and do not call Supabase. That matches RLS (only admin and floor_manager can write todos) and prevents accidental writes for press/qc and for “no role” users.
- **Todos (admin 403):** Ensure the Supabase client has the session when loadAll runs (no change needed if session is always attached after showLauncher). Ensure **profiles.role = 'admin'** for the admin user. If 403 still occurs, add defensive skip in saveTodos when getAuthRole() is null so we never send a todos write when the app doesn’t yet know the role.
- **Jobs (press 403):** Ensure **press-choose-any-policy.sql** is applied so press can update job when job_on_any_press(id). For admin jobs 403: same as above (session + profiles.role).
- **No DB policy changes** per your constraint; fix is app-side (skip todos write when role cannot write todos) and, if needed, confirm session/profile data and RLS policy deployment.
