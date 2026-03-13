# ACHTUNG Protocol

**Status:** Canonical reference — this is the source of truth for ACHTUNG behavior in PMP OPS.

---

## 1. Definition

ACHTUNG is the PMP OPS **exception overlay protocol**. It marks an object as not flowing normally and signals that human attention is required.

ACHTUNG is orthogonal to status. A job can be `pressing` and ACHTUNG'd. An asset can be `received` and then cycled to ACHTUNG. Status describes *where something is in the pipeline*. ACHTUNG describes *whether something needs attention right now*.

ACHTUNG has one icon (⚠), one color family (amber `#ffb300`), and one lifecycle — expressed at different interaction depths depending on the surface.

---

## 2. Lifecycle

Every ACHTUNG instance follows the same five-stage lifecycle:

```
FLAG → STAMP → NAG → CONTEXT → PERSIST → RESOLVE
```

### FLAG
An operator marks an object as ACHTUNG. The trigger mechanism varies by surface (cycle, dropdown, inline button), but the result is always the same: the object enters the ACHTUNG state.

### STAMP
The system records the exact moment of flagging as an ISO 8601 timestamp. All downstream pulse/nag logic references this timestamp.

- **Job-level:** `job.caution.since`
- **Asset-level:** `assets[key].cautionSince`
- **Pack-level:** `packCard[key].cautionSince`

### NAG
The system pulses the ⚠ indicator and prompts for context. On detail surfaces (Asset Card, Pack Card), the row may lock inputs until a note is provided. On operational surfaces (Jobs, Floor, SHIP), the pill or icon pulses.

### CONTEXT
The operator adds a note to `notesLog`. The system detects a note with `timestamp >= since` and stops the nag. The pulse stops. The signal remains.

### PERSIST
The ACHTUNG flag stays active — amber triangle, visible on all surfaces — until explicitly resolved. Adding a note does not clear the flag. Changing job status does not clear the flag. No timer clears the flag.

### RESOLVE
An operator explicitly removes the ACHTUNG state:
- **Job-level:** RSP dropdown set to "— None" and saved, or `clearCaution(jobId)`.
- **Asset-level:** Cycle status away from `caution` (to `''`, `received`, or `na`).
- **Pack-level:** Cycle status away from `caution`.

---

## 3. Pulse Meaning

Pulse has exactly one meaning across the entire application:

| Visual | Meaning |
|--------|---------|
| **Pulsing amber ⚠** | ACHTUNG is active AND context is missing — the system is asking *"why?"* |
| **Static amber ⚠** | ACHTUNG is active AND context has been provided — flagged, explained, not yet resolved |
| **No ⚠** | Object is clear |

Any surface where ⚠ always pulses regardless of note state is non-canonical and should be normalized.

---

## 4. Notes Relationship

ACHTUNG flags. NOTES explains. These are separate acts by design.

### The Note Satisfaction Rule

A note satisfies the ACHTUNG context requirement when:
1. It exists in the job's `notesLog` array.
2. Its `timestamp` is `>=` the ACHTUNG `since` timestamp (ISO string comparison).
3. **For scoped objects (assets):** the note's `assetKey` must match the flagged asset's key.
4. **For unscoped objects (job-level, pack-level):** any note on the job satisfies it.

The system does not inspect note content, length, person, or type. Existence after the timestamp is sufficient.

### What a note does and does not do

- A note **stops the pulse** (satisfies the nag).
- A note **does not clear ACHTUNG** (the flag persists until explicitly resolved).
- Setting ACHTUNG **does not auto-create a note** (flag and context are separate acts).

### Trigger-time composer

At trigger time, an inline composer may appear to capture initial context. This composer writes to `notesLog` (tagged with `cautionContext: true`). After submission, the composer disappears. The surface does not become an ongoing editable notes surface. This exists on:

- **RSP:** Text field in the ACHTUNG drawer (writes to `notesLog` when caution is newly set with text).
- **SHIP LOG:** Inline composer appears when activating ACHTUNG (writes to `notesLog` via `setCaution`).
- **Asset Card:** Existing inline `+ NOTE` composer on locked rows (writes via `addAssetNoteFromOverlay`).

---

## 5. Signal vs Explanation

| Layer | Role | Where it lives |
|-------|------|----------------|
| **Signal** | "Something is wrong" | ⚠ icon, amber color, pulse, row highlight — on boards/tables/cards |
| **Explanation** | "Here's what's wrong" | NOTES (`notesLog` entries) |

### Rules

- Boards and overview surfaces show **signal only** — the ⚠ symbol, amber border/background, pulse when applicable.
- Boards do **not** display inline narrative text about the ACHTUNG reason. The `caution.text` field appears only in tooltips.
- Clicking the ⚠ symbol on any display surface routes to NOTES with the correct job/object context pre-selected.
- NOTES is the canonical home for all explanation, context, proof, and communication.
- The ⚠ symbol on a board is a bridge from signal to explanation.

---

## 6. Surface Behavior

Surfaces implement ACHTUNG at one of three interaction depths:

### Full Protocol (Detail Surfaces)

Used by: **Asset Card**, **Pack Card**

- Status cycle includes `caution` as a state.
- `cautionSince` timestamp recorded on entry.
- Row locks detail inputs while context is missing (asset-level).
- Row pulses while context is missing.
- Inline `+ NOTE` composer or ⌕ (view notes) button available.
- Pulse stops when a qualifying note exists.
- Signal persists until status is cycled away from `caution`.

### Signal Protocol (Operational Surfaces)

Used by: **Jobs table**, **Jobs mobile cards**, **Floor table**, **Floor card**, **SHIP table**, **RSP Icon Zone**, **SHIP LOG console**

- ⚠ pill or icon displayed when ACHTUNG is active.
- Pill/icon pulses when context is missing (`cautionNeedsNote` / `cautionLocked`).
- Pill/icon is static amber when context exists.
- Click routes to NOTES with job context.
- RSP provides the trigger/clear mechanism (drawer with dropdown + text field).
- SHIP LOG provides a trigger mechanism (inline composer) and view mechanism (click routes to NOTES when active).

### Instrument Protocol (Read-Only Surfaces)

Used by: **ENGINE**, **TV**, **Floor stats bar**

- ACHTUNG appears as a count or aggregate metric.
- Click-through filters to relevant objects.
- No trigger, no pulse, no routing to NOTES.

---

## 7. Object Scopes

ACHTUNG operates at three object scopes. Each scope has its own data field but follows the same lifecycle.

### Job-Level

| Field | Type | Location |
|-------|------|----------|
| `job.caution` | JSONB object or `null` | Supabase column: `caution` |
| Shape | `{ reason: string, since: string, text: string }` | |

- **Reasons:** `stuck`, `customer`, `billing`, `traffic_jam`, `special`, `achtung`, `other`, or `''` (none).
- **Trigger:** RSP dropdown, Floor Card dropdown, SHIP LOG ACHTUNG button.
- **Note check:** Any `notesLog` entry with `timestamp >= caution.since`.
- **Resolution:** RSP dropdown to "— None" and save.
- **Surfaces:** Jobs table, Jobs mobile, Floor table, Floor card, SHIP table, RSP, SHIP LOG button, ENGINE/Floor stats.

### Asset-Level

| Field | Type | Location |
|-------|------|----------|
| `job.assets[key].cautionSince` | ISO string or `''` | Inside `assets` JSONB column |
| `job.assets[key].status` | `'caution'` | Inside `assets` JSONB column |

- **Trigger:** Status cycle on Asset Card (`'' → received → na → caution → ''`).
- **Note check:** `notesLog` entry with `assetKey === key` AND `timestamp >= cautionSince`.
- **Resolution:** Cycle status away from `caution`.
- **Surfaces:** Asset Card (full protocol), NOTES feed (⚠ icon on caution-state asset notes).
- **Canonical reference implementation** — this is the most mature and complete scope.

### Pack-Level

| Field | Type | Location |
|-------|------|----------|
| `job.packCard[key].cautionSince` | ISO string or `''` | Inside `pack_card` JSONB column |
| `job.packCard[key].status` | `'caution'` | Inside `pack_card` JSONB column |

- **Trigger:** Status cycle on Pack Card (`'' → ready → na → caution → ''`).
- **Note check:** Any `notesLog` entry with `timestamp >= cautionSince`.
- **Resolution:** Cycle status away from `caution`.
- **Surfaces:** Pack Card (full protocol).

---

## 8. Resolution Rules

1. **Resolution is always explicit and manual.** No timer, status change, or note addition auto-clears ACHTUNG.
2. **One reason at a time** per job (job-level). Assets and pack items are independently scoped.
3. **Adding a note satisfies the nag** (stops pulse) but does not resolve the flag.
4. **Resolving ACHTUNG removes the flag entirely.** The signal disappears from all surfaces.
5. **There is no escalation, severity, or aging system.** ACHTUNG is binary: active or clear.

---

## 9. Scenario Classes

ACHTUNG covers these real operational exception classes:

| Scenario | Typical Reason | Scope |
|----------|---------------|-------|
| Job stuck / not progressing | `stuck` | Job |
| Waiting on customer response | `customer` | Job |
| Billing or payment issue | `billing` | Job |
| Added step / traffic jam | `traffic_jam` | Job |
| Special handling required | `special` | Job |
| General attention needed | `achtung` / `other` | Job |
| Asset not received / problematic | (status cycle) | Asset |
| Packing item concern | (status cycle) | Pack |
| Outbound hold / ship exception | `achtung` via SHIP LOG | Job |

Scenarios that do **not** belong in ACHTUNG:
- Normal pipeline progression → use **status**.
- Detailed explanation of a problem → use **NOTES**.
- Counted movement events → use **LOG**.
- Routine communication → use **NOTES**.

---

## 10. What ACHTUNG Is Not

- **Not a replacement for status.** Status = pipeline position. ACHTUNG = exception overlay.
- **Not a notes system.** ACHTUNG flags; NOTES explains.
- **Not a workflow gate.** ACHTUNG does not prevent status changes, logging, or other operations.
- **Not a severity system.** There is no "warning vs critical." ACHTUNG is binary.
- **Not a ticketing system.** There is no assignment, SLA, or escalation chain.
- **Not a counted event.** ACHTUNG is state, not movement. LOG records movement.
- **Not auto-resolving.** Nothing clears ACHTUNG except an explicit human action.

---

## 11. Relationship to Other Systems

### Status
ACHTUNG is orthogonal to status. A job can be `pressing` and ACHTUNG'd simultaneously. Changing status does not set or clear ACHTUNG. They are independent dimensions.

### NOTES
NOTES is the explanation layer for ACHTUNG. When ACHTUNG is set, the system nags for a note. When a note exists, the nag stops. Clicking any ACHTUNG symbol on a display surface routes to NOTES. The `cautionContext: true` flag tags notes written at trigger time.

### LOG
LOG records counted movement (PRESS and SHIP modes). ACHTUNG is not a LOG event. However, SHIP LOG provides a trigger surface for job-level ACHTUNG via the ⚠ button and inline composer.

### Asset Card
Asset Card is the **canonical reference implementation** of the full ACHTUNG protocol. Status cycle includes `caution`, rows lock and pulse, inline composer writes to NOTES, pulse stops on qualifying note, resolution is by cycling away.

### Pack Card
Pack Card implements the full protocol: status cycle with `cautionSince`, pulse-until-note logic, and resolution by cycling away. Note check is job-scoped (any note after timestamp satisfies).

### SHIP / LOG SHIP
SHIP table displays the job-level `cautionPill` (signal protocol). LOG SHIP provides a trigger mechanism — the ⚠ button opens an inline composer when activating, and routes to NOTES when the job is already ACHTUNG'd. The button reflects pulse vs static state.

### Jobs / Floor / RSP
- **Jobs page:** `cautionPill` with pulse/static logic, click routes to NOTES, filter dropdown includes `⚠ ACHTUNG`.
- **Floor table:** ⚠ icon with pulse/static logic, click routes to NOTES.
- **Floor card:** ⚠ icon with pulse/static logic, click routes to NOTES. Quick-edit form has ACHTUNG reason dropdown.
- **RSP:** Icon Zone ⚠ button opens ACHTUNG drawer (dropdown + context text field). Button shows pulse/static state. Drawer is the canonical workbench for setting/clearing job-level ACHTUNG.

### ENGINE
ENGINE shows ACHTUNG as an aggregate count in the Floor stats bar. Click-through filters to ACHTUNG'd jobs. Display-only — no trigger or resolution.

---

## 12. Implementation Notes

### Data persistence

| Scope | Supabase Column | Type | Shape |
|-------|----------------|------|-------|
| Job | `caution` | JSONB | `{ reason, since, text }` or `null` |
| Asset | `assets` | JSONB | `assets[key].cautionSince` (string) + `.status = 'caution'` |
| Pack | `pack_card` | JSONB | `packCard[key].cautionSince` (string) + `.status = 'caution'` |
| Notes | `notes_log` | JSONB | Array of `{ text, person, timestamp, cautionContext?, assetKey? }` |

### Key functions (internal names use legacy `caution` terminology)

| Function | File | Role |
|----------|------|------|
| `isJobCautioned(job)` | `core.js` | Returns `true` if `job.caution.reason` is truthy |
| `cautionNeedsNote(job)` | `core.js` | Returns `true` if no note exists after `caution.since` |
| `cautionPill(job)` | `core.js` | Renders ⚠ pill with pulse/static class and click-to-NOTES |
| `cautionReasonLabel(reason)` | `core.js` | Maps reason code to display label |
| `setCaution(jobId, reason, text)` | `app.js` | Sets or clears job-level ACHTUNG; writes to `notesLog` if text provided |
| `clearCaution(jobId)` | `app.js` | Clears job-level ACHTUNG (delegates to `setCaution`) |
| `toggleShipAchtung()` | `app.js` | SHIP LOG trigger — opens composer or routes to NOTES |
| `togglePanelCaution()` | `app.js` | RSP drawer toggle |
| `cycleAssetsOverlayStatus(key)` | `render.js` | Asset status cycle including `caution` with `cautionSince` |
| `cyclePackStatus(key)` | `render.js` | Pack status cycle including `caution` with `cautionSince` |
| `getAssetStatus(d)` | `core.js` | Canonical asset status derivation |
| `getPackItemStatus(item)` | `core.js` | Canonical pack item status derivation |

### CSS tokens

| Token | Meaning |
|-------|---------|
| `caution-pill-pulse` | Job pill pulsing (needs note) |
| `caution-pill` | Job pill static (has note or display-only) |
| `asset-row-caution-locked` | Asset row locked (needs note) |
| `asset-btn-pulse` | Asset add-note button pulsing |
| `pk-row-caution-locked` | Pack row locked (needs note) |
| `pk-btn-pulse` | Pack status badge pulsing |
| `achtung-active` | SHIP LOG button active (job cautioned) |
| `achtung-pulse` | SHIP LOG button pulsing (needs note) |
| `floor-caution-satisfied` | Floor icon static (has note) |
| `caution-active` | RSP button active |
| `caution-pulse` | RSP button pulsing (needs note) |

### Shared animation

All pulse animations use `@keyframes cautionPulse` — amber box-shadow oscillation at 1.4–1.6s intervals. Asset Card has a dedicated `@keyframes asset-btn-pulse` for the add-note button.

### Internal naming convention

Internal function names, CSS classes, HTML element IDs, and the database column still use `caution` terminology. This is intentional — renaming would create high churn with no user-visible benefit. The user-facing protocol name is **ACHTUNG**. The internal implementation name is `caution`. Both refer to the same thing.

---

## Supersedes

This document supersedes:
- `docs/achtung-expansion-plan.md` (historical)
- `docs/achtung-canonical-model.md` (folded into this document)
- `docs/achtung-protocol-unification-plan.md` (folded into this document)
- `docs/achtung-protocol-audit.md` (findings incorporated)
