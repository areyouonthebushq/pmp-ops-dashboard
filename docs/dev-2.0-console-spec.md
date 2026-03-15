# DEV 2.0 Console Spec — Reuse LOG Button Rails

**Status:** Spec only (no implementation yet)  
**Source:** DEV_2.0_ROADMAP.md (stage / work type / entity model)  
**Reuse from:** LOG console (pg-log) — mode toggle + action rails + selection state + theme colors

---

## 1. What We’re Reusing from LOG

### 1.1 LOG console structure (reference)

- **Mode toggle:** 2 options (e.g. PRESS / OUTBOUND). One selected; click sets selection; re-render applies `.active` and theme.
- **Action rail:** 3–6 mutually exclusive buttons (PRESS, PASS, REJECT or BOXED, READY, QUACK). One selected; same pattern.
- **State:** `logMode`, `logAction` in render.js; `setLogMode(mode)`, `setLogAction(action)`; `renderLog()` updates DOM (innerHTML, classList, disabled).
- **Visual:** Buttons get base class (e.g. `log-action-press`) and `.active` when selected; ENTER button gets theme class (e.g. `log-enter-press`). Theme colors defined in `#pg-log .log-main.log-faceplate` so they win over base.

### 1.2 Pattern to extract

| Concept | LOG | DEV 2.0 (target) |
|--------|-----|------------------|
| **Rails** | 1 mode toggle + 1–2 action rows | 3 rails: Stage, Work type, Entity |
| **State** | `logMode`, `logAction` | `devStage`, `devType`, `devEntity` |
| **Setters** | `setLogMode`, `setLogAction` | `setDevStage`, `setDevType`, `setDevEntity` |
| **Render** | `renderLog()` updates buttons, ENTER, rail glow | `renderDevRails()` (or part of `renderDevPage()`) updates all three rails |
| **Optional** | Action required for ENTER | All three optional (“note may exist with no tags”) |
| **Submit** | ENTER + numpad → `unifiedLogEnter()` | Enter key or + button → `addDevNote()` with current stage/type/entity |

---

## 2. DEV 2.0 Three Rails (from roadmap)

### Rail 1 — Stage

One of (default NOTE; selection optional for “plain note”).

| Key | Label |
|-----|--------|
| `note` | NOTE |
| `playground` | PLAYGROUND |
| `testing` | TESTING |
| `live` | LIVE |
| `the_shop` | THE SHOP |
| `purgatory` | PURGATORY |

### Rail 2 — Work type

One max; optional.

| Key | Label |
|-----|--------|
| `bug` | bug |
| `polish` | polish |
| `think` | think |
| `tune_up` | tune-up |
| `purge` | purge |
| `debug` | debug |

### Rail 3 — Entity

One max; optional (“what system or surface this note is mainly about”).

| Key | Label |
|-----|--------|
| `rsp` | RSP |
| `card` | CARD |
| `log` | LOG |
| `notes` | NOTES |
| `floor` | FLOOR |
| `jobs` | JOBS |
| `engine` | ENGINE |
| `dev` | DEV |
| `crew` | CREW |
| `pvc` | PVC |
| `audit` | AUDIT |

---

## 3. Console Logic (behavior)

- **One selection per rail:** Clicking a button sets that rail’s value; clicking the same button again can clear (toggle off) to keep “no tag” allowed, or we treat “no selection” as NOTE + no type + no entity.
- **Note text primary:** Composer is still the textarea; rails sit above (or beside) it. No rail selection required to submit.
- **Tactile:** Push-state buttons, not dropdowns (per roadmap: “push-state buttons preferred over dropdowns where practical”).
- **Theme when selected:** Selected button uses a theme color (reuse LOG’s approach: base class + `.active` with high-specificity override so the color shows). We can assign a small palette per rail or reuse LOG’s (e.g. stage = one set of colors, type = another, entity = neutral) to keep Phase 1 simple.

---

## 4. Data Model

### 4.1 Current DEV note (today)

- `area` — string (single channel: JOBS, FLOOR, LOG, …)
- `text`, `person`, `timestamp`

### 4.2 DEV 2.0 note (Phase 1)

- **Keep:** `text`, `person`, `timestamp`
- **Add (optional):** `stage`, `type`, `entity` (string keys matching tables above)
- **Migration:** Existing notes have no `stage`/`type`/`entity`; treat as “plain note” (display as NOTE or “—” in feeds). Optionally map legacy `area` → `entity` for display only (e.g. area `LOG` → entity `log`).

Storage and Supabase: extend `dev_notes` (or equivalent) with optional `stage`, `type`, `entity` columns; client payload in `Storage.logDevNote()` includes them when present.

---

## 5. UI Placement (current DEV page)

- **Current:** `pg-dev` has `dev-control-rail` (channel dropdown + EXPORT), then `dev-utility-row` (textarea + + button), then `dev-feed`.
- **Change:** Replace the single channel dropdown with **three horizontal button rails** (Stage | Work type | Entity). Keep EXPORT in the same control row or move to end of rails. Keep textarea and + below; Enter in textarea still submits. Feed below unchanged for Phase 1 (filtering by stage/type/entity can be Phase 2).

Layout sketch:

```
[ STAGE:     NOTE | PLAYGROUND | TESTING | LIVE | THE SHOP | PURGATORY ]
[ TYPE:      bug | polish | think | tune-up | purge | debug           ]
[ ENTITY:    RSP | CARD | LOG | NOTES | FLOOR | JOBS | ENGINE | DEV | CREW | PVC | AUDIT ]
[ EXPORT ]
[ <textarea>                                              ] [ + ]
[ DEV NOTES feed... ]
```

Rails can wrap on small screens; same pattern as LOG action row.

---

## 6. Implementation Reuse Checklist

- **Constants:** Define `DEV_STAGES`, `DEV_WORK_TYPES`, `DEV_ENTITIES` (array of `{ key, label, cls }`) in render.js or core.js; `cls` for theme (e.g. `dev-stage-note`, `dev-type-bug`, `dev-entity-log`).
- **State:** `let devStage = 'note'`, `let devType = ''`, `let devEntity = ''` (or all `''` and treat `''` as NOTE for stage). Setters: `setDevStage(v)`, `setDevType(v)`, `setDevEntity(v)` each set state and call `renderDevPage()` (or `renderDevRails()`).
- **HTML:** Either static markup in index.html (three rows of buttons with ids like `devStageNote`, `devStagePlayground`, …) or one container per rail and render buttons in JS (like LOG’s pressActions/shipActions loop). Recommendation: render in JS from constants so we don’t duplicate 6+6+11 buttons in HTML.
- **CSS:** New classes e.g. `.dev-rail`, `.dev-rail-btn`, `.dev-rail-btn.active`, and per-option classes (`.dev-stage-note.active`, …) with theme colors; mirror `#pg-log .log-main.log-faceplate .log-enter-btn.log-enter-*` specificity pattern so active state wins.
- **Submit:** `addDevNote()` reads current `devStage`, `devType`, `devEntity` (from state) and sends with `text`, `person`, `timestamp`. Clear textarea after submit; optionally clear rail selection or leave it for next note (roadmap: “structure should be earned, not mandatory” — leaving selection is fine).

---

## 7. Next Steps (ordered)

### Step 1 — Constants and state (no UI)

- Add `DEV_STAGES`, `DEV_WORK_TYPES`, `DEV_ENTITIES` to core.js or render.js with `key`, `label`, and a `cls` for styling.
- Add `devStage`, `devType`, `devEntity` and `setDevStage`, `setDevType`, `setDevEntity` in render.js (or app.js if DEV stays there); no DOM yet.

**Ready-to-use prompt for Cursor** (follows `docs/HOW_TO_PROMPT_CURSOR_SUCCESSFULLY.md`):

```text
Implement Step 1 only of docs/dev-2.0-console-spec.md: constants and state for the DEV 2.0 three rails. No UI changes. No DOM. Code only.

PART 1 — Constants
1. Add DEV_STAGES to core.js (or render.js if you prefer DEV-only constants live there). Each entry: { key, label, cls }. Keys and labels from the spec Section 2 "Rail 1 — Stage": note/NOTE, playground/PLAYGROUND, testing/TESTING, live/LIVE, the_shop/THE SHOP, purgatory/PURGATORY. Use cls like "dev-stage-note", "dev-stage-playground", etc.
2. Add DEV_WORK_TYPES same shape. Section 2 "Rail 2 — Work type": bug, polish, think, tune_up (label "tune-up"), purge, debug. cls like "dev-type-bug", "dev-type-polish", etc.
3. Add DEV_ENTITIES same shape. Section 2 "Rail 3 — Entity": rsp/RSP, card/CARD, log/LOG, notes/NOTES, floor/FLOOR, jobs/JOBS, engine/ENGINE, dev/DEV, crew/CREW, pvc/PVC, audit/AUDIT. cls like "dev-entity-rsp", etc.

PART 2 — State and setters
4. In render.js (DEV page logic lives there): add variables devStage, devType, devEntity. Default devStage to "note"; devType and devEntity to "" (empty string = no selection).
5. Add setDevStage(value), setDevType(value), setDevEntity(value). Each sets the corresponding variable and calls renderDevPage() so future rail UI will re-render (no rail DOM yet, so this is a no-op for now).

Requirements:
- Do not add or change any HTML or CSS. Do not add any DOM for the rails.
- Do not change addDevNote, Storage.logDevNote, or any existing DEV UI behavior.
- Preserve existing DEV page behavior; this is additive only.

After patching, report: 1. Exact files changed. 2. Export or global: are the constants and setters exposed so they can be used from app.js (e.g. addDevNote) and from future renderDevRails()? 3. Any naming or placement you chose and why (e.g. core.js vs render.js for constants).
```

### Step 2 — DEV rails HTML + render

- In index.html, replace (or augment) the single `devAreaSelect` dropdown with three containers, e.g. `id="devStageRail"`, `id="devTypeRail"`, `id="devEntityRail"`.
- In `renderDevPage()` (or new `renderDevRails()`), for each rail: clear container, loop constants, create buttons, set `onclick` to the corresponding setter, set `classList.toggle('active', currentValue === key)`, append. Call this after existing DEV DOM setup.

### Step 3 — CSS for rails

- Add `.dev-rail`, `.dev-rail-btn` base styles (similar to `.log-action-btn`: flex, border, cursor).
- Add one theme class per option (e.g. `.dev-stage-note.active { … }`) and ensure `.dev-rail-btn.active` wins with sufficient specificity (e.g. `#pg-dev .dev-rail .dev-rail-btn.<option>.active`).

### Step 4 — Wire submit and persistence

- In `addDevNote()`: read `devStage`, `devType`, `devEntity` from state; pass to `Storage.logDevNote({ stage, type, entity, text, person, timestamp })`.
- Extend storage/sync payload and Supabase schema (if applicable) to include `stage`, `type`, `entity`. Keep backward compatibility: notes without these fields remain valid.

### Step 5 — Feed and filtering (Phase 2)

- In feed, show stage/type/entity (e.g. badges or a short line). Add filter controls by stage, type, entity (optional; can reuse same rail UI as “filter” when not composing).

### Step 6 — Optional: shared rail component

- If we want one reusable “rail” function used by both LOG and DEV (e.g. `renderRail(containerId, options, currentValue, setValue)`), refactor LOG’s action row to use it and use the same for DEV’s three rails. This can wait until after DEV rails work end-to-end.

---

## 8. Out of Scope for This Spec

- Prompt packet generation (Phase 4), run history (Phase 5), semi-automatic runner (Phase 6).
- Rulesets, template library, or any automation.
- Changing LOG console behavior; only reading its pattern and reusing the idea on DEV.

---

## 9. Summary

| Item | Detail |
|------|--------|
| **Rails** | 3: Stage (6), Work type (6), Entity (11). Same “one selected per rail, optional” logic as LOG. |
| **State** | `devStage`, `devType`, `devEntity` + setters; render updates buttons and `.active`. |
| **Reuse** | LOG’s button rail pattern (state → setter → re-render → theme when active). |
| **Data** | Notes gain optional `stage`, `type`, `entity`; submit includes current selection. |
| **Next** | Constants + state → DOM + render → CSS → submit + persistence → feed/filter (Phase 2). |
