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
| `tune_up` | tune |
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
[ TYPE:      bug | polish | think | tune | purge | debug           ]
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
2. Add DEV_WORK_TYPES same shape. Section 2 "Rail 2 — Work type": bug, polish, think, tune_up (label "tune"), purge, debug. cls like "dev-type-bug", "dev-type-polish", etc.
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

**Ready-to-use prompt for Cursor** (follows `docs/HOW_TO_PROMPT_CURSOR_SUCCESSFULLY.md`):

```text
Implement Step 2 only of docs/dev-2.0-console-spec.md: DEV rails HTML and render. Add the three button rails to the DEV page; do not change submit or persistence yet.

PART 1 — HTML
1. In index.html, inside the DEV page (pg-dev), in dev-control-rail / dev-toolbar: add three rail containers above or beside the existing devAreaSelect and EXPORT button. Use ids: devStageRail, devTypeRail, devEntityRail. Each is a wrapper (e.g. div) with class "dev-rail" so CSS can target it. You may keep devAreaSelect for now (filter) or remove it; spec says "replace or augment" — prefer adding the three rails and keeping EXPORT; if space is tight, the rails can replace the channel dropdown and filter can be revisited in Phase 2.
2. Ensure the three containers are in the DOM and empty so render can fill them.

PART 2 — Render
3. In render.js, from DEV_STAGES, DEV_WORK_TYPES, DEV_ENTITIES (core.js): for each rail container by id, clear it, then for each constant entry create a button. Button: type="button", class "dev-rail-btn" plus the entry's cls (e.g. dev-stage-note), text = entry.label, onclick = call the corresponding setter with entry.key (setDevStage, setDevType, setDevEntity). After creating each button, set classList.toggle('active', currentValue === entry.key) where currentValue is devStage, devType, or devEntity respectively. Append button to the rail container.
4. Call this rail-render logic from renderDevPage() after the existing DEV DOM setup (e.g. after devAreaSelect binding and before or after the feed render). You may factor a small function renderDevRails() that renderDevPage() calls.

Requirements:
- Do not change addDevNote, Storage.logDevNote, or the shape of the note payload. Step 4 will wire persistence.
- Preserve existing DEV page behavior (textarea, + button, feed, export). Rails are additive.
- Use the existing state (devStage, devType, devEntity) and setters (setDevStage, setDevType, setDevEntity). Constants are in core.js.

After patching, report: 1. Exact files changed. 2. Where you placed the three rail containers in the layout (above textarea, same row as toolbar, etc.). 3. Whether devAreaSelect was kept or removed and why.
```

### Step 3 — CSS for rails

- Add `.dev-rail`, `.dev-rail-btn` base styles (similar to `.log-action-btn`: flex, border, cursor).
- Add one theme class per option (e.g. `.dev-stage-note.active { … }`) and ensure `.dev-rail-btn.active` wins with sufficient specificity (e.g. `#pg-dev .dev-rail .dev-rail-btn.<option>.active`).

**Ready-to-use prompt for Cursor** (follows `docs/HOW_TO_PROMPT_CURSOR_SUCCESSFULLY.md`):

```text
Implement Step 3 only of docs/dev-2.0-console-spec.md: CSS for the DEV 2.0 three rails. Styles only; no HTML or JS changes.

PART 1 — Base rail styles
1. Add .dev-rail: a horizontal flex container for the rail buttons (e.g. display: flex; flex-wrap: wrap; gap; align-items: center). Match the project’s spacing (var(--space-*) if available).
2. Add .dev-rail-btn: base button style similar to .log-action-btn in styles.css (min-height, font-family Inconsolata, font-weight 700, border 1px solid var(--b2), cursor pointer, transition, background var(--s2), color var(--d2), display flex, align-items center, justify-content center). So the DEV rail buttons look like the LOG action row: compact, console-like.
3. Add .dev-rail-btn:hover:not(.active) { background: var(--s3); } so unselected buttons have a hover state.

PART 2 — Active (selected) theme per option
4. For each DEV_STAGES key, add a rule so the button shows a theme color when .active. Use high specificity so it wins: #pg-dev .dev-rail .dev-rail-btn.dev-stage-note.active { … }, and similarly for dev-stage-playground, dev-stage-testing, dev-stage-live, dev-stage-the-shop, dev-stage-purgatory. Reuse the LOG palette where it fits (e.g. note = neutral, live = green, purgatory = muted, the_shop = amber) or assign a simple palette; spec says "reuse LOG’s approach" and "stage = one set of colors" for Phase 1.
5. Same for DEV_WORK_TYPES: #pg-dev .dev-rail .dev-rail-btn.dev-type-bug.active, .dev-type-polish.active, … (bug could be red, polish green, think blue, etc.).
6. Same for DEV_ENTITIES: #pg-dev .dev-rail .dev-rail-btn.dev-entity-rsp.active, … through dev-entity-audit. Entity rail can use a single neutral “selected” color (e.g. var(--g3) or var(--s3)) so all 11 don’t need 11 distinct colors.

Requirements:
- Do not change any LOG or other page styles. Scope limited to #pg-dev and .dev-rail, .dev-rail-btn.
- Ensure .active wins over base: use #pg-dev .dev-rail .dev-rail-btn.<option>.active for every option so the theme color shows when that rail option is selected.

After patching, report: 1. Exact file changed (should be styles.css only). 2. Where you placed the new block (e.g. after existing .dev-* rules, or in a new #pg-dev section). 3. Brief note on palette (which variables you used for stage vs type vs entity).
```

### Step 4 — Wire submit and persistence

- In `addDevNote()`: read `devStage`, `devType`, `devEntity` from state; pass to `Storage.logDevNote({ stage, type, entity, text, person, timestamp })`.
- Extend storage/sync payload and Supabase schema (if applicable) to include `stage`, `type`, `entity`. Keep backward compatibility: notes without these fields remain valid.

**Ready-to-use prompt for Cursor** (follows `docs/HOW_TO_PROMPT_CURSOR_SUCCESSFULLY.md`):

```text
Implement Step 4 only of docs/dev-2.0-console-spec.md: wire DEV rail state into submit and persistence. Notes must store optional stage, type, entity; existing notes without these fields remain valid.

PART 1 — Submit
1. In app.js, in addDevNote(): read the current devStage, devType, devEntity from the global state (they live in render.js; they are global so app.js can read them). Build the note payload to include stage, type, entity (strings; use "" when empty). Call Storage.logDevNote({ stage, type, entity, text, person, timestamp }) with those fields. Do not remove or change how text, person, timestamp are set; add the three new fields.
2. Keep existing behavior: clear textarea after successful submit; call renderDevPage(). Do not clear rail selection after submit (spec: "optionally clear rail selection or leave it for next note" — leave it so the next note can reuse the same tags).

PART 2 — Storage and sync
3. In storage.js: ensure the payload passed to logDevNote is persisted. Wherever dev notes are written (local and/or Supabase), include stage, type, entity in the stored object. If the write path expects a fixed shape, extend it to accept and store these optional fields; notes missing stage/type/entity must still load and display (backward compatibility).
4. If Supabase is used for dev_notes: ensure the table or sync payload includes stage, type, entity columns or keys. If the schema does not have them yet, add them as nullable or default null so existing rows remain valid. Document any schema change in a one-line comment or existing docs if applicable.

Requirements:
- Backward compatibility: reading old notes (no stage, type, entity) must not break. When displaying or exporting, treat missing fields as "" or "—".
- Do not change the DEV rail UI, renderDevRails(), or the feed layout in this step. Step 5 will add feed display of stage/type/entity. This step is submit + persistence only.
- Preserve existing export and filter behavior; extend export to include stage, type, entity columns if the export currently has columns (e.g. CSV), so exported data is complete.

After patching, report: 1. Exact files changed. 2. Where stage/type/entity are written (local, Supabase, or both) and how backward compatibility is preserved. 3. Any schema or API change (e.g. Supabase column names) so we can document or migrate if needed.
```

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
