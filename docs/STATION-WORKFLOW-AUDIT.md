# Station Workflow-Priority Audit

**Goal:** Ensure each station behaves like the correct operational surface for that role.  
**Focus:** Workflow fit, not design language.

---

## 1. Press Station

| Question | Current state |
|----------|----------------|
| Is the current job the most obvious thing on screen? | **Yes.** JOB section + catalog · artist at top; clear. |
| Is logging the next stack the most obvious action? | **No.** LOG PRESSED (+10/+25/+50/+100) sits **below** CONTROLS (HOLD / note / SAVE NOTE). On many screens the primary action is below the fold. |
| Is any secondary information competing with the logging action? | **Yes.** The CONTROLS block (hold, textarea, SAVE NOTE) sits between progress and the log buttons, so the main task (tap to log) is visually and physically after secondary tasks. |
| Can the surface be used quickly with repeated taps and low cognitive load? | **Only if the user scrolls first.** With current order, repeated “log stack” workflow requires scrolling to reach the buttons. |

**Verdict:** Job and progress are well prioritized. The **order of blocks** under-prioritizes the primary action (log pressed). Moving LOG PRESSED above CONTROLS would make “see job → tap +qty” the default path without scrolling.

---

## 2. QC Station

| Question | Current state |
|----------|----------------|
| Is job selection fast enough? | **Yes.** Current job at top; job list as tappable buttons; selection is one tap. |
| Are defect categories immediately tappable and obvious? | **Yes.** Six reject buttons with icons and labels; LOG REJECT section is clear. |
| Is today’s reject trend visible at a glance? | **No.** TODAY summary (total + breakdown by type) is **below** the defect buttons. To see “how many today” or “which type is spiking” you look down past the primary actions. |
| Does the screen prioritize rapid capture over browsing? | **Partly.** Defect buttons are prominent, but TODAY and RECENT log are in the same vertical flow. Moving today’s summary **above** the defect buttons would put “trend at a glance” before “tap to log” without adding UI. |

**Verdict:** Capture is well supported. **Today’s reject trend** is not at a glance; it’s after the main actions. Reordering so TODAY summary appears before LOG REJECT / defect buttons would improve at-a-glance trend without changing behavior.

---

## 3. Floor Manager

| Question | Current state |
|----------|----------------|
| Can someone identify bottlenecks in under 5 seconds? | **Yes.** Stats row shows OVERDUE (red when > 0), PRESSES online, ACTIVE, QUEUED, TOTAL OPEN. Overdue and press utilization are visible immediately. |
| Are late / blocked / at-risk jobs easy to spot? | **Yes.** Table uses `dueClass` (overdue = red, due-soon = amber); status pills show ON HOLD (red). No default sort by risk, but risk is visually coded. |
| Is press utilization legible without opening records? | **Yes.** Press cards show name, status, job, progress bar, due; no need to open a job to see utilization. |
| Is quick inspection (floor card) more prominent than full editing? | **No.** Row has two actions: tap artist/album → floor card (statboard), and button “OPEN →” → full panel. The button is as prominent as the row tap, so “open for full edit” competes with “open for quick inspect.” For FM, the intended primary is inspect (floor card); full edit should feel secondary. |

**Verdict:** Bottlenecks and risk are well supported. **Primary row action** is ambiguous: OPEN suggests “main” action. Using a label like “EDIT” for the full-panel button in FM would clarify that the main action is “tap row → statboard” and the button is for full edit.

---

## Top 3 UX Mismatches (Remaining)

1. **Press Station: Primary action (log pressed) is below secondary controls.**  
   CONTROLS (hold/note) sit between progress and LOG PRESSED buttons, so the main task can be off-screen and competes with hold/note for attention.

2. **QC Station: Today’s reject trend is not at a glance.**  
   TODAY summary is below the defect buttons, so operators can’t see “today total” or type breakdown without looking past the primary logging actions.

3. **Floor Manager: Full-panel action competes with quick inspect.**  
   Row offers “OPEN →” (full panel) and tap (floor card) with equal weight; for FM, quick inspect should be the obvious primary, with full edit clearly secondary.

---

## Smallest Code Changes (Implemented)

- **Press Station:** In `renderPressStationShell`, reorder the content template so **LOG PRESSED** (section + buttons) comes **immediately after** the progress stat block, and **CONTROLS** (hold / note / SAVE NOTE) come **after** the log buttons. No new UI; same sections, different order. Result: job → progress → tap to log (above the fold) → hold/note below.

- **QC Station:** In the QC shell HTML, move **TODAY** (summary label + summary div) **above** the LOG REJECT label and defect buttons. `renderQCStationShell` already fills these elements; only DOM order changes. Result: current job → today’s trend → job list → defect buttons → recent log. Today is at a glance before capture.

- **Floor Manager:** When rendering the floor table in `renderFloorManagerShell`, pass an option so the row’s last-cell button uses the label **“EDIT”** instead of “OPEN →”. In `floorTableRowHTML`, support `opts.openBtnLabel` and use it for the button text. Result: primary row action (tap for statboard) is unchanged; the button clearly reads as secondary “EDIT” for full panel.

No new design language, no workflow rewrites; order and one label only.
