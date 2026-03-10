# Phase 1 — Design system audit (launcher / station menu)

## 1. Spacing tokens (existing)

| Token        | Value |
|-------------|--------|
| `--space-xs` | 4px   |
| `--space-sm` | 8px   |
| `--space-md` | 12px  |
| `--space-lg` | 16px  |

All spacing must use these; no ad‑hoc values (e.g. no raw `4px` — use `var(--space-xs)`).

---

## 2. Launcher (station menu) — reference surface

- **Container**
  - `.launcher-grid`: `display: flex; flex-direction: column; gap: var(--space-xs);`
  - Stacked items: **4px** gap only (one token).

- **Primary buttons (Admin, Floor Manager, Press, QC)**
  - `.launcher-btn`: `padding: var(--space-sm) var(--space-md);` (8px 12px), `border: 1px solid;`, no `min-height` (content‑driven).
  - Font: `13px`, `font-weight: 700`, Inconsolata.

- **Secondary (OPEN)**
  - `.launcher-last-row .btn-open`: `padding: var(--space-sm) var(--space-lg);`, `min-height: 38px`, `border: 1px solid var(--g2);`.

- **Cohesion**
  - Single column, one gap token between items, same 1px border, padding from scale only.

---

## 3. Station shell (inner container)

- `.station-inner`: `padding: var(--space-md) var(--space-lg);` (12px 16px).
- `.station-header`: `margin-bottom: var(--space-sm);`, `padding-bottom: var(--space-sm);`, `border-bottom: 1px solid var(--b1);`.
- `.station-back`: `padding: var(--space-sm) var(--space-lg);`, `min-height: 32px`, `border: 1px solid var(--b2);`.

---

## 4. Press Station numpad (keypad / grid reference)

- **Container**
  - `.ps-numpad`: `max-width: 320px`, no extra padding.

- **Display**
  - `.ps-numpad-display`: `padding: var(--space-md) var(--space-lg);`, `margin-bottom: var(--space-sm);`, `min-height: 72px`, `border: 1px solid var(--b2);`.

- **Digit grid**
  - `.ps-numpad-grid`: `gap: 4px` (should be `var(--space-xs)`), `margin-bottom: var(--space-sm);`.
  - `.ps-numpad-btn`: `min-height: 56px`, `border: 1px solid var(--b2);`, font `22px` weight `700`.

- **Presets**
  - `.ps-numpad-presets`: `gap: 4px` → `var(--space-xs)`, `margin-bottom: var(--space-sm);`.
  - `.ps-numpad-preset`: `min-height: 40px`, `border: 1px solid var(--b1);`.

- **Primary action**
  - `.ps-numpad-log`: `min-height: 56px`, `border: 2px solid var(--g2);` (only 2px in this block).

---

## 5. Page / section

- `.pg`: `padding: var(--space-lg);`
- `.sec`: `margin: var(--space-lg) 0 var(--space-md);`, `padding-bottom: var(--space-sm);`, `border-bottom: 1px solid var(--b1);`

---

## 6. Bar (compact controls)

- `.bar-btn`: `padding: var(--space-xs) var(--space-md);`, `font-size: 11px`, `border: 1px solid var(--b2);`

---

## 7. Rules to reuse for LOG console

| Dimension           | Source              | Value / rule |
|--------------------|---------------------|--------------|
| Vertical gap (stack) | Launcher grid       | `var(--space-xs)` |
| Section spacing     | ps-numpad blocks    | `var(--space-sm)` margin-bottom |
| Container padding   | station-inner       | `var(--space-md) var(--space-lg)` |
| Column gap          | —                   | `var(--space-md)` (already used) |
| Button height (keypad/action) | ps-numpad-btn   | `56px` |
| Grid gap            | ps-numpad-grid      | `var(--space-xs)` (replace literal 4px) |
| Border weight       | Launcher / station   | `1px` (2px only for primary action) |
| Type (action buttons) | ps-numpad-btn     | 22px, 700, Inconsolata |

---

## 8. How “one product” is achieved

- **Single gap token** between stacked items (launcher: `--space-xs`).
- **Same border**: 1px, same color family (`var(--b1)` / `var(--b2)`).
- **Padding only from scale**: no random px.
- **One height module** for interactive rows: 56px where the numpad is used (Press Station).
- **Top alignment**: columns start together; no extra top margin so left rail and numpad share the same baseline.

---

# Phase 2 — Rebuild report (what was changed)

## 1. Files changed

- `styles.css` — LOG console block only (`.log-job-picker`, `.log-main`, `.log-actions`, `.log-action-btn`, `.log-center`, `#pg-log .log-main .log-center .qc-numpad-*`, `.ps-numpad-presets`, `.log-enter-btn`).
- `LOG-DESIGN-SYSTEM-AUDIT.md` — added (this audit + report). No HTML or JS changed.

## 2. Surfaces used as spacing/model reference

- **Launcher** (`.launcher-grid`, `.launcher-btn`): vertical gap between stacked items.
- **Station inner** (`.station-inner`): container padding.
- **Press Station numpad** (`.ps-numpad-display`, `.ps-numpad-grid`, `.ps-numpad-btn`, `.ps-numpad-presets`, `.ps-numpad-log`): row height (56px), grid gap, section margin-bottom, border weight.

## 3. Spacing/button/grid rules reused

| Rule | Source | Applied to LOG |
|------|--------|----------------|
| Container padding | `.station-inner`: `var(--space-md) var(--space-lg)` | `.log-main`: `padding: var(--space-md) var(--space-lg)` (was `var(--space-md)` only). |
| Vertical gap between stacked items | `.launcher-grid`: `gap: var(--space-xs)` | `.log-actions`: `gap: var(--space-xs)` (was `var(--space-sm)`). |
| Column gap | — | Kept `column-gap: var(--space-md)`. |
| Grid gap | `.ps-numpad-grid`: 4px | `#pg-log .log-center .qc-numpad-grid`: `gap: var(--space-xs)`. |
| Presets gap | `.ps-numpad-presets`: 4px | `#pg-log .log-center .ps-numpad-presets`: `gap: var(--space-xs)`. |
| Section spacing | `.ps-numpad-display` / grid / presets: `margin-bottom: var(--space-sm)` | Already used; no change. |
| Button height | `.ps-numpad-btn`: 56px | `.log-action-btn` and `.log-enter-btn` already 56px. |
| Border weight | Launcher/station: 1px | `.log-main`: `border: 1px solid var(--b2)` (was 2px). Mode still changes `border-color`. |
| Align columns to same baseline | — | `.log-main`: `align-items: start` so left rail and numpad share top. |

## 4. What was changed to force left rail and numpad onto the same rhythm

- **`.log-actions` gap**: `var(--space-sm)` → `var(--space-xs)` so the left rail uses the same stack gap as the launcher (4px).
- **`.log-main` alignment**: `align-items: stretch` → `align-items: start` so both columns start at the same vertical line and the first action button lines up with the start of the center column (job label + numpad).
- **`.log-main` padding**: `var(--space-md)` → `var(--space-md) var(--space-lg)` so horizontal padding matches `.station-inner` and the console sits on the same page rhythm.
- **Grid/presets gaps**: literal `4px` → `var(--space-xs)` so all spacing is token-based and consistent with the rest of the app.

## 5. New dimensions introduced

None. All values are existing tokens (`--space-xs`, `--space-sm`, `--space-md`, `--space-lg`) or existing component values (56px, 72px, 1px, 2px for primary action) from the launcher and Press Station numpad.
