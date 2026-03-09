# Demo hardening bug list

Punch-list for live demo readiness after the new-job consistency patch. Only issues that could disrupt the exact flow below are listed.

**Demo flow:** 1. Launcher → 2. Admin floor → 3. Open existing job (right-side panel) → 4. Create new job (chooser → manual wizard) → 5. Import CSV (chooser) → 6. Press station → 7. QC station → 8. Refresh persistence → 9. Exit to launcher/login.

---

## 1. Launcher

**No demo blocker found.**

- Entry (demo/login) and station choice (Admin, Press 1–4, QC) work; `#app` is shown for Admin/QC; null guards on `modeScreen` and `app` avoid throws if elements exist.

---

## 2. Admin floor

| Severity | Issue | Reproduction | Expected | Current | Smallest likely fix |
|----------|--------|---------------|----------|---------|----------------------|
| **Low** | Brief empty floor on first load | 1. Fresh load or refresh. 2. Click Admin. 3. Watch floor table and press cards. | Data appears within ~1–2 s. | First paint can show “NO ACTIVE JOBS” and empty press cards until `loadAll()` finishes; then `loadAll()` calls `renderAll()` and data appears. | None required for demo; optional: show a short “Loading…” on floor until first `renderAll()` after load. |

**No blocker.** Data appears once load completes.

---

## 3. Open existing job in right-side panel

**No demo blocker found.**

- Clicking a job row (floor table, jobs table, job card, VIEW on recently completed) calls `openPanel(j.id)`. Panel opens with that job; job-not-found path returns before opening overlay (no blank panel). Edit and save use existing `saveJob()` path.

---

## 4. Create new job via chooser → manual entry wizard

| Severity | Issue | Reproduction | Expected | Current | Smallest likely fix |
|----------|--------|---------------|----------|---------|----------------------|
| **Low** | N key opens chooser on top of open wizard | 1. Open chooser → Manual Entry (wizard opens). 2. Press N. | N is ignored or wizard stays in front. | Chooser opens again (over wizard); no check for wizard/chooser open before handling N. | In keydown handler, if `wizardWrap` or `newJobChooserWrap` has class `on`, return before handling N (and optionally before other shortcuts). |
| **Low** | Escape does not close chooser or wizard | 1. Open chooser or wizard. 2. Press Escape. | Modal closes. | Escape only handles confirm, panel, TV, station; chooser and wizard stay open. | In Escape branch, if `newJobChooserWrap` has `on` call `closeNewJobChooser()`; else if `wizardWrap` has `on` call `closeWizard()`. |

**No blocker.** Wizard steps, validation, duplicate check, and save path work; new job appears in list after save.

---

## 5. Import CSV via chooser

**No demo blocker found.**

- Chooser → “Import CSV” closes chooser and triggers `document.getElementById('csvFileInput').click()`. The file input lives in the Jobs page DOM and is always present; file picker opens; `importCSV(this)` runs on change. Same CSV import path as before; no change to behavior.

---

## 6. Press station

**No demo blocker found.**

- Launcher → Press 1/2/3/4 → `enterByLauncher('press', pressId)` → `openPressStation` → shell and render. Log quantity → `pressStationLogPressed` → `logJobProgress` → `Storage.logProgress`. Assignment and display match.

---

## 7. QC station

**No demo blocker found.**

- Launcher → QC → app and QC view; total from progressLog; pills labeled as events. Select job, enter qty, log reject; persistence and display are consistent.

---

## 8. Refresh persistence

**No demo blocker found.**

- Saves (panel and wizard) use `Storage.saveJob(job)` and `Storage.savePresses(S.presses)` as before. On refresh, `loadAll()` → `Storage.loadAllData()` repopulates S. Jobs, presses, progress, and QC log persist for the configured backend (Supabase or local).

---

## 9. Exit back to launcher/login

**No demo blocker found.**

- Bar “EXIT” → `doLogout()` → `showLauncher()`. Full sign out uses `signOutFully()` and shows login when auth is enabled. No blank screen or wrong destination.

---

## Summary

| Step | Blocker? | Notes |
|------|----------|--------|
| 1. Launcher | No | — |
| 2. Admin floor | No | Low: brief empty state on first load. |
| 3. Open existing job | No | — |
| 4. New job (chooser → wizard) | No | Low: N and Escape with chooser/wizard open. |
| 5. Import CSV via chooser | No | — |
| 6. Press station | No | — |
| 7. QC station | No | — |
| 8. Refresh persistence | No | — |
| 9. Exit to launcher/login | No | — |

**No blockers identified.** Remaining items are low-severity polish (first-paint empty state, N/Escape with modals open). Demo flow is viable as-is; fixes above are optional for hardening.
