# PMP OPS — Page-by-Page Style / System Audit

**Goal:** Identify root causes of aesthetic dissonance across surfaces. Not a subjective “make it nicer” pass — concrete audit of where the product stops feeling like one coherent system.

**Design tokens (reference):**  
`--space-xs/sm/md/lg` (4/8/12/16px), `--radius` 6px, `--b1`–`--b5` / `--s1`–`--s3` / `--d`–`--d3`, borders almost universally **1px solid**, fonts **Inconsolata** (body/UI) and **Special Elite** (titles/headings).

---

## 1. Launcher / station selection

- **Overall coherence score:** 9/10  
- **What works:** Single bounded box (`.mode-wrap`: `min(380px,92vw)`, 1px border, `var(--s1)`). Clear head + body: `.mode-head` (accent background, border-bottom, centered), `.mode-body` (padding `var(--space-md) var(--space-lg)`, gap `var(--space-sm)`). Typography: Special Elite 18px title, 10px uppercase sub; launcher buttons Inconsolata 13px, padding `var(--space-sm) var(--space-md)`, 1px border, gap `var(--space-xs)` in grid. Restrained hierarchy; one product frame.  
- **What breaks cohesion:** Launcher press sub-row and signout use slightly different button sizes/labels; minor.  
- **Root cause(s):** None material; this is the reference.  
- **Smallest fix category:** N/A (reference).

---

## 2. Admin shell chrome (bar / nav / header)

- **Overall coherence score:** 6/10  
- **What works:** Bar uses design tokens (padding, gap, 1px border-bottom), Inconsolata for logo/buttons, Special Elite for bar-logo. Sync bar and FAB are consistent.  
- **What breaks cohesion:** **Nav uses VT323 18px** for `.nav-item` — only place in the app that uses VT323 for primary chrome. Launcher, panel, stations, LOG all use Inconsolata + Special Elite. **Nav-item border-bottom is 2px** (active state); rest of app uses 1px. Bar has no outer containment (full-width strip); launcher has a single box — **containment logic differs** (chrome is “strip” not “frame”). Bar-btn is smaller (11px, `var(--space-xs) var(--space-md)`) than launcher-btn; **button rhythm doesn’t match** launcher.  
- **Root cause(s):**  
  - **Typography mismatch:** Nav introduced a second display font (VT323) for tabs only.  
  - **Containment logic:** Shell chrome is unbounded full-width; launcher is one centered bounded module.  
  - **Component inconsistency:** Bar-btn vs launcher-btn sizing/weight.  
- **Smallest fix category:** Typography (align nav to Inconsolata or to a single “tab” token); then border weight (nav 2px → 1px); then optional containment (e.g. max-width + margin for bar/nav if desired).

---

## 3. Floor page

- **Overall coherence score:** 5/10  
- **What works:** Uses `.sec` (Special Elite 15px), design tokens for stats/press grid/table, status pills and search bar consistent with tokens.  
- **What breaks cohesion:** **No outer containment.** Content is “padding + sections” under the bar; there is no single bounded module like the launcher. **Section rhythm is heavy:** `.sec` has `margin: var(--space-lg) 0 var(--space-md)` — large top margin makes the page feel like a list of blocks, not one composed area. Press grid uses `gap: 1px` and `background: var(--b1)` (grid-gap as “line”), while launcher uses `gap: var(--space-sm)` — **different spacing logic**. Stats row same 1px gap; floor feels “grid of cells” not “one card.”  
- **Root cause(s):**  
  - **Containment/composition:** Page has no frame; launcher has one.  
  - **Spacing rhythm:** Section margins and grid gaps follow a different system (1px vs space tokens) and no “body” padding wrapper.  
- **Smallest fix category:** Containment (optional single wrapper with launcher-like max-width + padding); or spacing rhythm (align section margins and grid gaps to space tokens where it doesn’t break layout).

---

## 4. Jobs page

- **Overall coherence score:** 5/10  
- **What works:** Same `.pg` padding, `.sec`, table and search patterns as floor; jobs-toolbar uses space tokens.  
- **What breaks cohesion:** **Same as floor:** no containment, same heavy `.sec` margins, content feels like “another list of sections.” Jobs-toolbar is flex with `var(--space-sm)` gap but no visual grouping (no border/background); **hierarchy is flat** compared to launcher head/body.  
- **Root cause(s):**  
  - **Containment/composition:** Same as floor — no bounded frame.  
  - **Hierarchy:** Toolbar and table are same visual weight as section labels; launcher has clear head vs body.  
- **Smallest fix category:** Same as floor — containment or section/toolbar hierarchy (e.g. toolbar in a subtle container, or reduced .sec top margin).

---

## 5. Right-side panel

- **Overall coherence score:** 6/10  
- **What works:** Panel uses `var(--s1)`, 1px border-left, Special Elite for panel-id and form-section, Inconsolata for inputs; form tokens (fl, fi, fs) and spacing are consistent.  
- **What breaks cohesion:** **Containment logic is different:** panel is a full-height drawer with **only border-left** (no full border or “card”); launcher has a full box. **Section typography splits:** `.form-section` is 13px, `.form-section--primary` is 15px, `.form-section--recede` is 10px — **three section sizes**; global `.sec` is 15px. So “section label” has four variants (sec, form-section, --primary, --recede) across the app. **Panel-id is 22px** (Special Elite); launcher mode-title is 18px — **title scale differs**. Panel-close is 30×30px; launcher buttons are not square — **control shape inconsistency**.  
- **Root cause(s):**  
  - **Containment:** Drawer uses edge border only, not a closed frame.  
  - **Hierarchy/typography mismatch:** Multiple section-label systems (sec vs form-section variants) and panel title larger than launcher title.  
  - **Component inconsistency:** Square close button vs rectangular launcher buttons.  
- **Smallest fix category:** Unify section-label scale (e.g. form-section primary = .sec size, recede = one step down); align panel-id to 18px to match mode-title; optional: add a subtle right/top border to panel for closure.

---

## 6. Press station

- **Overall coherence score:** 7/10  
- **What works:** Station-shell + station-inner (max-width 900px, padding `var(--space-md) var(--space-lg)`), station-header with 1px border-bottom, Special Elite for station-name, Inconsolata for content. Shared station-sec (13px). Numpad uses same color/spacing tokens.  
- **What breaks cohesion:** **Full-viewport shell** with no single “bounded box” — inner is a column, not a launcher-style card. **.ps-numpad-log uses 2px solid var(--g2)** — only 2px border in the app; everything else is 1px — **border weight mismatch**. Numpad max-width **320px** vs LOG console **360px** — **layout logic inconsistency** for similar “machine” surfaces. Station-sec is **13px**; global `.sec` is **15px** — section labels differ by surface.  
- **Root cause(s):**  
  - **Border weight:** One-off 2px on primary CTA (ps-numpad-log).  
  - **Section typography:** station-sec 13px vs .sec 15px.  
  - **Containment:** Station is “full screen + inner column,” not “one box.”  
  - **Layout logic:** Numpad width differs from LOG console.  
- **Smallest fix category:** Border weight (ps-numpad-log → 1px); then section size (station-sec to 15px or document as “station convention”); then optional numpad/LOG width alignment.

---

## 7. LOG page

- **Overall coherence score:** 7/10  
- **What works:** **.log-page-shell** explicitly matches launcher: `min(380px,92vw)`, 1px border, `var(--s1)`, padding `var(--space-md) var(--space-lg)`, gap `var(--space-sm)`. Console uses 1px borders, 56px rows, Inconsolata; mode colors and display are consistent.  
- **What breaks cohesion:** **Two section-label systems on one page:** inside shell, `.log-shell-sec` is **11px** (restrained); below the shell, RECENT and QC LOG use global **.sec** (15px). So the same page mixes “small shell label” and “large page section” — **hierarchy rhythm split**. Content below the shell has no containment (same as floor/jobs).  
- **Root cause(s):**  
  - **Hierarchy rhythm:** Two section styles on one page without a clear rule (“inside shell = small, outside = large” is implicit, not shared elsewhere).  
  - **Containment:** Only the top block is framed; RECENT/QC LOG are unframed.  
- **Smallest fix category:** Section label (either use .sec for shell labels at 15px, or use a single “page section” size for RECENT/QC LOG to match shell-sec 11px); or document the split as intentional and make it consistent (e.g. all “below fold” sections use .sec).

---

## 8. Audit page

- **Overall coherence score:** 4/10  
- **What works:** Uses .pg padding, design tokens for toolbar (gap, font size), table styling.  
- **What breaks cohesion:** **No containment and no hierarchy.** Audit is “toolbar + table” with no head, no section labels, no bounded module. **Feels like a utility screen**, not the same product as launcher. `.audit-toolbar` has no visual grouping (no border/background); `.audit-tbl` is 12px (slightly smaller than main tables 13px). **Composition drift:** launcher = one box + head + body; audit = flat strip + table.  
- **Root cause(s):**  
  - **Containment/composition:** No frame or head/body structure.  
  - **Hierarchy:** No section labels; page-level composition is minimal.  
  - **Layout logic:** Same “content under bar” as floor/jobs but with even less structure.  
- **Smallest fix category:** Containment (wrap audit in a launcher-style box or at least a bordered content area); add one section label (“AUDIT LOG”) and align table font to 13px if desired.

---

## 9. Other distinct shells / surfaces

**QC Station:** Same station-shell/inner pattern as Press. `.qc-station-shell` uses **background var(--b1)** vs press station **var(--bg)** — **color/state inconsistency** between station types. Section labels use station-sec (13px). Coherence 6/10; fix: align shell background to one convention and section size to .sec or document.

**Floor Manager:** `.fm-v1-bar` has **no border-bottom** (padding-bottom 0; border-bottom none); other station headers have border-bottom 1px — **component inconsistency**. `.fm-v1-sec.station-sec` is **11px, no border-bottom** — flattest section style in the app. Coherence 6/10; fix: give FM header a 1px border-bottom and align section label to 13px with border or document FM as “minimal chrome.”

**Login screen:** Matches launcher (bounded box, head/body, Special Elite + Inconsolata). Coherence 9/10.

**Modals (confirm, new-job-chooser, wizard, duplicate-job):** Centered boxes, 1px border, var(--s1). Sizes vary (340px, 320px, 420px, 360px) — **layout logic inconsistency** for “dialog” width. Coherence 7/10; fix: single max-width token for dialogs (e.g. 360px or 380px).

**Floor card / assets overlay / progress detail overlay:** Full-screen overlay with inner box; borders and spacing use tokens. Some inner titles use different font sizes. Coherence 6/10.

---

## Strongest reference surfaces

1. **Launcher (mode-wrap + mode-head + mode-body)** — Single bounded box, clear head/body, consistent spacing and typography.  
2. **Login (auth-wrap + auth-head + auth-form)** — Same containment and token use.  
3. **LOG page shell (.log-page-shell)** — Intentionally aligned to launcher (width, padding, gap, border).

---

## Weakest / most dissonant surfaces

1. **Audit page** — No containment, no hierarchy, feels like a different product.  
2. **Floor / Jobs** — No framing, heavy section margins, 1px grid gaps vs space tokens; “list of sections” not “one composed area.”  
3. **Nav** — Only VT323 use and 2px border; breaks typography and border consistency.  
4. **Panel** — Four section-label sizes and different containment (drawer vs box).  
5. **Station shells (Press/QC/FM)** — Mixed backgrounds, section sizes, and one 2px border (ps-numpad-log).

---

## Shared root causes across the app

1. **Containment logic inconsistency**  
   - Launcher/login: one bounded box (min width, centered).  
   - Bar/nav: full-width strips, no box.  
   - .pg (floor, jobs, audit): padding only, no outer frame.  
   - Panel: full-height drawer, border-left only.  
   - Stations: full viewport + inner max-width column.  
   - **Root cause:** No single rule for “when do we use a frame vs strip vs column.”

2. **Section label / hierarchy mismatch**  
   - .sec: 15px, margin var(--space-lg) 0 var(--space-md).  
   - .log-shell-sec: 11px.  
   - .station-sec: 13px.  
   - .form-section: 13px; --primary 15px; --recede 10px.  
   - .fm-v1-sec: 11px, no border.  
   - **Root cause:** Section labels evolved per surface; no single “section” token or scale.

3. **Typography split**  
   - VT323 only on nav; rest Inconsolata + Special Elite.  
   - **Root cause:** Nav treated as separate chrome with a different font.

4. **Border weight inconsistency**  
   - Almost all 1px; nav-item active 2px; ps-numpad-log 2px.  
   - **Root cause:** Exceptions added without a “primary CTA = 2px” rule.

5. **Button / control sizing rhythm**  
   - Launcher-btn, bar-btn, .btn, station-back, ps-v1-hold-btn, ps-numpad-log, log-enter-btn all differ in padding/min-height.  
   - **Root cause:** No shared “primary / secondary / chrome” button tokens.

6. **Layout logic (widths)**  
   - Launcher/mode-wrap 380px; LOG shell 380px; LOG console 360px; ps-numpad 320px; panel min(640px).  
   - **Root cause:** No width scale (e.g. narrow 320, standard 360/380, wide 640).

---

## Top 5 aesthetic / system fixes (highest leverage)

1. **Unify section labels**  
   Define one scale (e.g. “page section” 15px, “block section” 13px, “caption” 11px) and map .sec, .log-shell-sec, .station-sec, .form-section (and variants) to it. Reduces hierarchy mismatch across every page.

2. **Align nav with system**  
   Switch .nav-item to Inconsolata (or one designated tab font) and nav active border to 1px. Removes the only VT323 use and the only 2px border in chrome.

3. **Document or unify containment**  
   Either: (a) define rules (“entry screens = one box; app chrome = strips; content = padded column; overlay = drawer/centered box”) and align each surface, or (b) add a single “content frame” (e.g. max-width + border) for floor/jobs/audit so they share one containment idea with launcher.

4. **Normalize border weight**  
   Change ps-numpad-log to 1px (and optionally nav-item to 1px). One rule: all borders 1px unless a documented exception.

5. **Button rhythm tokens**  
   Define e.g. .btn-primary (min-height 44px, padding from space tokens), .btn-secondary, .btn-chrome and migrate launcher-btn, bar-btn, .btn, station-back, log-enter-btn to these. Highest impact on “same product” feel across chrome, panels, and stations.

---

*End of audit. No patches applied.*
