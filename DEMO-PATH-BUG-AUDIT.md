# DEMO PATH BUG AUDIT

**Scope:** Stabilize the prototype for a guided live demo. No new features, refactors, or UI redesign—only bugs that break the core demo path.

---

## A. Demo path checkpoints

| # | Checkpoint | Verdict | Notes |
|---|------------|---------|--------|
| 1 | Login or enter demo/local mode | **PASS** | Guest demo sets `PMP_GUEST_MODE`, `showLauncher()`; auth bootstrap shows login or launcher as configured. |
| 2 | Choose station from launcher | **PASS** | Launcher shows; `enterByLauncher(choice, pressId)` runs on button click. |
| 3 | Admin opens dashboard | **FAIL** | Dashboard (#app) never shown when Admin is chosen (see Bug 1). |
| 4 | Floor page shows presses + active orders correctly | **FAIL** | Cannot reach floor as Admin because #app stays hidden. |
| 5 | Open a job from active orders | **NOT VERIFIED** | Blocked by 3–4 for Admin path; would need manual test after Bug 1 fix. |
| 6 | Right-side panel loads the correct job data | **NOT VERIFIED** | Same as above. |
| 7 | Edit and save key fields | **NOT VERIFIED** | Same as above. |
| 8 | Press Station logs quantity correctly | **PASS** | Press path sets `app.style.display = 'block'` before opening station; `pressStationLogPressed` → `logJobProgress` → `Storage.logProgress`; flow is correct. |
| 9 | QC Station logs reject correctly | **FAIL** | QC chosen from launcher never shows #app (same root cause as Admin). |
| 10 | Changes persist after close/reopen | **NOT VERIFIED** | Depends on 5–7; persistence layer (Storage.saveJob, flushLocalSave, Supabase) is wired; no code bug found. |
| 11 | Changes persist after refresh | **NOT VERIFIED** | Same as 10; loadAll/loadAllData and restore of S look correct. |
| 12 | Logout/back behavior returns user to the correct screen | **PASS** | Bar EXIT → `doLogout()` → `showLauncher()`. SIGN OUT → `signOutFully()` → login (or launcher if no Supabase). |

---

## B. Confirmed bugs

### Bug 1: Admin and QC launcher choices never show the app

- **Title:** #app never displayed when entering Admin or QC from launcher.
- **Exact user-visible symptom:** User clicks “Admin” or “QC” on the launcher; mode screen hides but the main app (dashboard/QC UI) never appears—screen stays blank or only launcher area visible.
- **Likely root cause:** In `enterByLauncher()`, `document.getElementById('app').style.display = 'block'` is executed only after the `if (choice === 'admin')` and `if (choice === 'qc')` branches. Both branches `return` before that line, so the app div is never shown for Admin or QC.
- **File(s):** `app.js`
- **Function(s):** `enterByLauncher(choice, pressId)`
- **Severity:** **blocker**
- **Fix before demo:** **yes**

---

## C. Highest-priority fixes

1. **Show #app when entering Admin or QC from launcher (Bug 1).**  
   In `app.js`, set `document.getElementById('app').style.display = 'block'` (and any related bar/FAB visibility) **before** the `if (choice === 'admin')` / `if (choice === 'qc')` branches, or at the start of both branches, so that choosing Admin or QC makes the app visible. This is the only confirmed blocker for the demo path.

*(No other fixes are listed; no other bugs were confirmed that block the 12 checkpoints.)*

---

## D. Do not fix yet

- **Styling / UX polish:** Any non-functional UI or copy tweaks.
- **Auth edge cases:** e.g. session expiry mid-demo, role changes; not required for a controlled demo path.
- **Offline / Supabase failure:** Local banner and offline queue exist; deeper offline behavior is out of scope.
- **Realtime “data updated elsewhere”:** Panel notice and loadAll on event are implemented; fine-tuning is out of scope.
- **Performance / refactors:** No architecture or style cleanups; no “while we’re here” changes.

---

## Summary

- **One blocker:** Admin and QC never show the app because `#app` is never set to `display: block` when those launcher options are chosen.
- **Fix:** Ensure the app is shown (e.g. set `app.style.display = 'block'`) before or inside the Admin and QC branches in `enterByLauncher`.
- After that fix, checkpoints 3, 4, 5, 6, 7, 9 should be re-tested manually; 10 and 11 depend on those flows and can be verified at the same time.

**No code changes have been made. Awaiting your approval before implementing the fix.**
