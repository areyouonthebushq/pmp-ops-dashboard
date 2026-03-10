# PMP OPS — Interaction Consistency Audit

**Goal:** Audit interaction consistency and find places where the same kinds of controls or actions behave differently. No patches applied.

**Focus:** VIEWING vs EDITING, SAVE, CANCEL, DELETE, EXIT, BACK, SIGN OUT, LOG, OPEN, modal behavior, keyboard behavior, button states, disabled/read-only behavior.

---

## 1. VIEWING vs EDITING

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 1.1 | Right-side panel | Open job → edit fields | "Open = view by default; explicit EDIT to change." | Panel opens in **view mode** (inputs disabled, footer hidden). User must click EDIT to enable. | — | Aligned. |
| 1.2 | Floor card overlay | Open job statboard → change fields | Same: view first, then explicit edit. | Floor card opens in **view**; "QUICK EDIT" toggles edit mode. SAVE / CANCEL only in edit mode. | — | Aligned. |
| 1.3 | Assets overlay | Open assets for a job | Either view-then-edit or always-edit; same pattern as panel/card. | Assets overlay is **always editable** (no view-only state). No EDIT toggle. | Users expect "open = view" then "EDIT" to change; here opening = editing with no explicit edit step. | Optional: add view-only open with "EDIT ASSETS" to enter edit mode; or document that assets are "direct edit." |
| 1.4 | Panel: open different job | Open job A, switch to job B from table | Same job context; edit mode should reset. | Opening another job (openPanel(newId)) sets **panelEditMode = false** and reloads form. | — | Aligned. |

---

## 2. SAVE

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 2.1 | Panel | "SAVE JOB" | Save persists; panel stays open or closes by rule. | Save persists; **panel closes**; toast "JOB ADDED" / "JOB UPDATED". | — | Aligned. |
| 2.2 | Floor card (quick edit) | "SAVE" | Save persists; exit edit mode. | Save persists; **edit mode off**; overlay stays open in view mode. | — | Aligned. |
| 2.3 | Assets overlay | "SAVE & CLOSE" | Save persists; overlay closes. | Save persists; overlay closes; toast "ASSETS SAVED". | — | Aligned. |
| 2.4 | Wizard | "Save Job" (step 5) | Same as panel: persist and close. | Persists; wizard and duplicate modal close; toast "JOB ADDED". | — | Aligned. |
| 2.5 | Progress section (panel) | "+ LOG STACK" | Log is a form of save (append to progress). | Appends to progressLog; no "Save job" required for that entry; job still needs save for other fields. | — | Aligned. |

---

## 3. CANCEL

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 3.1 | Panel | "CANCEL" | Discard unsaved changes and close. | **closePanel()** — closes without saving. Form state is not persisted. | — | Aligned. |
| 3.2 | Floor card (edit) | "CANCEL" | Discard edit changes; return to view. | **toggleFloorCardEdit()** — exits edit mode **without saving**; in-memory job unchanged. | — | Aligned. |
| 3.3 | Assets overlay | "CANCEL" | Discard changes and close. | **closeAssetsOverlay()** with no args. Implementation: **saves** (calls Storage.updateJobAssets) and then closes. | Cancel is expected to discard; here it saves. Major breach of contract. | Call **closeAssetsOverlay(true)** for Cancel (skipSave = true discards). |
| 3.4 | Assets overlay | Click backdrop (overlay) | Same as Cancel: discard or explicit confirm. | **closeAssetsOverlay()** — same as Cancel: **saves** and closes. | Click-outside should not silently save; should either discard or ask. | Use closeAssetsOverlay(true) for backdrop click, or add "Discard changes?" when dirty. |
| 3.5 | Assets overlay | "✕" close button | Same as Cancel. | Same as 3.3: **saves** and closes. | Same as 3.3. | Use closeAssetsOverlay(true) for ✕, or unify with Cancel (discard). |
| 3.6 | New job chooser | Click outside / ✕ | No edits; just close. | Closes; no save. | — | Aligned. |
| 3.7 | Wizard | "Cancel" | Discard and close. | **closeWizard()** — closes without saving wizard data. | — | Aligned. |
| 3.8 | Confirm dialog | "CANCEL" | Dismiss without running destructive action. | **closeConfirm()** — no action; dialog closes. | — | Aligned. |
| 3.9 | Duplicate job modal | "Cancel" | Dismiss; no change. | Closes modal; wizard stays open. | — | Aligned. |
| 3.10 | LOG reject picker | "CANCEL" | Abort reject flow; no log entry. | **unifiedLogHideRejectPicker()** — hides picker; no log. | — | Aligned. |

---

## 4. DELETE

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 4.1 | Panel | "DELETE JOB" | Destructive; must confirm. | Button only when editing existing job and **admin**; **openConfirm('DELETE JOB?', ...)**; on confirm: delete, release press, close panel, toast. | — | Aligned. |
| 4.2 | Confirm primary button | Label | "CONFIRM" for generic; override for clarity. | Default **"CONFIRM"**; duplicate-job flow sets **"OPEN EXISTING"** then resets to CONFIRM after. | — | Aligned. |
| 4.3 | Delete elsewhere | Jobs table / floor | No inline delete. | No delete on table or floor card; delete only in panel. | — | Consistent. |

---

## 5. EXIT / BACK / SIGN OUT

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 5.1 | Admin bar | "EXIT" | Leave app shell and return to launcher (or login). | **doLogout()**: hides app, stops sync, **shows launcher**. Does **not** call Supabase signOut. | Naming: "EXIT" vs launcher "SIGN OUT" suggests different actions; both leave shell but only SIGN OUT ends session. | Use one term: e.g. "SIGN OUT" everywhere and document "from bar = exit to launcher, from launcher = sign out of account"; or "EXIT TO LAUNCHER" on bar. |
| 5.2 | Launcher / city line | "SIGN OUT" | End session and show login (or launcher if no auth). | **signOutFully()**: if guest, clear and show login; else **Supabase signOut**, show login (or launcher if no client). | — | Aligned. |
| 5.3 | Press / QC / FM station | "← BACK" | Return one level: admin → shell, operator → launcher. | **exitPressStation / exitQCStation / exitFloorManager**: if admin → **returnToAdmin()**; else **doLogout()** (to launcher). | — | Aligned. |
| 5.4 | Station + Escape | Press Escape while in station | Same as BACK or consistent "escape = exit to launcher." | **Escape** in station calls **doLogout()** only (always to launcher). Does **not** return admin to shell. | As admin, BACK → admin shell, Escape → launcher. Same key "back" elsewhere closes modal; here Escape does a stronger exit. | Either: Escape in station = same as BACK (admin → admin, operator → launcher), or document "Escape in station = exit to launcher for all." |
| 5.5 | TV mode | "ESC · EXIT TV" | Leave TV view. | **exitTV()**; no sign out. | — | Aligned. |

---

## 6. LOG (press / QC pass / reject)

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 6.1 | LOG page | Select job → numpad → LOG PRESS / PASS / REJECT | Log is immediate; no secondary "Save log." | **unifiedLogEnter()** / reject flow: call **logJobProgress**; toast; clear numpad. No separate save step. | — | Aligned. |
| 6.2 | LOG enter button | Disabled when | Should be disabled when action cannot be performed. | **Disabled when n === 0 or !S.logSelectedJob.** | — | Aligned. |
| 6.3 | Press station | LOG PRESSED / LOG +X PRESSED | Same: immediate log. | **psNumpadSubmit** → **logJobProgress**; toast; clear. | — | Aligned. |
| 6.4 | QC station | Reject buttons | Log by defect type immediately. | **qcStationLogReject(type)** → **logQC(type)**. No numpad; immediate. | — | Aligned. |
| 6.5 | Panel progress | "+ LOG STACK" | Append to progress; job must be saved for other fields. | Log entry appended to progressLog; **Storage.saveJob(job)** called for status-change flows; panel save saves full job. | Slightly different from LOG page (panel has full form save). | Document: "Panel progress log is part of job; SAVE JOB persists it." |

---

## 7. OPEN

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 7.1 | Floor / jobs table | Click catalog or row | Open job in panel (or station). | **openPanel(j.id)** (or openFloorCard / openPressStation by context). | — | Aligned. |
| 7.2 | Launcher | "OPEN" (last) | Reopen last station/screen. | **openLastLauncherChoice()** — re-enters last chosen mode (admin, press, QC, FM). | — | Aligned. |
| 7.3 | Panel from duplicate | "Open Existing Job" | Close modals and open that job. | **closeDuplicateModal(); closeWizard(); openPanel(duplicateExistingJob.id)**. | — | Aligned. |
| 7.4 | Save duplicate (panel) | "OPEN EXISTING" in confirm | Same. | **closeConfirm(); openPanel(existing.id)**. | — | Aligned. |

---

## 8. Modal behavior

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 8.1 | Escape order | Escape closes topmost overlay. | Consistent stack: chooser → wizard → confirm → panel → TV. | Order: **station → newJobChooser → wizard → confirm → panel → TV**. Station triggers doLogout (see 5.4). | — | Aligned except station. |
| 8.2 | Confirm dialog | Escape | Dismiss without confirming. | **closeConfirm()** when Escape and confirm open. | — | Aligned. |
| 8.3 | Panel | Escape | Close panel (discard if no save). | **closePanel()** when Escape and panel open. | — | Aligned. |
| 8.4 | New job chooser / wizard | Escape | Close without saving. | **closeNewJobChooser()** / **closeWizard()**. | — | Aligned. |
| 8.5 | Assets overlay | Escape | Should close (discard or confirm). | **Not handled** in keydown. Escape does not close assets overlay. | User expects Escape to close any overlay; assets overlay stays open. | Add Escape branch: if assetsOverlay open then closeAssetsOverlay(true) (discard) and preventDefault. |
| 8.6 | Progress detail overlay | Escape | Close (read-only). | **Not handled**. Escape does not close progress detail. | Same as 8.5. | Add: if progressDetailOverlay open then closeProgressDetail(); preventDefault. |
| 8.7 | Floor card overlay | Escape | Close (or discard if editing). | **Not handled**. Escape does not close floor card. | Same. | Add: if floorCardOverlay open then closeFloorCard(); preventDefault. |
| 8.8 | Click-outside | Clicking backdrop closes. | All overlays close on backdrop click or don’t (confirm = don’t). | **Chooser, wizard, duplicate, assets, progress detail, floor card**: wrap has **onclick="if(event.target===this)close..."**. **Confirm**: wrap has **no** click handler — does not close on backdrop. | Confirm not closing on backdrop is correct (avoid accidental dismiss). Assets click-outside saves (see 3.4). | Fix assets click-outside to discard (closeAssetsOverlay(true)) or prompt. |
| 8.9 | Stacking | Opening panel from wizard/chooser | Clear stacking. | Wizard/chooser close before opening panel in flows. Duplicate modal can sit on top of wizard. | — | Aligned. |

---

## 9. Keyboard behavior

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 9.1 | Global N | New job from floor/jobs | Shortcut for FAB. | **N** on floor or jobs (and no chooser/wizard open) → **openNewJobChooser()**. | — | Aligned. |
| 9.2 | Global / | Focus search | Focus floor or jobs search. | **/** → focus floorSearch if on floor, else jobSearch. | — | Aligned. |
| 9.3 | Escape in input | In panel/overlay input | Blur or close. | Escape still runs full Escape handler; e.g. in panel it **closes panel** (no "blur only"). | Typing in panel and hitting Escape discards and closes; some users may expect "blur field." | Optional: when isTyping and focus in panel, first blur; second Escape close. Or document. |
| 9.4 | QC page (pg-qc) | 1–6 | Reject by type. | **1–6** on QC page (when no panel, no station) → **logQC(QC_TYPES[n-1])**. Note: **pg-qc** is used; nav is "LOG" (pg-log). QC station is separate shell. | LOG page and QC station are different; shortcut only on old pg-qc if present. | Verify QC shortcuts apply where user expects (LOG page vs QC station). |
| 9.5 | Todo input | Enter | Add task. | **Enter** in todo input → **addTodo(columnKey)**. | — | Aligned. |

---

## 10. Button states and disabled / read-only

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 10.1 | Panel form | View mode | Fields not editable. | All **input, select, textarea** in panel body **disabled**; opacity 0.8; pointer-events none. Footer and ".btn.go" disabled. | — | Aligned. |
| 10.2 | Panel progress | No job (new) | Cannot log progress. | **"+ LOG STACK"** and form **hidden** when !S.editId; **logBtn.disabled = true**; message "SAVE JOB FIRST TO LOG PROGRESS." | — | Aligned. |
| 10.3 | LOG enter button | No job or 0 qty | Cannot submit. | **disabled when n === 0 \|\| !hasJob.** | — | Aligned. |
| 10.4 | Press station LOG | 0 qty | Cannot submit. | **btn.disabled = n === 0.** | — | Aligned. |
| 10.5 | Panel +10% (jOv) | Read-only | Computed field. | **readonly** attribute; placeholder "auto". | — | Aligned. |
| 10.6 | Floor card | Non-admin / station | Quick edit may be hidden. | **canUseFloorCard** controls visibility of edit row and QUICK EDIT; otherwise view-only. | — | Aligned. |
| 10.7 | Panel DELETE | New job | No delete. | **delBtn.style.display = 'none'** when !S.editId. | — | Aligned. |
| 10.8 | Panel DELETE | Non-admin | No delete. | **delBtn.style.display = 'none'** when not admin. | — | Aligned. |
| 10.9 | Login submit | Loading | Prevent double submit. | **submitBtn.disabled = true** during submit; re-enabled on error. | — | Aligned. |
| 10.10 | FAB | Page | Show only where relevant. | FAB visible on **floor** and **jobs** only; hidden on log, audit, todos. | — | Aligned. |

---

## 11. Audit page and other surfaces

| # | Surface | Interaction | Expected product rule | Current behavior | Why it breaks trust | Smallest fix |
|---|---------|-------------|------------------------|------------------|----------------------|---------------|
| 11.1 | Audit | "LOAD" | Fetch and show audit data. | **loadAuditPage()**; hint shows "Loading…" / "X entries" / "Error: …". | — | Aligned. |
| 11.2 | Audit | No FAB | No new-job from audit. | FAB hidden on audit page. | — | Aligned. |
| 11.3 | Reject picker (LOG) | Sub-modal | Must choose type or Cancel. | Overlay with defect buttons and CANCEL; no Escape handler (parent Escape would close panel/chooser first if open). | If LOG page is top and reject picker is open, Escape is not explicitly handled for picker. | Add: when reject picker visible, Escape → unifiedLogHideRejectPicker(). |

---

## Implied interaction rules currently in the product

1. **View vs edit:** Panel and floor card use an explicit **view mode** by default; user clicks **EDIT** / **QUICK EDIT** to enable editing. Assets overlay is always editable.
2. **Save:** "SAVE JOB" / "SAVE" / "SAVE & CLOSE" persist and then close or exit edit mode. No "Save and keep editing" in panel (save closes).
3. **Cancel:** Cancel and close buttons **discard** unsaved changes and close — **except** assets overlay, where Cancel and backdrop and ✕ **save** and close.
4. **Delete:** Only in panel, only for existing job, only for admin; **always** via confirm dialog.
5. **Exit / sign out:** Bar **"EXIT"** = leave app shell to launcher (no Supabase sign out). Launcher **"SIGN OUT"** = sign out of account and show login (or launcher). Same word "sign out" not used on bar.
6. **Back:** In stations, **"← BACK"** = one level back (admin → shell, operator → launcher). **Escape** in station = always to launcher (doLogout).
7. **Log:** Log actions (press, QC pass, reject) are **immediate**; no separate "Save log" step. Panel progress "+ LOG STACK" is part of job and persisted on SAVE JOB.
8. **Modals:** **Escape** closes in order: chooser → wizard → confirm → panel → TV. **Click-outside** closes chooser, wizard, duplicate, assets, progress detail, floor card. **Confirm** does not close on click-outside. **Assets** and **progress detail** and **floor card** are **not** closed by Escape.
9. **Keyboard:** **N** = new job (floor/jobs); **/** = focus search; **Escape** = close topmost or exit (station); **1–6** on QC page = reject type.
10. **Disabled:** Buttons and inputs are disabled when the action is not valid (no job, 0 qty, view mode, no permission).

---

## Where those rules break

- **CANCEL / close = discard:** Breaks on **assets overlay** — Cancel, ✕, and backdrop **save** instead of discard.
- **Escape closes overlays:** Breaks for **assets overlay**, **progress detail overlay**, **floor card overlay** — Escape does not close them.
- **EXIT vs SIGN OUT:** Bar says EXIT (to launcher), launcher says SIGN OUT (account); same "leave" gesture, different labels and behavior (only SIGN OUT ends session).
- **Escape in station:** For admin, BACK = return to admin, Escape = exit to launcher; inconsistent with "Escape = back/close" elsewhere.
- **Reject picker:** Escape does not explicitly close the reject picker when it’s the topmost UI.

---

## Top 10 interaction inconsistencies

1. **Assets overlay Cancel / ✕ / backdrop saves** — Cancel and close should discard; they currently persist and close. **Fix:** Use **closeAssetsOverlay(true)** for Cancel, ✕, and backdrop so all close-without-save paths discard.
2. **Escape does not close assets overlay** — Every other overlay (chooser, wizard, confirm, panel) closes on Escape. **Fix:** In keydown Escape handler, if assets overlay is open, call **closeAssetsOverlay(true)** and preventDefault.
3. **Escape does not close progress detail overlay** — Same expectation. **Fix:** If progress detail overlay open, call **closeProgressDetail()** and preventDefault.
4. **Escape does not close floor card overlay** — Same. **Fix:** If floor card overlay open, call **closeFloorCard()** and preventDefault.
5. **EXIT (bar) vs SIGN OUT (launcher)** — Same gesture (leave), different labels and semantics (exit to launcher vs sign out of account). **Fix:** Unify label and/or document: e.g. bar "EXIT TO LAUNCHER" or both "SIGN OUT" with tooltip explaining bar = launcher, launcher = account.
6. **Escape in station vs BACK** — Admin: BACK → admin shell, Escape → launcher. **Fix:** Either make Escape in station do the same as BACK (returnToAdmin vs doLogout), or document "Escape in station = exit to launcher for all."
7. **Assets overlay click-outside saves** — Backdrop click should not silently save. **Fix:** Backdrop click should call **closeAssetsOverlay(true)** (discard) or show "Discard changes?" when dirty.
8. **Reject picker (LOG) not closed by Escape** — When reject picker is open, Escape is not handled for it. **Fix:** In Escape handler, if reject picker is visible, call **unifiedLogHideRejectPicker()** and preventDefault.
9. **Assets overlay always editable** — Panel and floor card use view-then-edit; assets open straight into edit with no view-only state. **Fix:** Optional product decision: add view-only assets with "EDIT ASSETS," or document as "direct edit" and keep as-is.
10. **Confirm dialog primary button label** — Sometimes "CONFIRM," sometimes "OPEN EXISTING"; reset to CONFIRM after. Minor; already context-specific where it matters. **Fix:** Optional: ensure every openConfirm() that needs a custom primary label sets and that it’s not overwritten on close.

---

## Recommended “interaction contract” for the app

1. **View then edit:** Opening a job (panel, floor card) shows **view mode** by default. User explicitly enters **edit mode** (EDIT / QUICK EDIT). Overlays that are edit-only (e.g. assets) should either follow view-then-edit or be clearly "direct edit" with no misleading Cancel.
2. **Save:** Any explicit "SAVE" / "SAVE JOB" / "SAVE & CLOSE" **persists** and then closes or exits edit mode. No silent save on close unless documented (e.g. "auto-save on close").
3. **Cancel and close:** "CANCEL" and "✕" and **click-outside** mean **discard** unsaved changes and close, unless the surface is read-only (then just close). **No** "Cancel" that saves.
4. **Delete:** Destructive delete only after **confirm**; confirm dialog does not close on backdrop click.
5. **Exit and back:** One term for "leave app shell" (e.g. "EXIT" or "SIGN OUT") used consistently, with tooltip or copy where behavior differs (exit to launcher vs sign out of account). **BACK** in stations = one level back (admin → shell, operator → launcher). **Escape** in station = either same as BACK or explicitly "exit to launcher" for all, documented.
6. **Escape:** **Escape** closes the **topmost** overlay or exits the current context. Order: sub-modals (reject picker) → chooser → wizard → duplicate → confirm → assets → progress detail → floor card → panel → TV. In station, Escape = exit to launcher (or same as BACK per above). When focus is in input/textarea, Escape first closes overlay (or blurs once then closes — product choice).
7. **Click-outside:** Backdrop click closes the overlay. For **editable** overlays, close = **discard** (or prompt "Discard changes?"). **Confirm** dialogs do **not** close on backdrop.
8. **Log:** Log actions (press, QC pass, reject) are **immediate**; success toast and clear input. No separate "Save log."
9. **Disabled state:** Buttons and inputs are **disabled** when the action is invalid (no selection, 0 qty, view mode, no permission). Read-only fields use **readonly** or disabled.
10. **Shortcuts:** **N** = new job (floor/jobs); **/** = focus search; **Escape** = close/exit per contract; **1–6** on QC/LOG = reject type where applicable. Document in UI or help if needed.

---

*End of audit. No patches applied.*
