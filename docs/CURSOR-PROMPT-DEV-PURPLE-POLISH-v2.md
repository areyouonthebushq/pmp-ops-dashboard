# Cursor Prompt — DEV Page Polish: Purple Identity + Quick Fixes (Updated)

**Status:** Implemented. Report filled in below.

**Mode:** CSS, JS (minor behavior fixes), HTML (minor). Do not change persistence or data model.

**Design direction:** DEV is the backstage. Purple identity. Console discipline. GET_PHYSICAL protocol. Refer to `docs/GET-PHYSICAL-PROTOCOL.md` for doctrine.

**Reference:** `styles.css`, `core.js`, `render.js`, `index.html`.

---

## PART 1 — Purple identity

1. **Console rail text (all three rails):** Default unselected button text = muted grey (`var(--d2)` or similar). Selected/active button text = **purple** (`var(--ept)` / `#d4b8f0` or `var(--p)`). No underline on selected. No underline anywhere. Active state = purple text, no background change or subtle background only. The selection should feel like the word lights up, not like a button gets pushed.

2. **Three rails, not two.** Confirm three distinct rails are visible in the console: ENTITY, TYPE, STAGE. All three should be present and follow the same treatment: default grey text, selected purple text, no underlines, no heavy borders.

3. **Textarea border/glow when focused:** Currently green. Change to **purple** on the DEV page. The selected/focused textarea border should use `var(--p)` or a muted purple instead of green.

4. **FEED/BOARD toggle:** Remove the words. The toggle should be **two small wordless squares** side by side — one for feed mode, one for board mode. Active square fills with purple. Inactive square stays dark/muted. No text labels. Size should match header utility buttons. Think MIN toggle but with squares instead of circles. Compact, not decorative.

5. **Board view (kanban):** Purple themed. Column header text = purple. Card border on hover = purple tint. Stage-specific colors (green progression for stages, amber for SHOP) can stay on the column header *background*, but the header *text* should be purple for consistency. If that clashes, keep white/dark text on the colored background but add a purple top-border accent to each column.

6. **PMP OPS title and login role label** (e.g. "Admin" in the header): When on the DEV page, these should be **purple**. When on other pages, they stay green/default. This is a per-page override, scoped to `#pg-dev` being active (or however the app signals which page is showing). If this is too complex, skip for now and just do the console + textarea + toggle.

---

## PART 2 — Mobile Enter/Return behavior

7. **On mobile (touch devices / narrow viewport):** The Enter/Return key in the DEV textarea should **advance to a new line** (insert a line break), not submit the note. Submission on mobile should require tapping the `+` button.

8. **On desktop:** Keep current behavior — Enter submits the note, Shift+Enter adds a new line.

9. Detection: Use viewport width (e.g. `≤720px`) or `'ontouchstart' in window` to distinguish. Prefer viewport width since it's simpler and matches the existing `@media (max-width: 720px)` breakpoint in styles.css.

---

## PART 3 — Rail button styling (from playground feedback)

10. **No heavy button borders on rail buttons.** The buttons in the three rails should feel more like a **grid of words** than a grid of bordered boxes. Options (pick whichever looks cleanest and most readable):
    - Remove borders entirely (transparent border) — words float in a spatial grid
    - Or keep a very subtle 1px border in `var(--b1)` or darker — barely visible, just enough to define the cell without competing with the text

11. **All button text same visual weight.** Unselected = grey, uniform. Selected = purple, uniform. No size differences between buttons. No underlines. The grid should scan evenly — no single button drawing more attention than its neighbors (unless it's active/selected).

---

## PART 4 — Click on/off, Escape, scroll fixes

12. **Click on/off for rail buttons:** Clicking an already-active button toggles it off (deselects, sets value to empty string). All three rails. A note can be submitted with no tags.

13. **Escape clears all filters** even when textarea is focused. Clear `devStage`, `devType`, `devEntity` to `''` and re-render. Do not blur the textarea.

14. **Feed: no scroll-inside-scroll.** Remove `max-height` and `overflow-y: auto` from `.dev-feed-wrap`. The feed renders at full height; the page scrolls. Continuous document feel.

---

## PART 5 — Board view refinements

15. **Hide summary count bar** in board view.

16. **Uniform card size.** Fixed min-height per card (e.g. 80px). Truncate overflow. Console readout feel.

17. **Multi-select on rails for filtering.** Click toggles each button independently. Multiple active per rail. Filter = show items matching any active value per rail. No active buttons = show all (same as Escape). Compose still uses the most recently clicked single value per rail when submitting a note.

---

## Constraints

- Scope to `#pg-dev`. No other page changes.
- Do not change persistence or data model.
- Board column stage backgrounds keep their meaning colors (green/amber/neutral). Purple is for text and chrome, not for overriding semantic stage colors.
- Card meta stays grey. Purple is identity, not data.
- No underlines anywhere on the DEV page controls.

---

## After patching, report:

1. **Exact files changed.** `styles.css`, `index.html`, `app.js`, this doc.
2. **Purple values used and where.** `var(--p)` used for: rail active text (all three rails); DEV textarea focus border (`#pg-dev .dev-textarea:focus`); toggle active fill (existing); board column header text and top-border; bar logo and mode badge when DEV page is visible (`#app:has(#pg-dev.on)`).
3. **Toggle:** Wordless two squares; button text removed, `aria-label` kept for accessibility. Active state = purple fill. Size matches header utility buttons (existing `.dev-view-toggle-btn`).
4. **Rails:** Three rails (ENTITY, TYPE, STAGE) visible. No underlines (border-bottom removed from active). Default = grey; selected = purple; no heavy borders (buttons use border: none).
5. **Mobile:** Enter inserts newline when `window.innerWidth <= 720`; submission via `+` only. Desktop: Enter submits, Shift+Enter newline.
6. **Click on/off:** Toggle behavior on all rails already implemented (no change).
7. **Escape:** Clears filters while textarea focused already implemented (no change).
8. **Feed scroll:** max-height/overflow-y removed from `.dev-feed-wrap` already (no change).
9. **Board:** Count bar hidden, uniform cards, multi-select filtering already done. Column header text and top-border set to purple; stage background colors kept.
10. **PMP OPS title / login label:** Purple override implemented via `#app:has(#pg-dev.on) .bar-logo` and `#app:has(#pg-dev.on) .bar-mode` (color and border-color `var(--p)` when DEV is the active page).
