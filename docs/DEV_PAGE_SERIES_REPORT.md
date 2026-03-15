# DEV Page Series Report (PART 1–4)

**Scope:** `#pg-dev` only. No persistence or data model changes. No other pages modified.

---

## Exact files changed (full series)

| File | Changes |
|------|--------|
| **index.html** | DEV composer: `onkeydown` on row; textarea no `onkeydown`; ENTITY/TYPE/STAGE labels removed; FEED/BOARD toggle: two buttons in a wrapper (FEED, BOARD). |
| **app.js** | `goPg('playground')` + `renderPlayground`; FAB hidden on playground; `addDevNote()` reads stage/type/entity as first element of array (or legacy string); `devComposerKeydown` unchanged (Enter submits). |
| **render.js** | Escape no longer skips when textarea focused; rail click toggles (single-value → empty); `devStage`/`devType`/`devEntity` → arrays, setters toggle membership; `fillRail` uses `currentValues.includes(entry.key)`; filter uses `devEntity.length && devEntity.includes(...)` etc.; board HTML: summary count row/total removed; `getPlaygroundJobs`, `renderPlayground`, playground prev/next/setIndex. |
| **styles.css** | Purple identity (terminal, control rail, panels, labels, rail buttons, feed wrap, board summary/cols/cards, toggle); FEED/BOARD compact horizontal toggle (18px height, 28px per button); duck entry; `.dev-feed-wrap` no max-height/overflow-y; board card min-height 80px, card text line-clamp 3. |
| **docs/DEV_PAGE_SERIES_REPORT.md** | This report. |

---

## Purple color values and where used

Design system reference: `--p: #e040fb`, `--p2: #2a0035` (used only where noted).

| Use | Value | Where |
|-----|--------|--------|
| **Panel / chrome border** | `hsl(270, 15%, 14%)` | Terminal border, control-rail bottom, panel border-top, feed-wrap border, toggle border, board summary/cols/card borders. |
| **Terminal background** | `hsl(270, 10%, 5%)` | `#pg-dev .dev-terminal`. |
| **Panel label text** | `hsl(270, 15%, 30%)` | `#pg-dev .dev-panel-label` (ENTITY/TYPE/STAGE — if present). |
| **Rail button text (inactive)** | `hsl(270, 20%, 45%)` | `#pg-dev .dev-rail-btn` default color. |
| **Rail button text (hover)** | `hsl(270, 25%, 55%)` | `#pg-dev .dev-rail-btn:hover:not(.active)`. |
| **Section label (e.g. feed sec)** | `hsl(270, 20%, 45%)` | `#pg-dev .dev-feed-sec`. |
| **Feed wrap** | Border `hsl(270, 15%, 14%)`, bg `hsl(270, 10%, 8%)` | `#pg-dev .dev-feed-wrap`. |
| **Toggle (inactive)** | Border `hsl(270, 15%, 14%)`, bg `hsl(270, 10%, 10%)`, text `hsl(270, 20%, 45%)` | `#pg-dev .dev-view-toggle`, `.dev-view-toggle-btn`. |
| **Toggle (hover inactive)** | Bg `hsl(270, 15%, 14%)`, text `hsl(270, 25%, 55%)` | `.dev-view-toggle-btn:hover:not(.active)`. |
| **Toggle (active)** | Bg `hsl(270, 40%, 12%)`, text `var(--p)` | `.dev-view-toggle-btn.active`. |
| **Board summary/cols/cards** | Borders `hsl(270, 15%, 14%)`, cell/card bg `hsl(270, 10%, 6%)` / `hsl(270, 10%, 10%)`, card hover border `hsl(270, 20%, 22%)` | Board view containers and cards. |
| **Entity rail active** | `var(--p)`-family (existing entity purple) | `.dev-panel-entity .dev-rail-btn.active` (unchanged; meaning color). |

Card meta and data text stay grey (`var(--d3)`, `var(--d)`). Board column headers keep stage/meaning colors (green, amber, etc.); not overridden by purple.

---

## Toggle: style, size, comparison to header buttons

- **Style:** Compact horizontal 1×2: two buttons side by side, touching, no gap. Single outer border; divider between buttons. Text: “FEED” and “BOARD”, 10px Inconsolata, uppercase. Active: purple tint bg + `var(--p)` text.
- **Size:** Height **18px** (matches header MIN toggle). Each button **28px × 18px** (nearly square). Total width ~56px + border.
- **Comparison:** Header MIN toggle is 32×18px (one control, sliding knob). DEV toggle is two 28×18px cells, same height as MIN and same family (Inconsolata, no radius, hard edges). Slightly narrower per cell to fit label text; feels like the same “bar” family.

---

## Click on/off (rail buttons)

- **Behavior:** Clicking a rail button toggles that option. If it was active, it is turned off (removed from the selection). If it was inactive, it is turned on (added). Multiple buttons per rail can be active (multi-select).
- **Implementation:** `devStage` / `devType` / `devEntity` are arrays. Setters `setDevStage(key)`, `setDevType(key)`, `setDevEntity(key)` toggle membership (indexOf + splice or push). `fillRail` uses `currentValues.includes(entry.key)` for `.active`. So click-on/click-off works on all three rails.

---

## Escape (textarea focused)

- **Behavior:** Escape clears all three rail selections (stage, type, entity) and re-renders, regardless of focus. It does not blur the textarea or call `preventDefault`.
- **Implementation:** In `render.js`, the Escape handler only checks `e.key === 'Escape'` and that `#pg-dev` is visible, then sets `devStage = []`, `devType = []`, `devEntity = []` and calls `renderDevPage()`. There is no check for `document.activeElement === devText`. Confirmed: works while textarea is focused.

---

## Enter (submit note)

- **Behavior:** Enter (without Shift) submits the note (same as clicking +). Shift+Enter can insert a newline in the textarea.
- **Implementation:** `dev-composer-row` has `onkeydown="devComposerKeydown(event)"`. `devComposerKeydown` (app.js) on Enter with `!event.shiftKey` and no modifier calls `event.preventDefault()` and `addDevNote()`. So Enter from textarea or from any focused element in the row (e.g. after selecting meta) submits. Confirmed.

---

## Feed scroll (no scroll-in-scroll)

- **Behavior:** Feed is one continuous document; the page scrolls, not an inner box.
- **Implementation:** `.dev-feed-wrap` has no `max-height` and no `overflow-y`. It has only border, background, and margin-top. Confirmed: `max-height` and `overflow-y` are not set on `.dev-feed-wrap`.

---

## Board: count bar, uniform cards, multi-select

- **Count bar hidden:** The stage count row and “Total: N” are no longer rendered in board view. Board HTML is now `dev-board-wrap` → `dev-board-cols` → columns only (no `dev-board-summary-row` or `dev-board-summary-total`).
- **Uniform card height:** `#pg-dev .dev-board-card` has `min-height: 80px` and flex column layout. `.dev-board-card-text` has `-webkit-line-clamp: 3`, `line-clamp: 3`, `overflow: hidden`, `text-overflow: ellipsis`, plus `flex: 1` and `min-height: 0` so extra space is in the text block and overflow is truncated. Cards are uniform height; meta stays below text.
- **Multi-select filtering:** Filter logic: show notes that match **(any active entity)** AND **(any active type)** AND **(any active stage)**. If a rail has no active buttons (`length === 0`), that dimension does not filter (show all). Code: `if (devEntity.length > 0) filtered = filtered.filter(n => devEntity.includes(n.entity || ''));` and similarly for `devType` and `devStage`. Confirmed.

---

## Multi-select: compose vs filter (dual behavior)

- **Filtering (board and feed):** Multi-select is used as combinable filters. Multiple active values per rail are OR within the rail; across rails they are AND. Empty rail = no filter on that dimension.
- **Compose (tagging a note):** A note still stores a single `stage`, `type`, and `entity`. When submitting via `addDevNote()`, the app uses the **first** selected value from each rail: `devStage[0]`, `devType[0]`, `devEntity[0]`, or `''` if the array is empty. So multi-select is for filtering/viewing; the stored note always has at most one value per dimension, taken from the first selected option on each rail. If no option is selected on a rail, that dimension is stored as `''` (note can have no tags). No separate “compose mode” vs “filter mode”: same rails, filter = multi-select, compose = first selected.

---

## Summary table

| Item | Status |
|------|--------|
| Purple identity (panel bg, border, button text, labels, toggle) | Implemented; values above. |
| Toggle: compact horizontal, bar-button size | 18px height, 28×18px per cell, FEED/BOARD. |
| Click on/off on all three rails | Toggle on/off + multi-select. |
| Escape clears rails when textarea focused | No skip; clears arrays and re-renders. |
| Enter submits note | Row keydown; Enter → addDevNote(). |
| Feed: no max-height/overflow-y on .dev-feed-wrap | Removed; page scrolls. |
| Board: count bar hidden | Removed from board HTML. |
| Board: uniform card height | min-height 80px, line-clamp 3, ellipsis. |
| Board: multi-select filtering | Arrays; AND across rails, OR within rail; empty = no filter. |
| Multi-select vs compose | Filter = multi-select; compose = first selected (one value per field stored). |
