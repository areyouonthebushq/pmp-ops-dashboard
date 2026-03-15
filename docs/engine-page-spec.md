# ENGINE — Page Strategy & Spec

**The living instrumentation layer of the plant.**
Not a reports page. Not a dashboard. The engine room.

*Nashville · Press Floor Operations · physicalmusicproducts.com*

---

## 1. Executive summary

PMP OPS has strong surfaces for **doing work** (LOG, FLOOR, Card Zone PACKING, NOTES) and for **seeing state** (JOBS, LOG SHIP / Card Zone; SHIP page purged, Assets). What it does not yet have is a surface that answers the factory-scale question: **is the machine moving?**

ENGINE is that surface. It is a data-first console that reads the same `progressLog`, job, press, and caution data the rest of the app already produces — and compresses it into big, scanable telemetry blocks. Think: factory engine room dials, not a spreadsheet. Mastering rack VU meters, not a pivot table.

The atomic unit of output is the **Quack** — a finished unit out the door. The north-star metric is **QPM** (Quacks Per Month). Everything on ENGINE works backward from that: what moved, what's stuck, what yielded, what shipped.

ENGINE does not replace any existing surface. It reads the same data, shows it at a different altitude, and links back into the surfaces that own the detail.

---

## 2. What ENGINE is

| | |
|---|---|
| **Industrial telemetry console** | Big blocks, big numbers, minimal chrome. The question is "is the factory alive?" not "give me a report." |
| **Movement-first** | Every block answers a movement question: how many pressed today, how many QC'd, how many packed, how many quacked. |
| **Click-through, not click-around** | Each block is a portal. Click → detail view or jump to the surface that owns that data. |
| **Live** | ENGINE reads current state on render. No stale cache, no "run report." Same render cycle as FLOOR/JOBS. |
| **A read surface** | ENGINE does not write data. LOG writes. FLOOR writes. Card Zone (PACKING face) writes. ENGINE reads. |
| **In-family** | Same nav bar, same tokens, same visual grammar as the rest of PMP OPS. It should feel like a page the machine already wanted to have. |

### Thematic direction

- **Factory engine room.** Gauges, rails, indicator lights. Not charts and pie graphs.
- **Mastering rack / signal chain.** VU meters, level bars, clip indicators. Information density without noise.
- **Vignelli-clean industrial.** Big Helvetica numbers. Monospace secondary. Grid-strict layout. No decoration.
- **TV-land "machine is alive."** If you put this on the plant TV next to the existing TV view, it should feel like the factory is broadcasting its own vitals.

---

## 3. What ENGINE is not

| ENGINE is not | Why |
|---|---|
| A business intelligence dashboard | No pivot tables, no slice-and-dice, no "export to PDF." |
| A financial/accounting surface | No invoices, no revenue, no margin, no billing. |
| A CRM or pipeline view | No client names, no deal stages, no "project leads." That stays in Bitrix. |
| A replacement for FLOOR | FLOOR answers "what's running where." ENGINE answers "is the factory moving." |
| A replacement for LOG | LOG is the input console (write movement). ENGINE is the output console (read movement). |
| A scheduling or forecasting tool | No "what should we run next" or "can we hit this date." That's a later surface. |
| A general "analytics" page | No arbitrary query builder, no user-defined charts. Fixed, opinionated blocks. |

---

## 4. User goals for ENGINE

| Who | What they want to know | How often |
|---|---|---|
| **Plant owner / GM** | Is the factory moving? What's the output? Where is it stuck? | Daily, glance |
| **Floor manager** | What moved today? Which jobs are lagging? Are we yielding well? | Multiple times/day |
| **Admin / ops lead** | QPM trend. Caution concentration. Press utilization. Pack-readiness backlog. | Daily to weekly |
| **Anyone on TV** | Big numbers: pressed today, quacked this month, yield %, jobs cautioned. | Ambient, always-on |

### The five questions ENGINE answers

1. **Is the factory moving?** — Did units move today? This hour?
2. **Where is movement happening?** — Which presses are producing? Which jobs are flowing?
3. **Where is movement stuck?** — What's cautioned? What's overdue? Where is yield dropping?
4. **What is the output?** — How many quacked this period? QPM trajectory?
5. **Are we getting our quacks in a row?** — Pack readiness pipeline. Are jobs flowing from press → QC → pack → out?

---

## 5. Core interaction model

### 5.1 Block grid

ENGINE is a grid of **big square blocks** (or near-square). Each block owns one telemetry reading. Blocks are fixed — not user-configurable in MVP. The grid is responsive but strict: 2–3 columns on desktop, 1 column on mobile.

```
┌───────────────────┬───────────────────┬───────────────────┐
│                   │                   │                   │
│   PRESSED TODAY   │   QC'D TODAY      │   QUACKED (MTD)   │
│                   │                   │                   │
│       1,240       │      1,180        │       8,420       │
│   ▮▮▮▮▮▮▮▮░░░    │   ▮▮▮▮▮▮▮▮░░░    │   ▮▮▮▮▮▮░░░░░░   │
│                   │                   │                   │
├───────────────────┼───────────────────┼───────────────────┤
│                   │                   │                   │
│   YIELD           │   PRESSES         │   ⚠ CAUTIONED     │
│                   │                   │                   │
│      95.2%        │      3 / 4        │        2          │
│   ▮▮▮▮▮▮▮▮▮▮░    │   ◉ ◉ ◉ ○        │   ▲ ▲             │
│                   │                   │                   │
├───────────────────┼───────────────────┼───────────────────┤
│                   │                   │                   │
│   PACKED (MTD)    │   READY / ON SKID │   QPM             │
│                   │                   │                   │
│       6,800       │       820         │      12,400       │
│   ▮▮▮▮▮░░░░░░    │   ▮▮▮░░░░░░░░    │   ▮▮▮▮▮▮▮▮░░░    │
│                   │                   │                   │
└───────────────────┴───────────────────┴───────────────────┘
```

### 5.2 Block anatomy

Each block has a fixed structure:

```
┌─────────────────────────┐
│  LABEL              tag │   ← section label (monospace, small, dim)
│                         │      optional tag (TODAY / MTD / RATE)
│        1,240            │   ← primary number (large, monospace, bold)
│                         │
│  ▮▮▮▮▮▮▮▮░░░░░░░       │   ← rail / gauge (thin bar, fill proportional)
│  1,240 / 2,000          │   ← secondary context (dim, small)
│                         │
└─────────────────────────┘
```

- **Primary number** is the hero. Big. Monospace. Color-coded to meaning (amber for production, cyan for ship-family, green for output, red for problems).
- **Rail / gauge** is always present. It compresses ratio into a thin bar. Same visual language as LOG console rail.
- **Secondary context** is optional. Denominator, %, delta, or a compact list.
- **Clicking a block** opens a detail view or navigates to the owning surface.

### 5.3 Click-through behavior

| Block | Click destination |
|---|---|
| PRESSED TODAY | LOG page (PRESS mode) |
| QC'D TODAY | LOG page (PRESS mode, action = qc_pass) |
| QUACKED (MTD) | LOG page (SHIP mode) or detail drill showing job breakdown |
| YIELD | Detail view: yield by job (inline expand or overlay) |
| PRESSES | FLOOR page |
| ⚠ CAUTIONED | Detail list of cautioned jobs (inline expand); click job → RSP |
| PACKED (MTD) | LOG page (SHIP mode, action = packed) |
| READY / ON SKID | (SHIP page purged; use LOG SHIP + Card Zone PACKING) |
| QPM | Detail view: monthly trend (inline expand, last 3–6 months) |

### 5.4 Date/period controls

ENGINE defaults to **today** for daily blocks and **current month** for MTD/QPM blocks. A minimal date control (same language as LOG date nav) allows:
- **Today** (default, highlighted)
- **← / →** day navigation for daily blocks
- MTD blocks always show current calendar month (later: selectable month)

No arbitrary date ranges in MVP. The console reads "now."

---

## 6. Visual and thematic direction

### 6.1 Design tokens

ENGINE should use the existing PMP OPS token system. No new palette — just deliberate application:

| Semantic | Token | Usage on ENGINE |
|---|---|---|
| Production / press | `--w` (amber) | PRESSED, PRESS blocks |
| QC / yield | `--g` (green) | QC'D, YIELD, healthy indicators |
| Ship / outbound | `--cy` (cyan) | PACKED, READY, QUACKED, QPM |
| Caution / stuck | `#ffb300` (caution amber) | CAUTIONED block, warning indicators |
| Problem / reject | `--r` (red) | Yield drop, reject spike |
| Neutral / structure | `--b1`, `--b2`, `--s` | Block borders, grid lines, dimmed labels |

### 6.2 Typography

| Element | Treatment |
|---|---|
| Block label | `'Special Elite'` or `'Inconsolata'` · 11px · letter-spacing 2px · uppercase · `var(--d3)` |
| Primary number | `'Inconsolata'` · 48–64px · bold · color by semantic |
| Secondary context | `'Inconsolata'` · 12px · `var(--d2)` |
| Rail | 6px tall bar · same as LOG console rail |

### 6.3 Layout

- **Grid-strict.** CSS Grid, fixed columns (3 on wide, 2 on tablet, 1 on phone).
- **Square blocks.** Aspect ratio should trend toward 1:1 or slightly landscape. No tall thin panels.
- **Breathing room.** Each block has generous internal padding. Numbers should dominate whitespace.
- **No cards.** Blocks are not "cards" with shadows and rounded corners. They are grid cells with thin borders. The grid itself is the frame.
- **Dark.** ENGINE inherits the app dark theme. Blocks are `var(--s)` or `var(--s2)` background. Borders are `var(--b1)`.

### 6.4 TV compatibility

ENGINE should be usable as a TV surface (fullscreen, no nav bar). This means:
- Numbers must be legible at 10+ feet.
- The grid should scale gracefully to large landscape screens.
- Consider a dedicated "ENGINE TV" mode (like the existing TV view) or make ENGINE itself TV-friendly by default.
- Auto-refresh: ENGINE should re-render on the same polling/realtime cycle as the rest of the app.

---

## 7. MVP scope

### 7.1 MVP blocks (9 blocks, 3×3 grid)

| # | Block | Data source | Primary number | Rail | Period |
|---|---|---|---|---|---|
| 1 | **PRESSED** | `progressLog` stage `pressed` | Sum qty | pressed / total ordered (active jobs) | Today |
| 2 | **QC PASSED** | `progressLog` stage `qc_passed` | Sum qty | qcPassed / pressed | Today |
| 3 | **QUACKED** | `progressLog` stages `shipped` + `picked_up` | Sum qty | shipped+picked_up / total ordered (active) | MTD |
| 4 | **YIELD** | `qcPassed / (qcPassed + rejected)` | Percentage | fill bar | Today |
| 5 | **PRESSES** | `S.presses` | Online / Total | dot indicators (◉ online, ○ offline) | Live |
| 6 | **⚠ CAUTIONED** | `S.jobs` where `isJobCautioned()` | Count | — (list of catalog labels) | Live |
| 7 | **PACKED** | `progressLog` stage `packed` | Sum qty | packed / qcPassed | MTD |
| 8 | **READY** | `progressLog` stage `ready` | Sum qty | ready / packed | Live |
| 9 | **QPM** | `progressLog` stages `shipped` + `picked_up`, current month | Sum qty | vs. previous month (if available) | MTD |

### 7.2 MVP click behavior

- Blocks 1–3, 7: navigate to LOG (appropriate mode/action).
- Block 4: inline expand showing yield per job (top 5 by reject count).
- Block 5: navigate to FLOOR.
- Block 6: inline expand showing cautioned jobs list; click job → open RSP.
- Block 8: navigate to LOG or Card Zone (SHIP page purged).
- Block 9: inline expand showing monthly totals (last 3 months).

### 7.3 MVP data computation

All MVP blocks can be computed from data already loaded:
- `S.jobs` (with `progressLog` already hydrated from `progress_log` table)
- `S.presses`
- `S.qcLog`
- `getJobProgress(job)` already aggregates all stages per job

No new API calls, no new tables, no new backend. ENGINE is a **read-only view** over existing state.

### 7.4 MVP build list

1. Add `pg-engine` page shell to `index.html` and nav.
2. Add `ENGINE` nav item (suggested icon: `⬡` or `◈` — pick what reads best in the family).
3. Add `renderEngine()` in `render.js`.
4. Add `getEngineData()` helper in `core.js` — aggregates across all non-archived jobs for the requested date/period.
5. Add ENGINE styles in `styles.css` — block grid, typography, rail bars, color application.
6. Wire click-through navigation (`goPg` + optional pre-set state).
7. Wire into `renderAll()` cycle.

### 7.5 What MVP does NOT include

- No historical trend charts (line graphs, sparklines).
- No user-configurable blocks or layout.
- No export/download.
- No per-press breakdown (that's FLOOR).
- No per-employee breakdown.
- No financial data.
- No alert/notification system.
- No forecasting or scheduling.

---

## 8. Later-phase possibilities

These are ordered roughly by leverage and feasibility, not by sequence commitment:

| Phase | Feature | Notes |
|---|---|---|
| **2a** | **Sparkline trends** per block | Tiny inline sparkline (last 7 or 30 days) below the primary number. No new data — just aggregate `progressLog` by date. |
| **2b** | **ENGINE TV mode** | Fullscreen ENGINE with auto-cycling or all-visible layout. Pair with or replace existing TV view. |
| **2c** | **Per-job drill** | Click a block → inline table of top contributing jobs (e.g., "which jobs contributed the most pressed today?"). |
| **3a** | **QPM goal line** | Set a monthly Quack target. Rail shows progress vs. goal. Block glows green when on pace, amber when behind. |
| **3b** | **Yield alert** | If daily yield drops below threshold (e.g. 90%), the YIELD block turns red / pulses. No notification system — just visual. |
| **3c** | **Press uptime / utilization** | Track press online hours vs. idle. Requires new data (press status timestamps — not yet logged). |
| **4a** | **Pack readiness pipeline** | Block showing: jobs with `packHealth < 100%` vs. jobs approaching ship. Card Zone PACKING data, read-only. |
| **4b** | **Time-in-status** | How long have cautioned jobs been cautioned? How long have queued jobs been queued? Requires timestamps already present in `caution.since` and status change logs. |
| **4c** | **Weekly / monthly summary** | Expand date controls to week and month views. Aggregate blocks for broader periods. |
| **5** | **Ambient mode** | ENGINE as a slow-cycling ambient display (rotate through blocks one at a time, full-screen number + rail). For wall-mounted displays. |

---

## 9. Relationship to other surfaces

### 9.1 ENGINE and LOG

| | ENGINE | LOG |
|---|---|---|
| **Role** | Read movement | Write movement |
| **Data** | Aggregates `progressLog` across all jobs | Writes individual entries to `progressLog` |
| **Interaction** | Click block → navigate to LOG | Numpad → LOG action → entry created |
| **Period** | Today + MTD | Single date (with navigation) |

ENGINE is the **dashboard** of the movement LOG writes. They are complementary. ENGINE never writes to `progressLog`.

### 9.2 ENGINE and FLOOR

| | ENGINE | FLOOR |
|---|---|---|
| **Altitude** | Factory-wide | Press-by-press |
| **Question** | "Is the factory moving?" | "What's running where?" |
| **Overlap** | PRESSES block (count) | Press grid (detail per press) |

The PRESSES block on ENGINE is a compressed read of what FLOOR shows in detail. Click → FLOOR.

### 9.3 ENGINE and Card Zone PACKING

| | ENGINE | Card Zone (PACKING) |
|---|---|---|
| **Altitude** | Aggregate readiness signal | Per-job checklist |
| **Data read** | Could read `packHealth()` across jobs (later phase) | Job-scoped `packCard` JSONB |

In MVP, ENGINE does not read Card Zone PACKING data directly. In a later phase, a "Pack Readiness" block could show how many jobs are pack-ready vs. not. Card Zone PACKING remains the detail surface.

### 9.4 ENGINE and NOTES

ENGINE does not read or surface notes directly. NOTES is the explanation/context layer. If ENGINE shows a cautioned job and the user clicks through, they land in RSP or NOTES — where the context lives.

### 9.5 ENGINE and SHIP (purged)

| | ENGINE | SHIP (purged) |
|---|---|---|
| **Altitude** | Aggregate output numbers | (was: per-job fulfillment phase) |
| **READY block** | Count of units in `ready` stage | SHIP page purged; use LOG SHIP + Card Zone PACKING |
| **QPM block** | Total shipped + picked_up, current month | — |

The READY block on ENGINE answered the same question as the former SHIP page at different altitudes. SHIP page purged. See `purgatory-protocol.md`.

### 9.6 Summary: surface altitude map

```
  HIGH ALTITUDE (factory-wide)
  ┌─────────────────────────────────────────┐
  │  ENGINE                                  │
  │  "Is the machine moving? What's output?" │
  └──────────────────┬──────────────────────┘
                     │ click-through
  MEDIUM ALTITUDE (page-level)
  ┌──────┬───────┬──────┬──────┬───────────┐
  │FLOOR │ JOBS  │ LOG  │(SHIP purged)│ CREW/PVC  │
  │where │ what  │count │phase │ who/what  │
  └──┬───┴───┬───┴──┬───┴──┬───┴───────────┘
     │       │      │      │
  LOW ALTITUDE (job-scoped)
  ┌──────┬──────────┬──────────┬────────────┐
  │ RSP  │RECEIVING │Card Zone PACKING│  NOTES     │
  │detail│readiness │pack-ready│ context    │
  └──────┴──────────┴──────────┴────────────┘
```

ENGINE sits at the top of this stack. It does not compete with any surface below it — it compresses their data into high-altitude readings and links down into them for detail.

---

## 10. Recommended build sequence

### Step 1: Shell + nav + static grid (small)

- Add `pg-engine` to `index.html`.
- Add ENGINE to the admin nav bar.
- Add the 3×3 block grid with placeholder data and correct typography/layout.
- Wire into `renderAll()`.
- Validate the visual grammar: does it feel like the engine room?

### Step 2: Live data — daily blocks (medium)

- Implement `getEngineData()` in `core.js` — aggregates `progressLog` by stage for a given date range.
- Wire PRESSED, QC PASSED, YIELD blocks to today's data.
- Wire PRESSES block to `S.presses`.
- Wire CAUTIONED block to `isJobCautioned()` count.
- Rails render proportionally.

### Step 3: Live data — MTD blocks (medium)

- Extend `getEngineData()` to aggregate current month.
- Wire QUACKED, PACKED, READY, QPM blocks.
- QPM shows current month total.

### Step 4: Click-through (small)

- Wire block clicks: navigate to LOG/FLOOR (SHIP page purged) as specified.
- Inline expand for YIELD (per-job), CAUTIONED (job list), QPM (monthly totals).

### Step 5: Polish + TV readiness (small)

- Responsive grid (2-col tablet, 1-col phone).
- Font scaling for TV viewing distance.
- Optional: ENGINE TV mode (fullscreen, no nav).

---

## Appendix A: ENGINE data dictionary

All data required for MVP is already in memory. No new tables, no new API calls.

| Metric | Source | Computation |
|---|---|---|
| Pressed (today) | `S.jobs[].progressLog` | `sum(qty)` where `stage === 'pressed'` and `timestamp` is today |
| QC Passed (today) | `S.jobs[].progressLog` | `sum(qty)` where `stage === 'qc_passed'` and `timestamp` is today |
| Rejected (today) | `S.jobs[].progressLog` | `sum(qty)` where `stage === 'rejected'` and `timestamp` is today |
| Yield (today) | Derived | `qcPassed / (qcPassed + rejected)` for today |
| Packed (MTD) | `S.jobs[].progressLog` | `sum(qty)` where `stage === 'packed'` and `timestamp` is current month |
| Ready (live) | `getJobProgress()` per job | `sum(ready)` across all non-archived jobs |
| Quacked (MTD) | `S.jobs[].progressLog` | `sum(qty)` where `stage in ('shipped','picked_up')` and `timestamp` is current month |
| QPM | Same as Quacked (MTD) | Same computation; label changes meaning (rate context) |
| Presses online | `S.presses` | `count` where `status === 'online'` |
| Cautioned jobs | `S.jobs` | `count` where `isJobCautioned(job)` |
| Total ordered (active) | `S.jobs` | `sum(qty)` for non-archived, non-done jobs |

### Date filtering

`progressLog` entries have ISO timestamps. Filtering by date:
```
const today = new Date().toDateString();
const isToday = (ts) => new Date(ts).toDateString() === today;

const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
const isMTD = (ts) => new Date(ts) >= monthStart;
```

This is the same date logic LOG already uses for its daily feed.

---

## Appendix B: Naming and placement rationale

**Why ENGINE, not DASHBOARD / STATS / REPORTS?**

- "Dashboard" implies a generic BI tool. ENGINE implies a machine — the factory has an engine room, and this is it.
- "Stats" is passive and flat. ENGINE is alive — it reads the machine's vitals.
- "Reports" implies export, print, and historical analysis. ENGINE is a live console.

**Where in the nav?**

Suggested placement: after LOG, before NOTES.

```
NAV: [FLOOR] [JOBS] [TODOS] [LOG] [ENGINE] [NOTES] [PVC] [CREW] [AUDIT] [DEV] (SHIP purged)
```

ENGINE sits between the write surface (LOG) and the context surface (NOTES). It is the read layer between doing and explaining.

**Nav icon?**

Suggested: `◈` — a compact geometric form that reads as "engine" or "core" without being literal. Alternatively `⬢` (hexagon) if that reads better in the family. Final choice should be tested visually alongside the existing nav icons.

---

*End of ENGINE page spec. Read-only strategy — no code changes.*
