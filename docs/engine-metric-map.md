# ENGINE — Metric Map

**Every metric ENGINE should care about, ranked by bottom-line impact, grounded in real data.**

*Nashville · Press Floor Operations · physicalmusicproducts.com*

---

## 1. Executive summary

ENGINE metrics follow one rule: **if it doesn't move product out the door, it doesn't belong on the first screen.**

The metric philosophy:

1. **Output is king.** The plant exists to turn orders into quacks. Everything flows backward from quacks out the door.
2. **Movement beats state.** "How many pressed today" is more useful than "how many jobs exist." State is for JOBS/FLOOR. Movement is for ENGINE.
3. **Yield is the silent killer.** A 5% yield drop on 10,000 units is 500 units of re-press. Yield is always a Tier 1 metric.
4. **Stuck is expensive.** Every cautioned job, every overdue job, every press sitting idle is lost capacity. Exception metrics are not nice-to-haves — they are cost metrics.
5. **No vanity.** "Number of notes created" is not a metric. "Number of jobs" is not a metric. Counts of activity are not the same as measures of throughput.

The metric tiers:

| Tier | What it measures | Bottom-line claim |
|---|---|---|
| **Tier 1** | Output, yield, throughput | Directly affects revenue and cost per unit |
| **Tier 2** | Capacity utilization, flow health, exceptions | Affects how much of Tier 1 the plant can achieve |
| **Tier 3** | Rhythm, readiness, pipeline shape | Management visibility into where the system is healthy or degrading |
| **Tier 4** | Advanced analytics, trends, benchmarks | Requires historical depth or data not yet collected |

---

## 2. Ranked metric inventory

### Tier 1 — Highest bottom-line impact

These metrics directly answer: are we making money today?

---

#### M1. QUACKS (shipped + picked up)

| | |
|---|---|
| **ENGINE label** | `QUACKED` |
| **Definition** | Total units with `progressLog` stage `shipped` or `picked_up` within the measured period. |
| **Why it matters** | This is THE output metric. A quack is a finished unit out the door. Revenue is not recognized until units leave the building. Every other metric feeds into this one. |
| **Bottom-line impact** | **Critical.** This is the number. |
| **Data exists today?** | **Yes.** `job.progressLog` entries where `stage === 'shipped' \|\| stage === 'picked_up'`. Each entry has `qty`, `timestamp`, `person`. |
| **Periods** | Today, MTD (QPM), WTD, trailing 30d. |

---

#### M2. QPM (Quacks Per Month)

| | |
|---|---|
| **ENGINE label** | `QPM` |
| **Definition** | Total quacks (M1) for the current calendar month. The north-star rate metric. |
| **Why it matters** | Monthly throughput is the clearest measure of plant capacity and execution. QPM is the number you tell the owner. |
| **Bottom-line impact** | **Critical.** This is the rate. |
| **Data exists today?** | **Yes.** Same source as M1, filtered to current calendar month. |
| **Periods** | Current month. Later: trailing 3/6/12 months for trend. |

---

#### M3. YIELD

| | |
|---|---|
| **ENGINE label** | `YIELD` |
| **Definition** | `qcPassed / (qcPassed + rejected)` for the measured period. Expressed as a percentage. |
| **Why it matters** | Every rejected unit is material cost, labor cost, and lost press time. A plant running at 92% yield vs 97% yield on a 50,000-unit month is wasting 2,500 units. At ~$1–3/unit in materials alone, that's real money. |
| **Bottom-line impact** | **Critical.** Yield is the most direct cost-per-unit lever the floor controls. |
| **Data exists today?** | **Yes.** `progressLog` stages `qc_passed` and `rejected`, each with `qty` and `timestamp`. |
| **Periods** | Today, MTD, trailing 7d. |
| **Alert condition** | Yield < 90% should be visually red. Yield < 95% should be amber. |

---

#### M4. PRESSED

| | |
|---|---|
| **ENGINE label** | `PRESSED` |
| **Definition** | Total units with `progressLog` stage `pressed` within the measured period. |
| **Why it matters** | Pressing is the core production event. If pressed count is zero, the factory is not moving. This is the heartbeat. |
| **Bottom-line impact** | **High.** Pressing feeds everything downstream. No pressing → no QC → no packing → no quacks. |
| **Data exists today?** | **Yes.** `progressLog` entries where `stage === 'pressed'`. |
| **Periods** | Today, MTD. |

---

#### M5. QC PASSED

| | |
|---|---|
| **ENGINE label** | `QC PASSED` |
| **Definition** | Total units with `progressLog` stage `qc_passed` within the measured period. |
| **Why it matters** | QC passed is the quality gate. Units that pass QC are cleared for packing. The gap between pressed and QC passed (excluding rejects) is the QC backlog — units sitting in limbo. |
| **Bottom-line impact** | **High.** QC is the bottleneck between production and fulfillment. |
| **Data exists today?** | **Yes.** `progressLog` entries where `stage === 'qc_passed'`. |
| **Periods** | Today, MTD. |

---

#### M6. REJECTED

| | |
|---|---|
| **ENGINE label** | `REJECTED` |
| **Definition** | Total units with `progressLog` stage `rejected` within the measured period. |
| **Why it matters** | Rejects are direct waste. Reject count is the inverse of yield (M3), but showing it as a raw number makes the cost visceral. "47 rejected today" hits different than "96.2% yield." |
| **Bottom-line impact** | **High.** Every reject is cost with no revenue. |
| **Data exists today?** | **Yes.** `progressLog` entries where `stage === 'rejected'`. Also `S.qcLog` for defect-type breakdown. |
| **Periods** | Today, MTD. |

---

### Tier 2 — Strong operational leverage

These metrics answer: is the machine running well, or is something dragging?

---

#### M7. PACKED

| | |
|---|---|
| **ENGINE label** | `PACKED` |
| **Definition** | Total units with `progressLog` stage `packed` within the measured period. |
| **Why it matters** | Packed units are the pre-ship inventory. The gap between QC passed and packed is the packing backlog. If QC is fast but packing is slow, units pile up. |
| **Bottom-line impact** | **Medium-high.** Packing throughput directly gates outbound. |
| **Data exists today?** | **Yes.** `progressLog` entries where `stage === 'packed'`. |
| **Periods** | Today, MTD. |

---

#### M8. READY (on skid / in loading)

| | |
|---|---|
| **ENGINE label** | `READY` |
| **Definition** | Cumulative units in `ready` stage across all active (non-archived, non-done) jobs. This is a live snapshot, not a period sum. |
| **Why it matters** | Ready units are inventory waiting to leave. High ready count with low quack rate means the plant is producing but not shipping — which may indicate fulfillment bottlenecks, customer holds, or shipping delays. |
| **Bottom-line impact** | **Medium-high.** Ready units are sunk cost not yet converted to revenue. |
| **Data exists today?** | **Yes.** `getJobProgress(job).ready` summed across active jobs. |
| **Periods** | Live snapshot. |

---

#### M9. PRESSES ONLINE

| | |
|---|---|
| **ENGINE label** | `PRESSES` |
| **Definition** | Count of presses where `status === 'online'` vs total presses. |
| **Why it matters** | Offline presses are lost capacity. If 1 of 4 presses is down, the plant is running at 75% capacity ceiling regardless of demand. |
| **Bottom-line impact** | **Medium-high.** Press availability is the physical capacity constraint. |
| **Data exists today?** | **Yes.** `S.presses` array, each with `status` (`online` / `offline` / `maintenance`). |
| **Periods** | Live snapshot. |
| **Gap note** | Press status is current-state only. There is no timestamp log of when presses went online/offline. Uptime % (M20) requires this. |

---

#### M10. CAUTIONED JOBS

| | |
|---|---|
| **ENGINE label** | `⚠ CAUTIONED` |
| **Definition** | Count of non-archived jobs where `isJobCautioned(job) === true`. |
| **Why it matters** | Every cautioned job is stuck. Stuck jobs consume floor attention, block press assignments, delay fulfillment. Caution count is a measure of operational friction. |
| **Bottom-line impact** | **Medium.** Cautions don't cost money directly, but they cost time and attention — which costs money. |
| **Data exists today?** | **Yes.** `job.caution` JSONB with `reason` and `since` fields. `isJobCautioned()` in `core.js`. |
| **Periods** | Live snapshot. |
| **Sub-metrics** | Caution by reason (`CAUTION_REASONS`), caution age (from `caution.since`), caution without note follow-up (`cautionNeedsNote()`). |

---

#### M11. OVERDUE JOBS

| | |
|---|---|
| **ENGINE label** | `OVERDUE` |
| **Definition** | Count of non-archived, non-done jobs where `job.due` is before today. |
| **Why it matters** | Overdue jobs are broken promises. They indicate scheduling failures, upstream delays, or capacity shortfalls. |
| **Bottom-line impact** | **Medium.** Overdue = late delivery = unhappy clients = potential lost business. |
| **Data exists today?** | **Yes.** `job.due` (date string) compared to current date. Already computed in `getFloorStats()`. |
| **Periods** | Live snapshot. |

---

#### M12. PENDING QC

| | |
|---|---|
| **ENGINE label** | `PENDING QC` |
| **Definition** | `pressed - qcPassed - rejected` summed across active jobs. Units that have been pressed but not yet QC'd or rejected. |
| **Why it matters** | This is the QC backlog. High pending QC means the press is outrunning QC — units are piling up between stages. It's a flow imbalance indicator. |
| **Bottom-line impact** | **Medium.** QC backlog delays downstream movement and ties up floor space. |
| **Data exists today?** | **Yes.** `getJobProgress(job).pendingQC` already computed in `core.js`. |
| **Periods** | Live snapshot. |

---

#### M13. ORDER BOOK (total ordered, active jobs)

| | |
|---|---|
| **ENGINE label** | `ORDER BOOK` |
| **Definition** | Total `qty` summed across all non-archived, non-done jobs. The total unit demand the plant is working against. |
| **Why it matters** | This is the denominator for all throughput ratios. It answers: how much work is in front of us? Combined with QPM (M2), it gives a rough "months of backlog" reading. |
| **Bottom-line impact** | **Medium.** Not directly actionable, but essential context for every other metric. |
| **Data exists today?** | **Yes.** `job.qty` (string, parsed to int) summed across active jobs. |
| **Periods** | Live snapshot. |

---

### Tier 3 — Management / rhythm visibility

These metrics answer: is the system healthy? Are we in rhythm?

---

#### M14. JOBS BY STATUS

| | |
|---|---|
| **ENGINE label** | `PIPELINE` |
| **Definition** | Count of active jobs in each status: `queue`, `pressing`, `assembly`, `hold`, `done`. |
| **Why it matters** | Pipeline shape reveals flow health. Too many in queue → not pulling fast enough. Too many in hold → exceptions piling up. Healthy pipeline is a forward-leaning wedge. |
| **Bottom-line impact** | **Low-medium.** Visibility metric. Actionable when shape is wrong. |
| **Data exists today?** | **Yes.** `job.status` for each job. `STATUS_ORDER` in `core.js`. |
| **Periods** | Live snapshot. |

---

#### M15. ASSET READINESS

| | |
|---|---|
| **ENGINE label** | `ASSETS READY` |
| **Definition** | Across all active jobs in `queue` or `pressing` status: `assetHealth(job).pct` averaged or counted. Possible readings: "X jobs fully asset-ready" or "average asset readiness Y%." |
| **Why it matters** | A job can't go on the press if assets aren't in-house. Low asset readiness on queued jobs means the queue is fake — those jobs aren't really pressable. |
| **Bottom-line impact** | **Low-medium.** Indirectly affects throughput by revealing how much of the queue is genuinely ready. |
| **Data exists today?** | **Yes.** `assetHealth(job)` returns `{ done, total, pct }` from `job.assets` and `ASSET_DEFS`. |
| **Periods** | Live snapshot. |

---

#### M16. PACK READINESS

| | |
|---|---|
| **ENGINE label** | `PACK READY` |
| **Definition** | Across jobs in `assembly` status or with `fulfillment_phase` set: `packHealth(job).pct` averaged or counted. "X jobs pack-ready" or "average pack readiness Y%." |
| **Why it matters** | Pack readiness gates the transition from production to fulfillment. A job that's fully pressed and QC'd but not pack-ready will sit — blocking floor space and delaying quacks. |
| **Bottom-line impact** | **Low-medium.** Gates the last mile before outbound. |
| **Data exists today?** | **Yes.** `packHealth(job)` returns `{ done, total, pct }` from `job.packCard` and `PACK_DEFS`. |
| **Periods** | Live snapshot. |

---

#### M17. FULFILLMENT DISTRIBUTION

| | |
|---|---|
| **ENGINE label** | `SHIP QUEUE` |
| **Definition** | Count of jobs by `fulfillment_phase`: awaiting instructions, ready for pickup, ready to ship, local pickup, in-house fulfillment, held/exception, shipped. |
| **Why it matters** | Shows where jobs are pooling in the outbound pipeline. "12 jobs ready to ship but only 2 shipped this week" reveals a shipping bottleneck. |
| **Bottom-line impact** | **Low-medium.** Late-stage visibility. |
| **Data exists today?** | **Yes.** `job.fulfillment_phase` field. `FULFILLMENT_PHASES` in `core.js`. |
| **Periods** | Live snapshot. |

---

#### M18. DEFECT DISTRIBUTION

| | |
|---|---|
| **ENGINE label** | `DEFECT MIX` |
| **Definition** | Breakdown of rejected units by defect type (`QC_TYPES`: FLASH, BLEMISH, OFF-CENTER, AUDIO, UNTRIMMED, BISCUIT/FLASH) for the measured period. |
| **Why it matters** | If 80% of rejects are one type, that's a specific fixable problem (tooling, process, material). Without the breakdown, yield is just a number — with it, yield becomes actionable. |
| **Bottom-line impact** | **Medium** (when yield is poor), **low** (when yield is healthy). |
| **Data exists today?** | **Yes.** `S.qcLog` entries with `type` (defect type), `job`, `date`, `time`. Also `progressLog` rejected entries may carry `reason`. |
| **Periods** | Today, MTD, trailing 7d. |

---

#### M19. JOBS ON PRESS

| | |
|---|---|
| **ENGINE label** | `ON PRESS` |
| **Definition** | Count of presses currently assigned to a job (`press.job_id !== null`). Optionally: list of job catalogs currently on press. |
| **Why it matters** | "3 of 4 presses are running jobs" is a quick utilization read. "Press 2 has no job" is an actionable observation. |
| **Bottom-line impact** | **Low-medium.** Utilization visibility. |
| **Data exists today?** | **Yes.** `S.presses` with `job_id` field. Already used in `getFloorStats()`. |
| **Periods** | Live snapshot. |

---

### Tier 4 — Later / advanced analytics

These metrics require data that doesn't exist yet, or require historical depth the app doesn't yet accumulate.

---

#### M20. PRESS UPTIME %

| | |
|---|---|
| **ENGINE label** | `UPTIME` |
| **Definition** | `(hours press online) / (total hours in period)` per press, averaged across presses. |
| **Why it matters** | The single best measure of capital utilization. A press that costs $X/month but runs 60% of the time is 40% waste. |
| **Bottom-line impact** | **High** (if measured). |
| **Data exists today?** | **No.** Press `status` is current-state only — there is no log of state transitions with timestamps. |
| **What's needed** | A `press_status_log` table or appended JSONB log on presses: `{ status, timestamp }` entries logged whenever `setPressStatus()` is called. |

---

#### M21. CYCLE TIME (order to quack)

| | |
|---|---|
| **ENGINE label** | `CYCLE TIME` |
| **Definition** | Elapsed time from job creation (or first `pressed` entry) to last `shipped`/`picked_up` entry. Per job, then averaged or median'd across jobs. |
| **Why it matters** | Cycle time is the factory's clock. Shorter cycle time = faster revenue recognition, less WIP inventory, happier clients. |
| **Bottom-line impact** | **High** (if measured). |
| **Data exists today?** | **Partial.** `progressLog` has timestamps for first pressed and last shipped. But job creation date is not explicitly stored (no `created_at` column — Supabase may have it as row metadata). |
| **What's needed** | Reliable `created_at` on jobs table. Computation: `lastShippedTimestamp - createdAt` or `lastShippedTimestamp - firstPressedTimestamp`. |

---

#### M22. THROUGHPUT PER PRESS

| | |
|---|---|
| **ENGINE label** | `PRESS OUTPUT` |
| **Definition** | `pressed` qty attributed to a specific press, per period. |
| **Why it matters** | Reveals whether one press is underperforming. If Press 1 does 500/day and Press 3 does 200/day on similar jobs, Press 3 has a problem. |
| **Bottom-line impact** | **Medium-high** (if measured). |
| **Data exists today?** | **Partial.** `progressLog` entries include `person` (e.g., "Log · Admin") but do NOT include which press logged the entry. Press assignment is a snapshot (`press.job_id`), not stamped on each log entry. |
| **What's needed** | Add `press_id` or `press_name` to `progressLog` entries at log time. The data is available (`job.press` or the press the operator is using) — it's just not written to the entry. |

---

#### M23. REJECT RATE BY PRESS

| | |
|---|---|
| **ENGINE label** | `PRESS REJECT RATE` |
| **Definition** | `rejected / (qcPassed + rejected)` broken down by which press ran the job. |
| **Why it matters** | If one press has 8% reject rate and the others are at 2%, that press needs maintenance or recalibration. Without per-press attribution, you can't isolate the source. |
| **Bottom-line impact** | **Medium-high** (if measured). |
| **Data exists today?** | **No.** Same gap as M22 — log entries don't carry press ID. |
| **What's needed** | Same as M22: `press_id` on progress entries. |

---

#### M24. UNITS PER LABOR HOUR

| | |
|---|---|
| **ENGINE label** | `UPH` (Units Per Hour) |
| **Definition** | `pressed / labor_hours` for the measured period. |
| **Why it matters** | The ultimate productivity metric. Answers: is the plant getting more efficient or less? |
| **Bottom-line impact** | **High** (if measured). |
| **Data exists today?** | **No.** Labor hours are not tracked. `S.scheduleEntries` has shift labels and areas but no clock-in/clock-out or hours fields. |
| **What's needed** | Either: (a) track shift hours in schedule entries, or (b) infer from schedule shift labels (e.g., "8am–4pm" → 8 hours). Both require data model changes. |

---

#### M25. WIP VALUE

| | |
|---|---|
| **ENGINE label** | `WIP` (Work In Progress) |
| **Definition** | Units that have been pressed but not yet shipped, valued at estimated cost per unit. |
| **Why it matters** | WIP is tied-up capital. High WIP with low throughput means money is stuck on the floor. |
| **Bottom-line impact** | **High** (if measured with cost data). |
| **Data exists today?** | **Partial.** Unit counts exist (pressed − shipped). Cost per unit does not exist in the data model. |
| **What's needed** | A cost-per-unit field on jobs, or a default cost assumption. Without it, WIP can only be shown as unit count, not dollar value. |

---

#### M26. CAUTION AGE

| | |
|---|---|
| **ENGINE label** | `CAUTION AGE` |
| **Definition** | For each cautioned job: `now - caution.since` (in hours or days). Show average, max, or distribution. |
| **Why it matters** | A 2-hour-old caution is normal triage. A 5-day-old caution is a forgotten blocker. Aging cautions indicate organizational failure to resolve exceptions. |
| **Bottom-line impact** | **Low-medium.** Operational hygiene metric. |
| **Data exists today?** | **Yes.** `job.caution.since` is an ISO timestamp. Age is trivially computed. |
| **Periods** | Live snapshot. |

---

#### M27. NOTE RESPONSE TIME

| | |
|---|---|
| **ENGINE label** | — (Tier 4 only) |
| **Definition** | Time between caution being set and the first note added after `caution.since`. |
| **Why it matters** | Measures how fast the team responds to exceptions. Fast response = healthy exception protocol. |
| **Bottom-line impact** | **Low.** Process health metric. |
| **Data exists today?** | **Yes** (computationally). `caution.since` vs `notesLog` entries with `timestamp >= caution.since`. Already partially computed by `cautionNeedsNote()`. |

---

## 3. Core MVP ENGINE blocks

Recommended first 9 blocks for ENGINE MVP, selected by: bottom-line impact, data availability, and visual clarity.

### Primary grid (3 × 3)

| Position | Block | Metric | Period | Color family | Click target |
|---|---|---|---|---|---|
| 1 | **PRESSED** | M4 | Today | Amber (`--w`) | LOG → PRESS mode |
| 2 | **QC PASSED** | M5 | Today | Green (`--g`) | LOG → PRESS mode |
| 3 | **YIELD** | M3 | Today | Green/Red conditional | Detail expand: yield by job |
| 4 | **PACKED** | M7 | MTD | Cyan (`--cy`) | LOG → SHIP mode |
| 5 | **QUACKED** | M1 | MTD | Cyan (`--cy`) | LOG → SHIP mode |
| 6 | **QPM** | M2 | MTD | Cyan (`--cy`) | Detail expand: monthly trend |
| 7 | **PRESSES** | M9 | Live | Neutral | FLOOR |
| 8 | **⚠ CAUTIONED** | M10 | Live | Caution amber | Detail expand: cautioned job list |
| 9 | **OVERDUE** | M11 | Live | Red (`--r`) | Detail expand: overdue job list |

### Why this arrangement

**Row 1: Production heartbeat (today).** Did units move through the press and QC today? What was the yield? This row tells you whether the factory ran today.

**Row 2: Output pipeline (MTD).** How many units are packed, how many quacked, what's the monthly rate? This row tells you whether the factory is delivering.

**Row 3: Health indicators (live).** Are presses up? Are jobs stuck? Are we late? This row tells you whether the factory is healthy.

### Stretch blocks (add 3 more for a 4 × 3 grid when ready)

| Position | Block | Metric | Rationale |
|---|---|---|---|
| 10 | **REJECTED** | M6 | Today. Makes reject count visceral next to yield. |
| 11 | **PENDING QC** | M12 | Live. Shows QC backlog — the hidden bottleneck. |
| 12 | **ORDER BOOK** | M13 | Live. Context denominator for everything. |

---

## 4. Quack metrics

### What is a Quack?

A **Quack** is a single finished unit that has left the building. Specifically:

> A Quack is one unit with a `progressLog` entry at stage `shipped` or `picked_up`.

Quacks are the atomic unit of output. The plant's purpose is to produce quacks. Everything else — pressing, QC, packing, assets, notes — exists in service of quacks.

### Quack-coded KPIs

| KPI | Label | Definition | Period |
|---|---|---|---|
| **Quacks Today** | `QTD` | Sum of `shipped` + `picked_up` qty where timestamp is today. | Daily |
| **Quacks Per Month** | `QPM` | Sum of `shipped` + `picked_up` qty where timestamp is current calendar month. | Monthly |
| **Quacks Per Week** | `QPW` | Sum of `shipped` + `picked_up` qty where timestamp is current ISO week. | Weekly |
| **Quack Rate** | `Q/DAY` | QPM divided by business days elapsed in current month. Daily average rate. | Derived |
| **Quack Pace** | `Q PACE` | `Q/DAY × business days in month`. Projected QPM at current rate. | Derived |
| **Quack Backlog** | `Q BACK` | `ORDER BOOK - cumulative quacked`. Total units still owed. | Live |
| **Quack Yield** | `Q YIELD` | `quacked / pressed` for the period. End-to-end yield from press to door. | MTD |

### Quack Pace: the projected QPM

Quack Pace deserves special attention. It answers: **if we keep going at today's rate, how many quacks will we have at month-end?**

```
Q/DAY = QPM_so_far / business_days_elapsed
Q PACE = Q/DAY × total_business_days_in_month
```

If QPM goal is set (later phase), Quack Pace vs goal is the single most actionable number on ENGINE.

### Which quack metrics belong in MVP?

| Metric | MVP? | Rationale |
|---|---|---|
| Quacks Today | Later | Nice to have but low daily count may read as noise. Better as a feed item than a big block. |
| QPM | **Yes (block 6)** | North-star metric. |
| QPW | Later | Useful but redundant with QPM for MVP. |
| Q/DAY | Later | Derived. Requires business-day logic. |
| Q PACE | Later | Highest value derived metric. Add when QPM goal is introduced. |
| Q BACK | Later | Requires summing order book minus cumulative shipped. Useful but second-pass. |
| Q YIELD | Later | End-to-end yield. More meaningful than single-stage yield but harder to interpret at first. |

---

## 5. Source-of-data map

For each MVP block, the exact data path.

### Block 1: PRESSED (Today)

| | |
|---|---|
| **Source** | `S.jobs[]` → each `job.progressLog[]` |
| **Filter** | `entry.stage === 'pressed'` AND `new Date(entry.timestamp).toDateString() === today` |
| **Aggregation** | `sum(entry.qty)` |
| **Denominator (for rail)** | Sum of `job.qty` across all non-archived, non-done jobs |
| **Existing helper** | `getJobProgress(job).pressed` gives per-job total, but ENGINE needs date-filtered aggregation — a new helper is needed |
| **Code location** | `progressLog` hydrated in `supabase.js` → `loadAllData` → attached to each job |

### Block 2: QC PASSED (Today)

| | |
|---|---|
| **Source** | `S.jobs[]` → each `job.progressLog[]` |
| **Filter** | `entry.stage === 'qc_passed'` AND timestamp is today |
| **Aggregation** | `sum(entry.qty)` |
| **Denominator (for rail)** | Today's pressed count (Block 1) |
| **Existing helper** | `getJobProgress(job).qcPassed` — same date-filter gap as Block 1 |

### Block 3: YIELD (Today)

| | |
|---|---|
| **Source** | Derived from Blocks 2 and 6 (today's rejected) |
| **Computation** | `qcPassedToday / (qcPassedToday + rejectedToday)` |
| **Denominator (for rail)** | 100% (yield is a percentage) |
| **Edge case** | If `qcPassedToday + rejectedToday === 0`, show `—` not `0%` |
| **Color logic** | `>= 97%` → green, `>= 90%` → amber, `< 90%` → red |
| **Existing helper** | None. New derived computation from date-filtered progress entries. |

### Block 4: PACKED (MTD)

| | |
|---|---|
| **Source** | `S.jobs[]` → each `job.progressLog[]` |
| **Filter** | `entry.stage === 'packed'` AND timestamp is current month |
| **Aggregation** | `sum(entry.qty)` |
| **Denominator (for rail)** | MTD `qc_passed` sum (what was available to pack) |

### Block 5: QUACKED (MTD)

| | |
|---|---|
| **Source** | `S.jobs[]` → each `job.progressLog[]` |
| **Filter** | `entry.stage === 'shipped' \|\| entry.stage === 'picked_up'` AND timestamp is current month |
| **Aggregation** | `sum(entry.qty)` |
| **Denominator (for rail)** | MTD packed sum or ORDER BOOK — product decision |

### Block 6: QPM

| | |
|---|---|
| **Source** | Same as Block 5 |
| **Computation** | Identical to QUACKED MTD. Label changes the framing from "count" to "rate." |
| **Secondary context** | Previous month total (if available), or "X/day avg" |
| **Rail** | vs. previous month, or vs. order book |

### Block 7: PRESSES

| | |
|---|---|
| **Source** | `S.presses[]` |
| **Computation** | `S.presses.filter(p => p.status === 'online').length` / `S.presses.length` |
| **Visual** | Dot indicators: ◉ (online), ○ (offline) — one per press |
| **Existing helper** | Already computed in `getFloorStats()` |

### Block 8: ⚠ CAUTIONED

| | |
|---|---|
| **Source** | `S.jobs[]` |
| **Computation** | `S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done' && isJobCautioned(j)).length` |
| **Detail expand** | List of cautioned job catalogs with `cautionReasonLabel()` and age from `caution.since` |
| **Existing helper** | `isJobCautioned()`, `cautionReasonLabel()`, `cautionNeedsNote()` — all in `core.js` |

### Block 9: OVERDUE

| | |
|---|---|
| **Source** | `S.jobs[]` |
| **Computation** | `S.jobs.filter(j => !isJobArchived(j) && j.status !== 'done' && j.due && new Date(j.due) < Date.now()).length` |
| **Detail expand** | List of overdue job catalogs with due date and days overdue |
| **Existing helper** | Already computed in `getFloorStats()` |

### New helper needed: `getEngineData(dateFilter)`

The primary gap is that `getJobProgress()` returns **lifetime totals** per job, not **date-filtered** totals. ENGINE needs a function that scans `progressLog` entries across all jobs and filters by timestamp.

```
function getEngineData(periodStart, periodEnd) {
  // Iterate S.jobs (non-archived)
  // For each job, iterate job.progressLog
  // Filter entries where timestamp >= periodStart && timestamp < periodEnd
  // Sum qty by stage
  // Return { pressed, qcPassed, rejected, packed, ready, shipped, pickedUp, held }
}
```

This is a ~15-line function. All data is already in memory.

---

## 6. Gaps

### Gap 1: Date-filtered progress aggregation

| | |
|---|---|
| **What's missing** | A helper that sums `progressLog` by stage for a date range, across all jobs. |
| **Impact** | Blocks 1–6 all need this. |
| **Difficulty** | Trivial. 15 lines of JS. All data in memory. |
| **Blocking?** | Yes, for MVP. But trivially solvable. |

### Gap 2: Press attribution on log entries

| | |
|---|---|
| **What's missing** | `progressLog` entries do not include which press produced the units. |
| **Impact** | M22 (throughput per press) and M23 (reject rate per press) are impossible. |
| **Difficulty** | Small data model change: add `press_id` or `press_name` to the entry written by `logJobProgress()`. |
| **Blocking?** | Not for MVP. Required for Tier 4. |

### Gap 3: Press status history

| | |
|---|---|
| **What's missing** | No log of press online/offline transitions. |
| **Impact** | M20 (press uptime %) is impossible. |
| **Difficulty** | New table or JSONB append when `setPressStatus()` is called. |
| **Blocking?** | Not for MVP. Required for Tier 4. |

### Gap 4: Job creation timestamp

| | |
|---|---|
| **What's missing** | Jobs do not have an explicit `created_at` field. Supabase may provide row metadata, but it's not exposed to the client. |
| **Impact** | M21 (cycle time from order to quack) can only be approximated using first `pressed` timestamp. |
| **Difficulty** | Small: add `created_at` default on Supabase jobs table, or read Supabase row metadata. |
| **Blocking?** | Not for MVP. Required for Tier 4. |

### Gap 5: Labor hours

| | |
|---|---|
| **What's missing** | No clock-in/clock-out or shift-hours tracking. Schedule entries have `shift_label` and `area` but no numeric hours. |
| **Impact** | M24 (units per labor hour) is impossible. |
| **Difficulty** | Significant. Requires either manual hour entry or clock-in/clock-out system. |
| **Blocking?** | Not for MVP. Tier 4 long-term. |

### Gap 6: Cost per unit

| | |
|---|---|
| **What's missing** | No cost data on jobs. Material cost, labor cost, overhead are not modeled. |
| **Impact** | M25 (WIP value in dollars) is impossible. WIP in unit count is available. |
| **Difficulty** | Would require adding cost fields to the job model or a separate cost-estimation system. |
| **Blocking?** | Not for MVP. Not recommended for PMP OPS — cost accounting should stay in accounting systems. |

### Gap 7: QPM goal / target

| | |
|---|---|
| **What's missing** | No mechanism to set a monthly output target. |
| **Impact** | Quack Pace (Q PACE) vs goal — the most motivating possible ENGINE reading — cannot be shown. |
| **Difficulty** | Trivial: a single setting (number) persisted in Supabase or local storage. |
| **Blocking?** | Not for MVP. High-value Phase 2 addition. |

---

### Gap severity summary

| Gap | Severity for MVP | Severity for full ENGINE |
|---|---|---|
| Date-filtered aggregation | **Must fix** (trivial) | Must fix |
| Press attribution on entries | Not needed | **Important** |
| Press status history | Not needed | **Important** |
| Job created_at | Not needed | Moderate |
| Labor hours | Not needed | Moderate |
| Cost per unit | Not needed | Low (out of scope) |
| QPM goal | Not needed | **High value** |

**Bottom line:** MVP requires exactly one new helper function. Everything else is already in memory.

---

*End of ENGINE Metric Map. Read-only analysis — no code changes.*
