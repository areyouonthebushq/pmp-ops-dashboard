> **Archived.** Superseded by [`achtung-protocol.md`](../achtung-protocol.md). Retained as historical reference.

# ACHTUNG Expansion Plan (Historical)

> **Status:** Historical — superseded by `achtung-protocol-unification-plan.md` and `achtung-canonical-model.md`.
> Retained for context on how the protocol evolved.

**Purpose:** Plan the next expansion of the ACHTUNG protocol (originally "caution") beyond asset rows to job-level conditions.

**Scope:** Read-only planning. No code changes. Optimizes for operational usefulness without building a giant status system.

*Nashville · Press Floor Operations · physicalmusicproducts.com*

---

## 1. Where caution currently exists and what it does

### 1.1 Asset-level caution (the only caution today)

Caution lives exclusively on **asset rows** inside the assets overlay. Each of the 10+ ASSET_DEFS (stampers, compound, testPress, testApproved, labels, cut, baked, etc.) can be cycled through four states:

```
'' (unset) → received → na → caution → '' (loop)
```

When an asset enters **caution**:

| Behavior | Implementation |
|----------|----------------|
| **Timestamp recorded** | `cautionSince` (ISO string) stored on the asset datum |
| **Row styled** | Yellow left border, warm background (`asset-row-caution`) |
| **Locked interaction** | Detail fields (date, person, note) hidden; view-notes button disabled (`asset-row-caution-locked`) |
| **Pulsing add-note cue** | After 1.5s, the `+` button pulses amber (`asset-btn-pulse` animation, 1.4s loop) |
| **Inline prompt** | Asset name gets suffix: *"— add note or change state"* |
| **Resolution** | Caution clears (locked + pulse stop) when **either** a new note with matching `assetKey` is added after `cautionSince` **or** the asset status is cycled away from caution |
| **Notes integration** | Notes entries for cautioned assets show ⚠ icon in panel notes list and full NOTES timeline |

### 1.2 What caution is NOT today

- There is **no** job-level caution flag, field, or concept.
- `status = hold` is the closest job-level blocker, but it has **no reason field**, **no note-required behavior**, **no pulse**, and **no timestamp**.
- The TV "BLOCKERS" stat counts `hold` jobs + offline presses — but there is no concept of "how long" or "why" beyond reading notes.
- The pipeline taxonomy and job status audit both recommended an optional `hold_reason` field but did not connect it to the caution protocol.

---

## 2. Which real job-level conditions are analogous to asset caution

Asset caution means: *"Something is wrong with this specific asset; you must document it before moving on."* The protocol is: **flag → require context → resolve.**

Job-level conditions that follow the same *flag → require context → resolve* pattern:

| Condition | Operational meaning | Currently handled by |
|-----------|---------------------|----------------------|
| **Stuck** | Job is stalled; unclear why or what to do next | `hold` + free-form notes (no structure) |
| **Blocked on customer** | Waiting on client approval, art, payment, etc. | `hold` + notes |
| **Billing issue** | Payment problem preventing ship or next step | `hold` + notes (or Bitrix) |
| **Added step / traffic jam** | Extra process inserted; job delayed in flow | `hold` + notes, or just notes |
| **Special handling** | Job needs non-standard treatment (fragile, rush, VIP, etc.) | Notes only; no flag or visual cue |
| **Waiting on assets** | Not all assets in-house; job can't proceed | Derived from asset health, but no job-level signal |

### 2.1 The pattern

All of these share: *"This job has a condition that needs attention and context. Someone should document why before the condition is considered addressed."*

Today, the only mechanism is `status = hold` (binary, no reason, no note-required behavior) or notes (unstructured, no visual escalation).

---

## 3. What form should job-level caution take?

### Option A: A boolean flag (`job.caution`)

```
job.caution = true | false
```

- **Pro:** Simplest. Mirror of asset caution. Can be toggled from panel, floor card, SHIP.
- **Con:** No reason. "Why is this cautioned?" still lives only in notes. Same weakness as `hold` today.
- **Verdict:** Too bare. Doesn't carry context.

### Option B: A reason field (`job.caution_reason`)

```
job.caution_reason = 'billing' | 'customer' | 'traffic_jam' | 'special_handling' | 'stuck' | '' | null
```

- **Pro:** Structured. Filterable. Answers "why" without parsing notes.
- **Con:** Enum creep risk. Must maintain list. Doesn't enforce note-writing.
- **Verdict:** Better than a bare flag. But still doesn't have the asset-caution "you must add a note" behavior.

### Option C: A note convention (no field)

```
Note text starts with [CAUTION] or [HOLD] tag
```

- **Pro:** Zero schema change. Conventions can be adopted immediately.
- **Con:** No visual escalation. No enforcement. No filtering without parsing. Not analogous to asset caution behavior at all.
- **Verdict:** Good supplementary practice, but not a protocol expansion.

### Option D: A lightweight blocker model (recommended)

```
job.caution = {
  active: true,
  reason: 'billing',      // short enum
  since: '2026-03-06T…',  // ISO timestamp
  text: 'Awaiting final payment from client before ship'  // optional short context
}
// — or null / absent when not cautioned
```

**Behavior modeled on asset caution:**

| Asset caution behavior | Job caution equivalent |
|------------------------|------------------------|
| `cautionSince` timestamp | `caution.since` |
| Amber row styling | Amber/warm visual treatment on job row (Floor, Jobs, SHIP) |
| Locked interaction (detail fields hidden) | Not needed at job level — jobs are more complex than single asset rows |
| Pulsing add-note cue | Pulsing cue on job row or pill: *"add note or resolve"* |
| Inline prompt text | Job row shows reason label: *"BILLING — add note or resolve"* |
| Resolution via new note | Caution resolves when a note is added after `caution.since` (same `notesLog` check pattern) |
| Resolution via state change | Caution resolves when `caution` is cleared manually or status changes away from `hold` |
| ⚠ icon in notes timeline | ⚠ on notes added while job was cautioned |

- **Pro:** Full protocol parity with asset caution. Structured reason. Timestamp enables "how long has this been cautioned." Note-required behavior drives documentation. Resolves cleanly.
- **Con:** Slightly more schema than a boolean. Needs one JSONB field or 2-3 flat columns.
- **Verdict:** This is the right model. It is exactly what asset caution does, lifted to the job level.

### Recommendation: Option D (lightweight blocker model)

But implemented in the **smallest safe** version first (see §4).

---

## 4. The smallest safe next expansion of caution protocol

### Phase 1: Job-level caution flag + reason + timestamp (MVP)

**Schema (one new JSONB column or three flat columns):**

Simplest: one JSONB column `caution` on the `jobs` table (matches the pattern of `assets`, `poContract`):

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS caution jsonb;
```

In-app shape:

```js
job.caution = null;  // not cautioned
job.caution = {
  reason: 'billing',
  since: '2026-03-06T14:30:00.000Z',
  text: 'Awaiting final payment'
};
```

**Reason enum (small, practical, no creep):**

| Value | Label | Covers |
|-------|-------|--------|
| `stuck` | Stuck | General stall; unclear next step |
| `customer` | Waiting on Customer | Art, approval, response, decision |
| `billing` | Billing Issue | Payment, invoice, deposit |
| `traffic_jam` | Traffic Jam | Added step, bottleneck, process delay |
| `special` | Special Handling | VIP, rush, fragile, non-standard |
| `other` | Other | Catch-all with free text |

Six values. No creep path — anything that doesn't fit goes in `other` with the `text` field for context.

**Behavior (Phase 1 — mirror asset caution):**

1. **Set caution:** From panel (dropdown + optional short text), floor card (dropdown only), SHIP page (if job is on SHIP). Setting caution records `since` timestamp automatically.
2. **Visual treatment:** Job rows on Floor, Jobs, SHIP get amber/warm left border and ⚠ icon next to status pill when cautioned. Reason label shown inline (e.g. *"⚠ BILLING"*).
3. **Note-required behavior:** When `caution.since` is set and no `notesLog` entry exists with `timestamp >= caution.since`, show a pulsing add-note cue (same pattern as asset caution pulse). Row shows *"— add note or resolve"* suffix.
4. **Resolution:** Caution is considered *addressed* (pulse stops, prompt hides) when either:
   - A note is added after `caution.since` (automatic, checks `notesLog`)
   - Caution is manually cleared (set to `null`)
   - Job status changes away from `hold` (optional: auto-clear on status change)
5. **Toast:** Setting caution toasts *"⚠ BILLING — add note"*. Clearing toasts *"Caution cleared"*.
6. **TV blockers:** TV "BLOCKERS" count can include cautioned jobs (not just `hold` status), giving better visibility into operational friction.

**What Phase 1 does NOT do:**

- No auto-set of caution when status changes to `hold` (manual only in Phase 1)
- No caution history / audit trail (just current state)
- No notifications or escalation
- No bulk caution operations
- No caution on fulfillment_phase (SHIP has `held_exception` which is close, but separate)

### Phase 2: Enhancements (later, only if useful)

- **Auto-suggest caution when setting `hold`:** Panel shows "Add caution reason?" prompt when status changes to hold. Not forced, just prompted.
- **Caution badge on Floor stats:** "3 CAUTIONED" alongside "QUEUED," "ACTIVE," etc.
- **Filter by caution reason:** Jobs filter dropdown adds "CAUTIONED" option; sub-filter by reason.
- **Caution in NOTES timeline:** Notes added while job is cautioned get ⚠ icon (same as asset-caution notes).
- **Caution duration display:** "Cautioned 3d" in job row or panel, derived from `since`.
- **Auto-clear on status change:** When job leaves `hold`, auto-clear caution (with confirmation toast).
- **SHIP integration:** `held_exception` fulfillment phase could auto-set caution, or vice versa. Keep separate for now; unify later if the team uses both.

---

## 5. Recommended implementation sequence

| Step | What | Files | Effort |
|------|------|-------|--------|
| **1** | Add `CAUTION_REASONS` constant and helpers to `core.js` (`cautionPill()`, `cautionReasonLabel()`, `isJobCautioned()`) | core.js | Small |
| **2** | Add `caution` to `supabase.js` row mapping (`jobToRow` / `rowToJob`) | supabase.js | Tiny |
| **3** | Add `caution` JSONB column migration | supabase/ | Tiny |
| **4** | Add caution dropdown + optional text field to panel (index.html), wire in `FIELD_MAP` or custom save logic | index.html, app.js | Small |
| **5** | Add caution dropdown to floor card edit mode, show caution pill in floor card view mode | render.js, stations.js | Small |
| **6** | Add caution visual treatment to Floor table rows, Jobs table/cards, SHIP rows (amber border, ⚠ pill, reason label) | render.js, styles.css | Medium |
| **7** | Add note-required behavior: pulsing cue + "add note or resolve" prompt, checking `notesLog` timestamps against `caution.since` | render.js, styles.css | Medium |
| **8** | Add `setCaution()` / `clearCaution()` functions to `app.js` with toast | app.js | Small |
| **9** | Update TV blockers count to include cautioned jobs | render.js | Tiny |
| **10** | Add `caution` to `jobFieldsHash()` for conflict detection | core.js | Tiny |

**Recommended grouping:**

- **Pass A (schema + controls):** Steps 1–5, 8, 10. Establishes the data model and all edit surfaces. Small pass.
- **Pass B (visual protocol):** Steps 6–7, 9. The actual "caution behavior" — visuals, pulse, note-required, resolution. The part that makes it feel like asset caution.

---

## Summary

Asset caution is a focused, effective protocol: **flag → timestamp → require note → resolve.** The same pattern applies naturally to job-level conditions like stuck, billing, customer wait, traffic jam, and special handling.

The smallest safe expansion is **one JSONB field** (`caution`) with a short reason enum, a `since` timestamp, and optional free text — mirroring exactly how asset caution works. The note-required behavior and visual escalation (pulsing cue, amber treatment, inline prompt) transfer directly from asset rows to job rows.

This does **not** add new job statuses. `hold` remains the single blocker status. Caution is an **overlay** — it answers *"why is this held, and has anyone documented it?"* without replacing anything.

---

*End of Caution Expansion Plan. See `docs/pipeline-taxonomy.md` §5.3 (caution/blocker states) and `docs/job-status-model-audit.md` §2.2 (hold — one bucket) for prior analysis.*
