# Typography & Control-Size Matrix

**Status:** Implementation reference — use this when building or modifying any UI surface in PMP OPS.

**Based on:** `docs/spatial-size-audit.md`, `docs/spatial-size-spec.md`, `docs/button-language-spec.md`.

---

## 1. Text Role Inventory

Every piece of text in PMP OPS belongs to exactly one role. The role determines font-family, size, weight, color, letter-spacing, and line-height.

### Display roles — big numbers that ARE the signal

| Role | Font | Size | Weight | Color | Letter-spacing | Line-height | Example |
|------|------|------|--------|-------|---------------|-------------|---------|
| **Hero metric** | Inconsolata | 36px | 700 | `var(--g)` | 0 | 1.0 | ENGINE QPM value, ENGINE hero block |
| **Metric value** | Inconsolata | 30px | 700 | `var(--g)` | 0 | 1.0 | ENGINE standard block values |
| **Stat value** | Inconsolata | 28px | 700 | `var(--g)` | 0 | 1.0 | Floor stat row numbers, Floor Card artist name, progress detail percentage |
| **Detail metric** | Inconsolata | 48px | 700 | `var(--g)` | 0 | 1.0 | ENGINE detail overlay hero number |
| **Console display** | Inconsolata | 48px | 700 | Context-colored | 0 | 1.0 | LOG numpad readout |
| **TV clock** | Inconsolata | 42px | 700 | `var(--g)` | 4px | 1.0 | TV mode clock |

**Rule:** Display roles always use `line-height: 1.0` and `letter-spacing: 0` (except TV clock). Never apply body-text line-height to display numbers — it adds unwanted vertical space above the cap line.

---

### Title roles — structural identity markers

| Role | Font | Size | Weight | Color | Letter-spacing | Line-height | Example |
|------|------|------|--------|-------|---------------|-------------|---------|
| **Page section** | Special Elite | 15px | 400 | `var(--d)` | 3px | 1.35 | `.sec` headings (ACTIVE ORDERS, RECENT LOG, QC LOG) |
| **Object ID** | Special Elite | 18px | 400 | `var(--g)` | 2px | 1.2 | Panel ID (`.panel-id`), press card name (`.pc-name`) |
| **Station name** | Special Elite | 18px | 400 | `var(--d)` | 2px | 1.2 | Station header titles |
| **Overlay title** | Inconsolata | 16px | 700 | `var(--d)` | 2px | 1.35 | Card Zone title, Floor Card title, progress detail title |
| **Wizard/auth title** | Special Elite | 18px | 400 | `var(--d)` | 2px | 1.2 | Wizard titles, login title, launcher mode title |
| **Bar logo** | Special Elite | 17px | 400 | `var(--g)` | 2px | 1.35 | `.bar-logo` |

**Rule:** Special Elite appears only in title roles. If the text is not an identity marker or section heading, it should be Inconsolata.

---

### Body roles — working-layer data text

| Role | Font | Size | Weight | Color | Letter-spacing | Line-height | Example |
|------|------|------|--------|-------|---------------|-------------|---------|
| **Table cell (identity)** | Inconsolata | 13px | 700 | `var(--w)` amber | 0.5px | 1.3 | Catalog number column in Jobs/Floor tables |
| **Table cell (data)** | Inconsolata | 13px | 400 | `var(--d)` | 0 | 1.3 | Artist, album, spec, due date columns |
| **Table cell (muted)** | Inconsolata | 11–12px | 400 | `var(--d2)` or `var(--d3)` | 0 | 1.3 | Support columns, secondary data |
| **Input value** | Inconsolata | 14px | 400 | `var(--d)` | 0 | 1.35 | Standard form inputs (`.fi`, `.fs`, `.fta`) |
| **Feed entry (primary)** | Inconsolata | 13px | 400 | `var(--d)` | 0 | 1.35 | LOG feed text, NOTES entry text, DEV entry text |
| **Feed entry (meta)** | Inconsolata | 11px | 400 | `var(--d2)` | 0 | 1.35 | Timestamps, author names, action tags in feeds |
| **Button label** | Inconsolata | 14px | 700 | Inherited | 1px | 1.35 | Primary buttons (`.btn`) |
| **Utility button label** | Inconsolata | 11px | 700 | Inherited | 1px | 1.35 | Toolbar buttons (`.bar-btn`) |
| **Nav item** | Inconsolata | 14px | 400 | `var(--d2)` / `var(--g)` active | 2px | 1.35 | Navigation bar items |
| **Compound name** | Inconsolata | 14px | 700 | `var(--d)` | 0 | 1.35 | PVC compound card name |

**Rule:** Body roles always use Inconsolata. Weight and color differentiate hierarchy, not font-family. Bold + amber = identity anchor. Regular + muted = supporting data.

---

### Label roles — structural scaffolding

| Role | Font | Size | Weight | Color | Letter-spacing | Line-height | Example |
|------|------|------|--------|-------|---------------|-------------|---------|
| **Section label** | Inconsolata | 11px | 700 | `var(--d3)` | 2px | 1.35 | Console section labels (`.log-shell-sec`), form section labels |
| **Stat label** | Inconsolata | 10px | 400 | `var(--d3)` | 2px | 1.35 | Floor stat block labels (`.sl`) |
| **Block label** | Inconsolata | 9px | 400 | `var(--d3)` | 1.5px | 1.35 | ENGINE block labels (`.eng-label`), asset row labels, pack detail labels |
| **Block sub-label** | Inconsolata | 9px | 400 | `var(--d3)` | 1.5px | 1.35 | ENGINE block sub-text (`.eng-sub`) |
| **Mode badge** | Inconsolata | 10px | 700 | `var(--d3)` | 2px | 1.35 | Mode indicators, filter hint badges |
| **Pill text** | Inconsolata | 11px | 700 | Per-status | 1px | 1.35 | Status pills, fulfillment pills |
| **Form field label** | Inconsolata | 10px | 400 | `var(--d3)` | 1.5px | 1.35 | `.fl` form labels in RSP, wizards |
| **Tag/note indicator** | Inconsolata | 9–10px | 400 | `var(--d3)` | 1px | 1.35 | Notes tags, progress-over annotations, compare toggles |

**Rule:** Labels are always muted (`--d3`), always uppercase (via `text-transform: uppercase` or manual casing), and always carry 1.5–2px letter-spacing. They are scaffolding — the user should be able to ignore them and still understand the data.

---

## 2. Font-Size Quick Reference

Canonical sizes only. If a size is not on this list, it should converge to the nearest value.

| Size | Tier | Primary roles |
|------|------|---------------|
| **9px** | Micro | Block labels, asset/pack detail labels, compare toggles, tag indicators |
| **10px** | Micro/Small | Stat labels, mode badges, form field labels, auth footer |
| **11px** | Small | Section labels, utility button labels, pill text, feed meta, nav badges |
| **12px** | Small/Body | Table support columns, progress subs, inline button labels, compact inputs |
| **13px** | Body | Table cells (default), feed entries, search text, wizard body text |
| **14px** | Body | Standard inputs/selects/buttons, compound names, nav items, LOG job label |
| **15px** | Title | Page section headings (`.sec`) |
| **16px** | Title | Overlay titles, close button icons |
| **17px** | Title | Bar logo |
| **18px** | Title | Object ID (panel, press card), station name, wizard title, auth title |
| **28px** | Display | Stat values, Floor Card artist |
| **30px** | Display | ENGINE metric values |
| **36px** | Display | ENGINE hero value |
| **42px** | Display | TV clock |
| **48px** | Display | ENGINE detail number, LOG numpad readout |

**Gap analysis:** There are no values used between 18px and 28px. This is correct — PMP OPS does not need editorial "large heading" sizes. The jump from Title (18px) to Display (28px) is intentional.

### Sizes to phase out

These values currently exist but should converge to a neighbor:

| Current | Converge to | Where | Rationale |
|---------|------------|-------|-----------|
| 8px | 9px | Pill dot pseudo-element, compare label | 8px is one-off; 9px is the established micro floor |
| 20px | 18px | TV press name | Isolated; 18px is the established title ceiling |
| 22px | — | LOG numpad keys, primary form section number | Keep as-is for now; LOG numpad has unique density needs. Optional future convergence to a token. |
| 26px | — | FAB icon | Keep as-is; FAB is a unique control with its own spatial rules |

---

## 3. Letter-Spacing Quick Reference

| Spacing | Role | When to use |
|---------|------|-------------|
| **0px** | Data values, display numbers, metric numbers | Text that IS the information. No spreading. |
| **0.5px** | Data text with slight identity weight | Identity columns in tables (catalog number) |
| **1px** | Active labels, buttons, pills | Text that names an action or state. Slight spread for readability at small sizes. |
| **1.5px** | Structural labels | Text that names a section, field, or block. More spread = more label-like. |
| **2px** | Section titles, navigation, stat labels, mode badges | Text that names a page zone, navigation target, or structural role. |
| **3px** | Page-level identity | Page section titles (`.sec`), ship title, ENGINE header |
| **4px** | Ambient display identity | TV clock, ENGINE header (optional) |

**Rule of thumb:** If the text is data, use 0–0.5px. If the text is a label, use 1–2px. If the text is a section/page title, use 2–3px. The gradient is load-bearing — do not flatten it.

---

## 4. Line-Height Quick Reference

| Value | When to use |
|-------|-------------|
| **1.0** | Display numbers only — stat values, metric values, ENGINE blocks, LOG numpad, TV clock. Eliminates above-cap space so the number sits tight. |
| **1.2** | Title roles that are short (object ID, station name, overlay title). Tighter than body text because titles are usually single-line. |
| **1.35** | Everything else — body text, labels, feeds, table cells, inputs. The universal text line-height. |

**Convergence target:** The current codebase uses 1.3, 1.35, and 1.4 in various places. All should converge to **1.35** for body/label roles. The 0.05 difference is invisible but the inconsistency creates maintenance drift.

---

## 5. Control-Size Tiers

### Buttons

| Tier | Name | Min-height | Padding | Font-size | Weight | Where |
|------|------|------------|---------|-----------|--------|-------|
| **Primary** | `.btn` | 38px | `8px 16px` | 14px | 700 | Form footers (SAVE, CANCEL, CREATE). One per action group. |
| **Utility** | `.bar-btn` | ~28px | `4px 12px` | 11px | 700 | Page toolbars, note rail actions, filter buttons |
| **Inline** | `.open-btn`, `.status-tap` | 32–36px | `8px 16px` | 12px | 700 | Table row actions, tappable pills in Floor Card |
| **Icon (standard)** | `.panel-close`, `.cz-close`, etc. | 30px × 30px | 0 | 16px | — | Close, star, ACHTUNG, edit, pack (desktop overlays) |
| **Icon (touch)** | `.floor-card-close`, station controls | 36px × 36px | 0 | 18px | — | Surfaces used on tablets or factory floor |
| **FAB** | `.fab` | 52px × 52px | 0 | 26px | — | Fixed-position floating add button |
| **LOG action** | grid-fill | Grid row height (48–56px) | 0 | 14px | 700 | LOG faceplate action buttons (PRESS, PASS, PACKED, etc.) |
| **LOG numpad** | grid-fill | Grid row height (56px) | 0 | 22px | 700 | LOG faceplate number keys |
| **LOG enter** | grid-fill | Grid row height (56px) | 0 | 14px | 700 | LOG faceplate enter/commit button |

**Strict rules:**
- Primary buttons ONLY appear in form/card/wizard footers. Never in toolbars.
- Utility buttons ONLY appear in toolbars and utility rows. Never as the final commit action.
- Icon buttons are 30×30px on desktop, 36×36px in touch/station contexts. No other sizes.
- LOG faceplate buttons fill their grid cells. Do not add padding or explicit height — the grid controls the size.

---

### Inputs

| Tier | Name | Height | Padding | Font-size | Where |
|------|------|--------|---------|-----------|-------|
| **Standard** | `.fi`, `.fs`, `.fta` | ~34px | `8px 12px` | 14px | RSP forms, wizards, page-level filters, NOTES composer |
| **Compact** | Floor Card edit, inline | ~28px | `6px 8px` | 12–13px | Inline editing in overlays, Floor Card quick-edit fields |
| **Micro** | `.pk-di`, `.pc-select`, import review | ~24px | `4px` or `4px 8px` | 12px | Pack Card detail fields, press card dropdowns, import review cells |

**Strict rules:**
- Standard is the default for any new form.
- Compact is for inline editing where the input lives inside a table row or card detail.
- Micro is only for dense overlay cards (Pack Card, press cards) where vertical space is very constrained.
- Never mix tiers within the same form group. If one input is Standard, all inputs in that group are Standard.

---

### Textareas

| Context | Min-height | Max-height | Padding | Font-size | Where |
|---------|------------|------------|---------|-----------|-------|
| **Standard form** | 72px | None | `8px 12px` | 14px | RSP notes field (`.fta`) |
| **Composer** | 38px | None | `8px 12px` | 14px | NOTES new-note composer (`#notesNewText`) |
| **Dev composer** | 56px | 160px | `8px 12px` | 14px | DEV area composer (`.dev-textarea`) |
| **Inline micro** | ~26px | ~26px | `4px 8px` | 12px | SHIP ACHTUNG composer (`.ship-achtung-input`) |

**Rule:** Textareas use Standard-tier font (14px) unless they are inline micro-composites. The SHIP ACHTUNG composer is intentionally small because it is a capture mechanism, not a writing surface.

---

### Dropdowns / Selects

| Tier | Padding | Font-size | Where |
|------|---------|-----------|-------|
| **Page-level** | `8px 12px` | 13px | Page toolbar filters (Jobs, SHIP, Audit, LOG job picker) |
| **Inline** | `3px 8px` | 12px | In-table selects (fulfillment phase dropdown, press card selects) |
| **Notes toolbar** | `4px 12px` | inherited (13px) | NOTES job select (slightly tighter than page-level) |

**Rule:** Page-level selects sit in toolbar rows and are sized to match adjacent search inputs. Inline selects sit inside table cells and are sized to not disrupt row height. The NOTES toolbar select is a minor variant of page-level — acceptable as-is but could normalize to standard `8px 12px` if touched.

---

## 6. Icon-Size Tiers

| Tier | Size | Where | Examples |
|------|------|-------|----------|
| **Inline text** | Same as surrounding font-size | Inside text flows, pills, feed entries | ⚠ in pills, ◇ in feed tags, ★ in icon zone |
| **Control icon** | 16px | Icon buttons, close buttons, nav icons | `✕` close, `⚠` ACHTUNG control, `★` star, `✎` edit |
| **FAB icon** | 26px | Floating action button only | `+` in FAB |
| **Custom SVG** | 14–16px inline height | Inline with text or button labels | Duck-head QUACK icon, geometric nav icons |

**Strict rules:**
- Inline-text icons inherit their parent's font-size. Do not set an explicit size.
- Control icons are 16px inside 30×30px buttons. The icon is centered with the remaining 14px as implicit padding.
- Custom SVGs (QUACK duck-head) should target 14–16px rendered height to match control icons.
- Emoji icons should be avoided in favor of SVG or text symbols for consistent sizing and tintability.

---

## 7. Spacing Tiers

Current tokens and their canonical uses:

| Token | Value | When to use |
|-------|-------|-------------|
| `--space-xs` | 4px | Tight gaps: between adjacent pills, between icon and label in compact controls, between grid rows in dense feeds |
| `--space-sm` | 8px | Standard small gap: between toolbar controls, between feed entries, between form field groups, console section internal gap |
| `--space-md` | 12px | Standard medium gap: internal console padding (vertical), between card sections, between form rows |
| `--space-lg` | 16px | Standard large gap: page padding, internal console padding (horizontal), section separation, toolbar margin-bottom |

### Proposed additions (not yet implemented)

| Token | Value | When to use |
|-------|-------|-------------|
| `--space-2xs` | 2px | Micro gaps: ENGINE grid gaps (currently `1px`), dense list separators, hairline spacing |
| `--space-xl` | 24px | Section breaks: between major page zones (stat row → press grid → table), between console and below-fold sections |

**Rule:** All spacing values should reference a token. If a value is not in this table, it should converge to the nearest token. Ad-hoc pixel values like `3px`, `6px`, `10px`, `14px` should be replaced with the closest token on next touch.

---

## 8. Known Current Drift Areas

These are places where the current implementation deviates from the canonical matrix. Listed for awareness — fix on next touch, not as a dedicated cleanup pass.

### Typography drift

| Location | Current | Should be | Severity |
|----------|---------|-----------|----------|
| Pill dot pseudo-element | 8px | 9px (Micro floor) | Low — cosmetic |
| TV press name | 20px | 18px (Title ceiling) | Low — TV is a unique surface |
| CREW/SHIP table row padding | `12px 12px` | `8px 12px` (Board standard) | Medium — board family inconsistency |
| Various line-heights (1.2, 1.3, 1.4) | Mixed | 1.35 (body standard) | Low — visually negligible per-instance |
| ENGINE compare button text | 9px | 9px is correct (Micro) but toggle affordance may need 10px | Low — expert control |

### Control-size drift

| Location | Current | Should be | Severity |
|----------|---------|-----------|----------|
| `.cz-close` icon button | 32×32px | 30×30px (standard icon) | Low — 2px difference |
| `.floor-card-close` icon button | 36×36px | 36×36px (touch icon) — correct for its context | None — this is intentional |
| `.eng-detail-close` icon button | No explicit height | 30×30px (standard icon) | Low — functionally fine |
| NOTES toolbar job select padding | `4px 12px` | `8px 12px` (page-level standard) or keep as-is | Very low |

### Spacing drift

| Location | Current | Should be | Severity |
|----------|---------|-----------|----------|
| ENGINE grid gaps | `1px` | `--space-2xs` (2px) if token exists, or keep 1px as instrument exception | Very low |
| Various `margin-top`/`margin-bottom` using raw px | Mixed | Nearest spacing token | Low — gradual migration |

### Color-role drift in overlays

| Location | Current background | Should be | Severity |
|----------|-------------------|-----------|----------|
| Card Zone | `var(--b2)` | `var(--s1)` per spec recommendation | Low |
| Floor Card | `var(--b2)` | `var(--s1)` per spec recommendation | Low |
| Progress Detail | `var(--b2)` | `var(--s1)` per spec recommendation | Low |
| Wizards, confirms, ENGINE detail | `var(--s1)` | `var(--s1)` — already correct | None |

---

## 9. Flexibility vs. Strictness Guide

Not every rule needs the same enforcement level. This table clarifies what is rigid and what allows judgment.

### Strict — do not deviate

| Rule | Why strict |
|------|-----------|
| Font-family assignments (Inconsolata = data, Special Elite = identity, VT323 = section numbers only) | Core brand identity. Any new font breaks "one product." |
| Display numbers at `line-height: 1.0` | Prevents visual misalignment in metric blocks and stat rows. Even `1.2` creates visible above-cap space at 30px+. |
| Primary buttons only in form footers | Muscle memory. Operators expect the green commit button at the bottom. Moving it to a toolbar creates confusion. |
| Board max-width at 1200px | Prevents the single biggest usability problem on wide screens. |
| Letter-spacing gradient (0 → data, 2 → labels, 3 → titles) | This is the strongest implicit hierarchy signal in the app. Flattening it removes scanability. |
| Icon buttons at 30px (desktop) / 36px (touch) | Consistent hit targets. Mixed sizes create "where do I click" uncertainty. |

### Firm — follow the rule, but exceptions are allowed with good reason

| Rule | Acceptable exceptions |
|------|----------------------|
| Body text at 13px | 12px is acceptable for support/secondary columns where density matters more than readability (e.g., support data in 14-column Jobs table). |
| Standard inputs at 34px | Compact (28px) and Micro (24px) tiers exist for inline/overlay contexts. The exception is codified, not ad-hoc. |
| Row padding at `8px 12px` for boards | TV mode uses `12px` for arm's-length readability. Station tables may use larger padding for touch. |
| Spacing via tokens only | 1px borders and 1px grid gaps are acceptable raw values — they represent structural lines, not spacing. |

### Flexible — use judgment, converge gradually

| Rule | Guidance |
|------|----------|
| Overlay background (`--s1` vs `--b2`) | Preference is `--s1` for content overlays, `--b2` for backdrops. But either works. Normalize when an overlay is touched for other reasons. |
| Exact font-size within a tier (e.g., 12px vs 13px for body) | Both are in the Body tier. Prefer 13px for primary data, 12px for secondary. Do not create a 12.5px compromise. |
| Textarea min-height | Content-dependent. 72px is standard, but a composer can be 38px if the expected input is short. |
| Line-height 1.2 vs 1.35 for titles | Both work for single-line titles. Prefer 1.35 for multi-line-capable titles, 1.2 for guaranteed-single-line identity markers. |
| Mobile breakpoint values | Current breakpoints (480, 600, 800, 900px) are ad-hoc but functional. Converge to a named vocabulary (480, 768, 1024, 1440) when building new responsive rules, not by migrating existing ones. |
