# ACHTUNG Protocol — Unification Plan

> **Status:** Superseded by `docs/achtung-protocol.md`. Retained for historical context.

> Based on the completed ACHTUNG Protocol Audit (`docs/achtung-protocol-audit.md`).
> Read-only planning pass. No code changes.

---

## 1. Canonical Definition

**ACHTUNG is the PMP OPS exception overlay protocol.**

It marks an object — a job, an asset, or a pack item — as **not flowing normally and needing human attention before it can proceed.** It does not replace the object's primary status. It does not explain itself — NOTES explains. ACHTUNG flags. NOTES talks.

The protocol follows one lifecycle everywhere:

> **Flag → Timestamp → Require context → Surface → Resolve**

ACHTUNG is an overlay, not a state machine. It lives beside status, not inside it. A job can be `in_progress` and ACHTUNG'd. An asset can be `received` and ACHTUNG'd. The two are orthogonal.

ACHTUNG is not:
- A replacement for job status (use status for pipeline position)
- A replacement for notes (use notes for communication and proof)
- A workflow gate (it nags, it may lock detail forms, but it does not prevent saving or shipping)
- A severity system (there is no ACHTUNG-1 vs ACHTUNG-5)
- A ticketing system (there are no assignees, SLAs, or escalation chains)

---

## 2. Canonical Lifecycle

Every ACHTUNG, at every scope, should follow this lifecycle:

```
┌─────────────────────────────────────────────────────────────┐
│                    ACHTUNG LIFECYCLE                         │
│                                                             │
│  1. FLAG          Someone marks the object as ACHTUNG.      │
│                   A reason is selected or implied.           │
│                   A timestamp (since) is recorded.           │
│                                                             │
│  2. SURFACE       The flag propagates to every view that     │
│                   shows this object. Amber. Triangle. Glow.  │
│                                                             │
│  3. NAG           The system nags for context.               │
│                   Pulse animation. "+ NOTE" prompt.           │
│                   Optional: lock detail until note added.    │
│                                                             │
│  4. CONTEXT       Someone adds a note explaining the         │
│                   situation. The nag stops. The pulse stops.  │
│                   The ACHTUNG remains active.                │
│                                                             │
│  5. RESOLVE       Someone explicitly clears the ACHTUNG.     │
│                   The flag is removed. The object is normal.  │
│                   Notes remain as the historical record.      │
└─────────────────────────────────────────────────────────────┘
```

### Key design rules

1. **Flag and context are separate acts.** Setting ACHTUNG does not require a note at the moment of flagging. The protocol nags afterward. This lets a fast operator flag something quickly and explain later — which matches plant reality.

2. **Context satisfies the nag, not the flag.** Adding a note stops the pulse and removes the `+ NOTE` prompt. It does not clear the ACHTUNG. The exception persists until someone deliberately resolves it.

3. **Resolve is always manual.** No auto-clear on status change, note addition, or timer expiry. If the situation changed, a human should confirm it.

4. **One reason at a time per object.** A job carries one ACHTUNG reason. If the situation is more complex, the text field and notes provide nuance. This keeps the model flat and the UI clean.

---

## 3. Canonical Note Rule

### The contract

| Principle | Rule |
|-----------|------|
| **ACHTUNG flags.** | Setting ACHTUNG does NOT create a note. |
| **NOTES explains.** | The note is the explanation, not the flag. |
| **The system nags.** | Until a note is added after `since`, the UI pulses and prompts. |
| **A note satisfies the nag.** | Any note with `timestamp >= since` (and matching scope key for assets) stops the nag. |
| **A note does not clear the flag.** | ACHTUNG remains active after a note. Resolution is separate. |
| **ACHTUNG does not write to LOG.** | Currently true. This should remain — LOG is for counted movement. A future audit-trail enhancement could add a lightweight ACHTUNG event to `notesLog` (not `progressLog`), but this is not required for unification. |

### Scope-specific note rules

| Scope | Note check | What satisfies it? | What happens after? |
|-------|-----------|---------------------|---------------------|
| **Job** | `cautionNeedsNote()` — any `notesLog` entry with `timestamp >= caution.since` | Any note for the job | Pulse stops, `+ NOTE` disappears. ACHTUNG stays active. |
| **Asset** | Timestamp check — any `notesLog` entry with matching `assetKey` and `timestamp >= cautionSince` | An asset-scoped note | Row unlocks, detail form reappears. ACHTUNG stays active. |
| **Pack** | **Should be:** same logic — any `notesLog` entry with `timestamp >= cautionSince` (currently missing) | A note for the job (asset-scoped not applicable for pack items) | Pulse stops, lock lifts. ACHTUNG stays active. |

### Recommended pack-level note rule

Pack items should gain a `cautionSince` timestamp (matching assets). The note check should look for any note on the job with `timestamp >= cautionSince`. Pack items do not have their own `assetKey` equivalent in the notes system, so any job-level note after the timestamp satisfies it. This is simpler than asset-level (which scopes to `assetKey`) but still enforces the "flag → nag → context → persist" lifecycle.

---

## 4. Canonical Visual / Interaction Rules

### Icon

**⚠** (U+26A0, warning triangle) — used everywhere. No emoji. No SVG replacement needed. The triangle is the ACHTUNG glyph.

### Color

**Amber `#ffb300`** with these graduated opacities:

| Use | Value |
|-----|-------|
| Text / icon / border (active) | `#ffb300` |
| Background tint | `rgba(255,179,0,0.06)` to `rgba(255,179,0,0.12)` |
| Glow / box-shadow | `rgba(255,179,0,0.3)` to `rgba(255,179,0,0.6)` |
| Border (softer) | `rgba(255,179,0,0.5)` |

No other color should represent ACHTUNG. Green is healthy. Cyan is SHIP/PACK family. Amber is ACHTUNG. Red is reject.

### Pulse behavior

| State | Pulse? | What pulses? |
|-------|:------:|--------------|
| ACHTUNG active, note needed | ✅ | The ⚠ icon, the pill, or the status chip — depending on surface. Uses `@keyframes cautionPulse`. |
| ACHTUNG active, note satisfied | ❌ | No pulse. Amber glow remains but is static. |
| ACHTUNG cleared | ❌ | No visual. Normal state. |

**Canonical rule:** Pulse means "this needs context." Static amber means "this is flagged but we know why." No amber means "clear."

**Floor exception:** Floor ⚠ currently always pulses regardless of note state. This should be normalized — Floor should pulse only when `cautionNeedsNote()` is true, matching Jobs page behavior.

### Inactive / active treatment

| Element | Inactive | Active (note satisfied) | Active (note needed) |
|---------|----------|------------------------|---------------------|
| RSP ⚠ button | Default button color | Amber border + bg | Amber border + bg + pulse |
| LOG SHIP ⚠ button | Grey border, muted | Amber border + bg + pulse | Same |
| Floor ⚠ icon | Not rendered | Amber, static | Amber, pulsing |
| Table row | Normal | Amber left border + warm bg | Same + pill pulses |
| Card | Normal | Amber border | Same + pill pulses |
| Asset/Pack row | Normal | Amber left border, ⚠ icon | Same + pulse + lock (asset) |

### Click behavior by surface type

| Surface type | ⚠ click action | Rationale |
|-------------|----------------|-----------|
| **Fast operational** (Floor table, Floor Card) | Route to NOTES (filtered to job) | Floor stays fast. No inline forms. |
| **Managerial** (Jobs table/cards) | `+ NOTE` button routes to NOTES with add form open | Jobs page is for inspection + action. |
| **Workbench** (RSP) | Toggle ACHTUNG drawer (reason + text) | RSP is the job workbench. Editing lives here. |
| **Card Zone** (Asset Card) | Status cycle includes caution. Locked row has inline note composer. ⌕ routes to NOTES. | Card Zone is the detail surface. Full interaction. |
| **Card Zone** (Pack Card) | Status cycle includes caution. ⌕ routes to NOTES. (Should add: pulse, lock.) | Should match Asset Card depth. |
| **Console** (LOG SHIP) | One-click toggle. No inline form. | Console is fast. Flag now, explain later. |
| **Instrument** (ENGINE, TV) | Display-only. Click-through to job detail (RSP or NOTES). | ENGINE reads, it doesn't write. |
| **Communication** (NOTES) | Display-only ⚠ icon on relevant notes. | NOTES is the explanation layer. |

---

## 5. Surface Normalization Plan

### 5.1 Jobs Page

**Current state:** ✅ Strong — pill, row highlight, `+ NOTE`, filter, text display.

**Changes needed:**
- Rename filter label from `⚠ CAUTIONED` to `⚠ ACHTUNG` (user-facing terminology).
- Otherwise, this is the reference surface for job-level ACHTUNG. No structural changes.

### 5.2 Floor Page

**Current state:** Good but slightly inconsistent.

**Changes needed:**
1. **Normalize pulse:** Floor ⚠ icon should pulse only when `cautionNeedsNote()` is true (currently always pulses). This makes Floor consistent with Jobs page and teaches the same visual language: pulse = needs context, static = flagged with context.
2. Rename stat label from `⚠ CAUTIONED` to `⚠ ACHTUNG`.

### 5.3 SHIP Page

**Current state:** Shows pill + row highlight but no `+ NOTE` button.

**Changes needed:**
1. **Add `cautionNoteBtn(j)` to SHIP table rows.** If a cautioned job appears on SHIP without context, the operator should see the same `+ NOTE` nag as on Jobs page. This is a one-line addition in the ship row template.

### 5.4 RSP (Right-Side Panel)

**Current state:** Good — drawer with reason + text. Auto-opens for cautioned jobs.

**Changes needed:**
1. **Rename label** from "⚠ Caution / Blocker" to "⚠ ACHTUNG".
2. **Rename "Caution Note"** to "ACHTUNG note" or just "Note (short context)".
3. **Sync dropdown options** with `CAUTION_REASONS`. Currently the HTML has 7 options (missing `achtung`). Decision: **remove `achtung` as a reason value** from `CAUTION_REASONS` entirely. The LOG SHIP quick-flag should use `reason: 'attention'` (new) instead. This resolves the "achtung is both the protocol and a reason" ambiguity. See §6 for the updated reason vocabulary.
4. **Rename toast** from "Caution cleared" to "ACHTUNG cleared".

### 5.5 Card Zone / Asset Card

**Current state:** ✅ Strongest implementation. The reference model.

**Changes needed:**
- None structurally. This is the gold standard for item-level ACHTUNG.
- Minor: the "add note or change state" locked-row hint could include the word ACHTUNG for terminology consistency, but this is cosmetic.

### 5.6 Card Zone / Pack Card

**Current state:** Weakest implementation. Status exists but protocol is incomplete.

**Changes needed (highest priority unification target):**
1. **Add `cautionSince` field** to pack item data shape. When cycling to caution, stamp `cautionSince = new Date().toISOString()`. When cycling away, clear it.
2. **Add note-required check.** Pack items don't have a per-item `assetKey` in the notes system, so use a simpler check: any `notesLog` entry with `timestamp >= cautionSince` satisfies the nag. (This is the job-level check, not the asset-scoped check.)
3. **Add pulse animation** to cautioned pack rows when note is needed.
4. **Add lock behavior** to match Asset Card: when cautioned and no note since, suppress detail inputs and show "add note or change state."
5. **Add inline `+ NOTE` or composer link** — at minimum, the ⌕ button that already exists should pulse when note is needed.

This brings Pack Card to parity with Asset Card and completes the protocol at all three scopes.

### 5.7 LOG PRESS Mode

**Current state:** No ACHTUNG features.

**Changes needed:** None. PRESS mode is counted production movement. ACHTUNG does not belong here. If a job is ACHTUNG'd, the LOG SHIP achtung button and the RSP drawer are the right surfaces.

### 5.8 LOG SHIP Mode

**Current state:** Functional achtung toggle but lacks reason/text granularity.

**Changes needed:**
1. **Rename reason value** used by the LOG SHIP toggle from `'achtung'` to `'attention'`. This resolves the "achtung is both protocol and reason" ambiguity.
2. **No text prompt needed.** The one-click flag-now-explain-later pattern is correct for a console. The system nags via `cautionNeedsNote()` after the fact. Adding a text prompt would slow down the console.
3. **Normalize pulse:** The `achtung-active` glow should pulse only when `cautionNeedsNote()` is true for the selected job. Currently it always pulses when active. This teaches the same visual language as everywhere else.

### 5.9 Floor Card Quick-Edit

**Current state:** Reason dropdown but no text field.

**Changes needed:**
1. **Remove `achtung` from the reason dropdown** (after the reason value rename).
2. Consider adding a text input to match RSP. Not strictly required — the Floor Card is a fast surface and the RSP drawer is the full-form editing path. Low priority.

### 5.10 ENGINE Page

**Current state:** ACHTUNG'd jobs bundled into BLOCKERS count alongside `hold` and offline presses.

**Changes needed:**
1. **Add a standalone ⚠ ACHTUNG metric block** to the ENGINE grid. The metric map already defines it (`M10`). This gives ACHTUNG first-class visibility on the instrument panel.
2. **Keep BLOCKERS count** as a separate composite metric if desired, but ACHTUNG should also stand alone.
3. In the detail view, clicking through should show the list of ACHTUNG'd jobs with reason labels, matching the pattern of other ENGINE detail views.

### 5.11 TV Surface

**Current state:** Cautioned jobs in BLOCKERS count.

**Changes needed:**
- Same as ENGINE. If ENGINE gets a standalone ACHTUNG block, TV should surface it too.

### 5.12 NOTES Page

**Current state:** ⚠ icon on notes for currently-cautioned assets. Display-only.

**Changes needed:**
1. **Extend ⚠ icon to job-level caution.** If a note was written for a job that is currently ACHTUNG'd, show the ⚠ icon on that note entry. Currently only asset-level caution drives this icon.
2. **Consider:** A subtle visual marker distinguishing "this note was written after the ACHTUNG was set" from other notes. Not required for unification but would make the timeline more readable. Low priority.

---

## 6. Scenario Mapping

### Updated ACHTUNG reason vocabulary

Based on audit findings, the recommended canonical reason set is:

| Value | Label | Use case |
|-------|-------|----------|
| `stuck` | Stuck | General blockage — can't proceed for any reason not covered below |
| `customer` | Waiting on Customer | Awaiting approval, response, or decision from the client |
| `billing` | Billing Issue | Payment, invoice, or financial hold |
| `traffic_jam` | Traffic Jam | Added step, unexpected process change, scheduling conflict |
| `special` | Special Handling | Signed copies, handmade elements, split shipment, fragile treatment |
| `mismatch` | Source Mismatch | What PMP OPS says vs. what reality is — inventory discrepancy, wrong version, label error |
| `attention` | Needs Attention | Quick flag (replaces old `achtung` reason). Generic "look at this." Used by LOG SHIP toggle and any fast one-click flag path. |
| `other` | Other | Anything not covered above |

**Removed:** `achtung` as a reason value. "ACHTUNG" is now exclusively the protocol name.

**Added:** `mismatch` (source-truth discrepancy) and `attention` (renamed from `achtung`).

### Real-world scenario routing

| Scenario (from Bitrix/plant language) | Route to... | Why? |
|---------------------------------------|-------------|------|
| **TP FAIL** | Asset Card → cycle Test Press to ACHTUNG + note | Asset-level exception. The TP asset is the problem, not the job. |
| **AWAITING TP APPROVAL** | Asset Card → cycle Test Press to ACHTUNG | Waiting state on a specific asset. |
| **STUCK** | RSP → ACHTUNG drawer → `stuck` | Job-level blockage. |
| **BILLING ISSUE** | RSP → ACHTUNG drawer → `billing` | Job-level financial hold. |
| **WAITING ON CUSTOMER** | RSP → ACHTUNG drawer → `customer` | Job-level external dependency. |
| **ADDED STEP / TRAFFIC JAM** | RSP → ACHTUNG drawer → `traffic_jam` | Job-level process disruption. |
| **NEED SHIPPING QUOTE** | RSP → ACHTUNG drawer → `customer` + text "needs shipping quote" | Customer-dependent, with text for specificity. |
| **AWAITING FINAL PAYMENT** | RSP → ACHTUNG drawer → `billing` + text "final payment" | Financial hold. |
| **SPECIAL HANDLING (signed, handmade)** | RSP → ACHTUNG drawer → `special` + text, or Pack Card → ACHTUNG on relevant items | Can be job-level or item-level depending on scope. |
| **WRONG LABEL / INVENTORY MISMATCH** | RSP → ACHTUNG drawer → `mismatch` | Source-truth discrepancy. New first-class reason. |
| **SHIP HOLD / OUTBOUND EXCEPTION** | LOG SHIP → achtung toggle (`attention`) + note later | Fast outbound flag. |
| **PACKING PROBLEM (wrong sleeve, missing insert)** | Pack Card → cycle item to ACHTUNG + note | Item-level packing exception. (Requires pack-level protocol completion.) |
| **PROJECT COMPLETE but not picked up** | Status change. Not ACHTUNG. | This is a pipeline state, not an exception. |
| **GENERAL "look at this"** | LOG SHIP → `attention`, or RSP → `attention` | Quick flag for anything not covered by a specific reason. |

### What should NOT be ACHTUNG

| Scenario | What to use instead |
|----------|---------------------|
| Normal pipeline position (in progress, assembly, done) | Job status |
| Fulfillment stage (ready to ship, picked up) | `fulfillment_phase` field |
| Routine communication (updates, check-ins) | Notes only |
| Production counts (pressed, QC'd, packed) | LOG |
| Quality defects found during QC | LOG reject with defect type |

---

## 7. Priority Fixes

Ranked by value × coherence impact. Each fix is small and independent.

### Tier 1 — Protocol completion (highest value)

| # | Fix | Files | Effort | Why first? |
|---|-----|-------|--------|------------|
| **1** | **Pack Card: add `cautionSince` + note-required + pulse + lock** | `core.js`, `render.js`, `styles.css` | Medium | Closes the biggest protocol gap. Makes ACHTUNG feel like one thing across Card Zone. |
| **2** | **Rename `achtung` reason to `attention`; add `mismatch` reason** | `core.js`, `index.html`, `render.js`, `app.js` | Small | Resolves the protocol-name-as-reason ambiguity. Adds real value with `mismatch`. |
| **3** | **SHIP page: add `cautionNoteBtn(j)` to table rows** | `render.js` | Tiny (one line) | Closes a surface gap where ACHTUNG'd jobs have no note nag on SHIP. |

### Tier 2 — Terminology normalization (user-facing)

| # | Fix | Files | Effort | Why? |
|---|-----|-------|--------|------|
| **4** | **Rename user-facing labels: RSP "Caution / Blocker" → "ACHTUNG", toast "Caution cleared" → "ACHTUNG cleared"** | `index.html`, `app.js` | Small | Makes the house-coded language consistent. Users see "ACHTUNG" everywhere, not a mix of "caution" and "achtung." |
| **5** | **Rename filter/stat labels: "⚠ CAUTIONED" → "⚠ ACHTUNG"** | `render.js`, `index.html` | Small | Consistent with §4. |

### Tier 3 — Behavioral normalization

| # | Fix | Files | Effort | Why? |
|---|-----|-------|--------|------|
| **6** | **Floor ⚠ pulse: gate on `cautionNeedsNote()`** | `render.js` | Tiny | Makes pulse mean the same thing on every surface. |
| **7** | **LOG SHIP achtung glow: gate on `cautionNeedsNote()`** | `render.js` | Tiny | Same principle. |
| **8** | **Sync RSP dropdown with `CAUTION_REASONS` (dynamic generation instead of static HTML)** | `index.html` or `app.js` | Small | Eliminates the 7-vs-8 options drift. One source of truth. |

### Tier 4 — Instrument / visibility

| # | Fix | Files | Effort | Why? |
|---|-----|-------|--------|------|
| **9** | **ENGINE: add standalone ⚠ ACHTUNG metric block** | `core.js`, `render.js`, `styles.css` | Medium | Gives ACHTUNG first-class visibility on the instrument panel. |
| **10** | **NOTES: extend ⚠ icon to job-level ACHTUNG'd notes** | `render.js` | Small | Makes NOTES aware of job-level ACHTUNG, not just asset-level. |

### Tier 5 — Future considerations (not required for unification)

| # | Consideration | Notes |
|---|---------------|-------|
| 11 | ACHTUNG audit trail (log set/clear events to `notesLog`) | Valuable but not required for protocol coherence. |
| 12 | ACHTUNG age escalation (visual differentiation for old ACHTUNG) | Nice-to-have. Not required. |
| 13 | Multi-reason ACHTUNG | Not recommended. Keep model flat. Notes handle nuance. |
| 14 | ACHTUNG expiry / auto-clear | Not recommended. Manual resolve is correct. |

---

## 8. Documentation Plan

### Order of operations

After code unification is complete, update docs in this order:

| # | Document | Action | Depends on |
|---|----------|--------|------------|
| **1** | `docs/achtung-protocol.md` **(new)** | Create the canonical living reference for the unified ACHTUNG protocol. Define: meaning, lifecycle, data model, note contract, reason vocabulary, surface expectations. | — |
| **2** | `docs/achtung-expansion-plan.md` (renamed from `caution-expansion-plan.md`) | Add header marking it as **historical / superseded by `achtung-protocol.md`**. Do not delete — it's useful context for how the protocol evolved. | #1 |
| **3** | `docs/informationarchitecturev3.md` | Normalize "caution" → "ACHTUNG" in user-facing descriptions. Update Card Zone references. Add ACHTUNG protocol to the glossary. Reference `achtung-protocol.md`. | #1 |
| **4** | `docs/engine-language-guide.md` | Strengthen ACHTUNG entry. Confirm "Achtung" is the protocol name, not a reason. Add `attention` and `mismatch` to the vocabulary. | #1 |
| **5** | `docs/engine-page-spec.md` | Rename CAUTIONED to ACHTUNG in block/metric labels. Add standalone ACHTUNG block to the spec. | #1 |
| **6** | `docs/engine-metric-map.md` | Rename CAUTIONED metric to ACHTUNG. Update label/definition. | #1 |
| **7** | `docs/capability-map-overlay.md` | Add ACHTUNG as a named cross-system protocol capability. Normalize terminology. | #1 |
| **8** | `docs/pipeline-taxonomy.md` | Replace "caution" references with "ACHTUNG protocol" where describing exception handling. | #1 |
| **9** | `docs/pack-card-v1-plan.md` | Update to reflect completed pack-level protocol (after code fix #1). | Code fix #1 |
| **10** | `docs/log-2-plan.md` | Minor normalization — replace "caution" with "ACHTUNG" where appropriate. | #1 |
| **11** | `docs/achtung-protocol-audit.md` | Add header noting it is the pre-unification audit. Reference the new `achtung-protocol.md` as the canonical doc. | #1 |

### The canonical doc: `docs/achtung-protocol.md`

This is the most important deliverable. It should contain:

1. **Definition** — one paragraph (from §1 of this plan)
2. **Lifecycle** — the five-step diagram (from §2)
3. **Data model** — table of fields per scope (job, asset, pack)
4. **Reason vocabulary** — the canonical reason set (from §6)
5. **Note contract** — the exact rules (from §3)
6. **Visual rules** — icon, color, pulse logic (from §4)
7. **Surface behavior table** — what ACHTUNG does on each surface (from §5)
8. **What ACHTUNG is not** — explicit boundaries
9. **Scenario routing guide** — when to use ACHTUNG vs status vs notes (from §6)

This doc replaces `achtung-expansion-plan.md` (formerly `caution-expansion-plan.md`) as the source of truth and is referenced by all other architecture docs.
