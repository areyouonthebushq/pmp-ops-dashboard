# ACHTUNG — Canonical Model

> **Status:** Superseded by `docs/achtung-protocol.md`. Retained for historical context.

> The asset-level implementation is the reference. This document defines it as the canonical protocol model for all ACHTUNG behavior in PMP OPS.

---

## 1. Canonical Lifecycle

Every ACHTUNG, at every scope, follows five steps:

```
FLAG → STAMP → NAG → CONTEXT → PERSIST (until manual resolve)
```

| Step | What happens | Who acts |
|------|-------------|----------|
| **FLAG** | An object is marked ACHTUNG. The status changes. A `since` timestamp is recorded. | Operator (cycle-click, toggle, or drawer save) |
| **STAMP** | The system records the moment of flagging. All downstream checks reference this timestamp. | System (automatic) |
| **NAG** | The system pulses the ⚠ indicator and prompts for a note. The object may be locked (detail inputs suppressed) until context is provided. | System (automatic) |
| **CONTEXT** | Someone adds a note. The note is written to NOTES (the job's `notesLog`). The system detects that a note exists with `timestamp >= since` and stops the nag. | Operator (via inline composer or NOTES page) |
| **PERSIST** | The ACHTUNG flag remains active. Amber. Triangle. Visible on every surface that shows this object. Only the pulse stops. The flag is cleared only by an explicit manual action. | System (display) / Operator (manual resolve) |

### What does NOT happen

- Setting ACHTUNG does not auto-create a note.
- Adding a note does not auto-clear the flag.
- No timer clears ACHTUNG.
- No status change clears ACHTUNG.

---

## 2. Pulse vs Non-Pulse

Pulse has exactly one meaning everywhere:

| Visual state | Meaning |
|-------------|---------|
| **⚠ pulsing amber** | ACHTUNG is active AND context is still missing. No qualifying note exists after `since`. The system is asking: "why?" |
| **⚠ static amber** | ACHTUNG is active AND context has been provided. A qualifying note exists. The system knows why. The flag remains because the situation is not yet resolved. |
| **No ⚠** | Object is not ACHTUNG'd. Normal flow. |

**The rule:** Pulse = missing context. Static = flagged with context. Absent = clear.

This must be true on every surface. Any surface where ⚠ always pulses regardless of note state is non-canonical and should be fixed.

---

## 3. When a Note Satisfies Context

A note satisfies the ACHTUNG context requirement when:

1. The note exists in the job's `notesLog` array.
2. The note's `timestamp` is `>=` the ACHTUNG `since` timestamp.
3. **For scoped objects (assets):** the note's `assetKey` matches the flagged asset's key.
4. **For unscoped objects (job-level, pack items):** any note on the job satisfies it.

That's the entire rule. The system does not inspect the note's content, length, or type. Any note after the flag timestamp counts.

### Why this is correct

The system cannot judge whether a note is a good explanation. It can only verify that someone responded to the flag. The human writes the context. The system enforces that context was provided.

---

## 4. Explanation Belongs in NOTES

NOTES is the communication home. ACHTUNG is the signal layer.

| Responsibility | Belongs to |
|---------------|-----------|
| "Something is wrong" | ACHTUNG (flag + triangle + amber) |
| "Here's what's wrong" | NOTES (text, attachments, timestamps, attribution) |
| "Here's what we're doing about it" | NOTES |
| "It's resolved" | ACHTUNG clear (manual) + optional NOTES entry |

### What this means for surfaces

Boards, cards, tables, and consoles should show the **signal** — ⚠, amber, pulse — but should not display narrative ACHTUNG text inline. The short `text` field on job-level ACHTUNG (the RSP drawer's optional context input) is a convenience label, not a replacement for notes. It appears in tooltips, not as body text on operational surfaces.

**Canonical behavior:**
- ⚠ icon: always visible when ACHTUNG is active.
- Tooltip: shows reason label, optional short text, and age.
- Inline narrative: avoided. If explanation is needed, the user clicks ⚠ and goes to NOTES.

The one exception to inline text: the RSP drawer's short text input at trigger time. This is a label written at the moment of flagging — a shorthand, not a conversation. It is stored in `caution.text` and shown in tooltips only.

---

## 5. Boards Show Signal, Not Narrative

| Surface type | Shows | Does not show |
|-------------|-------|--------------|
| **Tables** (Jobs, Floor, SHIP) | ⚠ icon, amber row, pill with reason label | Inline caution text body, note content, expanded explanation |
| **Cards** (Floor Card, Job Card) | ⚠ icon, amber border | Inline caution text paragraphs |
| **Card Zone** (Asset Card, Pack Card) | ⚠ icon, amber row, locked state, pulse | Note composer (only as a one-time trigger-time convenience) |
| **Consoles** (LOG SHIP) | ⚠ toggle, amber glow | Caution text, note preview |
| **Instruments** (ENGINE, TV) | Count, metric block | Caution details, reason text |
| **NOTES** | Full explanation, attachments, history | (This IS the narrative surface) |
| **RSP** | Drawer with reason + short text, ⚠ button | Extended narrative (that goes in NOTES) |

### The inline composer exception

Asset Card currently allows an inline `+ NOTE` composer directly inside the card when an asset is ACHTUNG'd and locked. This is canonical. The composer writes to NOTES (`notesLog`). It does not store the note inside the asset data. The card is not becoming a notes app — it is providing a fast path to satisfy the ACHTUNG context requirement without leaving the card.

This pattern may be inherited by other surfaces at the trigger point only. The composer must write to NOTES, not to the surface's own data.

---

## 6. What Each Scope Should Inherit from Asset Behavior

### Reference: What asset-level ACHTUNG does today

1. Status cycle includes `caution` as a valid state.
2. Entering `caution` stamps `cautionSince` with the current ISO timestamp.
3. The system checks `notesLog` for a note with matching `assetKey` and `timestamp >= cautionSince`.
4. If no qualifying note exists → row is **locked** (detail inputs suppressed), ⚠ **pulses**, hint text says "add note or change state."
5. An inline `+ NOTE` composer is available per-row to write a note without leaving the card.
6. A ⌕ button routes to NOTES filtered by job + asset.
7. After a qualifying note → lock lifts, pulse stops, ⚠ remains static amber.
8. ACHTUNG remains active until the status is explicitly cycled away from `caution`.

### Job-level: what to inherit

| Asset behavior | Job-level today | Should inherit? | Notes |
|---------------|----------------|:---:|-------|
| `since` timestamp | ✅ Has it | — | Already present. |
| Note-required check | ✅ Has it (`cautionNeedsNote`) | — | Already present. Uses any `notesLog` entry with `timestamp >= since`. |
| Pulse gated on note state | ✅ On Jobs page pill. ⚠ On Floor (always pulses). | **Yes** | Floor ⚠ should pulse only when `cautionNeedsNote()` is true. |
| Lock / gate behavior | ❌ No lock | **No** | Job-level ACHTUNG should nag, not lock. Locking an entire job would block too many workflows. The nag (pulse + `+ NOTE`) is the right pressure. |
| Inline composer | ❌ No inline composer | **No** | Job-level trigger surfaces (RSP, Floor Card edit, LOG SHIP) already have their own input paths. The `+ NOTE` button routes to NOTES, which is correct. |
| ⚠ click → NOTES | ✅ On Floor. ❌ On Jobs (pill is not clickable). | **Yes** | The ⚠ pill on Jobs page should be clickable → route to NOTES filtered by job (matching Floor behavior). |
| Static amber after note | ✅ Pill stops pulsing | — | Already correct. |
| Manual resolve only | ✅ Must clear via RSP/edit | — | Already correct. |
| Short text in tooltip only | ⚠ `caution.text` shown inline on Jobs table | **Yes** | Jobs table currently shows `j-caution-text` as a `<div>` in the status cell. This should move to tooltip-only, matching the canonical rule that boards show signal, not narrative. |

**Summary for job-level:** Normalize Floor pulse gating. Make the Jobs page pill clickable → NOTES. Move inline caution text to tooltip. Everything else is already canonical.

### Pack-level: what to inherit

| Asset behavior | Pack-level today | Should inherit? | Notes |
|---------------|-----------------|:---:|-------|
| `since` timestamp | ❌ Missing | **Yes** | Add `cautionSince` to pack item data. Stamp on cycle to caution. Clear on cycle away. |
| Note-required check | ❌ Missing | **Yes** | Check `notesLog` for any entry with `timestamp >= cautionSince`. Pack items don't have an `assetKey` equivalent, so any job-level note satisfies it. |
| Pulse gated on note state | ❌ No pulse at all | **Yes** | Add pulse to ⚠ icon / `pk-stat-caution` chip when note is needed. Stop pulse after note. |
| Lock / gate behavior | ❌ No lock | **Yes** | Match Asset Card: suppress detail inputs (person, note fields) when ACHTUNG'd and no qualifying note. Show "add note or change state" hint. |
| Inline composer | ❌ Not present | **Optional** | The ⌕ button already exists and routes to NOTES. An inline composer per-row would match Asset Card exactly but is not strictly required — the ⌕ route is sufficient. Recommend: add inline composer for parity. |
| ⌕ click → NOTES | ✅ Present | — | Already routes to NOTES. Should pulse when note is needed (currently does not). |
| Static amber after note | ⚠ Amber exists but no pulse/static distinction | **Yes** | After note: static amber. Before note: pulsing amber. |
| Manual resolve only | ✅ Must cycle away | — | Already correct. |

**Summary for pack-level:** Add `cautionSince`. Add note-required check. Add pulse. Add lock. Optionally add inline composer. This is the highest-priority unification work.

### Ship/LOG-level: what to inherit

| Asset behavior | LOG SHIP today | Should inherit? | Notes |
|---------------|---------------|:---:|-------|
| `since` timestamp | ✅ (Uses job-level `caution.since` via `setCaution`) | — | Already present. |
| Note-required check | ✅ (Job-level `cautionNeedsNote` applies) | — | Already present. |
| Pulse gated on note state | ⚠ Always pulses when active | **Yes** | The `achtung-active` glow should pulse only when `cautionNeedsNote()` is true. After a note, static glow. |
| Lock / gate behavior | ❌ No lock | **No** | A console should never lock. The toggle is a fast one-click flag. Nag is appropriate; lock is not. |
| Inline composer | ❌ Not present | **No** | LOG SHIP is a counting console. The ACHTUNG toggle is a quick flag. Context goes to NOTES afterward via the nag. No composer needed here. |
| ⚠ click → NOTES | ❌ Toggle behavior (sets/clears) | **No change** | The ⚠ in LOG SHIP is a toggle control, not a navigation link. This is correct — the console surface needs a toggle, not a route. The `+ NOTE` nag on other surfaces handles routing. |
| Manual resolve only | ✅ Toggle clears | — | Already correct. |

**Summary for LOG SHIP:** Normalize pulse gating. Everything else is already canonical or intentionally different (toggle vs route).

---

## Summary: The Three Canonical Behaviors

| Behavior | Where it applies | Character |
|----------|-----------------|-----------|
| **Full protocol** (flag, stamp, lock, pulse, composer, resolve) | Asset Card, Pack Card | Detail surfaces. The operator is inside the object. Full interaction. |
| **Signal protocol** (flag, stamp, pulse-nag, `+ NOTE` route, resolve) | Jobs page, Floor, SHIP, RSP | Operational surfaces. The operator sees the signal and can act. No lock, no inline narrative. |
| **Instrument protocol** (count, display, click-through) | ENGINE, TV | Read-only surfaces. ACHTUNG is a metric. Click-through leads to a signal or detail surface. |

These three are not separate protocols. They are the same lifecycle expressed at different interaction depths. The lifecycle is always FLAG → STAMP → NAG → CONTEXT → PERSIST. The depth of interaction varies by surface type.
