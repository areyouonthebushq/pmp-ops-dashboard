# Spatial & Size Spec

**Status:** Canonical reference — defines the spatial rules of PMP OPS: width, density, typography, control sizing, and what size means.

**Based on:** `docs/spatial-size-audit.md` (exhaustive CSS/HTML audit), `docs/spatial-surface-families.md` (family definitions).

**Related:** `docs/button-language-spec.md` (control categories), `docs/STYLE-NORMALIZATION-PLAN.md` (phase implementation), `docs/engine-language-guide.md` (ENGINE-specific language).

---

## 1. Executive Summary

PMP OPS is a factory operations console. Its spatial language should feel like **industrial instrumentation** — every surface has a defined footprint, every control has a predictable size, every piece of text has a clear role in the hierarchy. Nothing stretches aimlessly. Nothing crowds unnecessarily.

The product optimizes for:

- **Containment** — every surface knows how wide it should be and stays there. Contained surfaces feel deliberate. Unconstrained surfaces feel like spreadsheets.
- **Scan speed** — operators should find the information they need without their eyes drifting across empty space or hunting through dense walls of equal-weight text.
- **Attention hierarchy** — size tells the user what matters. Big numbers are signals. Small labels are context. Medium text is data. This hierarchy must be consistent across every surface.
- **Muscle memory** — controls, inputs, and buttons should be the same size in the same role everywhere. A standard input is always 34px. A toolbar button is always `bar-btn` size. An icon close button is always 30px.
- **Density appropriate to task** — consoles are tight because the user is focused. Boards are medium because the user is scanning. Instruments are dense because the user is monitoring. Workbenches are comfortable because the user is editing.

### What the spatial language is NOT

- Not a marketing layout system. No hero sections, no editorial grids, no whitespace-for-beauty.
- Not a responsive-first system. PMP OPS runs primarily on desktop/tablet in a factory. Mobile is accommodated, not optimized for.
- Not pixel-perfect. The spacing tokens (4/8/12/16px) provide rhythm. Surfaces round to the nearest token, not to arbitrary values.

---

## 2. Canonical Surface Families

Six families. Each answers a different operational question and carries a different spatial contract.

### CONSOLE — "What am I doing right now?"

Single-task, input-heavy, vertically stacked.

| Rule | Value |
|------|-------|
| Max-width | `380–520px` (narrow) or `980px` (wide/prose variant) |
| Alignment | Left-aligned within page (narrow). Centered (wide). |
| Containment | Bordered box: `1px solid var(--b2)`, `background: var(--s1)` |
| Internal padding | `12px 16px` |
| Section rhythm | `Special Elite` section labels, `1px var(--b1)` bottom borders, `8px` vertical gaps |
| Row/feed density | `8px` padding per entry. High density. Minimal whitespace. |
| Typography | Body 12–14px. Section labels 11px with 2px letter-spacing. Feed entries 12–13px. |

**Members:** LOG (380px), NOTES (520px), DEV (980px wide variant).

**When to use this family:** The user is performing a single task — logging production counts, writing a note, reading an event feed. The surface should feel like a dedicated instrument in a rack.

---

### BOARD — "What does the whole picture look like?"

Multi-object, table-driven, scan-optimized.

| Rule | Value |
|------|-------|
| Max-width | `1200px` |
| Alignment | Centered (`margin: 0 auto`) when constrained; full-width below breakpoint |
| Containment | None — the table IS the page. No border box wrapping. |
| Toolbar | Search left, actions right. Filter dropdown adjacent to search. Flex-wrap row. |
| Row density | `8px 12px` cell padding → ~34px row height |
| Column typography | Identity: 13px bold. State: 11–12px pills. Support: 11px muted. |
| Horizontal rhythm | Identity columns left (may have tinted background). State columns center. Support columns right. |

**Members:** FLOOR, JOBS, SHIP, CREW, AUDIT.

**When to use this family:** The user needs to see 10–50 objects simultaneously, scanning left-to-right across structured columns. The board is the manifest view of the factory.

**Board max-width rule:** All boards MUST have `max-width: 1200px; margin: 0 auto`. This is the single highest-leverage spatial change in the app. It prevents table-stretch on wide monitors, maintains full content on laptops, and centers the user's eye. This has not yet been implemented.

---

### INSTRUMENT — "Is the machine alive?"

Metric-grid, read-primary, telemetry surface.

| Rule | Value |
|------|-------|
| Max-width | `660px`, centered |
| Containment | Console box with `1px var(--b2)` border, `box-shadow`, inner grid |
| Block shape | `aspect-ratio: 1` (square) |
| Grid | `4 × 2` with `1px` gaps |
| Value typography | 30–36px bold green |
| Label typography | 9px, 1.5px letter-spacing, muted |
| Period selector | Small text strip, right-aligned, outside/below the console box |

**Members:** ENGINE.

**When to use this family:** The user needs an at-a-glance status read of the factory — throughput, yield, movement, output. The surface should feel like an engine-room gauge cluster.

---

### LIBRARY — "What do we have?"

Catalog-browse, card-based, reference surface.

| Rule | Value |
|------|-------|
| Max-width | `980px`, centered |
| Containment | Bordered box: `1px solid var(--b2)`, `background: var(--s1)` |
| Card layout | Stacked vertical list with `1px` gaps |
| Card typography | Name: 14px bold. Number: 12px muted. Notes: 12px muted. |
| Toolbar | Same pattern as boards — search left, add right |

**Members:** PVC (Compound Library).

**When to use this family:** The user is browsing a catalog of reference entities that exist in the system (compounds, materials, templates). Not a work queue — a reference shelf.

---

### WORKBENCH — "Let me edit this one thing."

Single-object editing, docked or overlaid, always secondary to a parent surface.

| Rule | Value |
|------|-------|
| Max-width | Varies: 320–640px by content need |
| Position | Right-docked (RSP) or centered overlay (everything else) |
| Containment | Solid background, bordered, entry animation |
| Form inputs | Standard tier: 34px height. Compact tier: 28px. Micro tier: 24px. |
| Form layout | 2-column grid for label+value rows. `8–12px` vertical gaps. |
| Object identity | 18px `Special Elite` at top |
| Action footer | Sticky bottom bar. CANCEL left, primary COMMIT right. |
| Dismiss | `✕` icon, Escape key, backdrop click |

**Members:** RSP (640px), Card Zone (560px), wizards (420px), modals (320–480px), Floor Card (900px read-primary).

**When to use this family:** The user has selected one object and needs to inspect or edit it. The workbench is never the page — it layers on top of the page.

**Width decision rule:** A workbench's max-width should be the minimum needed to render its content without scroll or cramping:
- Small form (2–4 fields): 320–420px
- Medium form (5–12 fields, 2-column): 420–560px
- Rich form (scrolling body, icon zone, many sections): 560–640px
- Statboard (large display + optional edit): 900px

---

### STATION — "I am standing at this machine."

Full-screen, single-workflow, factory-floor kiosk.

| Rule | Value |
|------|-------|
| Max-width | `900px` (standard) / `1200px` (wide variant) |
| Position | Fixed full-screen, replaces app |
| Background | Clean `var(--bg)` fill, centered inner container |
| Control density | Larger than standard: numpad rows at 56px, reject buttons at 56px min-height |
| Touch targets | Minimum 48px for any tappable control |
| Typography | Station name: 18px `Special Elite`. Display numbers: 48px+. Data: 14px. |
| Back affordance | `← BACK` in header, returns to launcher |

**Members:** Press Station (900px), QC Station (900px), Floor Manager (1200px).

**When to use this family:** The user is physically at a machine on the factory floor. The surface replaces the entire app with a single-purpose interface. All controls must be usable with factory gloves.

---

## 3. Canonical Width Rules

### When to constrain

**Always constrain.** No surface in PMP OPS should stretch indefinitely. The question is how wide, not whether.

| Scenario | Max-width | Rationale |
|----------|-----------|-----------|
| Console with numpad | `380px` | One-hand operation |
| Console with text feed | `520px` | Comfortable line lengths for prose |
| Console with prose/code | `980px` | Long-form reading |
| Instrument grid | `660px` | Proportional 4×2 square blocks |
| Library catalog | `980px` | Card-width browsing |
| Board / manifest | `1200px` | Prevents column-drift while remaining full-width on laptops |
| Workbench panel | `640px` | Form-appropriate. Board behind remains partially visible. |
| Workbench overlay | `320–560px` | Content-driven. See sizing rule above. |
| Station | `900–1200px` | Centered instrument, readable from arm's length |

### When full-width is appropriate

Only two cases:
1. **TV mode** — full viewport is correct for a wall-mounted ambient display.
2. **Factory station** — full-screen because it replaces the app, though the inner container is still constrained.

No content page should ever be unconstrained.

### Centering rule

- **Centered** (`margin: 0 auto`): boards, instruments, libraries, wide consoles, stations, overlays.
- **Left-aligned** (within page padding): narrow consoles (LOG, NOTES). Left-alignment anchors the user's eye at a known starting position rather than centering a small box in a large page.

---

## 4. Canonical Control Size Rules

### Input fields — three tiers

| Tier | Height | Padding | Font | Where |
|------|--------|---------|------|-------|
| **Standard** | ~34px | `8px 12px` | 14px | RSP forms, wizards, page-level filters, NOTES composer |
| **Compact** | ~28px | `6px 8px` | 12–13px | Inline editing, Floor Card quick-edit, inline dropdowns |
| **Micro** | ~24px | `4px` | 12px | Pack Card detail fields, press card dropdowns, import review |

**Rule:** Standard tier is the default. Use Compact for inline/in-table editing. Use Micro only inside dense overlay cards where space is very constrained. Never mix tiers within the same form group.

### Buttons — four tiers

| Tier | Min-height | Padding | Font | Role |
|------|------------|---------|------|------|
| **Primary** (`btn`) | 38px | `8px 16px` | 14px/700 | COMMIT, ADD, DESTRUCTIVE in form footers |
| **Utility** (`bar-btn`) | ~28px | `4px 12px` | 11px | Toolbar actions, filter buttons, note buttons |
| **Icon** | 30px × 30px | 0 | 16px | Close, star, ACHTUNG, edit, pack |
| **FAB** | 52px × 52px | 0 | 26px | Floating add button |

**Rule:** Primary buttons appear at the bottom of forms/wizards/cards, never in toolbars. Utility buttons appear in toolbars, never as the final commit action. Icon buttons must be 30×30px everywhere except station contexts where 36×36px is acceptable for touch targets.

**Close button normalization:** All close buttons (`panel-close`, `cz-close`, `floor-card-close`, `eng-detail-close`, overlay close buttons) should normalize to 30×30px with consistent styling: `font-size: 16px`, `cursor: pointer`, `color: var(--d3)`, no explicit border. The current range (30–36px, varying border treatments) should converge.

### Dropdowns — two tiers

| Tier | Padding | Font | Where |
|------|---------|------|-------|
| **Page-level** | `8px 12px` | 13px | Page toolbars (filter, sort, job select) |
| **Inline** | `3px 8px` | 12px | In-table controls (fulfillment phase, press card selects) |

**Rule:** Page-level dropdowns sit in toolbars. Inline dropdowns sit inside table rows or card detail areas. Do not use page-level sizing for inline controls or vice versa.

---

## 5. Canonical Typography Rules

### Font-family roles

| Family | Role | Where |
|--------|------|-------|
| `'Inconsolata', monospace` | **Operational text** — all data, controls, inputs, feeds, tables, pills, buttons, metrics | Everywhere by default |
| `'Special Elite', cursive` | **Identity / hierarchy** — section titles, page names, object names, station names | Marks important structural moments |
| `'VT323', monospace` | **Diagnostic accent** — form section numbers only | Used very sparingly for technical texture |

**Rule:** Inconsolata carries all operational weight. Special Elite appears only at identity/hierarchy moments (page name, section title, object ID, station name). VT323 appears only in form section numbers. No other font families. No font-family decisions per-surface — this is a system-level rule.

### Size tiers

Five tiers, from smallest to largest. Every text element should belong to exactly one tier.

| Tier | Size range | Letter-spacing | Role | Examples |
|------|-----------|----------------|------|----------|
| **Micro** | 8–9px | 1.5px | Notation, accents, block labels | ENGINE block labels, asset row labels, pack detail labels, compare toggles |
| **Small** | 10–11px | 1–2px | Secondary text, badges, section labels | Section labels, stat labels, mode badges, feed meta, toolbar hints, pill text |
| **Body** | 12–14px | 0–1px | Primary data, inputs, feeds, tables | Table cells, feed entries, input values, button labels, compound names |
| **Title** | 15–18px | 2–3px | Section headings, object names, overlay titles | `.sec` headings, panel ID, press card names, station names, wizard titles |
| **Display** | 28–48px | 0–4px | Hero numbers, stat values, metrics | ENGINE values, stat row values, LOG numpad, TV clock |

**Rule:** There is no "large heading" tier between Title (18px) and Display (28px). This is correct — PMP OPS does not need editorial headings. The hierarchy jumps from section identity to hero numbers.

### Line-height

Two values. That is all.

| Value | Where |
|-------|-------|
| `1.0` | Display numbers, metric values, stat values — eliminates above-cap space |
| `1.35` | All text content — body, labels, feeds, inputs, section titles |

**Rule:** If the text is a big number meant to be read as a signal, use `line-height: 1`. If it is anything else, use `line-height: 1.35`. The current range (1.2, 1.3, 1.35, 1.4) should converge to 1.35.

### Letter-spacing hierarchy

Letter-spacing is PMP OPS's strongest implicit hierarchy signal. Wider spacing = more structural/label-like. Tighter spacing = more data-like.

| Spacing | Role | Examples |
|---------|------|----------|
| `0–0.5px` | Data text, values, metric numbers | Table cell content, input values, compound pills, progress numbers |
| `1px` | Active labels, buttons, pill text | Button labels, feed meta, bar buttons, status pills |
| `1.5px` | Structural labels | Asset/pack labels, ENGINE block labels, section sub-labels |
| `2px` | Section titles, navigation | `.sec` titles, mode badges, stat labels, nav items, uppercase labels |
| `3–4px` | Page-level identity | Page section titles, ENGINE header, ship title |

**Rule:** Preserve this hierarchy. It is one of the most coherent design decisions in the app. Do not flatten letter-spacing to one value. The gradient from 0 (data) to 4 (identity) is load-bearing.

---

## 6. Attention / Hierarchy Rules

Size communicates meaning. Every size decision should answer: "What does the user need to see first?"

### What should feel PRIMARY (largest / boldest / brightest)

| Signal | Size range | Color | Rationale |
|--------|-----------|-------|-----------|
| **Hero metric** (QPM, stat values) | 28–36px | `var(--g)` green | The north-star number. Nothing else competes. |
| **Display number** (LOG numpad, TV clock) | 42–48px | Context-colored | The user is physically focused on this number right now. |
| **Object identity** (catalog number in table row) | 13px bold | `var(--w)` amber | The first thing the eye finds in a table row. Bold + color does the work, not size. |

### What should feel SECONDARY (medium / regular weight / standard color)

| Signal | Size range | Color | Rationale |
|--------|-----------|-------|-----------|
| **Data values** (table cells, feed text) | 12–14px | `var(--d)` or `var(--d2)` | The working layer. Readable but not demanding. |
| **Input values** | 14px | `var(--d)` | Matches body tier. User-entered content should not shout. |
| **Status pills** | 11–12px | Per-status color | Small but color-differentiated. Color does the hierarchy work. |

### What should feel TERTIARY (smallest / muted / quiet)

| Signal | Size range | Color | Rationale |
|--------|-----------|-------|-----------|
| **Section labels** | 10–11px | `var(--d3)` | Structural scaffolding. Not data. Should be visible but never competing. |
| **Feed meta** (timestamps, authors) | 11px | `var(--d2)` or `var(--d3)` | Context for an entry, not the entry itself. |
| **Block labels** (ENGINE, pack detail) | 9px | `var(--d3)` | The label names the gauge. The number IS the gauge. |

### What size should NOT communicate

- **Importance via font-size alone.** Color and weight carry more meaning than size in PMP OPS. A 13px amber bold catalog number is more primary than a 15px regular-weight gray section title.
- **Decorative scale.** No hero banners, no display-size page titles, no text larger than it needs to be for readability at the expected viewing distance.
- **Editability.** Standard 14px inputs in a 34px field is the universal editable signal. Do not change input size to indicate importance.

### Warning / live signal sizing

| Signal | Treatment | Size |
|--------|-----------|------|
| **ACHTUNG pulse** | Symbol + animation, not size increase | Same size as surrounding text. Pulse carries the attention. |
| **Caution border** | `3px solid amber` left border on row | Border width (3px) is the attention device, not text size. |
| **ENGINE hot metric** | Subtle glow + accent color | Same block size. Role-colored border does the work. |
| **Active filter** | Green highlight on active stat block | Same text size. Color does the work. |

**Rule:** Attention signals in PMP OPS should use color, animation, and border — not size increases. Inflating text to signal urgency breaks the spatial rhythm. The exception is Display-tier numbers (stat values, ENGINE metrics), which are already large and communicate significance through their permanent size, not a temporary increase.

---

## 7. Space Utilization Rules

### How to decide if a page is too wide

A board surface is too wide when:
- The user's eye must travel more than ~30cm (roughly 1100–1200px at typical zoom) to scan from the first column to the last column of a table row.
- Gutters between table columns exceed the width of the narrowest data column.
- Empty space exceeds data space in a row.

**Fix:** Apply `max-width: 1200px; margin: 0 auto;`.

### How to decide if a page is too narrow

A surface is too narrow when:
- Table columns truncate essential content on standard laptop screens (1280–1440px).
- Form inputs require horizontal scrolling.
- Two-column form layout breaks into single-column at normal width.

**Diagnosis:** This is currently not a problem in PMP OPS. The tightest surface (LOG at 380px) is deliberately compact and works correctly. No surface is underserving its content.

### How to decide if a page is too dense

A surface is too dense when:
- Adjacent controls are indistinguishable without careful focus.
- Text overlaps or truncates in a way that loses meaning.
- Touch targets are below 44px on a surface used on touch devices.

**Current concern:** Pack Card detail rows (9px labels, 24px micro-inputs, tight padding) are at the lower bound of comfortable density. They are acceptable for a desktop-only expert overlay but would fail on a tablet.

### How to decide if a page is too loose

A surface is too loose when:
- Row height exceeds 44px for simple single-line data in a board table.
- Vertical whitespace between feed entries exceeds the height of the entries themselves.
- The user must scroll to see information that should be visible at once.

**Current concern:** SHIP and CREW tables use `12px 12px` padding (~40px rows) while Floor/Jobs use `8px 12px` (~34px rows). The SHIP/CREW density should tighten to match Floor/Jobs. Board tables should have one row density.

### Screen real estate philosophy

PMP OPS is not a consumer app that needs breathing room. It is a factory console. The screen real estate philosophy is:

1. **Every pixel serves a purpose.** If space is empty, it should be intentional containment (console margins, centered page), not accidental overflow (unconstrained table stretch).
2. **Constrain first, expand only if the content requires it.** Start with the narrowest comfortable width for the content type. Only widen if adding columns, blocks, or sections that genuinely need the space.
3. **Density should match the task.** Logging events (console) is dense. Scanning a manifest (board) is medium. Editing a record (workbench) is comfortable. Monitoring metrics (instrument) is dense. There is no single "correct" density — there is correct density per task.

---

## 8. Exceptions That Should Stay

These are deliberate spatial exceptions that violate a general rule for good reasons. Do not normalize them.

### 1. DEV terminal at 980px

DEV is a console but uses library-width (980px) because dev notes are prose-heavy and benefit from longer line lengths. This is a correct exception. If DEV gained structured data, it should narrow.

### 2. Floor Manager station at 1200px

All other stations are 900px. Floor Manager is wider because it includes a stat overview + full table that needs board-family room. Correct exception.

### 3. LOG numpad at 380px (not 360px)

The LOG shell is 380px while the inner console is 360px. The 20px difference accommodates shell padding. This is fine — the visual width is consistent.

### 4. Floor Card at 900px

Most workbenches are 320–640px. Floor Card is 900px because it displays a statboard with progress bars, large typography, and multiple data zones. It is a read-primary workbench that needs the room.

### 5. ENGINE blocks at aspect-ratio: 1

No other surface uses `aspect-ratio` enforcement. ENGINE blocks are squares because they represent gauges. This is an intentional instrument-family decision. Do not make them rectangular.

### 6. TV typography at 16–42px

TV mode uses larger text than any other surface because it is designed for wall-mounted viewing at 3–10 meters. This is a correct exception. TV is its own surface family.

### 7. Station touch targets at 56px

Stations use larger controls (56px numpad rows, 56px reject buttons) than desktop surfaces. This is correct for factory-floor use with gloves. Do not tighten station controls to match desktop sizes.

### 8. LOG faceplate grid (no gaps)

The LOG numpad uses a 0-gap grid where buttons fill their cells entirely. This is deliberate — the faceplate should feel like a physical calculator. Do not add gaps.

---

## 9. Ranked Normalization Opportunities

Ordered by leverage — the change that improves the most surfaces with the least risk is first.

### Rank 1: Board max-width (CRITICAL)

Add `max-width: 1200px; margin: 0 auto` to FLOOR, JOBS, SHIP, CREW, AUDIT.

- **Impact:** Fixes the single biggest spatial issue in the app. Five surfaces immediately gain containment.
- **Risk:** Low. No content is lost — 1200px accommodates all current column sets on laptop and desktop.
- **Files:** `styles.css` — one shared rule or five individual rules.

### Rank 2: Board row density normalization

Normalize SHIP and CREW table row padding from `12px 12px` to `8px 12px`, matching Floor/Jobs/Audit.

- **Impact:** Boards feel like one family. More rows visible per screen on SHIP and CREW.
- **Risk:** Low. The 4px vertical padding change is cosmetic.
- **Files:** `styles.css` — `.ship-tbl`, `.crew-tbl`.

### Rank 3: Close button normalization

Normalize all close/dismiss icon buttons to 30×30px with consistent styling.

- **Impact:** Workbench-family overlays feel unified. One less thing that drifts.
- **Risk:** Low. Verify touch targets remain adequate on tablet.
- **Files:** `styles.css` — `.panel-close`, `.cz-close`, `.floor-card-close`, `.eng-detail-close`.

### Rank 4: Line-height convergence

Replace all line-height values (1.2, 1.3, 1.35, 1.4) with two canonical values: `1.0` for display numbers, `1.35` for everything else.

- **Impact:** Subtle but systemic. Text rhythm becomes consistent across surfaces.
- **Risk:** Low. Verify no layout shifts from the ~0.05 difference.
- **Files:** `styles.css` — targeted selectors.

### Rank 5: Typography tier tokens

Add CSS custom properties for the five typography tiers:

```css
:root {
  --type-micro: 9px;
  --type-small: 11px;
  --type-body: 13px;
  --type-title: 15px;
  --type-display: 30px;
}
```

- **Impact:** Establishes a formal scale. Future surfaces pull from tokens instead of choosing ad-hoc values.
- **Risk:** Low if applied incrementally. Do not migrate all selectors at once.
- **Files:** `styles.css` — `:root` first, then gradual adoption.

### Rank 6: Spacing variable extension

Extend the spacing system from 4 tokens to 6:

```css
:root {
  --space-2xs: 2px;   /* micro gaps, dense grid */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  12px;
  --space-lg:  16px;
  --space-xl:  24px;   /* section separation */
}
```

- **Impact:** Covers the two missing ends of the scale — the 1–2px micro gaps (ENGINE grid, import review) and the 24px section separations that currently use `var(--space-lg)` plus ad-hoc margins.
- **Risk:** Low. Additive only.
- **Files:** `styles.css` — `:root`.

### Rank 7: Breakpoint vocabulary

Define named breakpoints to replace ad-hoc per-surface media queries:

```css
/* Compact: phones, small tablets */
@media (max-width: 480px)  { ... }
/* Medium: large tablets, narrow laptops */
@media (max-width: 768px)  { ... }
/* Standard: laptops, average desktops */
@media (max-width: 1024px) { ... }
/* Wide: large desktops, ultrawide */
@media (max-width: 1440px) { ... }
```

- **Impact:** Replaces the current 480/600/800/900px ad-hoc breakpoints with a coordinated vocabulary. New surfaces can target named breakpoints instead of inventing values.
- **Risk:** Medium. Changing existing breakpoints may shift mobile layout. Implement as new convention for new CSS; migrate existing breakpoints gradually.
- **Files:** `styles.css` — `:root` or documentation-first.

### Rank 8: Input size tier tokens

Add CSS custom properties for the three input size tiers:

```css
:root {
  --input-standard: 34px;
  --input-compact:  28px;
  --input-micro:    24px;
}
```

- **Impact:** Codifies the implicit three-tier system. New forms reference tokens instead of guessing.
- **Risk:** Low. Additive.
- **Files:** `styles.css` — `:root`.

### Rank 9: Icon button size normalization

Normalize icon buttons to two tiers: 30px (standard desktop) and 36px (touch/station contexts). Remove the current 32px and implicit-height variants.

- **Impact:** Small visual cleanup. Consistent hit targets across overlays.
- **Risk:** Low. Verify no icon-text alignment issues after resize.
- **Files:** `styles.css` — `.cz-close`, `.eng-detail-close`, others.

### Rank 10: Overlay background normalization

Choose one overlay background convention. Currently split between `var(--b2)` (Card Zone, Floor Card, Progress Detail) and `var(--s1)` (wizards, confirms, ENGINE detail).

- **Impact:** Subtle. Overlays feel like one family.
- **Risk:** Very low. Pick one value and apply.
- **Recommended:** `var(--s1)` for all overlays — it is the lighter value and matches the console/shell background, creating a natural "same-level" feel for content surfaces. Reserve `var(--b2)` for backdrops/scrims only.
- **Files:** `styles.css`.

---

## 10. Docs To Update

After implementing the normalization opportunities above, the following docs should be updated:

| Document | What to update |
|----------|---------------|
| `docs/STYLE-NORMALIZATION-PLAN.md` | Incorporate board max-width, row density, close buttons, and typography tokens into the phase plan. May need a Phase 4 or merge into existing phases. |
| `docs/button-language-spec.md` | Cross-reference the canonical control size tiers defined here. Section 5 (Color/Style Rules) can reference this spec for spatial details. |
| `docs/spatial-surface-families.md` | Mark as superseded-by or companion-to this spec, since this spec now includes family definitions with normalization rules. |
| `docs/spatial-size-audit.md` | No changes needed — the audit is the evidence base. This spec is the prescription. |
| `docs/INFORMATION-ARCHITECTURE.md` | Update the surface taxonomy section to reference the six canonical families. |
| `docs/engine-language-guide.md` | Cross-reference the Instrument family spatial rules for ENGINE-specific terminology. |

### Documents this spec supersedes

None. This spec is new. It is the spatial companion to `docs/button-language-spec.md` (interaction rules) and `docs/achtung-protocol.md` (exception rules).

### Recommended implementation order

1. Board max-width (Rank 1) — immediately impactful, low risk
2. Board row density (Rank 2) — pairs naturally with #1
3. Close button normalization (Rank 3) — pairs with existing style normalization phases
4. Typography + spacing tokens (Rank 5, 6) — foundation for future consistency
5. Everything else — as surfaces are touched for other reasons, apply the canonical rules
