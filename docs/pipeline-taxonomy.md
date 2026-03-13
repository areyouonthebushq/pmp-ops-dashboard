# Pipeline Taxonomy — Bitrix/Plant Stages to PMP OPS

**Purpose:** Map real operational stages from Bitrix and plant threads into PMP OPS system language. Clarify what belongs in the dashboard, what stays in Bitrix, and what is represented by job status vs notes vs conventions.

**Scope:** Read-only strategy. No code changes. Optimizes for operational clarity without replacing Bitrix CRM/admin flow.

*Nashville · Press Floor Operations · physicalmusicproducts.com*

---

## 1. Executive summary

- **Bitrix and plant threads** use many stage labels (pre-sale, pre-press, production, packing, shipping, billing). **PMP OPS** uses a small status rail: **queue → pressing → assembly → hold → done**, plus **progress log** (pressed / qc_passed / rejected) and **per-job assets** (ASSET_DEFS).
- This doc defines each Bitrix-style stage, maps it to PMP OPS (or “Bitrix only”), and recommends which stages become **formal job status**, **fulfillment/shipping state**, **caution/blocker**, or **note conventions only**.
- **Recommendation:** Keep PMP OPS status rail focused on **floor execution**. Do not overcomplicate with dozens of statuses. Represent pre-press, billing, and fulfillment via **notes**, **conventions**, and optional **extended fields** (e.g. fulfillment_phase) only where they directly affect the floor.
- **Bitrix** remains the place for project leads, invoicing, deposits, final payment, and full project lifecycle; PMP OPS remains the place for *what’s on the press, what’s queued, what’s in assembly, and what’s done*.

---

## 2. Stage glossary

Definitions are operational (what the stage means in practice), not system-specific.

| Stage (Bitrix/plant) | Operational meaning |
|----------------------|----------------------|
| **PROJECT LEADS** | Job is in sales/estimation; not yet confirmed for production. |
| **PENDING / STUCK** | Waiting on something outside the floor (client, art, approval, payment). |
| **INVOICE SENT** | Client has been invoiced; awaiting payment or next step. |
| **DEPOSIT PAID** | Deposit received; job is financially cleared to proceed (or partially). |
| **ART APPROVED / HOLDING** | Art/print approved; may be intentionally held before print order. |
| **PRINT ORDERED** | Print (e.g. jackets, labels) has been ordered; job is moving toward production. |
| **CUTTING** | Physical cutting step (e.g. jackets) in progress. |
| **TP IS WORKABLE** | Test press is in a workable state; can be run. |
| **AWAITING TP APPROVAL** | Test press run done; waiting on approval to proceed. |
| **TP FAIL** | Test press did not pass; rework or new TP needed. |
| **TP APPROVED** | Test press approved; job cleared for production run. |
| **ALL ASSETS IN-HOUSE** | All required assets (stampers, compound, labels, etc.) received and ready. |
| **ON THE PRESS RIGHT NOW** | Job is currently running on a press (production). |
| **ADDED STEP / TRAFFIC JAM** | Extra step added or bottleneck; job is delayed in flow. |
| **IN PACKING RIGHT NOW** | Units are in packing; post-press, pre-ship. |
| **NEED SHIPPING QUOTE** | Shipping quote needed before ship. |
| **AWAITING FINAL PAYMENT** | Waiting on final payment before ship or close. |
| **LOCAL PICK UP** | Customer will pick up; no outbound ship. |
| **READY TO SHIP** | Packed and ready to ship (or pick up). |
| **IN HOUSE FULFILLMENT** | Fulfillment is handled in-house (vs third-party). |
| **PROJECT COMPLETE** | Job/project fully complete (production + billing/ship as applicable). |
| **STUCK / BILLING ISSUE** | Blocked by billing or payment issue. |
| **FINISHED** | Production finished; may still be in packing/ship. |

---

## 3. Mapping: Bitrix-style stage → PMP OPS equivalent

| Bitrix/plant stage | In PMP OPS? | PMP OPS equivalent or handling |
|--------------------|-------------|--------------------------------|
| PROJECT LEADS | No | **Bitrix only.** Before job exists in PMP OPS. |
| PENDING / STUCK | Partial | **hold** (if blocked); or **notes** (“Pending art,” “Stuck – client”). |
| INVOICE SENT | No | **Bitrix only.** Billing/sales. |
| DEPOSIT PAID | No | **Bitrix only.** Optional **note** (“Deposit paid”) if floor cares. |
| ART APPROVED / HOLDING | Partial | **hold** if intentionally held; else **queue**. **Notes** for “Art approved.” |
| PRINT ORDERED | Note | **Notes** (“Print ordered,” “Jackets ordered”). |
| CUTTING | Note | **Notes** or **assembly**; no dedicated status. |
| TP IS WORKABLE | Asset / note | **Assets:** Test Press Complete / Test Press Approved. **Notes** for TP state. |
| AWAITING TP APPROVAL | Note / asset | **Assets:** Test Press in caution until approved. **Notes** (“Awaiting TP approval”). |
| TP FAIL | Caution / note | **Asset** caution; **notes** (“TP fail – rework”). |
| TP APPROVED | Asset | **Assets:** Test Press Approved = received. |
| ALL ASSETS IN-HOUSE | Yes | **Assets overlay:** all ASSET_DEFS received (or N/A). No single status; derived from asset health. |
| ON THE PRESS RIGHT NOW | Yes | **status = pressing** + **press** assigned. |
| ADDED STEP / TRAFFIC JAM | Note / hold | **hold** if blocked; **notes** (“Added step,” “Traffic jam – X”). |
| IN PACKING RIGHT NOW | Yes | **status = assembly** (or future **packing** if added). **Notes** (“In packing”) acceptable. |
| NEED SHIPPING QUOTE | No | **Bitrix / notes.** “Need shipping quote” in notes if floor needs to know. |
| AWAITING FINAL PAYMENT | No | **Bitrix only.** **Notes** if it affects “ready to ship” visibility. |
| LOCAL PICK UP | Note / convention | **Notes** (“Local pick up”); optional **shipping_notes** or tag later. |
| READY TO SHIP | Fulfillment | Not a job status today; **notes** or future **fulfillment_phase** (see §5). |
| IN HOUSE FULFILLMENT | Note / convention | **Notes** or org convention; not a status. |
| PROJECT COMPLETE | Yes | **status = done** (production complete); “project complete” may include billing in Bitrix. |
| STUCK / BILLING ISSUE | Caution / hold | **status = hold** + **notes** (“Billing issue,” “Stuck – payment”). |
| FINISHED | Yes | **status = done** (production finished). |

---

## 4. Stages that should remain in Bitrix (for now)

Keep these in Bitrix as the primary place; PMP OPS does not need a formal status or field for them unless the floor explicitly needs a signal:

- **PROJECT LEADS** — Pre-job; no PMP OPS record yet.
- **INVOICE SENT** — Billing/sales.
- **DEPOSIT PAID** — Billing; optional note in PMP OPS only if useful.
- **AWAITING FINAL PAYMENT** — Billing; notes if it affects “ready to ship.”
- **NEED SHIPPING QUOTE** — Fulfillment/sales; notes if floor needs to know.
- **IN HOUSE FULFILLMENT** — Convention; no status needed.

These can be reflected in PMP OPS only via **notes** or future **sync from Bitrix** (read-only display), not as first-class job statuses.

---

## 5. Stages that should become formal status, fulfillment, caution, or notes

### 5.1 Formal job status (already in PMP OPS)

Current **STATUS_ORDER** in `core.js`: **queue → pressing → assembly → hold → done.**

| PMP OPS status | Covers Bitrix/plant concept |
|----------------|-----------------------------|
| **queue** | Queued for floor; includes “ready to run” (art approved, print ordered, etc.). Pre-press details live in notes/assets. |
| **pressing** | **ON THE PRESS RIGHT NOW** — job is on a press (press assignment is the proof). |
| **assembly** | Post-press: assembly, **IN PACKING RIGHT NOW**, or similar. One status for “off press, not done.” |
| **hold** | **PENDING / STUCK**, **ADDED STEP / TRAFFIC JAM**, **STUCK / BILLING ISSUE**, **ART APPROVED / HOLDING** (when held). |
| **done** | **FINISHED**, **PROJECT COMPLETE** (production side). |

No new statuses are recommended for the core rail. “Packing” can remain a **subset of assembly** or a **note convention** (“In packing”).

### 5.2 Fulfillment / shipping state

Today PMP OPS has **no** formal fulfillment or shipping status. Recommendations:

- **Do not** add many shipping statuses to the main job status rail.
- **Option A (recommended for now):** **Notes only** — e.g. “Ready to ship,” “Local pick up,” “Need shipping quote.” Searchable/filterable notes suffice for visibility.
- **Option B (later):** Single **fulfillment_phase** (or **shipping_state**) field: e.g. `null | 'packing' | 'ready_to_ship' | 'shipped' | 'local_pickup'`. Used for filtering and display only; not part of STATUS_ORDER. Kept separate so the main status stays “done” when production is complete.

**READY TO SHIP**, **LOCAL PICK UP** → notes today; optional fulfillment_phase later.

### 5.3 Caution / blocker states

Represent blockers without new statuses:

- **STUCK / BILLING ISSUE**, **PENDING / STUCK** → **status = hold** + **notes** (“Billing issue,” “Stuck – client”).
- **TP FAIL**, **AWAITING TP APPROVAL** → **Assets overlay:** Test Press in **caution**; **notes** (“TP fail,” “Awaiting TP approval”). Caution mode already forces a note before clearing.
- **ADDED STEP / TRAFFIC JAM** → **hold** if blocking; **notes** for context.

No new “blocker” status needed; **hold** + **notes** + **asset caution** cover these.

### 5.4 Note conventions only (no formal status or field)

Use **notes** (job notes, assembly log, or NOTES channels) and optional **tags/keywords** in text:

- **PRINT ORDERED** — Note: “Print ordered,” “Jackets ordered.”
- **CUTTING** — Note or assembly: “Cutting in progress.”
- **TP IS WORKABLE** — Note; asset “Test Press Complete” when done.
- **LOCAL PICK UP** — Note: “Local pick up.”
- **IN HOUSE FULFILLMENT** — Note or team convention.

Conventions (e.g. “Start note with [SHIP] for shipping-related”) can be documented in runbooks; no code change required for a first pass.

---

## 6. Recommendations for a clean staged model

1. **Keep the status rail small.** Five statuses (queue, pressing, assembly, hold, done) are enough for floor execution. Avoid adding statuses for every Bitrix stage.
2. **Use notes and assembly log for context.** Pre-press (print ordered, cutting, TP), billing (deposit, final payment), and fulfillment (ready to ship, local pick up) can live in notes until there is a clear need for structured fields.
3. **Use assets for readiness.** “ALL ASSETS IN-HOUSE” is already represented by asset health (ASSET_DEFS: received/na/caution). TP approval is Test Press Approved = received; TP fail = caution + note.
4. **Use hold for any blocker.** Stuck, billing issue, traffic jam, or intentional hold → **hold** + note. No separate “stuck” or “billing” status.
5. **Leave billing and CRM in Bitrix.** Invoicing, deposit, final payment, project leads stay in Bitrix. Optional: display a “Bitrix stage” or “external status” on the job (read-only) if sync exists later.
6. **Optional fulfillment_phase.** If the floor needs “ready to ship” or “shipped” as a filter/view, add a **single** fulfillment field separate from status; do not merge into STATUS_ORDER.
7. **Document conventions.** In docs or runbooks: how to use notes for “Print ordered,” “In packing,” “Local pick up,” “Billing issue,” so the team uses them consistently.

---

## 7. Suggested next implementation opportunities

- **Document note conventions** — Short doc or panel hint: “Use notes for: Print ordered, Cutting, TP state, Ready to ship, Local pick up, Billing issue.”
- **Job-level “blocker” or “reason on hold”** — Optional short field (e.g. `hold_reason` or free text) when status = hold, for filtering (“Show all billing holds”) without parsing notes. Low cost, high clarity.
- **Asset health in floor/panel** — Already present; ensure “ALL ASSETS IN-HOUSE” is clearly visible (e.g. “Assets 8/8” or “All in-house” when asset health = 100%).
- **Fulfillment_phase (later)** — If shipping visibility becomes important: one enum or string per job (`packing | ready_to_ship | shipped | local_pickup`), filterable on Jobs/Floor, set via panel or small workflow; do not replace **done** for production completion.
- **Bitrix sync (later)** — If Bitrix becomes the source of pre-production stages: sync job into PMP OPS when it reaches a “production-ready” stage; optionally show Bitrix stage as read-only in panel; keep status transitions (queue → pressing → assembly → hold → done) owned by PMP OPS for floor execution.

---

*End of Pipeline Taxonomy. For data model and status definitions see `core.js` (STATUS_ORDER, STATUS_OPTS, PROGRESS_STAGES) and `informationarchitecturev3.md`.*
