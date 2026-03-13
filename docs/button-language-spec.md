# Button Language Spec

**Status:** Canonical reference — this is the source of truth for how buttons, controls, and interactive elements should behave in PMP OPS.

**Based on:** `docs/button-language-audit.md` (225+ controls inventoried).

---

## 1. Executive Summary

PMP OPS is an operational plant console, not a consumer app. Its button language should feel like an **instrument panel** — every control has a clear job, a consistent shape, and a predictable location. Operators should never wonder "what does this do?" or "where is the save button?"

The product optimizes for:
- **Scan speed** — operators should identify the right control in under a second.
- **Muscle memory** — repeated actions should live in the same place, use the same words, and look the same way across every surface.
- **Zero ambiguity** — a green button always commits. A ghost button always backs out. Red always destroys. Amber always means attention.
- **Signal, not decoration** — every color, icon, and label carries meaning. Nothing is ornamental.

The existing codebase is approximately 85% coherent. This spec codifies the grammar that already works and defines the rules for normalizing the remaining 15%.

---

## 2. Canonical Control Categories

Every interactive element in PMP OPS belongs to exactly one of these families:

### COMMIT
Writes data. Always green (`btn go`). Always the last action in a form/wizard/card. Only one per action group.

> SAVE JOB · SAVE & CLOSE · CREATE JOBS · LOG PACKED · ⚠ FLAG

### DISMISS
Closes, cancels, or backs out without writing. Always ghost or icon-only. Never green.

> CANCEL · ✕ · ← BACK · Escape key · backdrop click

### DESTRUCTIVE
Permanently removes data or ends a session. Always red (`btn del` or red hover). Always requires confirmation for irreversible actions.

> DELETE JOB · CONFIRM (in delete context) · EXIT · SIGN OUT

### ADD / CREATE
Opens a creation surface (wizard, chooser, composer). Always uses `+` prefix. Always in page toolbar position (right side).

> \+ ADD JOB · + ADD PERSON · + ADD COMPOUND · + ADD ENTRY · + ADD NOTE · FAB (+)

### NAVIGATE
Moves between pages or stations. Always uses `ICON WORD` format. Active state is green.

> ⬡ FLOOR · ▶ JOBS · ◈ ENGINE · ← BACK

### OPEN / ENTER
Opens a panel, overlay, card, wizard, or detail view. Triggered by row click, tap column, or explicit button. Label is the destination name or an implicit interaction (clicking a row).

> Row click → openPanel · ASSETS tap → openCardZone · OPEN · QUICK EDIT · metric block click

### MODE / FACE TOGGLE
Switches between two states or faces of the same surface. Uses segmented-control or tab pattern.

> ◉ PRESS / ◇ SHIP · ASSET CARD / PACK CARD · edit toggle

### LOG ACTION
Selects a counted-movement action in the LOG console. Uses the LOG action-button pattern with per-action color identity.

> PRESS · PASS · REJECT · PACKED · READY · QUACK

### ROUTE
Navigates to another page with context pre-loaded. Not a page-level nav — a contextual shortcut from one surface to another.

> ⚠ cautionPill → NOTES · ⌕ → NOTES · + NOTE → NOTES · ◇ NOTES (pack header)

### FILTER / SORT
Narrows or reorders a list. Toggleable. No write operation. Includes search inputs, filter dropdowns, stat filter cards, and sortable column headers.

> Filter dropdown · Stat blocks · Sortable headers · CLEAR · Search inputs

### FILE / PROOF
Uploads, previews, or manages an image or document. Includes hidden file inputs triggered by visible buttons or thumbnail clicks.

> Upload image · REPLACE · REMOVE · ↑ IMPORT CSV · ↓ CSV · thumbnail click → lightbox

### STATE CHANGE
Modifies an object's state inline without opening a form. Includes dropdown-driven changes, cycle-click patterns, and toggle controls.

> Fulfillment phase dropdown · Press status dropdown · Asset status cycle · Archive / Restore · Hold / Resume

### ACHTUNG
Exception-protocol controls. Always amber. Trigger, display, or route for the ACHTUNG protocol. Detailed in `docs/achtung-protocol.md`.

> ⚠ (RSP drawer) · ⚠ (LOG trigger) · ⚠ FLAG · cautionPill · ⚠ floor icon

---

## 3. Canonical Label Rules

### 3.1 Case

All user-facing button labels are **ALL-CAPS**. No exceptions.

| Wrong | Right |
|-------|-------|
| `Save Job` | `SAVE JOB` |
| `Add Compound` | `ADD COMPOUND` |
| `clear` | `CLEAR` |
| `Replace` | `REPLACE` |

### 3.2 Commit labels

Format: **VERB** or **VERB OBJECT**.

The verb should describe what the button does to the data, not what happens to the UI.

| Label | When to use |
|-------|-------------|
| `SAVE JOB` | Panel save (verb + object) |
| `SAVE & CLOSE` | Card Zone save (verb + consequence) |
| `SAVE` | Inline quick-edit save (verb only — object is implicit) |
| `LOG [ACTION]` | LOG enter button (verb + action name) |
| `CREATE JOBS (N)` | Import review confirm (verb + object + count) |
| `ADD` | Notes/asset-note composer (verb only — object is the text just typed) |

### 3.3 Add/create labels

Format: **+ ADD [OBJECT]**.

The `+` prefix is the universal add signal. The object name follows.

| Label | Surface |
|-------|---------|
| `+ ADD JOB` | Floor / Jobs toolbar |
| `+ ADD PERSON` | Crew toolbar |
| `+ ADD ENTRY` | Schedule toolbar |
| `+ ADD COMPOUND` | PVC toolbar |
| `+ ADD NOTE` | Pack Card footer, SHIP table |

Exception: the FAB uses `+` alone because it's a mobile convenience button whose object varies by context.

### 3.4 Dismiss labels

| Label | When to use |
|-------|-------------|
| `CANCEL` | Text button in footer action rows |
| `✕` | Icon button in overlay/panel/wizard headers |
| `← BACK` | Station shell exit |

Never use `CLOSE`, `DONE`, `OK`, or `GO BACK`. The vocabulary is fixed.

### 3.5 Destructive labels

Format: **VERB OBJECT** in ALL-CAPS.

| Label | When to use |
|-------|-------------|
| `DELETE JOB` | Panel footer destructive action |
| `CONFIRM` | Confirm-dialog OK button (used only when preceding context explains the action) |
| `EXIT` | Return to launcher |
| `SIGN OUT` | Full session logout |

### 3.6 Navigation labels

Format: **ICON WORD**.

The icon is a geometric identity mark (not a semantic indicator). The word is the page/station name in ALL-CAPS.

> ⬡ FLOOR · ▶ JOBS · ◈ ENGINE · ◇ NOTES · ◇ SHIP · ◉ CREW · ◌ PVC

### 3.7 Log action labels

Single-word verbs that name the movement event, in ALL-CAPS. No prefixes.

> PRESS · PASS · REJECT · PACKED · READY · QUACK

The LOG enter button uses the format `LOG [ACTION]` — e.g., `LOG PACKED`, `LOG PRESS`.

### 3.8 Route labels

Contextual routing buttons use one of these patterns:

| Pattern | Example | When |
|---------|---------|------|
| icon-only ⌕ | Asset/Pack note-view buttons | Small inline contexts where the destination (NOTES) is understood |
| icon + destination | ◇ NOTES | When the destination needs to be explicit |
| + destination | + NOTE | When the action is "add" at the destination |

### 3.9 File action labels

| Label | When |
|-------|------|
| `UPLOAD IMAGE` | First upload (no existing image) |
| `REPLACE` | Replace existing image |
| `REMOVE` | Delete existing image |
| `↑ IMPORT CSV` | CSV file import trigger |
| `↓ CSV` | CSV export |

---

## 4. Canonical Icon Rules

### 4.1 Icon-only is acceptable when:

1. The button is **≤ 36px** and space is constrained (icon zone, inline row actions).
2. The icon has **exactly one meaning** in the app and that meaning is established by repetition.
3. The button has a **title/tooltip** that explains the action.

Acceptable icon-only controls: `✕` (close), `⚠` (ACHTUNG), `⌕` (view in NOTES), `+` (add note on asset row), `←` (numpad back), `☆`/`★` (PO star), `▸`/`▾` (expand/collapse), FAB `+`.

### 4.2 Icon + label is required when:

1. The button is a **primary action** or **mode toggle** (e.g., `◉ PRESS`, `◇ SHIP`).
2. The icon alone would be ambiguous without the word.
3. The control is on a **navigation surface** (nav bar, station launcher).

### 4.3 Canonical icon meanings

| Icon | Meaning | May NOT mean |
|------|---------|-------------|
| `✕` | Close / dismiss | Delete, cancel (use text for those) |
| `⚠` | ACHTUNG signal | Generic warning, error |
| `⌕` | View in NOTES | Search, inspect, zoom |
| `+` | Add new item | Edit, expand, more (see 4.4) |
| `←` | Back / previous | Undo |
| `☆` / `★` | PO/contract image (has/needs) | Favorite, bookmark |
| `↑` | Import / upload | — |
| `↓` | Export / download | — |
| `▸` / `▾` | Expand / collapse detail | Navigate forward/back |
| `◂` / `▸` | Date step (prev/next) | — |
| Duck SVG | QUACK (shipped/picked up) | — |

### 4.4 Icon overload to resolve

The `+` icon currently means "add" everywhere except the RSP icon zone, where it means "toggle edit mode." This should be normalized:

**Rule:** `+` always means **add**. The RSP edit toggle should use `✎` (pencil) or equivalent.

### 4.5 Nav icon system

Navigation icons are **identity marks**, not semantic indicators. Each page has a unique geometric shape. These shapes do not carry functional meaning — they exist for rapid visual identification. This system is coherent and should be preserved, with two exceptions:

- `⬡` is used for both FLOOR and LOG. One should change.
- `◇` is used for both NOTES and SHIP. One should change.

---

## 5. Canonical Color / Style Rules

### 5.1 Color roles

| Token | Role | Used for |
|-------|------|----------|
| `--g` (green) | **Go / commit / active / online** | `btn go`, nav active, FAB, edit active, status "go" |
| `--cy` (cyan) | **Late-stage / ship / pack** | LOG SHIP mode, pack card accents, Card Zone pack tab |
| `--w` (amber) | **ACHTUNG / warning / press mode** | Caution pills, ACHTUNG controls, LOG press mode, data-changed notice |
| `--r` (red) | **Destructive / reject / offline** | `btn del`, close hover, LOG reject, press offline |
| `--d2`/`--d3` | **Secondary / neutral / muted** | `btn ghost`, `bar-btn` resting, muted icons, inactive controls |

**Rule:** No color appears in a role that contradicts its meaning. Green never means "warning." Red never means "go." Amber never means "success."

### 5.2 Button style hierarchy

| Level | Resting | Hover | When to use |
|-------|---------|-------|-------------|
| **Primary** (`btn go`) | Dark green bg (`--g3`), green border (`--g2`), green text (`--g`) | Filled green bg, black text, green glow | One per action group. Always the commit/save/create action. |
| **Secondary** (`btn ghost`) | Transparent bg, muted border (`--b2`), muted text (`--d2`) | Brightened border/text (stays neutral) | Cancel, back, alternatives, non-primary options. |
| **Destructive** (`btn del`) | Transparent bg, dark red border (`--r2`), red text (`--r`) | Dark red fill (`--r2`) | Delete, destructive confirm. Requires confirmation for irreversible actions. |
| **Bar utility** (`bar-btn`) | Transparent bg, muted border, muted text | Green border + green text | Page toolbar actions (add, import, export). Resting is ghost; hover hints at action with green. |
| **Icon button** (`panel-close` pattern) | 28–36px square, no bg, muted border, muted text | Contextual hover color (red for close, green for edit, amber for ACHTUNG) | Icon zone controls, inline row actions. |

### 5.3 Ghost hover rule

**Canonical rule:** Ghost buttons that are *utility actions* (toolbar `bar-btn`) hover green. Ghost buttons that are *cancel/dismiss actions* (`btn ghost`) hover neutral. This is the existing pattern and should be preserved — it correctly distinguishes "this is a secondary action that does something" from "this is a way to back out."

### 5.4 Close button rule

**Canonical pattern:** All close buttons use the same base treatment — no background, 1px muted border, muted text. Hover goes red (indicating dismissal).

| Current | Canonical |
|---------|-----------|
| `.panel-close` (bordered ghost → red hover) | **Keep — this is the reference** |
| `.cz-close`, `.floor-card-close` (filled `--b4` bg) | Normalize to bordered ghost → red hover |
| `.eng-detail-close` (invisible, text-only) | Normalize to bordered ghost → red hover |

### 5.5 Authoring rule

Always use CSS custom properties (`var(--g)`, `var(--w)`) instead of raw hex values. Raw `#ffb300` and `rgba(255,179,0,...)` should be replaced with `var(--w)` and `rgba()` derived from the token system where possible.

---

## 6. Canonical Placement Rules

### 6.1 Page toolbar

```
[ SEARCH INPUT ]                           [ ↑ IMPORT CSV ] [ + ADD OBJECT ]
```

Search lives on the left. Add/import live on the right. Filter dropdowns sit next to search. This is the existing pattern on Floor, Jobs, Crew, PVC, and SHIP.

### 6.2 Form commit footer

```
[ CANCEL ]  ...spacer...  [ DELETE OBJECT ]  [ SAVE OBJECT ]
```

- CANCEL (ghost) on the left.
- Primary commit (green) on the right.
- Destructive (red) second from right, when applicable.
- This matches the RSP panel footer and the wizard footer.

**Normalize:** Card Zone and Floor Card currently invert this. They should adopt the same left-cancel / right-primary order.

### 6.3 Icon zone (RSP header, overlay headers)

```
[ action icons ... ]  [ ✕ close ]
```

Close (`✕`) is always the rightmost icon. Other icons sit to the left in order of frequency-of-use.

RSP icon zone: `☆ ⚠ ✎ ✕` (PO star, ACHTUNG, edit, close) — left to right.

### 6.4 Mode / face toggle

```
[ MODE A ] [ MODE B ]
```

Segmented control with connected borders. Active state fills with role-specific color. First segment has left border-radius; last has right border-radius.

Examples: LOG toggle (`◉ PRESS` / `◇ SHIP`), Card Zone tabs (`ASSET CARD` / `PACK CARD`).

### 6.5 Inline row controls

Small actions inside table rows or card rows. Always right-aligned within the row. Use icon-only buttons (28px max) to minimize visual noise.

Examples: Asset row `+` and `⌕`, Pack row `⌕` and `▸`, Crew row `EDIT`, SHIP row `+ NOTE` and `OPEN`.

### 6.6 Object click vs explicit button

**Rule:** If a row has no other interactive cells, the entire row is the click target (open panel). If a row has interactive cells (dropdowns, tap columns, notes buttons), add an explicit `OPEN` button.

- Jobs table: row click opens panel (no other interactive cells except assets/packing taps, which are in dedicated columns) — **correct**.
- SHIP table: has fulfillment dropdown and notes button, so adds explicit `OPEN` — **correct**.
- Floor table: row click opens panel — **correct**.

### 6.7 Close affordances

Every closeable surface (overlay, panel, wizard, modal, lightbox) must support all three dismiss mechanisms:

1. **✕ icon button** in the header.
2. **Backdrop click** on the overlay background.
3. **Escape key** via the global keydown handler.

---

## 7. Redundancy / Simplification Rules

### 7.1 When to rely on object click

If the row itself opens a panel or detail view, do not add a separate `OPEN` button unless the row contains other interactive elements that compete for click targets. The implicit click is sufficient and reduces visual noise.

### 7.2 When to keep duplicate add buttons

The `+ ADD JOB` button appears on both Floor and Jobs. This is intentional — both are primary working surfaces and operators should be able to add jobs from either. Keep it.

The FAB (`+`) duplicates the toolbar `+ ADD` button. This is intentional — the FAB provides mobile-first access when the toolbar scrolls off screen. Keep it.

### 7.3 When to avoid second notes surfaces

NOTES is the canonical communication home. No other surface should become an ongoing editable notes surface. Inline composers at trigger time (ACHTUNG, asset note) are acceptable because they write to `notesLog` and disappear after submission. Persistent text fields on boards are not acceptable.

### 7.4 When to avoid multiple route labels

When the same routing action exists on multiple surfaces, the label should be consistent:

| Action | Canonical Label | Not |
|--------|----------------|-----|
| Route to NOTES for job | `⌕` (icon-only) or `◇ NOTES` (icon+text) | `+ NOTE`, `View notes`, `Go to notes` |
| Route to NOTES and open composer | `+ NOTE` | `ADD NOTE`, `+ Add Note` |
| Route to NOTES with achtung context | `⚠` (icon-only, from cautionPill/floor icon) | Any text variant |

Current drift: Pack Card uses `◇ NOTES` (routing) and `+ ADD NOTE` (routing + open composer). SHIP uses `+ NOTE` (routing + open composer). These should align to `+ NOTE` for the add-composer pattern and `⌕` or `◇ NOTES` for the view-only pattern.

### 7.5 When to merge similar controls

The wizard currently uses `Add` (new) / `Save` (edit) for the commit button in Employee, Schedule, and Compound wizards. These should normalize to a single label: **`SAVE`** for both cases. "Add" vs "Save" is an implementation distinction, not a user distinction.

---

## 8. Exceptions That Should Stay

### 8.1 LOG enter-button chameleon
The LOG enter button changes its label and color to match the selected action (`LOG PRESS`, `LOG PACKED`, etc.). This is intentional, excellent, and central to the LOG console identity. **Keep.**

### 8.2 FAB always-filled green
The floating action button is a mobile convention that demands permanent high visibility. It uses filled green without the dark-green-resting pattern. **Keep.**

### 8.3 QC numpad 2px borders
QC pass/reject buttons use heavier 2px borders for emphasis on factory-floor touch targets. This is intentional industrial UX. **Keep.**

### 8.4 PIZZAZ button pulse
The TV PIZZAZ button has a unique pulse animation when active. This is deliberate show-mode treatment. **Keep.**

### 8.5 Stat blocks as filter buttons
Floor stat cards double as filter toggles with a green inset ring when active. This is an efficient use of space and well-understood by operators. **Keep.**

### 8.6 Row cells as implicit openers
Table rows that open panels on click (Floor, Jobs) are standard, efficient, and save operators from finding an explicit "open" button. **Keep.**

### 8.7 Geometric nav icons
The nav icon system uses abstract shapes as page identity marks, not semantic indicators. This is coherent, memorable, and intentionally house-coded. **Keep.**

### 8.8 SHIP `OPEN` explicit button
SHIP table rows have interactive dropdowns and notes buttons that compete for click area. The explicit `OPEN` button resolves this ambiguity. **Keep.**

---

## 9. Ranked Normalization Opportunities

Ranked by impact-to-effort ratio, highest first:

### Tier 1 — High value, low risk

| # | Change | Files | Why |
|---|--------|-------|-----|
| 1 | **Uppercase all labels** — `clear` → `CLEAR`, `Replace` → `REPLACE`, `Remove` → `REMOVE`, `Save Job` → `SAVE JOB`, `Add` → `ADD`, `Cancel` → `CANCEL` (wizard contexts) | `render.js`, `app.js`, `index.html` | Eliminates case drift across the entire app. ~15 string changes. |
| 2 | **RSP edit icon** — change `+` to `✎` (pencil) for edit-mode toggle | `index.html` (1 character), `styles.css` (hover color stays green) | Removes the only icon overload in the app. Single-character change. |
| 3 | **Unify `+ NOTE` label** — Pack Card `+ ADD NOTE` → `+ NOTE`, matching SHIP | `index.html` | One string change. Aligns the two surfaces. |
| 4 | **Add `:focus` outlines** — `button:focus-visible { outline: 2px solid var(--g); outline-offset: 2px; }` | `styles.css` | One CSS rule. Fixes accessibility gap for all buttons at once. |

### Tier 2 — Medium value, low risk

| # | Change | Files | Why |
|---|--------|-------|-----|
| 5 | **Normalize close buttons** — make `.cz-close`, `.floor-card-close`, `.eng-detail-close` match `.panel-close` pattern (bordered ghost → red hover) | `styles.css` | Three CSS rule updates. Makes all close buttons behave identically. |
| 6 | **Standardize commit placement** — move Card Zone and Floor Card primary button to right position | `index.html`, `render.js` | Two template reorders. Matches panel/wizard convention. |
| 7 | **Deduplicate nav icons** — give LOG and SHIP unique icons (currently `⬡` and `◇` are shared) | `index.html` | Two character changes. Eliminates visual ambiguity in nav. |
| 8 | **Replace raw hex in ACHTUNG styles** — `#ffb300` → `var(--w)`, `rgba(255,179,0,...)` → token-derived values | `styles.css` | ~10 replacements. Pure authoring hygiene. |

### Tier 3 — Refinement

| # | Change | Files | Why |
|---|--------|-------|-----|
| 9 | **Normalize wizard commit labels** — `Add` / `Save` → always `SAVE` | `app.js` | ~4 string changes across wizard render functions. |
| 10 | **Normalize `Manual Entry`** — rename to `+ NEW JOB` in the job chooser to match the `+ ADD` pattern | `index.html` | One string change. Minor but improves pattern consistency. |
| 11 | **Add consistent `:active` scale** — `button:active { transform: scale(0.97); }` globally | `styles.css` | Currently only on touch-heavy contexts. Adding globally improves tactile feel. |
| 12 | **Review `bar-btn` hover green** — document it as intentional "utility ghost" pattern or normalize to neutral | `styles.css` or spec only | No code change if documented as intentional — just codify the distinction. |

---

## 10. Docs To Update

After normalization work is implemented, update these docs:

| Document | What to update |
|----------|---------------|
| `docs/achtung-protocol.md` | Verify button labels in the trigger surfaces and surface behavior sections match normalized labels |
| `docs/informationarchitecturev3.md` | Update entry/exit point descriptions to use canonical control names |
| `docs/STYLE-NORMALIZATION-PLAN.md` | Incorporate button hierarchy, close-button rule, and color-role rules from this spec |
| `docs/engine-language-guide.md` | Verify ENGINE control labels (period strip, compare toggles) match spec |
| `docs/INTERACTION-CONSISTENCY-AUDIT.md` | Cross-reference this spec for resolved vs unresolved items |
| `docs/MICROCOPY-AUDIT.md` | Incorporate ALL-CAPS rule and label grammar rules |
| `docs/button-language-audit.md` | Mark as "findings incorporated into button-language-spec.md" |
