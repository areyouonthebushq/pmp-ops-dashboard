# Exception Taxonomy Recommendation

**Status:** Doctrine proposal — awaiting review.
**Date:** 2026-03-06
**Depends on:** `docs/achtung-protocol.md` (canonical ACHTUNG reference)

---

## 1. Executive Summary

PMP OPS currently runs one exception protocol (ACHTUNG) across two genuinely different exception domains. This document argues they should be named and rendered differently while remaining one protocol family.

| Domain | Current name | Proposed name | Icon | Scope | Character |
|--------|-------------|---------------|------|-------|-----------|
| Object / material / readiness | ACHTUNG (Card Zone) | **ACHTUNG** (keep) | ⚠ | Per-item (asset, pack item) | "This *thing* needs attention" |
| Admin / process / intervention | ACHTUNG (RSP, Floor, LOG) | **WRENCH** | 🔧 | Per-job | "This *job* needs intervention" |

Both share the same lifecycle: **FLAG → STAMP → NAG → CONTEXT → PERSIST → RESOLVE.**
Both route explanation to NOTES. Both are overlay protocols (orthogonal to status).
The difference is *what kind of exception* they represent.

---

## 2. Semantic Comparison

### ACHTUNG (Card) — Object Exception

| Dimension | Current behavior |
|-----------|-----------------|
| **What it marks** | A specific physical asset or pack item that is not flowing normally |
| **Scope** | Per-item within Card Zone (stampers, labels, sleeve, shrink wrap, etc.) |
| **Trigger** | Status cycle on the card row |
| **Reason** | Implicit — the item itself *is* the reason. The note provides context. |
| **Note path** | Inline composer or Card ACHTUNG popup → `addAssetNoteFromOverlay()` → tagged with `assetKey` + `assetLabel` |
| **NOTES rendering** | Yellow bottom-right meta tag (`notes-entry-asset`), clean integrated body, item-scoped |
| **Feel** | Tactile. Operational. The operator is touching the object. |
| **Examples** | Wrong labels received. TP failed. Compound wrong color. Sleeve damaged. |

### ACHTUNG (RSP) — Process Exception

| Dimension | Current behavior |
|-----------|-----------------|
| **What it marks** | A job that is blocked by an administrative, commercial, or process issue |
| **Scope** | Entire job |
| **Trigger** | RSP Icon Zone ⚠, Floor Card dropdown, LOG SHIP toggle |
| **Reason** | Dropdown: `stuck`, `customer`, `billing`, `traffic_jam`, `special`, `achtung`, `other` |
| **Note path** | `setCaution()` → `notesLog.push({ text: '⚠ REASON: text', cautionContext: true })` |
| **NOTES rendering** | Regular note entry with `⚠ REASON:` baked into the text body. No special meta treatment. |
| **Feel** | Administrative. Managerial. The operator is flagging a situation, not touching an object. |
| **Examples** | Waiting on customer approval. Billing hold. Added step. Scheduling conflict. |

### The real split

These are not the same kind of exception:

| Card | RSP |
|------|-----|
| **Physical** — about a *thing* | **Administrative** — about a *situation* |
| **Item-scoped** — "this stamper" | **Job-scoped** — "this job" |
| **Self-describing** — the item name *is* the category | **Needs categorization** — what *kind* of admin issue? |
| **Tactile** — cycle-click on a row | **Declarative** — dropdown + text |
| **Resolved by the thing arriving/changing** | **Resolved by an external condition changing** |

The current system forces both into the same word, icon, and visual language. This works but leaves the operator without a clear mental model of *what kind of attention is needed* at a glance.

---

## 3. Naming and Icon Recommendation

### Keep ACHTUNG for Card (object/material)

ACHTUNG (⚠) already means "danger / attention" in the plant's operational language. For physical objects — wrong labels, bad test pressing, missing insert — the warning triangle is exactly right. It says: *this thing is problematic.*

**Keep:** ⚠ ACHTUNG for Card Zone exceptions.

### Rename RSP to WRENCH (admin/process)

The RSP exception is not about danger — it's about *intervention*. The job needs someone to do something administrative: call the customer, resolve billing, reroute the schedule, approve an exception.

**Propose:** 🔧 WRENCH for job-level process exceptions.

| Attribute | ACHTUNG (Card) | WRENCH (RSP) |
|-----------|---------------|--------------|
| Icon | ⚠ (warning triangle) | 🔧 (wrench) |
| Color family | Amber `#ffb300` | Steel blue `#5c9ece` or muted tool-grey `#8a9bb0` |
| Meaning | "This object is not right" | "This job needs intervention" |
| One-word feel | Alert | Intervention |

### Why not keep both as ACHTUNG?

They *could* remain one word. But:
- The dropdown reasons on the RSP already indicate a different domain (billing, customer, scheduling — these are not material issues).
- Operators will eventually internalize two separate mental models anyway. Naming them differently makes the split explicit and teachable.
- A wrench icon says "someone needs to work on this" in a way a warning triangle does not.

### Why not absorb one into the other?

They serve genuinely different operational needs:
- Card ACHTUNG catches material/physical readiness issues during receiving and packing.
- Job-level exceptions catch administrative/commercial/process blocks.

Absorbing one into the other would lose specificity. Card ACHTUNG should not gain a dropdown of admin reasons. Job-level WRENCH should not become a status cycle.

### Recommended direction: Separate but rhyming

Both stay in one **exception protocol family** with the same lifecycle, the same relationship to NOTES, the same pulse/static/clear visual grammar. They differ in:
- Name
- Icon
- Color (optional — could stay amber for both if steel blue feels too cold)
- Trigger mechanism
- Scope
- Reason taxonomy

---

## 4. RSP Dropdown Taxonomy Evaluation

### Current reasons

```
stuck           → Stuck
customer        → Waiting on Customer
billing         → Billing Issue
traffic_jam     → Traffic Jam
special         → Special Handling
other           → Other
achtung         → Achtung       ← protocol name used as a reason (ambiguous)
```

### Problems

1. **`achtung` as a reason is circular.** The protocol name should not also be a selectable reason. (Already noted in the unification plan.)
2. **`stuck` is vague.** Everything in WRENCH is "stuck" in some way. It's a catch-all dressed as a category.
3. **`traffic_jam` is metaphorical.** Plant operators use concrete language. "Traffic jam" means scheduling conflict, added step, or internal bottleneck — but the metaphor doesn't make it clear.
4. **`special` (Special Handling) crosses domains.** Special handling can be a material/packing issue (signed copies, hand-numbered) or a process issue (split shipment, non-standard freight). It belongs partly in Card Zone and partly here.
5. **`other` is an escape hatch.** It's fine as a last resort but should not be the most-used option.
6. **The list doesn't reflect the actual intervention types.** The real question is: *who or what is the operator waiting on?*

### Proposed WRENCH taxonomy

Organized by **what needs to happen** (intervention type), not by vague description:

| Value | Label | Meaning | Examples |
|-------|-------|---------|----------|
| `customer` | **CUSTOMER** | Waiting on the customer to respond, approve, decide, or pay | Awaiting TP approval, needs shipping address, needs payment |
| `commercial` | **COMMERCIAL** | Financial, billing, or contractual issue that must resolve before proceeding | Final payment pending, invoice dispute, pricing discrepancy |
| `internal` | **INTERNAL** | PMP internal bottleneck — scheduling, capacity, equipment, or coordination | Press scheduling conflict, added step, re-run needed, capacity overload |
| `mismatch` | **MISMATCH** | What PMP OPS says vs reality — data, inventory, or specification discrepancy | Wrong quantity in system, label version conflict, inventory mismatch |
| `external` | **EXTERNAL** | Waiting on a third party that is not the customer | Vendor delay, freight carrier issue, outsourced process wait |
| `review` | **REVIEW** | Needs manual review or exception approval before proceeding | Non-standard order, unusual spec, management sign-off needed |
| `other` | **OTHER** | None of the above | Anything not covered |

### Why this is better

1. **Categories describe the bottleneck owner**, not vague symptoms.
2. **`customer` stays** — it's already good.
3. **`commercial` replaces `billing`** — broadens to include all financial/contractual, not just "billing."
4. **`internal` replaces `stuck` and `traffic_jam`** — if it's inside PMP, it's internal. Clearer than metaphors.
5. **`mismatch` is new** — source-of-truth discrepancies are a real, common exception class.
6. **`external` is new** — distinguishes vendor/carrier waits from customer waits.
7. **`review` is new** — explicitly captures "needs human judgment" rather than burying it in `other`.
8. **`achtung` and `special` are removed.** Protocol-as-reason is gone. Special handling belongs in notes text or in Card Zone caution per-item, not as a job-level category.

---

## 5. NOTES Rendering Recommendation

### Current state

| Source | How the note lands in `notesLog` | How NOTES renders it |
|--------|----------------------------------|---------------------|
| **Card ACHTUNG** | `{ text, person, timestamp, assetKey, assetLabel }` via `addAssetNoteFromOverlay()` | `notes-entry-asset` div: yellow meta tag (bottom-right), clean body, item-scoped |
| **RSP ACHTUNG** | `{ text: '⚠ REASON: text', person, timestamp, cautionContext: true }` via `setCaution()` | Regular note. `⚠ REASON:` baked into text body. No special meta rendering. `cautionContext` field exists but is not checked by render. |

### Problems

1. RSP ACHTUNG notes bake the signal (`⚠`) and category (`REASON:`) into the note *text body*. This is the "heavier broken-up structure" — it pollutes the note's actual content with protocol metadata.
2. Card ACHTUNG notes use structured fields (`assetKey`, `assetLabel`) and render the meta information in a dedicated visual zone. Cleaner. Scannable. The note text is just the note text.
3. NOTES currently cannot visually distinguish a WRENCH-type exception note from a regular note (it has `cautionContext: true` in data but ignores it in rendering).

### Recommendation: Card-style meta treatment becomes canonical

Both exception systems should produce notes that:
1. Store the exception metadata in structured fields, not baked into text.
2. Render the exception origin as a **bottom-right meta tag** — the same treatment Card notes already get.
3. Keep the note text clean and narrative.

**For WRENCH (RSP) notes, this means:**

| Field | Current | Proposed |
|-------|---------|----------|
| `text` | `'⚠ BILLING ISSUE: waiting on final payment'` | `'waiting on final payment'` |
| `cautionContext` | `true` | `true` |
| `wrenchReason` | *(does not exist)* | `'commercial'` |
| `wrenchLabel` | *(does not exist)* | `'COMMERCIAL'` |

**NOTES rendering for WRENCH notes:**
- Bottom-right meta tag showing `🔧 COMMERCIAL` (or the reason label) in steel blue / tool-grey.
- Note body contains only the operator's actual text.
- Visual treatment mirrors `notes-entry-asset` but with WRENCH color and icon.

**For Card ACHTUNG notes:**
- No change needed. Already uses the preferred meta treatment.

### Visual comparison

```
┌─────────────────────────────────────────────────┐
│ Card ACHTUNG note (current — keep as-is)        │
│                                                 │
│ Test press has audio dropout on side B           │
│                                                 │
│                      ⚠ Test Press  RECEIVING │
│                      Admin · Mar 6 3:12 PM       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ WRENCH note (proposed — same meta zone style)   │
│                                                 │
│ Client wants to change label art. Waiting on     │
│ revised files before pressing can resume.        │
│                                                 │
│                      🔧 CUSTOMER                │
│                      Admin · Mar 6 2:45 PM       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Regular note (no exception tag — unchanged)     │
│                                                 │
│ Pressing looks good, moving to packing.          │
│                                                 │
│                      Admin · Mar 6 1:30 PM       │
└─────────────────────────────────────────────────┘
```

Same visual architecture. Different icon and color per exception domain.

---

## 6. Protocol Family Architecture

### One family, two species

```
                    EXCEPTION PROTOCOL FAMILY
                    ─────────────────────────
                    Lifecycle:  FLAG → STAMP → NAG → CONTEXT → PERSIST → RESOLVE
                    Home:       NOTES (signal lives everywhere, explanation lives in NOTES)
                    Pulse:      missing context = pulsing, satisfied = static, clear = absent
                    
                    ┌────────────────────┐         ┌────────────────────┐
                    │     ⚠ ACHTUNG      │         │    🔧 WRENCH       │
                    │  object exception  │         │  process exception │
                    ├────────────────────┤         ├────────────────────┤
                    │ Scope: per-item    │         │ Scope: per-job     │
                    │ Trigger: cycle     │         │ Trigger: dropdown  │
                    │ Reason: implicit   │         │ Reason: taxonomy   │
                    │ Icon: ⚠ (warning)  │         │ Icon: 🔧 (wrench)  │
                    │ Color: amber       │         │ Color: steel/grey  │
                    │ Surface: Card Zone │         │ Surface: RSP, Floor│
                    │ Composer: Card     │         │ Composer: WRENCH   │
                    │   ACHTUNG popup    │         │   popup (dropdown) │
                    └────────────────────┘         └────────────────────┘
```

### Shared protocol rules (unchanged)

1. Flag and context are separate acts.
2. A note satisfies the nag but does not clear the flag.
3. Resolution is always manual and explicit.
4. No timer, status change, or note auto-clears the flag.
5. Boards show signal, NOTES shows explanation.
6. `cautionNeedsNote()` / `cautionLocked` logic applies to both.

### Distinct behaviors

| Behavior | ACHTUNG (Card) | WRENCH (RSP) |
|----------|---------------|--------------|
| Lock row until note | Yes (detail surface) | No (operational surface — nag, don't lock) |
| Reason dropdown | No (item *is* the reason) | Yes (the 7-value taxonomy) |
| Inline composer | Card ACHTUNG popup (auto-opens 1.5s after flag) | WRENCH popup (opens immediately on icon click) |
| Note tagging | `assetKey` + `assetLabel` | `wrenchReason` + `wrenchLabel` |
| Note rendering | `notes-entry-asset` with amber meta tag | New `notes-entry-wrench` with steel/grey meta tag |

---

## 7. Implementation Direction

### Phase 1 — Rename and re-icon (terminology + visual split)

1. Add WRENCH icon (🔧 with `\uFE0E` text variation selector, or a small inline SVG).
2. Replace ⚠ with 🔧 on the RSP Icon Zone for the job-level exception button.
3. Update WRENCH popup header: `🔧 WRENCH` instead of `⚠ ACHTUNG`.
4. Update Floor Card dropdown label: `🔧 WRENCH` instead of `⚠ ACHTUNG`.
5. Update JOBS LIVE column: show 🔧 for job-level exception instead of ⚠.
6. Keep ⚠ on Card Zone exclusively.

### Phase 2 — Reason taxonomy

1. Replace `CAUTION_REASONS` with the new 7-value WRENCH taxonomy.
2. Remove `achtung` as a reason value.
3. Update `cautionReasonLabel()` to use the new labels.
4. Update any saved data migration notes (old reason values should still display gracefully via fallback).

### Phase 3 — Note structure

1. Modify `setCaution()` to write structured note fields: `{ text, person, timestamp, cautionContext: true, wrenchReason, wrenchLabel }` — keep note text clean.
2. Update NOTES rendering to check for `wrenchReason` and render a `notes-entry-wrench` meta tag (same layout as `notes-entry-asset`, different icon/color).
3. Existing notes with `⚠ REASON:` baked into text remain as-is (backward compatible — just less pretty).

### Phase 4 — Color split (optional)

1. If steel blue / tool-grey is approved, add WRENCH color tokens.
2. Update WRENCH signal surfaces (JOBS LIVE, Floor, RSP button) to use WRENCH color instead of amber.
3. Card Zone keeps amber exclusively.
4. If color split is rejected, both can stay amber with different icons only.

### What NOT to do

- Do not merge Card and RSP into one system. They are genuinely different domains.
- Do not remove the RSP dropdown. WRENCH needs categorization; ACHTUNG does not.
- Do not force Card ACHTUNG to adopt a dropdown. The item *is* the context.
- Do not rename internal code variables (keep `caution` internally — the external name changes, not the plumbing).
- Do not break backward compatibility with existing saved `caution` data.

---

## 8. Risks and Tradeoffs

### Two names = learning curve
Operators will need to learn that ⚠ = object problem, 🔧 = process problem. Mitigated by the icon being self-explanatory and the surfaces being distinct (Card Zone vs RSP).

### Color split could feel over-designed
If steel blue for WRENCH feels too different from the amber exception family, both can stay amber with icon differentiation only. Icon + name alone may be sufficient.

### Data model backward compatibility
Existing `job.caution` data uses the old reason values (`stuck`, `billing`, etc.). These should continue to work. The label lookup function should gracefully handle old values.

### Two note meta tags in NOTES
NOTES will now have two exception-note styles: amber ⚠ (Card ACHTUNG) and steel 🔧 (WRENCH). This is actually *good* — the operator can distinguish "material problem" from "process problem" at a glance in the feed.

### `cautionContext: true` notes already in the system
Existing RSP-originated notes have `⚠ REASON: text` baked into the body. These will render with the old style (no structured meta tag) until the notes are re-created or a migration pass cleans them up. This is acceptable — they still render, just without the new meta treatment. No data loss.

---

## 9. Recommendation Summary

| Decision | Recommendation |
|----------|---------------|
| **Should Card and RSP stay ACHTUNG?** | No. Card keeps ACHTUNG. RSP becomes WRENCH. |
| **Should they share an icon?** | No. ⚠ for ACHTUNG, 🔧 for WRENCH. |
| **Should one absorb the other?** | No. Both stay separate but rhyming in one protocol family. |
| **Should the RSP dropdown be replaced?** | Yes. New 7-value taxonomy based on intervention type. |
| **Should Card-style meta be canonical in NOTES?** | Yes. Both exception types should render with bottom-right meta tags. |
| **Should color split?** | Recommended but optional. Amber for ACHTUNG, steel/grey for WRENCH. Can defer to icon-only differentiation. |
| **Should internal code rename?** | No. Keep `caution` internally. User-facing language changes only. |

---

## Supersedes / Related

- Extends: `docs/achtung-protocol.md`
- Extends: `docs/achtung-canonical-model.md`
- Extends: `docs/achtung-protocol-unification-plan.md`
- Does not supersede the protocol lifecycle or resolution rules — those remain canonical.
