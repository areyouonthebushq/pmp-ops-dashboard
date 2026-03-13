# Spatial & Size Cleanup Roadmap

**Status:** Implementation roadmap — ranked sequence of spatial/size fixes for PMP OPS.

**Based on:** `docs/spatial-size-audit.md`, `docs/spatial-size-spec.md`, `docs/spatial-surface-families.md`, `docs/typography-and-control-matrix.md`.

---

## 1. Executive Summary

PMP OPS is approximately 80% spatially coherent. The console family is tight. The instrument surface is solid. The workbench/overlay family is well-proportioned. The spacing token system works.

The remaining 20% is concentrated in three areas:

1. **Board surfaces have no width ceiling.** Five pages stretch indefinitely on wide monitors, diluting scan speed and making the app feel unfinished on large screens. This is the single biggest spatial problem and the single easiest fix.

2. **Board-family density is inconsistent.** SHIP and CREW use looser row padding than Floor, Jobs, and Audit. This makes the board family feel like two families.

3. **Small control and typography values drift.** Close buttons, line-heights, overlay backgrounds, and a few font sizes vary without reason. None of these are individually harmful, but together they create a subtle sense of "assembled, not designed."

The roadmap below is sequenced for maximum impact with minimum risk. The first three fixes are CSS-only, touch no HTML, and collectively address the most visible spatial issues in the app.

---

## 2. Top 10 Spatial/Size Fixes by Leverage

Ranked by the combination of: how many surfaces improve, how visible the improvement is, and how low the risk is.

| Rank | Fix | Surfaces affected | Effort | Risk | Impact |
|------|-----|-------------------|--------|------|--------|
| **1** | Board max-width: 1200px | FLOOR, JOBS, SHIP, CREW, AUDIT (5 pages) | Very low | Very low | **Critical** — fixes the biggest spatial issue |
| **2** | Board row density normalization | SHIP, CREW (2 pages) | Very low | Very low | High — boards feel like one family |
| **3** | Close button normalization to 30×30 | RSP, Card Zone, Floor Card, ENGINE detail, Progress Detail (5+ overlays) | Low | Low | Medium — workbench family tightens |
| **4** | Line-height convergence to 1.0 / 1.35 | All text surfaces | Low | Low | Medium — subtle but systemic |
| **5** | Typography tier tokens in :root | All future surfaces | Low | None | Medium — prevents future drift |
| **6** | Spacing token extension (2px, 24px) | All surfaces on next touch | Low | None | Medium — fills scale gaps |
| **7** | Overlay background normalization to --s1 | Card Zone, Floor Card, Progress Detail | Very low | Very low | Low-medium — overlay family unifies |
| **8** | Input size tier tokens in :root | All future forms | Low | None | Low-medium — prevents future drift |
| **9** | Icon button size normalization (32→30) | Card Zone close, ENGINE detail close | Very low | Very low | Low — minor alignment |
| **10** | Breakpoint vocabulary (documentation) | All responsive rules going forward | Low | None | Low — foundational, not immediately visible |

---

## 3. Low-Effort / High-Impact Fixes

These can be done in a single CSS session with no HTML changes, no JS changes, and no risk of breaking behavior.

### Fix 1: Board max-width

**What:** Add `max-width: 1200px; margin: 0 auto;` to the five board-family page containers.

**Where in CSS:** Target the table-wrapper or page-content containers for `#pg-floor`, `#pg-jobs`, `#pg-ship`, `#pg-crew`, `#pg-audit`. The simplest approach is a shared class on each page's content wrapper, or five individual rules.

**Expected result:** On screens wider than 1200px, board content centers with balanced gutters. On screens 1200px and narrower (most laptops), no visible change. Tables stop stretching. Columns stop drifting. Scan speed improves immediately.

**Risk:** None. No content is truncated — all current column sets fit within 1200px. The page background remains full-width; only the content constrains.

**Effort:** 1 CSS rule (shared) or 5 rules (individual). 5 minutes.

---

### Fix 2: Board row density

**What:** Normalize SHIP table and CREW table row padding from `12px 12px` to `8px 12px`, matching Floor/Jobs/Audit.

**Where in CSS:** `.ship-tbl tbody td` and `.crew-tbl tbody td` (or equivalent selectors for these table bodies).

**Expected result:** SHIP and CREW rows tighten by ~4px vertically. More rows visible per screen. Board tables feel like one family. The density matches the Floor and Jobs tables that users see most often.

**Risk:** Very low. Verify that SHIP fulfillment dropdowns and CREW PFP thumbnails still have adequate vertical room. Both should be fine — the dropdown is `3px 8px` padding internally, and the PFP is 36px which fits in a ~34px row with slight overflow handled by the cell.

**Effort:** 2 CSS rules. 2 minutes.

---

### Fix 3: Close button normalization

**What:** Normalize all overlay/panel close buttons to 30×30px with consistent styling: `width: 30px; height: 30px; font-size: 16px; cursor: pointer; color: var(--d3); border: none; background: transparent; display: flex; align-items: center; justify-content: center;`

**Where in CSS:** `.panel-close`, `.cz-close`, `.eng-detail-close`, `.progress-detail-close` (or equivalent). Leave `.floor-card-close` at 36×36px as a deliberate touch-target exception.

**Expected result:** Close buttons are visually identical across RSP, Card Zone, ENGINE detail, and Progress Detail. One fewer thing that looks "assembled per-surface."

**Risk:** Low. Verify no icon-text alignment shifts. The 2px change on `.cz-close` (32→30) is invisible.

**Effort:** 4 CSS selectors, shared rule or individual overrides. 5 minutes.

---

### Fix 4: Overlay background normalization

**What:** Change overlay inner-box backgrounds from `var(--b2)` to `var(--s1)` for Card Zone, Floor Card, and Progress Detail, matching wizards, confirms, and ENGINE detail.

**Where in CSS:** `.cardZoneBox`, `.floor-card-box` (or equivalent inner container), `.progress-detail-box`.

**Expected result:** All content overlays share one background. The darker `--b2` is reserved for backdrops/scrims. Content surfaces all read as "same level."

**Risk:** Very low. The visual change is subtle — `--s1` is slightly lighter than `--b2`. Text contrast improves marginally.

**Effort:** 3 CSS rules. 2 minutes.

---

## 4. Medium-Effort / High-Value Fixes

These require slightly more thought, possible multi-property changes, and ideally a visual review after implementation.

### Fix 5: Line-height convergence

**What:** Audit all explicit `line-height` declarations and converge them:
- `line-height: 1.0` for display numbers (stat values, ENGINE values, LOG numpad, TV clock)
- `line-height: 1.35` for everything else

**Where in CSS:** Search for `line-height:` and normalize each instance. The changes are:
- `1.2` → `1.35` (mode title, ENGINE sub text — unless deliberately tight, keep 1.2 for single-line title roles)
- `1.3` → `1.35` (table body cells, ship note previews)
- `1.4` → `1.35` (dev entry text)
- `1.35` → keep (already correct)
- `1.0` → keep (already correct for display numbers)

**Expected result:** Text rhythm becomes consistent across surfaces. The 0.05 difference per instance is invisible, but the systemic consistency prevents future drift.

**Risk:** Low. The largest change is `1.3` → `1.35` on table cells, which adds ~0.5px per line — imperceptible. Check that no text wrapping changes or layout shifts occur in dense areas.

**Effort:** ~10–15 selectors to audit and update. 15 minutes including verification.

---

### Fix 6: Typography tier tokens

**What:** Add CSS custom properties for the five canonical typography tiers:

```css
:root {
  --type-micro: 9px;
  --type-small: 11px;
  --type-body:  13px;
  --type-title: 15px;
  --type-display: 30px;
}
```

**Where in CSS:** `:root` block. Do NOT migrate existing selectors yet — this is a foundation pass. New surfaces should reference tokens; existing surfaces migrate on next touch.

**Expected result:** A formal scale exists. Developers building new UI reference tokens instead of choosing ad-hoc values. The 20+ distinct font sizes gradually converge.

**Risk:** None. Additive only — no existing styles change.

**Effort:** 5 lines in `:root`. 2 minutes. The value is long-term.

---

### Fix 7: Spacing token extension

**What:** Add two spacing tokens to fill gaps at the small and large ends:

```css
:root {
  --space-2xs: 2px;
  --space-xl:  24px;
}
```

**Where in CSS:** `:root` block. Same approach as typography tokens — foundation pass, not migration.

**Expected result:** The 1–2px micro gaps (ENGINE grid, import review, hairline separators) and the 24px section breaks (zone separations on FLOOR, section gaps in consoles) have named tokens. New CSS references these instead of raw pixel values.

**Risk:** None. Additive only.

**Effort:** 2 lines in `:root`. 1 minute.

---

### Fix 8: Input and button size tokens

**What:** Add CSS custom properties for canonical control sizes:

```css
:root {
  --input-standard: 34px;
  --input-compact:  28px;
  --input-micro:    24px;
  --btn-primary:    38px;
  --btn-utility:    28px;
  --btn-icon:       30px;
  --btn-icon-touch: 36px;
  --btn-fab:        52px;
}
```

**Where in CSS:** `:root` block. Foundation pass.

**Expected result:** Control sizing decisions are codified. New forms and surfaces reference tokens.

**Risk:** None. Additive only.

**Effort:** 8 lines in `:root`. 2 minutes.

---

### Fix 9: Icon button size normalization

**What:** Normalize `.cz-close` from 32×32 to 30×30. Add explicit `width: 30px; height: 30px;` to `.eng-detail-close` (currently no explicit height).

**Where in CSS:** Two selectors.

**Expected result:** All desktop close buttons are 30×30. Touch-context close buttons remain 36×36.

**Risk:** Very low. The 2px change on `.cz-close` is invisible.

**Effort:** 2 rules. 2 minutes.

---

## 5. Things to Defer

These are real issues but have low urgency, higher risk, or depend on other work happening first.

### Defer: Breakpoint vocabulary migration

**What it is:** The current media queries use ad-hoc breakpoints (480, 600, 800, 900px). The spec recommends a named vocabulary (480, 768, 1024, 1440px).

**Why defer:** Changing existing breakpoints risks shifting mobile layout on surfaces that currently work. The current ad-hoc breakpoints are functional. Apply the named vocabulary to new CSS only. Migrate existing breakpoints if/when a surface is redesigned.

**Revisit:** When building a new responsive surface, or during a dedicated mobile pass.

---

### Defer: Font-size phase-outs (8px→9px, 20px→18px)

**What it is:** A few isolated font sizes could converge to their nearest canonical value.

**Why defer:** The 8px pill dot and 20px TV press name are single-instance edge cases. Changing them has no visible impact and risks touching selectors for no user-facing benefit.

**Revisit:** When the specific surface is being modified for another reason.

---

### Defer: Double-padding cleanup (page padding + shell padding)

**What it is:** All `.pg` pages have `padding: 16px`, and contained shells (LOG, NOTES, ENGINE) add their own internal padding. The effective gutter is double-padded.

**Why defer:** The double-padding is harmless and invisible. Removing it would require restructuring how shells sit within pages. No user would notice the difference.

**Revisit:** Only if building a new page framework or CSS layout overhaul.

---

### Defer: SHIP toolbar simplification

**What it is:** SHIP's toolbar has a title + subtitle + filter + search + count, all in one wrapping flex row. On narrow screens it creates a wall of controls.

**Why defer:** This is a layout/IA issue, not a spatial token issue. Fixing it requires rethinking whether the title/subtitle should move to a board section header (matching FLOOR's `.sec` pattern). That is a design decision, not a CSS cleanup.

**Revisit:** When SHIP is next modified for functional reasons.

---

### Defer: Pack Card micro-density review

**What it is:** Pack Card detail rows use 9px labels and 24px micro-inputs, which are at the lower bound of comfortable density.

**Why defer:** Pack Card is a desktop-only expert overlay used by experienced operators. The density is functional. If Pack Card ever needs to work on tablets, the micro tier will need revisiting.

**Revisit:** If Pack Card gains a touch/tablet requirement.

---

### Defer: Full typography migration to tokens

**What it is:** Migrating all existing `font-size` declarations from raw pixel values to `var(--type-*)` tokens.

**Why defer:** There are 100+ selectors with explicit font sizes. Migrating them all at once is high-effort, low-reward, and high-risk for unexpected layout shifts. The tokens should be adopted incrementally: new CSS uses tokens, existing CSS migrates when touched.

**Revisit:** Ongoing — each time a surface's CSS is modified for another reason, migrate its font sizes to tokens.

---

## 6. Suggested Implementation Order

Three passes, sequenced for maximum impact with minimum risk.

### Pass 1: Board containment (15 minutes)

Do these four fixes in one CSS commit:

1. **Board max-width** — add `max-width: 1200px; margin: 0 auto` to FLOOR, JOBS, SHIP, CREW, AUDIT
2. **Board row density** — normalize SHIP and CREW to `8px 12px`
3. **Close button normalization** — converge to 30×30px
4. **Overlay background normalization** — converge to `var(--s1)`

**Result:** The five busiest pages in the app immediately feel contained. Board surfaces become one family. Overlays become one family. This is the most visible improvement.

### Pass 2: Foundation tokens (5 minutes)

Add all tokens to `:root` in one commit:

1. **Typography tier tokens** (`--type-micro` through `--type-display`)
2. **Spacing token extension** (`--space-2xs`, `--space-xl`)
3. **Input size tier tokens** (`--input-standard`, `--input-compact`, `--input-micro`)
4. **Button size tier tokens** (`--btn-primary` through `--btn-fab`)

**Result:** No visual change. But the spatial vocabulary is now codified. All future CSS work references tokens instead of inventing values. This prevents the spatial system from drifting again.

### Pass 3: Subtle convergence (20 minutes)

These can be done together or spread across multiple touches:

1. **Line-height convergence** — audit and normalize to 1.0 / 1.35
2. **Icon button normalization** — `.cz-close` to 30px, `.eng-detail-close` explicit sizing

**Result:** Text rhythm becomes consistent. The last few control-size outliers converge. The app feels "designed" rather than "assembled" across every surface.

### After Pass 3: Incremental adoption

No dedicated pass needed. When any surface is modified for functional reasons:
- Migrate its font sizes to `var(--type-*)` tokens
- Migrate its spacing to `var(--space-*)` tokens
- Migrate its control sizes to `var(--btn-*)` / `var(--input-*)` tokens
- Apply the named breakpoint vocabulary if adding new responsive rules

This is how the system stays clean without requiring a risky all-at-once migration.
