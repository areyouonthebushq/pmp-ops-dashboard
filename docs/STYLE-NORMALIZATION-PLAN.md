# PMP OPS — Style Normalization Plan

**Source of truth:** `docs/PAGE-BY-PAGE-STYLE-AUDIT.md`  
**Goal:** Smallest high-leverage implementation plan so PMP OPS feels like one product. No new features, no redesign.

---

## 1. Prioritized roadmap

### Phase 1: Highest-leverage global fixes

**Scope:** One or two CSS rules per fix; no HTML or layout restructure. Affects every page or all chrome.

| # | What to change | Why it has leverage | Files / components | Risk | Before / after demo |
|---|----------------|---------------------|---------------------|------|----------------------|
| 1.1 | **Nav typography:** `.nav-item` font-family VT323 → Inconsolata; keep font-size 18px or set to 14–15px to match bar. | Removes the only VT323 use; chrome typography becomes consistent. | `styles.css` (`.nav-item`). | Low | **Before** — single rule, no layout change. |
| 1.2 | **Nav border weight:** `.nav-item.on` border-bottom 2px → 1px. | Aligns with “all borders 1px” rule; removes 2px from chrome. | `styles.css` (`.nav-item.on` or `.nav-item` border). | Low | **Before** — one value change. |
| 1.3 | **Border weight — ps-numpad-log:** `.ps-numpad-log` border 2px → 1px solid var(--g2). | Removes the only 2px border in stations; matches LOG console and rest of app. | `styles.css` (`.ps-numpad-log`). | Low | **Before** — one value change. |
| 1.4 | **Section label scale (global tokens):** In `:root`, add e.g. `--sec-page: 15px`, `--sec-block: 13px`, `--sec-caption: 11px`. Do not change any component yet; use Phase 2 to apply. | Establishes a single scale for section labels so Phase 2 changes are consistent. | `styles.css` (`:root`). | Low | **Before** (tokens only) or with Phase 2. |

---

### Phase 2: Page-level normalization

**Scope:** Apply the global scale and fix the largest per-page dissonance. One surface at a time.

| # | What to change | Why it has leverage | Files / components | Risk | Before / after demo |
|---|----------------|---------------------|---------------------|------|----------------------|
| 2.1 | **Section labels — map to scale:** Set `.sec` to use `var(--sec-page)` (15px); `.log-shell-sec` to `var(--sec-caption)` (11px); `.station-sec`, `.ps-v1-sec`, `.form-section` to `var(--sec-block)` (13px); `.form-section--primary` to `var(--sec-page)`; `.form-section--recede` and `.fm-v1-sec.station-sec` to `var(--sec-caption)`. | Unifies hierarchy across launcher, LOG, panel, stations, floor, jobs. | `styles.css` (all section/heading classes above). | Medium | **After** — touch many selectors; verify each page. |
| 2.2 | **Panel title size:** `.panel-id` font-size 22px → 18px (match launcher `.mode-title`). | Aligns panel with launcher title scale. | `styles.css` (`.panel-id`). | Low | **Before** — one rule. |
| 2.3 | **Audit page — minimal structure:** Add one section label “AUDIT LOG” above the toolbar (reuse `.sec` or new class using `--sec-page`). Optionally wrap `#pg-audit` content (toolbar + table) in a div with `border: 1px solid var(--b2); background: var(--s1); padding: var(--space-md) var(--space-lg); max-width: min(900px, 100%);` so audit has one bounded block. | Gives audit a clear hierarchy and optional containment without redesign. | `index.html` (one wrapper + one label), `styles.css` (optional wrapper class). | Low–medium | **After** — small HTML + CSS. |
| 2.4 | **LOG page — single section size below fold:** Either (a) make RECENT/QC LOG use the same size as shell labels (11px, e.g. a class like `.log-page-sec` using `--sec-caption`), or (b) leave as .sec and document. Prefer (a) if goal is “one voice” on LOG. | Removes two section sizes on one page. | `styles.css` (new class or override for `#pg-log .sec`), optionally `index.html` (class on RECENT/QC LOG). | Low | **After**. |
| 2.5 | **Station shell background:** `.qc-station-shell.station-shell` and `.floor-manager-shell.station-shell` use `var(--b1)`; press uses `var(--bg)`. Set all to `var(--bg)` (or all to `var(--b1)`) so stations share one rule. | Removes color/state inconsistency between station types. | `styles.css` (`.qc-station-shell`, `.floor-manager-shell` or shared `.station-shell`). | Low | **After**. |
| 2.6 | **Floor Manager header:** `.fm-v1-bar.station-header` add `border-bottom: 1px solid var(--b1);` (and padding-bottom if needed). | Aligns FM with other station headers. | `styles.css` (`.fm-v1-bar.station-header`). | Low | **After**. |

---

### Phase 3: Optional cleanup

**Scope:** Nice-to-have consistency; not required for “one product” feel.

| # | What to change | Why it has leverage | Files / components | Risk | Before / after demo |
|---|----------------|---------------------|---------------------|------|----------------------|
| 3.1 | **Dialog width token:** Add `--dialog-max: 380px` (or 360px). Set `.confirm-box`, `.new-job-chooser-box`, `.duplicate-job-box` to `max-width: var(--dialog-max)`. Wizard can stay wider if needed. | Aligns modal widths to launcher/LOG shell. | `styles.css` (`:root` + modal classes). | Low | **After**. |
| 3.2 | **Button rhythm (document only or light token):** Add CSS custom properties e.g. `--btn-min-height: 38px`, `--btn-chrome-pad: var(--space-xs) var(--space-md)`. Optionally apply to bar-btn and launcher-btn only. | Reduces future drift; minimal visual change if only documenting. | `styles.css`. | Low | **After** — avoid before demo (touches many buttons). |
| 3.3 | **.sec margin:** Reduce `.sec` top margin from `var(--space-lg)` to `var(--space-md)` if pages feel too “blocky.” | Subtle rhythm alignment with mode-body gap. | `styles.css` (`.sec`). | Medium | **After** — can shift fold/scroll. |
| 3.4 | **Numpad/LOG width:** Align `.ps-numpad` max-width to 360px to match LOG console, or document 320 vs 360 as “press vs unified log” and leave. | Optional layout consistency for “machine” surfaces. | `styles.css` (`.ps-numpad`). | Low | **After**. |

---

## 2. Root causes → implementation categories

From the audit, map each shared root cause to a concrete implementation category:

| Root cause | Implementation category | Concrete actions |
|------------|--------------------------|------------------|
| Containment logic inconsistency | **Containment** | (1) Document: “entry = one box; chrome = strips; content = padded column; overlay = drawer/centered box; stations = full viewport + inner column.” (2) Optional: add one bordered content wrapper for audit (and optionally floor/jobs) so at least one “content” page shares a frame idea with launcher. Do not change bar/nav to a box or panel to a full box in this plan. |
| Section label / hierarchy mismatch | **Section labels** | (1) Add tokens: `--sec-page`, `--sec-block`, `--sec-caption`. (2) Map .sec, .log-shell-sec, .station-sec, .form-section (and variants), .fm-v1-sec to these three sizes. (3) Use one size per “role” (page section vs block section vs caption). |
| Typography split (VT323 on nav) | **Nav typography** | (1) Change .nav-item font-family to Inconsolata. (2) Optionally set font-size to 14px or 15px to match bar. |
| Border weight (2px exceptions) | **Border weights** | (1) .nav-item.on border-bottom → 1px. (2) .ps-numpad-log border → 1px. (3) Rule: “All borders 1px unless documented.” |
| Button / control sizing rhythm | **Button rhythm** | (1) Phase 3 only: add optional tokens (--btn-min-height, etc.) and document. (2) Do not migrate all buttons before demo (risk of layout/overflow). |
| Layout logic (widths) | **Width scale** | (1) Phase 3: add --dialog-max and apply to modals. (2) Optional: 320 / 360 / 380 / 640 documented or normalized for numpad/LOG/launcher/panel. |

---

## 3. Best first patch sequence (3 style fixes before demo)

If only **three** style fixes are done before demo, do them in this order:

1. **Nav typography + nav border (treat as one patch)**  
   - In `styles.css`: `.nav-item` → `font-family: 'Inconsolata', monospace;` and ensure active state uses `border-bottom-width: 1px` (or `border-bottom: 1px solid var(--g)`).  
   - **Why first:** Removes the only font and chrome border that break “one product” at a glance; one place, low risk.

2. **ps-numpad-log border 2px → 1px**  
   - In `styles.css`: `.ps-numpad-log` → `border: 1px solid var(--g2);`.  
   - **Why second:** Single rule; removes the only 2px border in stations; matches LOG and launcher.

3. **Panel title size 22px → 18px**  
   - In `styles.css`: `.panel-id` → `font-size: 18px;`.  
   - **Why third:** Aligns panel with launcher mode-title; one rule, no layout risk.

**Result:** Typography and border weight are consistent in chrome and stations; panel title matches launcher scale. No HTML changes, no new classes, no containment or section-label refactors before demo.

---

## 4. What NOT to touch before demo

- **Containment:** Do not add wrappers or change bar/nav/panel/stations to a new containment model. Do not wrap floor/jobs in a single bordered box (layout and scroll can change).
- **Section label refactor:** Do not change .sec, .log-shell-sec, .station-sec, or .form-section sizes or margins before demo unless it is a single value (e.g. panel-id). Phase 2 section-label mapping touches many selectors and every page.
- **Button rhythm:** Do not introduce new button classes or change padding/min-height of launcher-btn, bar-btn, .btn, station-back, log-enter-btn, or ps-numpad-log (except the 2px→1px border) before demo. Risk of overflow, wrap, or tap-target changes.
- **Width scale:** Do not change panel width, LOG shell width, or numpad/console widths before demo.
- **Audit page structure:** Do not add a wrapper or section label to audit before demo unless it is a trivial one-line label; avoid HTML/structure change close to demo.
- **Station shell background (QC/FM vs press):** Do not change var(--b1) vs var(--bg) before demo; low impact but touches multiple shells.
- **Floor Manager header border:** Optional; can be done after demo.

---

## 5. Summary

- **Phase 1:** Global fixes (nav font + nav border, ps-numpad-log border, optional section tokens). All low risk; nav + border fixes recommended **before demo**.
- **Phase 2:** Page-level normalization (section scale, panel title, audit structure, LOG section size, station background/header). Mostly **after demo**; panel-id 18px can be before.
- **Phase 3:** Optional (dialog width, button tokens, .sec margin, numpad width). **After demo.**

**Recommended before demo:** (1) Nav Inconsolata + 1px border, (2) ps-numpad-log 1px border, (3) panel-id 18px. Three small, high-leverage CSS-only changes.

**Do not before demo:** Containment changes, full section-label remap, button rhythm refactor, width changes, audit/floor/jobs structure.
