# LOG 2.0 — Single Console, Two Modes

> **⚠ SUPERSEDED IN PART** — The mode toggle described in this plan has been removed. LOG is now a single 6-action console (PRESS · PASS · REJECT · BOXED · READY · QUACK) with no toggle. "OUTBOUND" has been replaced by "SHIP" as the action family name. "PACKED" is now "BOXED", "SHIPPED" is now "QUACK". This document is preserved as historical reference. See `docs/informationarchitecturev3.md` §6.3 for current LOG spec.

**Purpose:** Plan LOG 2.0 as a unified console with mode switching between production/press logging and late-stage outbound logging. One console family, one source of truth, one event grammar.

**Scope:** Read-only planning. No code changes. Optimizes for operational coherence.

*Nashville · Press Floor Operations · physicalmusicproducts.com*

---

## 1. Executive summary

- **Current state:** LOG is a single-mode production console — PRESS / PASS / REJECT — writing to `job.progressLog` and `S.qcLog`. It answers "what units moved through the press and QC today?" The faceplate is a CSS grid with three action buttons, a numpad, a display, and a LOG enter button. The color system maps amber → PRESS, green → PASS, red → REJECT.
- **Gap:** After QC, the plant has no counted-movement surface for late-stage outbound events. PACK CARD tracks *readiness* (is this job ready to pack?). SHIP tracks *fulfillment phase* (where is this job in the shipping pipeline?). But nobody answers: "how many units were actually packed today?" or "how many went out the door?"
- **Proposal:** Add a **mode toggle** to LOG that switches the entire faceplate between **PRESS mode** (existing) and **OUTBOUND mode** (new). Same console, same numpad, same job picker, same daily feed — different action set, different color family, different progress stages. One console family. One event grammar. No interference.

---

## 2. Why a single console with mode switching

| Alternative | Problem |
|-------------|---------|
| **Two separate LOG pages** | Fragments the event grammar. Two numpad UIs, two feeds, two mental models. Violates "one source of truth." |
| **Add outbound actions to the existing three buttons** | Six buttons is too many. Press and outbound are different phases — they shouldn't compete for the same faceplate simultaneously. The numpad context becomes ambiguous. |
| **Put outbound logging on SHIP** | SHIP is a visibility/phase surface, not a counting console. Mixing counted events into a list page breaks the separation. LOG is the counting console. |
| **Mode toggle (recommended)** | One console family. Same interaction grammar (pick job → pick action → numpad → LOG). Context-switch is explicit and intentional. Faceplate changes color and actions. Feed can filter by mode or show both. No interference. |

---

## 3. The mode split

### 3.1 Mode toggle design

A **two-position toggle** above or at the top of the faceplate:

```
[ ◉ PRESS LOG ]  [ ○ OUTBOUND LOG ]
```

Toggling swaps:
- The **action buttons** (PRESS/PASS/REJECT → PACKED/SHIPPED/EXCEPTION or vice versa)
- The **enter button label** (LOG PRESS → LOG PACKED, etc.)
- The **faceplate border and rail color** (amber/green/red → cyan/green/amber or similar)
- The **console rail numerics** (pressed/ordered → packed/ordered or shipped/ordered)
- The **daily feed** (can show all, or filter by mode — product decision at build time)

Toggling does **not** change:
- The selected job
- The numpad value
- The date
- The job picker

### 3.2 State

```
logMode = 'press' | 'outbound'     // new — persisted in sessionStorage
logAction = 'press' | 'qc_pass' | 'qc_reject'               // existing (PRESS mode)
           | 'packed' | 'shipped' | 'outbound_exception'     // new (OUTBOUND mode)
```

When `logMode` switches, `logAction` resets to the default for that mode:
- PRESS mode default → `'press'`
- OUTBOUND mode default → `'packed'`

---

## 4. PRESS mode (existing — no change)

This is the current LOG, preserved exactly as-is.

| Action | Stage written | Color | Enter label |
|--------|--------------|-------|-------------|
| **PRESS** | `pressed` | amber (`--w`) | LOG PRESS |
| **PASS** | `qc_passed` | green (`--g`) | LOG PASS |
| **REJECT** | `rejected` + defect picker | red (`--r`) | LOG REJECT |

**Rail:** Shows pressed/ordered, qcPassed/ordered, or rejected/ordered depending on active action.

**Feed:** Press/Pass/Reject entries for the selected date (existing behavior).

**Data:** `job.progressLog` (stages: `pressed`, `qc_passed`, `rejected`), `S.qcLog` for defect-typed rejects.

No changes needed in PRESS mode for LOG 2.0. It continues to work identically.

---

## 5. OUTBOUND mode (new)

### 5.1 Actions

| Action | Stage written | Color | Enter label | What it counts |
|--------|--------------|-------|-------------|----------------|
| **PACKED** | `packed` | cyan (`--cy` — new) | LOG PACKED | Units assembled and packed into boxes |
| **SHIPPED** | `shipped` | green (`--g`) | LOG SHIPPED | Units that left the building (shipped or picked up) |
| **EXCEPTION** | `outbound_exception` + reason picker | amber (`--w`) | LOG EXCEPTION | Units held back, damaged in packing, short-shipped, etc. |

### 5.2 Color rationale

| Color | Meaning in PRESS mode | Meaning in OUTBOUND mode | Why |
|-------|----------------------|-------------------------|-----|
| **Amber** (`--w`) | PRESS (production action) | EXCEPTION (outbound hold) | In outbound context, the "attention" color shifts to exception handling |
| **Green** (`--g`) | PASS (QC cleared) | SHIPPED (gone — done) | Green = good/complete in both modes |
| **Cyan** (new) | — | PACKED (assembly counted) | Cyan is visually distinct from amber. Signals "different phase" without clashing. Packed = forward motion but not yet shipped. |

**Cyan addition:** Introduce one new color token:
```css
--cy:  #00e5ff;   /* cyan — outbound / packed */
--cy2: #002a33;   /* dark cyan bg */
```

This keeps the design system clean: green = complete, amber = attention, red = blocked, cyan = outbound-in-progress.

### 5.3 Console rail in OUTBOUND mode

The rail adapts to the active action, same pattern as PRESS mode:

| Action | Rail shows | Bar color |
|--------|-----------|-----------|
| PACKED | `packed / ordered` | cyan |
| SHIPPED | `shipped / ordered` | green |
| EXCEPTION | `exceptions / ordered` | amber |

### 5.4 Exception reason picker

Mirrors the REJECT defect picker pattern:

```
EXCEPTION — SELECT REASON
[ 📦 DAMAGE IN PACKING ]  [ ⚡ SHORT COUNT ]  [ ⬡ WRONG CONFIG ]
[ ◉ HELD — BILLING ]  [ ✕ HELD — CUSTOMER ]  [ ✦ OTHER ]
```

These are late-stage exception reasons, not press defect types. They are stored alongside the event so the feed can display reason context.

### 5.5 Data model extension

**Option A (recommended): Extend `job.progressLog`**

Add new stages to `PROGRESS_STAGES`:

```js
const PROGRESS_STAGES = ['pressed', 'qc_passed', 'rejected', 'packed', 'shipped', 'outbound_exception'];
```

Events use the same shape:
```js
{ qty: 100, stage: 'packed', person: 'Log · Mike', timestamp: '2026-03-06T14:30:00Z' }
{ qty: 100, stage: 'shipped', person: 'Log · Sarah', timestamp: '2026-03-06T16:00:00Z' }
{ qty: 5, stage: 'outbound_exception', person: 'Log · Mike', timestamp: '2026-03-06T15:00:00Z', reason: 'DAMAGE IN PACKING' }
```

**Why extend `progressLog` instead of a new array:**
- One event stream per job = one source of truth
- `getJobProgress()` can be extended to return `packed`, `shipped`, `exceptions` counts alongside `pressed`, `qcPassed`, `rejected`
- The daily feed already reads `progressLog` — outbound events appear naturally
- No new Supabase column or migration needed (JSONB array accommodates new stages)

**Option B (not recommended): Separate `outboundLog` array**
- Would require a new JSONB column, new load/save logic, separate feed rendering
- Violates "one event grammar, one source of truth"
- Only makes sense if press and outbound logs need separate permissions or lifecycle — unlikely at this stage

### 5.6 Extended progress model

```js
function getJobProgress(job) {
  // ... existing pressed, qcPassed, rejected ...
  // NEW:
  let packed = 0, shipped = 0, outboundExceptions = 0;
  log.forEach(e => {
    const q = Math.max(0, parseInt(e.qty, 10) || 0);
    if (e.stage === 'packed') packed += q;
    else if (e.stage === 'shipped') shipped += q;
    else if (e.stage === 'outbound_exception') outboundExceptions += q;
  });
  return { ordered, pressed, qcPassed, rejected, pendingQC, packed, shipped, outboundExceptions };
}
```

**Validation rules (OUTBOUND mode):**
- `packed` cannot exceed `qcPassed` (you can't pack more than QC cleared)
- `shipped` cannot exceed `packed` (you can't ship more than you packed)
- `outbound_exception` cannot exceed `packed` (exceptions come from packed units)
- These mirror the existing guardrails: `qc_passed + rejected` cannot exceed `pressed`

---

## 6. What stays in PACK CARD (not in LOG)

This is a critical boundary. PACK CARD and OUTBOUND LOG are complementary, not overlapping.

| Concern | Surface | Why |
|---------|---------|-----|
| **"Is the sleeve confirmed?"** | PACK CARD | Readiness check, not a counted event |
| **"Is the jacket confirmed?"** | PACK CARD | Readiness check |
| **"Is the insert placed?"** | PACK CARD | Readiness check |
| **"Is wrapping required / complete?"** | PACK CARD | Readiness flag |
| **"Is the box label ready?"** | PACK CARD | Readiness check |
| **"Special handling instructions?"** | PACK CARD + NOTES | Context, not a count |
| **"Packing caution / blocker?"** | PACK CARD | Exception flag on readiness |
| **"How many units were packed today?"** | LOG OUTBOUND | Counted movement |
| **"How many units shipped today?"** | LOG OUTBOUND | Counted movement |
| **"How many units were held / damaged?"** | LOG OUTBOUND (exception) | Counted exception |

**The ladder:**
```
PACK CARD          →  LOG OUTBOUND        →  SHIP
"ready to pack?"      "how many packed?"      "fulfillment state?"
(readiness)           (counted movement)      (phase/visibility)
```

PACK CARD is the checklist *before* the count. LOG OUTBOUND is the count *during* the work. SHIP is the status *after* the count.

---

## 7. Faceplate layout with mode toggle

### 7.1 Grid update

The current grid has 9 rows. The mode toggle adds one row at the very top:

```
grid-template-areas:
    "toggle toggle toggle"      ← NEW: mode toggle
    "rail   rail   rail"
    "job    job    job"
    "mode1  mode2  mode3"       ← action buttons (content changes per mode)
    "display display display"
    "k7     k8     k9"
    "k4     k5     k6"
    "k1     k2     k3"
    "c      zero   back"
    "log    log    log"
```

### 7.2 Mode toggle element

```html
<div class="log-mode-toggle" id="logModeToggle">
  <button class="log-mode-btn active" id="logModePressBtn" onclick="setLogMode('press')">◉ PRESS LOG</button>
  <button class="log-mode-btn" id="logModeOutboundBtn" onclick="setLogMode('outbound')">◇ OUTBOUND LOG</button>
</div>
```

Styling: two buttons, pill-style. Active button gets a subtle background tint matching the mode's primary color. PRESS mode toggle button: amber tint. OUTBOUND mode toggle button: cyan tint.

### 7.3 Faceplate border color per mode

| Mode | Default border | Active action border follows existing pattern |
|------|---------------|----------------------------------------------|
| PRESS | `--w2` (dark amber) | amber / green / red per action |
| OUTBOUND | `--cy2` (dark cyan) | cyan / green / amber per action |

### 7.4 Action button swap

When mode changes, the three action button labels and click handlers update:

```
PRESS mode:      [PRESS]  [PASS]  [REJECT]
OUTBOUND mode:   [PACKED]  [SHIPPED]  [EXCEPTION]
```

Implementation: same three `<button>` elements, innerHTML and onclick swapped by `setLogMode()` and `renderLog()`. No DOM insertion/removal.

---

## 8. Daily feed behavior

### 8.1 Feed with mode context

The daily feed already renders from `job.progressLog` (press entries) and `S.qcLog` (reject entries with defect type). Outbound entries naturally appear once they exist in `progressLog`.

**Options for feed filtering:**

| Option | Behavior | Recommendation |
|--------|----------|----------------|
| **A: Show all** | Feed shows press + outbound events interleaved by timestamp | Simpler. Full picture of the day. Could get noisy. |
| **B: Filter by active mode** | PRESS mode → only press/pass/reject. OUTBOUND mode → only packed/shipped/exception. | Cleaner per-mode view. Matches the faceplate context. |
| **C: Show all, highlight active mode** | All events visible; active-mode events get full color, inactive-mode events are dimmed | Best of both worlds — full picture with visual emphasis. |

**Recommendation: Option B** for v1, with a future toggle for "show all." Reason: the mode switch is intentional context. When you're logging packing, you want to see packing events. When you're logging press, you want to see press events. This keeps the feed focused and reduces cognitive load.

### 8.2 Feed entry styling per stage

| Stage | Color class | Display |
|-------|------------|---------|
| `pressed` | `.pressed` (amber) | `+500 PRESS · Log · Mike · 2:30 PM · CAT-001 · Artist` |
| `qc_passed` | `.qc_passed` (green) | `+500 PASS · Log · Mike · 3:00 PM · CAT-001 · Artist` |
| `rejected` | `.rejected` (red) | `+5 REJECT · FLASH · QC · 3:15 PM · CAT-001 · Artist` |
| `packed` | `.packed` (cyan — new) | `+200 PACKED · Log · Sarah · 4:00 PM · CAT-001 · Artist` |
| `shipped` | `.shipped` (green) | `+200 SHIPPED · Log · Sarah · 5:00 PM · CAT-001 · Artist` |
| `outbound_exception` | `.outbound_exception` (amber) | `+3 EXCEPTION · DAMAGE IN PACKING · Log · Sarah · 4:30 PM · CAT-001` |

---

## 9. Console rail in OUTBOUND mode

The rail adapts the same way it does in PRESS mode — showing a single compact % bar colored by the active action.

```js
function logConsoleRailHTML(job, mode) {
  const p = getJobProgress(job);
  const ordered = p.ordered;
  // PRESS mode uses existing logic
  // OUTBOUND mode:
  const num = mode === 'packed' ? p.packed
            : mode === 'shipped' ? p.shipped
            : p.outboundExceptions;
  const denom = mode === 'shipped' ? p.packed : ordered;
  // shipped measures against packed (you ship what you packed)
  // packed measures against ordered (you pack what was ordered)
  // exception measures against ordered
  const pct = denom ? Math.min(100, (num / denom) * 100) : 0;
  // ...
}
```

**Denominator logic:**
- PACKED / ordered → "how much of the order is packed?"
- SHIPPED / packed → "how much of what's packed has shipped?"
- EXCEPTION / ordered → "what fraction of the order had exceptions?"

---

## 10. Validation guardrails

| Rule | Error message |
|------|--------------|
| `packed > qcPassed` | "Packed cannot exceed QC passed" |
| `shipped > packed` | "Shipped cannot exceed packed" |
| `outbound_exception > packed` | "Exceptions cannot exceed packed" |
| `shipped + outbound_exception > packed` | "Shipped + exceptions cannot exceed packed" |

These follow the same pattern as `qc_passed + rejected > pressed`.

**Soft suggestion:** When packed reaches ordered and all validation clears, `suggestedStatus()` could suggest fulfillment phase advancement (e.g., suggest `ready_to_ship` on SHIP). This is a v2 enhancement.

---

## 11. What does NOT change

| Aspect | Status |
|--------|--------|
| PRESS mode behavior | Identical to today |
| `S.qcLog` (defect log) | Unchanged — only used by REJECT action in PRESS mode |
| PACK CARD | Unchanged — readiness, not counting |
| SHIP | Unchanged — fulfillment phase, not counting |
| `job.progressLog` shape | Same array, new stages added |
| Press Station shell | Same — uses PRESS mode actions only |
| QC Station shell | Same — uses PASS/REJECT actions only |
| Numpad | Same element, same behavior |
| Job picker | Same element, same behavior |
| Date nav | Same element, same behavior |

---

## 12. Outbound exception reason catalog

Analogous to `QC_TYPES` for press rejects:

```js
const OUTBOUND_EXCEPTION_TYPES = [
  'DAMAGE IN PACKING',
  'SHORT COUNT',
  'WRONG CONFIG',
  'HELD — BILLING',
  'HELD — CUSTOMER',
  'OTHER',
];
```

These are stored with the `outbound_exception` event in progressLog (same way reject defect types work). They also display in the daily feed.

The exception reason picker UI mirrors the existing `qc-reject-picker` overlay — same card, different title and buttons.

---

## 13. TV mode and ticker

The TV ticker currently shows blockers (cautioned jobs). The outbound stats could optionally feed into a TV section:

| Stat | Source |
|------|--------|
| Today packed | Sum of `packed` events for today across all jobs |
| Today shipped | Sum of `shipped` events for today across all jobs |
| Outbound exceptions | Sum of `outbound_exception` events for today |

**Recommendation:** Defer TV outbound stats to v2. Keep TV focused on press/QC for now. Add when outbound logging proves its value on the floor.

---

## 14. Implementation sequence

### Phase 1: Core mode switch (smallest useful)

| Step | What | Files | Dependency |
|------|------|-------|------------|
| **1a** | Add `logMode` state variable, `setLogMode()` function | render.js | None |
| **1b** | Add mode toggle HTML to faceplate grid | index.html | None |
| **1c** | Update faceplate grid CSS for new toggle row | styles.css | 1b |
| **1d** | Add cyan color tokens (`--cy`, `--cy2`) | styles.css | None |
| **1e** | Extend `PROGRESS_STAGES` with `'packed'`, `'shipped'`, `'outbound_exception'` | core.js | None |
| **1f** | Extend `getJobProgress()` to return `packed`, `shipped`, `outboundExceptions` | core.js | 1e |
| **1g** | Add `OUTBOUND_EXCEPTION_TYPES` constant | core.js | None |
| **1h** | Update `renderLog()` — swap action buttons per mode, filter feed per mode | render.js | 1a, 1e |
| **1i** | Update `unifiedLogEnter()` — handle `packed`, `shipped`, `outbound_exception` stages | render.js | 1e, 1f |
| **1j** | Add outbound exception reason picker (mirror reject picker) | index.html, render.js | 1g |
| **1k** | Add validation guardrails for outbound stages in `logJobProgress()` | app.js | 1f |
| **1l** | Update `logConsoleRailHTML()` for outbound modes | core.js | 1f |
| **1m** | Add OUTBOUND feed entry styles (`.packed`, `.shipped`, `.outbound_exception`) | styles.css | 1d |
| **1n** | Add OUTBOUND action button and enter button styles | styles.css | 1d |

**Estimated scope:** ~200–300 lines across 5 files. The faceplate HTML stays the same (three action buttons, same numpad, same enter). The changes are state, rendering, and style.

### Phase 2: Polish and derived signals

| Step | What |
|------|------|
| 2a | Extended progress display showing outbound counts (packed/shipped alongside pressed/qcPassed) |
| 2b | Jobs table column or indicator showing outbound progress |
| 2c | SHIP page showing packed/shipped counts per job |
| 2d | `suggestedStatus()` extension: suggest fulfillment phase when packed reaches ordered |
| 2e | "Show all" feed toggle (show both modes in feed) |
| 2f | TV ticker outbound stats |

### Phase 3: Future (not planned)

| Possibility | Notes |
|-------------|-------|
| Outbound logging from SHIP page (quick log) | If SHIP wants inline "mark N as shipped" without switching to LOG |
| Per-box logging (box ID + qty per box) | If box-level traceability becomes important |
| Integration with PACK CARD (auto-advance pack items when packed count reaches threshold) | Only if operationally useful |
| Floor Manager outbound mode | If FM role does outbound work on the floor |

---

## 15. Visual separation summary

### 15.1 Color mapping across modes

| Element | PRESS mode | OUTBOUND mode |
|---------|-----------|---------------|
| Mode toggle active | amber tint | cyan tint |
| Faceplate border (default) | `--w2` (dark amber) | `--cy2` (dark cyan) |
| Action 1 (primary) | PRESS → amber | PACKED → cyan |
| Action 2 (completion) | PASS → green | SHIPPED → green |
| Action 3 (exception) | REJECT → red | EXCEPTION → amber |
| Enter button | matches active action color | matches active action color |
| Rail bar fill | matches active action color | matches active action color |
| Feed entries | amber/green/red per stage | cyan/green/amber per stage |

### 15.2 Why this color mapping works

- **Cyan is the signal "you're in OUTBOUND."** It's visually distinct from amber/green/red without introducing a clash. The toggle, faceplate border, and primary action button all carry cyan in OUTBOUND mode.
- **Green stays green** in both modes. "Completion" (QC PASS / SHIPPED) is always green. Consistent meaning.
- **Red stays in PRESS mode** for REJECT. Outbound exceptions use **amber** instead of red because late-stage exceptions are "attention-needed" situations (billing hold, wrong config), not "defective product" situations. This is a meaningful distinction: a press reject is a quality failure; an outbound exception is an operational hold.
- **The mode toggle prevents confusion.** You are always in one mode. The faceplate's entire color personality changes. You cannot accidentally log a press event when you mean to log packed.

### 15.3 Subtle faceplate personality shift

When switching to OUTBOUND mode, the faceplate could have a subtle background tint shift (e.g., from `--s2` to a very dark cyan-tinted surface) to reinforce "you are in a different context." This is a polish item, not a requirement.

---

## 16. Key architectural decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Single console, mode toggle** | One LOG page with `logMode` state | One event grammar, one numpad, one feed. No fragmentation. |
| **Extend `progressLog`** | New stages in same array | One source of truth per job. No new JSONB columns. Feed reads one stream. |
| **Three actions per mode** | PRESS/PASS/REJECT and PACKED/SHIPPED/EXCEPTION | Matches the existing three-button faceplate. Clean cognitive parallel. |
| **Cyan for outbound** | New color token `--cy` | Distinct from all existing meaning-colors. Readable against dark background. |
| **Exception ≠ Reject** | Different reason catalog | Press rejects are defect types (flash, blemish). Outbound exceptions are operational reasons (billing hold, damage in packing). Different problem domains. |
| **Feed filters by mode** | PRESS feed, OUTBOUND feed | Focused context per mode. "Show all" as optional enhancement. |
| **PACK CARD untouched** | Readiness ≠ counting | PACK CARD answers "ready to pack?" LOG answers "how many packed?" Different questions. |

---

## 17. Open questions (for implementation time)

1. **Should the mode toggle persist across page navigation?** Recommendation: yes, via `sessionStorage` (same pattern as TV party mode). If someone is logging outbound all afternoon, they shouldn't have to re-toggle every time they visit LOG.
2. **Should Press Station and QC Station get OUTBOUND mode?** Recommendation: no, not in v1. Stations are role-scoped (press operator, QC operator). Outbound logging is a different operational role. If needed later, a dedicated "Packing Station" shell could use OUTBOUND mode.
3. **Should `outbound_exception` events link to job-level caution?** Recommendation: not automatically. Exception events are counted facts. Job-level caution is a manual flag. They can be correlated by a human ("I see 5 exceptions → I'll set caution on this job") but shouldn't be auto-wired.
4. **OUTBOUND_EXCEPTION_TYPES naming:** The list above is a starting suggestion. Should be refined with plant input before build.
5. **"Packed" vs "Assembled":** The plant may prefer "assembled" over "packed" since assembly (sleeve + jacket + insert + wrap) is distinct from boxing. If so, the action could be `ASSEMBLED` and the stage `assembled`. This is a naming decision, not an architecture decision.

---

*End of LOG 2.0 planning document. For implementation, follow the sequence in §14 and respect the boundaries in §6. See `docs/pack-card-v1-plan.md` for PACK CARD architecture and `docs/ship-page-roadmap.md` for SHIP.*
