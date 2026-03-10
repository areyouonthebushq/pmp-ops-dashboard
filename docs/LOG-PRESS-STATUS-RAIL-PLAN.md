# LOG & Press Station — Running Total / Status Rail (Design & Implementation Plan)

**Goal:** Plan an integrated running-total/status rail so the quantity-entry surfaces feel like complete machine instruments. Audit and proposal only; no patches applied.

**Scope:** LOG console (#pg-log), Press Station shell (stations.js). Data from existing `getJobProgress(job)` (core.js); no data model changes.

---

## 1. Compact stat set

**Recommended set (three cells):**

| Cell   | Meaning | Source |
|--------|--------|--------|
| **ORDERED** | Job qty (order size) | `p.ordered` |
| **PRESSED** | Total logged as pressed | `p.pressed` |
| **REMAINING** | Left to press (or to complete, context-dependent) | See below |

- **PRESSED** is the single “logged so far” number that updates as the user logs. Label can stay “PRESSED” on both surfaces for consistency; on LOG it still means “pressed” even when mode is PASS/REJECT (the rail reflects the same job’s press total).
- **REMAINING:**
  - **Press Station:** `ordered - pressed` (how many left to press). Already used today.
  - **LOG:** Prefer same for clarity: `ordered - pressed` (“remaining to press”). Optional later: a second line or compact QC line (e.g. QC PASSED · REJECTED) if we want LOG to feel more “full progress”; for a minimal rail, ORDERED · PRESSED · REMAINING is enough.

**Smaller subset (if we need minimal):**  
Two cells: **X / Y** (pressed / ordered) plus **Z left** (remaining). Same data, less label text. Recommendation: keep three cells (ORDERED, PRESSED, REMAINING) for clarity and consistency with Press Station’s existing language.

**Optional fourth cell (LOG only):**  
**QC** = `qcPassed` (and optionally `rejected`) so LOG shows “how much is through QC.” Defer to a second iteration; start with the three-cell rail.

---

## 2. Where the rail should live

**Principle:** The rail should feel like part of the console, not a separate card — a single strip directly attached to the numpad/faceplate so it reads as “this machine’s readout.”

- **LOG page:**  
  - **Placement:** Inside the console, as the **first row** of the faceplate. So the structure becomes: **[rail]** → job label → PRESS/PASS/REJECT → display → numpad grid → LOG PRESS/PASS/REJECT button.  
  - **Rationale:** Same container (`.log-console-wrap` / `#logConsole`), same border; the rail is the top strip of the instrument. When no job is selected, show a placeholder in the rail (“— Select job” or dimmed “— / — / —”) so the strip doesn’t disappear and layout doesn’t jump.

- **Press Station:**  
  - **Placement:** **Immediately above the numpad**, still inside the same content block. Today the order is: JOB (title + meta) → PROGRESS (section + stat block + bar) → LOG PRESSED (section + numpad). Change to: JOB (title + meta) → **[rail: one horizontal strip, same ORDERED/PRESSED/REMAINING + bar]** → LOG PRESSED (section + numpad).  
  - **Rationale:** The rail is the “readout” strip of the instrument; the numpad is the “input.” No separate “PROGRESS” section title, or a very small label (e.g. “PROGRESS”) so the strip is clearly part of the same instrument.

**Layout:** One horizontal strip: same width as the console/numpad column, single row (or one row of numbers + one thin bar), compact padding and font so it doesn’t dominate. Reuse existing design tokens (--space-xs/sm, --d2/--d3, --g for numbers) so it matches the rest of the app.

---

## 3. LOG vs Press Station

| Aspect | LOG page | Press Station |
|--------|----------|----------------|
| **Job context** | One job selected from dropdown; rail shows that job’s counts. | One job (assigned to the press); rail shows that job. |
| **Stats shown** | ORDERED, PRESSED, REMAINING (same three cells). Optional later: QC PASSED (and REJECTED) for LOG-only. | ORDERED, PRESSED, REMAINING (press-only). Already have this data; reframe as rail. |
| **When empty** | No job selected → rail shows placeholder (“— Select job” or “— / — / —”) so strip and layout stay stable. | No job assigned → no numpad; rail can be hidden or show “No job assigned.” |
| **Bar** | Optional: small progress bar (pressed/ordered) in the rail. | Keep existing bar in the rail strip (pressed/ordered). |
| **Update** | Rail refreshes when `renderLog()` runs (job change, after log entry, etc.). | Rail already updates via `updatePressStationProgress()` after log; keep that, ensure rail DOM is the target. |

**Shared:** One conceptual component — “status rail” = ORDERED · PRESSED · REMAINING (+ optional bar). LOG and Press Station each render it in their own layout; data from `getJobProgress(job)` in both cases.

---

## 4. Lowest-risk implementation

1. **Single shared rail HTML helper (e.g. in core.js or render.js)**  
   - `statusRailHTML(job)` (or `statusRailHTML(p)` where `p = getJobProgress(job)`).  
   - Returns a fragment or string: one row with ORDERED, PRESSED, REMAINING (and optional bar).  
   - No new state; no new API. Uses existing `getJobProgress`, `ordered`, `pressed`, `remaining = ordered - pressed`.

2. **LOG page**  
   - Add one container in the LOG console (e.g. `<div id="logConsoleRail" class="log-console-rail"></div>` as first child of `#logConsole` in index.html).  
   - In `renderLog()`: if `S.logSelectedJob`, set `job = S.jobs.find(...)`, then `logConsoleRail.innerHTML = statusRailHTML(job)`; else placeholder.  
   - CSS: `.log-console-rail` — horizontal strip, same max-width as console, compact height, border-bottom or none so it’s clearly the top of the faceplate.

3. **Press Station**  
   - In `renderPressStationShell()` (stations.js), replace the current PROGRESS section markup (`.ps-v1-sec` + `.ps-v1-stat-block`) with a single rail strip that uses the same data (ORDERED, PRESSED, REMAINING, bar).  
   - Reuse or introduce a class e.g. `.ps-v1-rail` (or reuse `.ps-v1-stat-block` with new layout) so the strip is one line: `ORDERED  X   PRESSED  Y   REMAINING  Z   [bar]`.  
   - Keep `updatePressStationProgress()` but have it update the rail’s text nodes / bar width (same as today, just ensure the updated nodes are inside the new rail strip).

4. **No changes to**  
   - LOG page flow (job picker, mode, numpad, enter, reject picker).  
   - Press Station flow (numpad, LOG PRESSED, hold/resume, note).  
   - Data model, Storage, or Supabase.  
   - Panel or any other surface.

5. **Risk mitigation**  
   - Reserve min-height for the rail (LOG and Press Station) so toggling job or “no job” doesn’t shift the numpad.  
   - Reuse existing type scale and spacing so the rail doesn’t look like a new “card”; it should feel like part of the existing chrome.

---

## 5. Mobile and fullscreen console (later)

- **Current:** LOG and Press Station already have responsive rules (e.g. numpad buttons, font sizes). The rail would be the same component; on small viewports it stays one row, can shrink font/padding slightly so it doesn’t wrap.
- **Optional later — fullscreen console:**  
  - On mobile (or a “focus mode”), we could make the console fullscreen: rail fixed at top (or bottom), numpad large below, minimal chrome. Same rail component and same data; only layout and viewport change.  
  - Recommendation: **defer** fullscreen/focus mode to a later iteration. Implement the rail first in the current layout; then, if we add a “fullscreen console” mode, reuse the rail as the status strip in that layout.

---

## 6. Summary

| Item | Recommendation |
|------|----------------|
| **Compact stat set** | ORDERED, PRESSED, REMAINING (three cells). Optional later: QC PASSED (and REJECTED) on LOG only. |
| **Rail placement** | LOG: first row inside `#logConsole`. Press Station: single strip immediately above the numpad (replace current PROGRESS section with rail layout). |
| **LOG vs Press Station** | Same three cells; LOG shows placeholder when no job; Press Station already has the data, reframe as rail. |
| **Lowest-risk impl** | One shared `statusRailHTML(job)` (or `statusRailHTML(p)`); add rail container to LOG and wire in `renderLog()`; refactor Press Station PROGRESS block into rail strip and keep `updatePressStationProgress()` updating it. |
| **Mobile / fullscreen** | Rail works in current responsive layout; defer fullscreen/focus console to later and reuse same rail. |

*End of plan. No patches applied.*
