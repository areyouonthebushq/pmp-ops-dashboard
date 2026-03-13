# Spatial & Size Audit

**Scope:** Every surface, control, text element, and spacing decision in PMP OPS — widths, heights, typography, density, and what size signals about meaning.

**Method:** Exhaustive inspection of `styles.css` (4142 lines), `index.html`, and rendered surface structure. Covers all 14 pages, 10+ overlays/cards, 3 station shells, and supporting UI.

---

## 1. Executive Summary

### Overall findings

PMP OPS has **three coexisting spatial philosophies** rather than one unified system:

1. **Console surfaces** (LOG, ENGINE, NOTES, DEV) — constrained-width, left-aligned, vertically stacked. These read like dedicated instruments: compact, focused, deliberate.
2. **Broad operational boards** (FLOOR, JOBS, SHIP, CREW, AUDIT) — full-width, table-driven, horizontally expansive. These read like manifests: information-dense, scan-optimized.
3. **Overlays and panels** (RSP, Card Zone, Floor Card, wizards, modals) — centered or right-docked, constrained-width, modal. These read like workbenches: focused editing surfaces.

The strongest spatial pattern is the console family — LOG, NOTES, and DEV share nearly identical containment, width constraints, and vertical rhythm. The weakest pattern is the board family — FLOOR, JOBS, SHIP, and CREW are full-width without explicit `max-width`, meaning they stretch indefinitely on wide monitors, diluting information density and scan speed.

### Strongest current spatial patterns

1. **Console containment** — LOG (`380px`), NOTES (`520px`), DEV (`980px`), and ENGINE (`660px`) all use explicit `max-width` with centered or left-aligned placement. This creates focused, instrument-grade surfaces.
2. **Spacing tokens** — The 4/8/12/16px spacing system (`--space-xs` through `--space-lg`) is applied consistently across all surfaces. No rogue spacing values in core layout.
3. **Panel slide** — RSP at `min(640px, 100vw)` is well-proportioned for a side panel. Slides from right. Correct for a workbench.
4. **Overlay family** — Card Zone (`560px`), Floor Card (`900px`), wizards (`420px`), confirm (`340px`), and ENGINE detail (`520px`) all use centered `max-width` sizing appropriate to their content density.

### Biggest inconsistencies

1. **Board surfaces have no `max-width`** — FLOOR, JOBS, SHIP, CREW, and AUDIT tables stretch to fill any screen width. On a 2560px monitor, table rows become uncomfortably wide, making cell-to-cell scanning harder.
2. **Typography lacks a formal scale** — Font sizes range from 8px to 48px across 20+ distinct values with no apparent modular scale. Sizes were chosen per-surface rather than from a system.
3. **Vertical density diverges across boards** — Floor table rows use `padding: 8px 12px`, Crew uses `padding: 12px 12px`, SHIP uses `padding: 12px 12px`. Similar data, different row heights.
4. **Two different page padding values** — All `.pg` pages use `padding: var(--space-lg)` (16px), but the contained shells (LOG, NOTES, ENGINE) add their own padding on top. Double-padding is harmless but creates slightly different effective gutters.
5. **No breakpoint system** — Media queries exist at `480px`, `600px`, `800px`, and `900px`, but they are ad-hoc per-surface rather than a coordinated breakpoint vocabulary.

---

## 2. Surface Width Audit

### Full-width (unconstrained) surfaces

| Surface | Constraint | Width behavior | Helping or hurting |
|---------|-----------|----------------|-------------------|
| **FLOOR** | None | Full parent width. Tables stretch indefinitely. | **Hurting** above ~1200px — columns drift apart, scan speed drops |
| **JOBS** | None | Full parent width | **Hurting** — same as FLOOR. The identity/state/support column hierarchy helps, but columns still spread |
| **SHIP** | None (`ship-shell` has `padding: 0`) | Full parent width | **Hurting** — 9-column table becomes sparse on wide screens |
| **CREW** | None (`crew-shell` has `padding: 0`) | Full parent width | **Hurting** — same issue. 8 columns + PFP |
| **AUDIT** | None | Full parent width | **Hurting mildly** — rarely used surface, but same table-stretch issue |
| **TODOS** | None | Full parent width | Neutral — column layout may self-constrain |

### Constrained (instrument) surfaces

| Surface | Max-width | Alignment | Helping or hurting |
|---------|-----------|-----------|-------------------|
| **LOG** (shell) | `min(380px, 92vw)` | Left-aligned within page | **Helping** — reads like a dedicated console. Compact and focused |
| **LOG** (console) | `360px` | Left-aligned | **Helping** — numpad grid stays tight |
| **NOTES** | `min(520px, 92vw)` | Left-aligned | **Helping** — feed stays readable. Comfortable line lengths |
| **DEV** | `980px` | Centered (`margin: 0 auto`) | **Helping** — comfortable for text-heavy content |
| **ENGINE** (shell) | `660px` | Centered | **Helping** — 4×2 grid of square blocks stays proportional |
| **PVC** | `980px` | Centered | **Helping** — card list stays manageable |

### Overlay/panel surfaces

| Surface | Max-width | Behavior | Appropriate |
|---------|-----------|----------|-------------|
| **RSP (panel)** | `min(640px, 100vw)` | Right-docked, full-height slide | **Yes** — proportional for form editing |
| **Card Zone** | `560px` | Centered overlay | **Yes** — good for checklist + summary content |
| **Floor Card** | `900px` | Centered overlay | **Yes** — large statboard needs room |
| **ENGINE Detail** | `520px` | Centered overlay | **Yes** — chart + bars + detail |
| **Progress Detail** | `480px` | Centered overlay | **Yes** — single-object focus |
| **Wizard** | `420px` | Centered overlay | **Yes** — single-step form |
| **Import Review** | `480px` | Centered overlay | **Yes** — table review |
| **Confirm Dialog** | `340px` | Centered overlay | **Yes** — minimal text + 2 buttons |
| **New Job Chooser** | `320px` | Centered overlay | **Yes** — small menu |
| **Duplicate Modal** | `360px` | Centered overlay | **Yes** — warning + 3 buttons |

### Station shells

| Surface | Max-width | Behavior | Appropriate |
|---------|-----------|----------|-------------|
| **Press Station** | `900px` | Centered, full-screen | **Yes** — dedicated instrument |
| **QC Station** | `900px` | Centered, full-screen | **Yes** |
| **Floor Manager** | `1200px` (`.wide`) | Centered, full-screen | **Acceptable** — needs more table room |

### Special surfaces

| Surface | Behavior | Appropriate |
|---------|----------|-------------|
| **TV** | Fixed, full viewport (`inset: 0`) | **Yes** — display board, fill screen |
| **Login** | `min(360px, 92vw)` centered | **Yes** — small auth form |
| **Launcher** | `min(380px, 92vw)` centered | **Yes** — small menu |

---

## 3. Vertical Density / Height Audit

### Row heights

| Surface | Row padding | Effective row height | Consistency |
|---------|------------|---------------------|-------------|
| **Floor table** | `8px 12px` | ~32–36px | Tight — appropriate for dense scan |
| **Jobs table** | `8px 12px` | ~32–36px | Matches Floor |
| **SHIP table** | `12px 12px` | ~38–42px | **Looser than Floor/Jobs** — inconsistent |
| **Crew table** | `12px 12px` | ~38–42px | Matches SHIP |
| **Audit table** | Default (`8px 12px`) | ~32–36px | Matches Floor/Jobs |
| **TV table** | `12px` | ~44px (larger `font-size: 16px`) | Appropriately larger for display |
| **Import review table** | `4px 8px` | ~28px | Tighter — appropriate for preview |
| **Compound cards** | `8px 12px` | ~56px (includes thumb) | Appropriate for card layout |

**Finding:** Board tables split into two density families: Floor/Jobs/Audit at `8px` vertical, and SHIP/Crew at `12px` vertical. This should be one value.

### Card heights

| Card type | Height behavior | Appropriate |
|-----------|----------------|-------------|
| **Press cards** | Auto-height, content-driven | **Yes** — variable job data |
| **Engine blocks** | `aspect-ratio: 1` (square) | **Yes** — deliberate instrument design |
| **Job cards (mobile)** | Auto-height, content-driven | **Yes** |
| **Stat blocks** | Auto-height | **Yes** — number + label |

### Feed density

| Feed | Entry padding | Line count per entry | Density |
|------|-------------|---------------------|---------|
| **LOG daily feed** | `8px` | 2 lines (primary + meta) | Tight — good |
| **NOTES feed** | `12px 0` | 2–4 lines (text + meta + tag + image) | Medium — appropriate for richer content |
| **DEV feed** | `8px 4px` | 2 lines (area + text) | Tight — good |
| **QC station log** | `8px 0` | 1–2 lines | Tight |

**Finding:** Feed density is generally consistent. NOTES is appropriately looser because entries carry more content (images, tags, longer text).

### Console density

| Console | Internal padding | Gap | Density |
|---------|-----------------|-----|---------|
| **LOG faceplate** | `12px 16px` | 0 (grid, no gaps) | **Very tight** — appropriate for numpad |
| **ENGINE grid** | `1px` gap, block padding `12px 8px` | Dense | **Good** — instrument cluster feel |
| **NOTES terminal** | `12px 16px` | `12px` between sections | **Medium** — appropriate |

---

## 4. Form Control Size Audit

### Input fields

| Control | Padding | Font size | Height | Where used |
|---------|---------|-----------|--------|------------|
| `.fi` (standard input) | `8px 12px` | 14px | ~34px | RSP form, wizards |
| `.fs` (standard select) | `8px 12px` | 14px | ~34px | RSP form, wizards, filters |
| `.fta` (textarea) | `8px 12px` | 14px | min 72px | RSP notes |
| `#notesNewText` | Same as `.fta` | Same | 38px (explicit) | NOTES composer |
| `.dev-textarea` | Same as `.fta` | Same | min 56px, max 160px | DEV composer |
| `.ship-achtung-input` | `4px 8px` | 12px | ~26px | SHIP ACHTUNG composer |
| `.pk-di` (pack detail) | `4px` | 12px | ~24px | Pack Card detail fields |
| `.pc-select` (press card) | `4px 8px` | 10px | min 28px | Press card dropdowns |
| Floor card edit inputs | `6px 8px` | Inherited (13px) | ~30px | Floor card quick edit |
| Import review inputs | `4px 8px` | 12px | ~26px | Import review table |

**Finding:** Three distinct input size tiers exist:
- **Standard** (34px): RSP forms, wizards, page-level filters
- **Compact** (26–30px): Inline editing, sub-forms, detail fields
- **Micro** (24px): Pack card, press card controls

This is reasonable if codified. Currently it is implicit.

### Buttons

| Button type | Padding | Font size | Min-height | Where used |
|-------------|---------|-----------|------------|------------|
| `.btn` (standard) | `8px 16px` | 14px/700 | 38px | Panel footer, wizard footer, card zone |
| `.bar-btn` (utility) | `4px 12px` | 11px | None explicit | Toolbar actions, NOTES rail |
| `.open-btn` (table row) | `8px 16px` | 12px | 32px | SHIP table |
| `.status-tap` (tappable pill) | `8px 16px` | 12px | 36px | Floor card, press card |
| LOG action buttons | 0 (grid-fill) | 14px | Grid-row height (48–56px) | LOG faceplate |
| LOG numpad buttons | 0 (grid-fill) | 22px | Grid-row height (56px) | LOG faceplate |
| LOG enter button | 0 (grid-fill) | 14px | Grid-row height (56px) | LOG faceplate |
| `.panel-close` (icon) | 0 | 16px | 30×30px | RSP icon zone |
| `.cz-close` (icon) | 0 | 16px | 32×32px | Card Zone header |
| `.floor-card-close` | 0 | 18px | 36×36px | Floor Card |
| `.eng-detail-close` | `4px 8px` | 16px | None | ENGINE detail |
| FAB | 0 | 26px | 52×52px | Fixed position |
| `.notes-composer-btn` | `4px 8px` | Same as bar-btn | 36px | NOTES toolbar |
| `.ship-note-btn` | `2px 8px` | 10px | None | SHIP table inline |
| Station back button | `8px 16px` | 12px | 32px | Station headers |

**Finding:** Icon buttons have four different sizes: 30px (panel), 32px (card zone, progress detail), 36px (floor card), and no explicit height (engine detail). These should normalize to two tiers: 30px (standard) and 36px (large touch target).

### Dropdowns on filter surfaces

| Control | Padding | Font size | Where |
|---------|---------|-----------|-------|
| Job filter | `8px 12px` | 13px | Jobs toolbar |
| Ship filter | `8px 12px` | 13px | SHIP toolbar |
| Audit limit | `8px 12px` | 13px | Audit toolbar |
| Notes job select | `4px 12px` | Inherited | NOTES toolbar |
| LOG job picker | `8px 12px` | — | LOG page |
| Fulfillment dropdown | `3px 8px` | 12px | SHIP table inline |

**Finding:** Page-level filter dropdowns are harmonized at `8px 12px` / 13px. Inline dropdowns are smaller. This is a reasonable two-tier system.

---

## 5. Typography Audit

### Font families

| Family | Where used | Role |
|--------|-----------|------|
| `'Inconsolata', monospace` | **Body default.** All data text, controls, labels, inputs, feeds, tables, pills, buttons, nav items, console surfaces, metrics. | Operational readout — monospace conveys precision and machine state |
| `'Special Elite', cursive` | Section titles (`.sec`), page titles (LOGIN, LAUNCHER), logo (`.bar-logo`), panel ID (`.panel-id`), press card names (`.pc-name`), TV logo, form section headings, wizard titles, notes/dev section labels | Identity / hierarchy marker — hand-stamped personality |
| `'VT323', monospace` | Form section numbers (`.fs-num`) only | Diagnostic / technical accent — used very sparingly |

**Finding:** The three-family system is coherent and well-deployed. `Inconsolata` carries all operational text. `Special Elite` marks important identity moments (page names, section titles, object names). `VT323` appears only in form section numbers for a subtle diagnostic feel. No drift detected — this is one of the strongest design system decisions in the app.

### Font size inventory

Exhaustive list of distinct `font-size` values in use:

| Size | Count | Where |
|------|-------|-------|
| **8px** | 2 | Pill dot (`.pill::before`), compare label (`.eng-compare-label`) |
| **9px** | 12 | Asset labels, pack detail labels, ENGINE block labels/subs, context labels, compound pills, notes tags, progress-over text |
| **10px** | 25+ | Section labels, stat labels, mode badges, date text, auth footer, TV date, letter-spacing-heavy labels, most `letter-spacing: 2px` elements |
| **11px** | 20+ | Bar buttons, nav badge, secondary text, compound subs, feed meta, crew cell notes, SHIP album, search count, pill text, filter hints |
| **12px** | 20+ | Progress subs, search counts, table progress, feed entries, compound notes, ship phase select, inline buttons, letter-spacing=1 text |
| **13px** | 15+ | Body/table default, inputs/selects, feed text, entry text, compound names, bar clock, dev/notes text, wizard body, empty states |
| **14px** | 8 | Standard inputs/selects/buttons, LOG job label, compound name, job card catalog, ACHTUNG ctrl, search icon |
| **15px** | 3 | Body root `html`, section title (`.sec`), primary form section |
| **16px** | 7 | Panel close icon, overlay titles (`.assets-overlay-title`, `.pack-card-title`, `.progress-detail-title`), TV table |
| **17px** | 2 | Bar logo, TV table catalog/artist |
| **18px** | 8 | Section number (`.fs-num`), panel ID, press card name, station name, mode title, auth title, TV logo, confirm title, ship title, wizard title |
| **20px** | 1 | TV press name |
| **22px** | 3 | Primary form section number, TV progress num, LOG numpad |
| **26px** | 1 | FAB icon |
| **28px** | 2 | Stat value (`.sv`), floor card artist, progress detail pct |
| **30px** | 1 | ENGINE block value |
| **36px** | 1 | ENGINE hero value, ENGINE detail number (mobile) |
| **42px** | 1 | TV clock |
| **48px** | 1 | ENGINE detail number |

**Finding:** There are approximately **20 distinct font sizes** in use. This is too many for a formal scale, but the distribution follows a reasonable pattern:

- **Micro** (8–9px): labels, accents, notation
- **Small** (10–11px): secondary text, badges, hints, letter-spaced labels
- **Body** (12–14px): primary data, inputs, feeds, tables
- **Title** (15–18px): section headings, object names, overlay titles
- **Display** (20–48px): hero numbers, stat values, TV clock

The gap is between 18px and 28px — there is no "large heading" tier, which is fine for an operational app that doesn't need editorial hierarchy. The jump from 30px (ENGINE blocks) to 48px (ENGINE detail) is steep but intentional — the detail is a deep-dive context.

### Line heights

Most text uses browser default or `line-height: 1` for large display numbers. Explicit line heights:

| Value | Where |
|-------|-------|
| `line-height: 1` | Engine values, stat values, TV clock, display numbers |
| `line-height: 1.2` | Mode title, floor card artist, ENGINE sub text |
| `line-height: 1.3` | Table body cells, ship note previews |
| `line-height: 1.35` | Crew notes cells |
| `line-height: 1.4` | Dev entry text |

**Finding:** Line heights are set per-surface rather than systematically. Body text generally lands around 1.3–1.4 where specified, which is appropriate. Display numbers correctly use 1.0 to eliminate above-cap space. No serious issues, but codifying to two values (1.0 for display, 1.35 for text) would improve consistency.

### Letter spacing

| Value | Count | Role |
|-------|-------|------|
| `0–0.5px` | Light | Data text, compound pills, progress numbers |
| `1px` | Heavy | Buttons, pills, most labels, feed meta, bar buttons |
| `1.5px` | Medium | Asset labels, pack detail labels, section labels, ENGINE labels |
| `2px` | Heavy | Section titles, mode badges, stat labels, nav items, most uppercase labels |
| `3px` | Light | Page section titles (`.sec`), ship title, ENGINE title |
| `4px` | 1 | TV clock, ENGINE title |

**Finding:** Letter spacing is the clearest hierarchy signal in the app. Higher spacing = more label-like / section-like. Lower spacing = more data-like. This is well-deployed and should be preserved.

---

## 6. Attention / Meaning Audit

### What feels primary (correctly)

- **Stat values** (28px, green, bold) — large numbers dominate the Floor stat row. Correct: these are the dashboard's north-star signals.
- **ENGINE blocks** (30px value, square blocks, role-colored accent lines) — clear metric hierarchy. QPM hero treatment (36px, scan animation) correctly feels most important.
- **TV clock** (42px, green, bold) — correctly dominates the TV display.
- **LOG numpad display** (48px equivalent, center of grid) — correctly feels like the input focus.
- **Press card names** (18px, Special Elite, green) — correctly identify each press.
- **Panel ID** (18px, Special Elite, green) — correctly names the focused job.
- **Table catalog numbers** (amber, bold) — correctly stand as identity anchors in rows.

### What feels secondary (correctly)

- **Section labels** (10–11px, spaced, muted gray) — correctly read as structural labels, not data.
- **Progress sub-text** (10–11px, `--d3`) — correctly subordinate to primary progress numbers.
- **Asset health bars** (4–5px tall, inline) — correctly read as secondary signal.
- **Feed meta** (11px, `--d2`) — correctly subordinate to feed primary text.

### What feels noisy

- **Full-width tables on wide screens** — When a 7-column table stretches to 2000px, every column competes equally for attention because the gutters are too wide. Nothing feels primary anymore.
- **SHIP toolbar** — Title + subtitle + filter + search + count, all in one flex row that wraps. On narrow screens this creates a wall of small controls. The title/subtitle are decorative and could be the page section header instead.
- **Floor stat row on narrow screens** — Wraps to 3×2 grid at 600px, which is fine, but 6+ stat blocks of equal size compete for attention. The filter-on-click behavior helps, but the resting state is flat.

### Where text is too large

- **Floor Card artist name** (28px) — Appropriate for the statboard overlay, but occasionally truncates for long names. Not harmful.

### Where text is too small

- **Pack detail labels** (9px) — Borderline. Still legible on retina, but on standard DPI this would be hard to read.
- **ENGINE block labels** (9px) — Same concern. Labels like "QPM" and "YIELD" are short enough to be fine, but longer labels like "QUACKED TODAY" require `text-overflow: ellipsis` which is currently applied.
- **Compare buttons** (9px) — Tiny, but these are expert controls in a deep-dive context.

### Where size flattens hierarchy

- **Board tables (FLOOR, JOBS, SHIP, CREW)** — All cells use the same 13px body text with no column-level size differentiation. The Jobs table partially addresses this with background-color blocks on identity columns, but size is uniform. On wide screens, a 13px catalog number in a 400px-wide column looks lost.
- **NOTES terminal vs LOG shell** — NOTES is 520px wide, LOG is 380px wide. Both are left-aligned. If they were side-by-side (they aren't), the size difference would signal priority. Since they're on separate pages, the difference is invisible to the user but means NOTES has longer line lengths, which is appropriate for prose.

---

## 7. Space Utilization Audit

### Where full-width helps

- **TV mode** — Full viewport is correct. This is a wall-mounted display board.
- **Floor Manager station** — 1200px max-width is appropriate for a manager's wide operational view.

### Where full-width dilutes attention

- **FLOOR page** — On a 27" monitor, the floor table stretches to ~2200px. Seven columns of 13px text with 300px of whitespace between them. Columns drift apart, and the eye has to travel too far from CATALOG to DUE. A `max-width: 1200px` would improve scan speed without losing information.
- **JOBS page** — Same issue, worse with 14 columns. Some columns (LOCATION, PRESS, COLOR/WT) are often empty, creating dead space.
- **SHIP page** — 9 columns with fulfillment dropdown and note preview. Long note previews help fill space, but the empty rows look sparse.
- **CREW page** — 8 columns. The PFP thumbnail is 36px, but the cell is 44px wide, followed by 13px text in cells that can be 300px wide. Notes column has `max-width: 180px`, which helps, but other columns stretch.

### Where constrained width is correctly applied

- **LOG** (380px) — Perfect for a numpad console. Wider would make the keys feel sparse.
- **NOTES** (520px) — Good for a feed/chat surface. Wider would create uncomfortably long lines.
- **ENGINE** (660px) — Good for a 4×2 grid of square blocks. Wider would make blocks too large.
- **DEV** (980px) — Good for text-heavy dev notes. Wider would dilute.
- **PVC** (980px) — Good for a compound library with thumbnails.

### Where more width would improve density

- No surfaces currently feel too constrained. The LOG console at 380px is the tightest, but it's deliberately modeled after a physical calculator/faceplate.

### Recommendation

The single highest-leverage spatial change would be adding `max-width: 1200px; margin: 0 auto;` to the board-family pages (FLOOR, JOBS, SHIP, CREW, AUDIT). This would:
- Prevent table stretch on wide monitors
- Maintain full content at 1200px and below (most laptop screens)
- Center the content, creating consistent gutters
- Match the existing pattern used by PVC, DEV, and station shells

---

## 8. Existing Pattern Extraction

### Surface family 1: CONSOLE

| Member | Max-width | Alignment | Border | Background |
|--------|-----------|-----------|--------|------------|
| LOG shell | `380px` | Left | 1px `--b2` | `--s1` |
| NOTES terminal | `520px` | Left | 1px `--b2` | `--s1` |
| DEV terminal | `980px` | Centered | 1px `--b2` | `--s1` |

**Shared grammar:** Explicit `max-width`, contained within a bordered box, `--s1` background, vertical section rhythm with `Special Elite` section labels.

**ENGINE** is a cousin — it shares the containment and centering pattern but has a more specialized visual treatment (console box with inner grid, shadow, accent lines).

### Surface family 2: BOARD

| Member | Max-width | Width use | Table columns |
|--------|-----------|-----------|---------------|
| FLOOR | None | Full | 7 |
| JOBS | None | Full | 14 |
| SHIP | None (`.ship-shell` present but unconstrained) | Full | 9 |
| CREW | None (`.crew-shell` present but unconstrained) | Full | 8 |
| AUDIT | None | Full | 6 |

**Shared grammar:** Full-width tables, sortable column headers, `overflow-x: auto` wrapper, toolbar row with search/filter/add actions.

**Gap:** These surfaces lack the containment box that consoles have. Adding a shared `max-width` and optional border would visually align them.

### Surface family 3: LIBRARY / CATALOG

| Member | Max-width | Layout |
|--------|-----------|--------|
| PVC | `980px` | Bordered shell, card-based list |

Currently PVC is the only library surface. If more catalog-style pages are added, this pattern should be reused.

### Surface family 4: PANEL / WORKBENCH

| Member | Width | Position | Animation |
|--------|-------|----------|-----------|
| RSP | `640px` | Right-docked | Slide from right |

Single member. The RSP is the only true workbench surface — a persistent editing panel that coexists with the main page.

### Surface family 5: OVERLAY / CARD

| Member | Max-width | Position | Background |
|--------|-----------|----------|------------|
| Card Zone | `560px` | Centered | `--b2` |
| Floor Card | `900px` | Centered | `--b2` |
| ENGINE Detail | `520px` | Centered | `--s1` |
| Progress Detail | `480px` | Centered | `--b2` |
| Wizard | `420px` | Centered | `--s1` |
| Import Review | `480px` | Centered | `--s1` |
| Confirm | `340px` | Centered | `--s1` |
| New Job Chooser | `320px` | Centered | `--s1` |
| Duplicate | `360px` | Centered | `--s1` |

**Shared grammar:** Fixed-position overlay with backdrop, centered max-width box, `✕` close button, backdrop-click dismiss, Escape dismiss.

**Gap:** Background color is split — some use `--b2`, others use `--s1`. Close button styling also varies (see button audit). These should normalize.

### Surface family 6: STATION

| Member | Max-width | Position |
|--------|-----------|----------|
| Press Station | `900px` | Full-screen, centered |
| QC Station | `900px` | Full-screen, centered |
| Floor Manager | `1200px` | Full-screen, centered |

**Shared grammar:** Fixed-position full-screen shell, centered inner container, `← BACK` header, section-based vertical layout.

---

## 9. Known Docs Impact

| Document | What to update |
|----------|---------------|
| `docs/button-language-spec.md` | Add spatial placement rules (form control size tiers, button size tiers) |
| `docs/STYLE-NORMALIZATION-PLAN.md` | Incorporate board-family max-width, typography scale, close-button normalization |
| `docs/informationarchitecturev3.md` | Update surface family taxonomy with spatial families |
| `docs/engine-language-guide.md` | Note ENGINE's spatial relationship to the console family |

### Recommended new asset

A `docs/spatial-spec.md` or equivalent should codify:
- The five surface families and their spatial rules
- Board-family `max-width` convention
- Typography scale (formalized from current usage)
- Input size tiers (standard 34px, compact 28px, micro 24px)
- Button size tiers (standard 38px, utility 28px, icon 30px, FAB 52px)
- Line-height convention (1.0 for display, 1.35 for text)
- Letter-spacing hierarchy (0–0.5px data, 1px labels, 2px section titles)
- Breakpoint vocabulary
