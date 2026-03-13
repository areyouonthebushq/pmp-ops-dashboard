# Employee Page MVP — Planning (read-only)

**Product intent:** Operational directory + schedule surface for the plant — who works here, how to reach them, what they do, who is in / scheduled today. Not an HR system.

**Constraints (this pass):** Read-only planning; no code changes. No payroll, PTO, HR records, emergency contacts, time clocks, or shift-swapping.

---

## 1. Best home in the app/nav

**Recommendation: add a single admin-shell page between NOTES and PVC.**

- **Nav label:** **◉ CREW** (or **CREW** without symbol). Fits PMP OPS family: short, operational, same tone as FLOOR, JOBS, LOG, NOTES, PVC.
- **Placement:** After NOTES, before PVC:
  - `⬡ FLOOR` · `▶ JOBS` · `✓ TODOS` · `⬡ LOG` · `◇ NOTES` · **`◉ CREW`** · `◌ PVC` · `▣ AUDIT` · `♛ DEV`
- **Rationale:**
  - CREW answers “who’s here / who do I call” — same kind of daily ops as NOTES (communication) and LOG (who’s doing what).
  - Keeps AUDIT and DEV at the end (admin/backstage).
  - New page follows existing pattern: one `pg` with `id="pg-crew"`, `data-pg="crew"`, `goPg('crew')`; no FAB on CREW (directory/schedule is read-only in MVP).
- **Visibility:** All roles that see the main nav can see CREW (same as NOTES, PVC). No admin-only gate for MVP.

---

## 2. Smallest useful employee data model

**Recommendation: new table `employees` (separate from `profiles`).**

- **Why a separate table:** The directory is an operational roster. It can include people who don’t have app logins (e.g. floor, shipping). `profiles` is “who can sign in”; `employees` is “who works here.”
- **Link later:** Optional `user_id` (FK to `auth.users` / `profiles`) can be added when you want “logged-in user ↔ directory row” (e.g. “you” badge or prefill); not required for MVP.

**Smallest useful schema:**

| Column        | Type         | Purpose |
|---------------|--------------|--------|
| `id`          | text (PK)    | Stable id (e.g. uuid or slug). |
| `name`        | text NOT NULL| Display name. |
| `role`        | text         | Display role: same as app roles and/or custom (“Press 1”, “QC”, “Shipping”, “Compound”). |
| `phone`       | text         | Contact. |
| `email`       | text         | Contact. |
| `specialty`   | text         | What they do / station (e.g. “P1”, “QC”, “Shipping”). Can align with `assigned_press_id` for press users later. |
| `photo_url`   | text         | Optional; same pattern as compounds `image_url`. |
| `active`      | boolean      | Default true; soft hide from directory without delete. |
| `created_at`  | timestamptz  | Default now(). |
| `updated_at`  | timestamptz  | Default now(). |

**Optional for later:** `user_id uuid REFERENCES auth.users(id)` to link to a profile.

**RLS:** Same pattern as other ops tables: authenticated (and anon if you use it) can SELECT; only admin (or a dedicated “crew editor” role) can INSERT/UPDATE/DELETE if you add edit UI later. MVP can be SELECT-only for all authenticated.

---

## 3. Smallest useful schedule model

**Recommendation: one table `schedule_entries` — “who is scheduled on which day.”**

- **MVP scope:** “Who is scheduled today” (and optionally “in” if you add a single flag). No shift-swap, no PTO, no time clocks.

**Smallest useful schema:**

| Column         | Type        | Purpose |
|----------------|-------------|--------|
| `id`           | text (PK)   | Stable id (e.g. uuid). |
| `employee_id`  | text NOT NULL | FK to `employees.id`. |
| `date`         | date NOT NULL | Day (no time). |
| `shift_label`  | text        | E.g. “8–4”, “AM”, “PM”, “Full”. |
| `sort_order`   | int         | Optional; order within day. |

**One row per person per day** they’re scheduled. Multiple rows per day per person only if you later support split shifts (out of MVP).

**“Who is in” vs “who is scheduled”:**  
- MVP: show only “scheduled today” (query by `date = today`).  
- Later: add optional `checked_in boolean` or a separate lightweight `check_ins(employee_id, date)` if you want “in” without changing schedule semantics.

**RLS:** Same idea as employees: SELECT for authenticated; write only for admin (or future “schedule editor”).

---

## 4. Best UI structure for Directory and Today

**Page shell:** One `.pg` with two clear sections, reusing existing PMP OPS patterns.

### 4.1 Section labels (family language)

- Use the same section pattern as LOG / NOTES / PVC / FM:
  - **`.sec`** for page-level section dividers (e.g. “DIRECTORY”, “TODAY”).
  - Or **`.station-sec`** if you want the same look as QC/Floor Manager shells.
- Label text:
  - **DIRECTORY** — who works here, how to reach them, what they do.
  - **TODAY** — who is scheduled (and optionally “in” later) with date in the section (e.g. “TODAY — Fri Mar 6”).

### 4.2 Directory view

- **Purpose:** Scan and contact people.
- **Structure:**
  - Optional toolbar: search/filter by name or role (same idea as NOTES search, JOBS filter).
  - List: table or cards.
    - **Table option:** `.tbl-wrap` + table, columns: Name, Role, Specialty, Phone, Email; optional small thumb (photo_url). Matches AUDIT/Floor table.
    - **Card option:** `.compound-list`-style cards: thumb (or initial), name, role, specialty, phone, email (click-to-call/mail). Matches PVC.
  - **Recommendation:** Table for density and scan; optional photo column. If roster is small, cards are fine and align with PVC.
- **Data:** `S.employees` filtered by `active === true`, sorted by name (or role then name).
- **Empty state:** “No employees” / “Add people to the directory in settings” (or later admin UI).

### 4.3 Today view

- **Purpose:** See who’s scheduled (and later “in”) for the current day.
- **Structure:**
  - Section header: **TODAY** + short date (e.g. “Fri Mar 6”).
  - List of people with at least one `schedule_entries` row for today.
  - Each row/card: name, role/specialty, shift_label (e.g. “8–4”), optional phone (or “tap Directory” for contact). Optional small photo/initial.
  - Sorted by shift_label or sort_order, then name.
- **Empty state:** “No one scheduled today” or “No schedule entries for today.”
- **Future:** If you add “in” (e.g. check-in), a simple “In” badge or column can be added without changing this structure.

### 4.4 Layout sketch (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◉ CREW                                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  DIRECTORY                                                                  │
│  [ Search / filter by name or role ]                                        │
│  ┌──────────┬──────────┬────────────┬─────────────┬──────────────────────┐ │
│  │ Name     │ Role     │ Specialty  │ Phone       │ Email                │ │
│  ├──────────┼──────────┼────────────┼─────────────┼──────────────────────┤ │
│  │ …        │ …        │ …          │ …           │ …                    │ │
│  └──────────┴──────────┴────────────┴─────────────┴──────────────────────┘ │
│                                                                             │
│  TODAY — Fri Mar 6                                                          │
│  ┌──────────┬────────────┬─────────┐                                        │
│  │ Name     │ Specialty  │ Shift   │  (optional: In ✓)                      │
│  ├──────────┼────────────┼─────────┤                                        │
│  │ …        │ …          │ 8–4     │                                        │
│  └──────────┴────────────┴─────────┘                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. What to include in MVP

| Item | In MVP | Notes |
|------|--------|--------|
| Name | ✅ | Required. |
| Role | ✅ | Display (admin, floor_manager, press, qc, or custom). |
| Phone | ✅ | How to reach. |
| Email | ✅ | How to reach. |
| Specialty / station | ✅ | What they do (e.g. P1, QC, Shipping). |
| Optional photo | ✅ | `photo_url`; same pattern as compounds. |
| Shift / today schedule | ✅ | `schedule_entries` for today; show shift_label. |
| Search/filter (directory) | ✅ | By name or role. |
| “Who is in” (check-in) | ❌ | Out of MVP; add later if needed. |
| Edit UI (add/edit employee, edit schedule) | ❌ | Can be out of MVP; data can be seeded or edited in Supabase. Or add a minimal admin-only form in a later slice. |

---

## 6. What should NOT be included yet

- Payroll, PTO, HR records, emergency contacts, time clocks, shift-swapping.
- Linking directory to “who is logged in” (e.g. “you” badge, or prefill from profile) — optional later via `employees.user_id`.
- Multiple shifts per person per day, recurring patterns, or calendar view — keep to “one row per person per day” + shift_label.
- Permissions beyond “who can see CREW” (e.g. hide certain people by role) — same visibility as NOTES/PVC for MVP.

---

## 7. Smallest safe implementation sequence

1. **Schema**
   - Add `employees` table (id, name, role, phone, email, specialty, photo_url, active, created_at, updated_at) + RLS (SELECT for authenticated; optionally write for admin).
   - Add `schedule_entries` table (id, employee_id, date, shift_label, sort_order) + RLS.
   - Migration file(s) in `supabase/` (e.g. `employees-table.sql`, `schedule-entries-table.sql`).

2. **Data load**
   - In `loadAll` (or equivalent), load employees and schedule entries (e.g. for “today” and maybe a small window) into `S.employees` and `S.scheduleEntries` (or `S.scheduleByDate`).
   - Supabase: add `employees` and `schedule_entries` to realtime publication if you want live updates; otherwise poll/load on CREW page focus.

3. **Nav and page shell**
   - Add nav item: `◉ CREW`, `data-pg="crew"`, `goPg('crew')`.
   - Add `#pg-crew` with two sections: DIRECTORY (toolbar + table or list), TODAY (date + list).
   - In `goPg`, ensure `crew` is handled and FAB stays hidden on CREW (like audit).

4. **Directory view**
   - Render from `S.employees` (active only): table or cards; columns: name, role, specialty, phone, email; optional photo.
   - Add simple search/filter by name/role; re-render on filter.

5. **Today view**
   - Filter `schedule_entries` by `date === today`; join to `S.employees` for name, role, specialty, phone.
   - Render list/table: name, specialty, shift_label; optional contact or “see Directory.”

6. **Optional (later)**
   - Admin UI to add/edit employees and schedule entries (or keep Supabase-only for a while).
   - `employees.user_id` and “you” or profile link.
   - “Who is in” (e.g. check-in flag or table) and show in Today.

---

## 8. Summary

- **Home:** New page **◉ CREW** in the admin shell, between NOTES and PVC; read-only directory + today schedule.
- **Data:** `employees` (who works here, contact, specialty, optional photo); `schedule_entries` (employee_id, date, shift_label) for “scheduled today.”
- **UI:** Two sections — DIRECTORY (search + table/cards) and TODAY (date + list); reuse `.pg`, `.sec`, `.tbl-wrap` or card list, and existing design tokens.
- **MVP scope:** Name, role, phone, email, specialty, optional photo, today schedule; no HR, no time clock, no shift-swap; minimal implementation order: schema → load → nav + shell → Directory → Today.

This keeps the Employee Page within PMP OPS operational grammar and family language and stays read-only and minimal for a first release.
