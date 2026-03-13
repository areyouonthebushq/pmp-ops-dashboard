# ENGINE — System Language Guide

**How we name things on the instrument panel.**

*Nashville · Press Floor Operations · physicalmusicproducts.com*

---

## 1. Core naming principles

Five rules govern every label that appears on ENGINE and its related surfaces.

### Rule 1: Movement verbs, not status nouns

ENGINE measures *movement*. Labels should read like something that happened, not something that exists.

| Prefer | Avoid |
|---|---|
| PRESSED | Press Count |
| QUACKED | Shipped Units |
| PACKED | Packing Total |

### Rule 2: One word when one word works

Every extra word costs attention. If the operator can read it at 10 feet on the plant TV, the label is right.

| Prefer | Avoid |
|---|---|
| YIELD | QC Yield Rate |
| REJECTED | Rejected Units Count |
| READY | Units Ready for Pickup |

### Rule 3: House-coded, not jargon

Duck language is internal shorthand that earns its keep by being faster and more memorable than the generic alternative. It should feel like something the team invented on the floor — not something a consultant named.

| House term | What it replaces | Why it works |
|---|---|---|
| Quack | Shipped unit | Shorter, stickier, unmistakable in conversation. "How many quacks today?" is faster than "how many shipped units today?" |
| QPM | Monthly shipped total | Three letters. Everyone knows what it means after hearing it once. |
| Achtung | Hold / exception / caution | Foreign-word gravity. Immediately serious without being clinical. |

### Rule 4: Labels describe the *what*, sub-text describes the *so-what*

The big label names the metric. The small sub-text beneath it gives context, ratio, or interpretation. Never put the interpretation in the label.

| Label | Sub-text |
|---|---|
| QPM | out the door |
| YIELD | 842 / 860 inspected |
| REJECTED | 2.1% rate |
| PACKED | 320 / 410 QC |

### Rule 5: No emoji in labels

Icons are permitted (the duck-head SVG for Quack, the triangle for Achtung). Emoji are not. Emoji break the instrument-panel register and read as casual where the surface should read as serious infrastructure.

---

## 2. Recommended labels for ENGINE blocks

These are the canonical labels for the first eight ENGINE blocks, in the order they appear on the console.

| Position | Label | Pronunciation | Definition | Sub-text pattern |
|---|---|---|---|---|
| 1 | **QPM** | "cue-pee-em" | Quacked units for the selected period. North-star metric. | `out the door` / `no quacks yet` |
| 2 | **PRESSED** | "pressed" | Units through the press for the selected period. | `{pressed} / {ordered}` |
| 3 | **QC PASSED** | "Q-C passed" | Units that passed quality control for the selected period. | `{passed} / {pressed} pressed` |
| 4 | **YIELD** | "yield" | Pass rate: `qcPassed / (qcPassed + rejected)`. Percentage. | `{passed} / {inspected}` |
| 5 | **REJECTED** | "rejected" | Units that failed QC for the selected period. | `{rate}% rate` |
| 6 | **PACKED** | "packed" | Units sealed in boxes for the selected period. | `{packed} / {qcPassed} QC` |
| 7 | **READY** | "ready" | Units currently on skids, staged for pickup/shipping. Live snapshot. | `on skids` / `none staged` |
| 8 | **ORDER BOOK** | "order book" | Total ordered quantity across active jobs. Live snapshot. | `{n} active jobs` |

### Label formatting rules

- **All caps.** ENGINE labels are always uppercase. This is not shouting — it is instrument-panel convention.
- **Monospace.** All labels render in `Inconsolata`. This is non-negotiable for the telemetry register.
- **No punctuation.** No periods, colons, or trailing characters in labels.
- **No units in the label.** The label says *what*. The number says *how many*. Do not write `QPM (units)`.

---

## 3. Duck-coded KPI language

### The Quack

A **Quack** is one finished unit that has left the building.

Technically: a unit with a `progressLog` entry at stage `shipped` or `picked_up`.

Conversationally: "we quacked 400 today" means 400 units went out the door.

The Quack is the atomic output unit of the plant. Every other metric feeds into it. The word exists because "shipped unit" is two words and zero personality. Quack is one word, one syllable, and impossible to confuse with anything else in the plant vocabulary.

### The duck icon

The Quack is accompanied by a small duck-head SVG icon (`QUACK_ICON`). This icon:

- Is a custom inline SVG, not an emoji
- Is tintable (inherits `currentColor`)
- Appears in the QPM block label, in LOG SHIP mode, and in the feed
- Should be used *only* for the Quack / shipped-out-the-door concept
- Should never be used decoratively or for non-output metrics

### Quack-family KPIs

| Term | Label | What it means | When to use |
|---|---|---|---|
| **Quack** | (n/a — concept) | One finished unit out the door | Conversation, documentation |
| **QPM** | `QPM` | Quacks Per Month — total quacked in the current month | ENGINE block 1 (default period) |
| **Quacked Today** | `QPM` (with 1D period) | Quacks in the last 24 hours | ENGINE block 1 when period = 1D |
| **QPW** | (future) | Quacks Per Week | Not yet implemented |
| **Quack Pace** | (future) | Projected month-end QPM at current daily rate | Not yet implemented |
| **Quack Backlog** | (future) | Order book minus cumulative quacked | Not yet implemented |

### When to use "Quack" vs "QPM" vs "shipped"

| Context | Use |
|---|---|
| ENGINE block label | `QPM` |
| ENGINE detail sub-text | `out the door` or `quacks per month` |
| LOG SHIP mode action button | `QUACK` (with icon) |
| LOG feed entry | icon + `QUACK` |
| Conversation / docs | "quack" or "quacked" |
| Supabase / data layer | `shipped` / `picked_up` (never rename the data) |
| CSV export / external reporting | "shipped" (the duck stays inside the building) |

Important: the duck language is *internal display language*, not data-model language. The `progressLog` stage is and should remain `shipped` and `picked_up`. The word "quack" lives in labels, conversation, and documentation — never in database columns or API payloads.

---

## 4. What language to avoid

### Avoid: corporate dashboard language

| Avoid | Why | Use instead |
|---|---|---|
| KPI | Generic, soulless | (just name the metric) |
| Metric | Overloaded | (just name the metric) |
| Analytics | Implies a different tool | Telemetry, instrumentation |
| Dashboard | ENGINE is not a dashboard | Console, instrument panel |
| Widget | Implies drag-and-drop customization | Block |
| Card (for ENGINE) | Overloaded — ASSET CARD and PACK CARD already own "card" | Block |

### Avoid: over-cute duck extensions

The duck language works because it is restrained. One house-coded word (Quack) and one icon (duck head). That's the budget. Expanding the duck vocabulary dilutes the signal.

| Avoid | Why |
|---|---|
| Duckboard | Forced. ENGINE is a better name. |
| Quack Attack | Comedy register, not operational register. |
| Duck Down | Trying too hard. |
| Waddle | Different action, different metaphor. Don't extend. |
| Flock | Grouping metaphor adds nothing over "jobs" or "batch." |
| Pond | Storage metaphor adds nothing over "queue" or "staged." |
| Egg | Pre-production metaphor adds nothing over "order" or "incoming." |
| Feathers | (no.) |

The rule: if a new duck term doesn't replace a longer phrase with something *genuinely faster and stickier*, it doesn't earn its place.

### Avoid: generic softness

| Avoid | Why | Use instead |
|---|---|---|
| Items | Means nothing | Units |
| Things | Means nothing | Jobs, units, presses |
| Stuff | Means nothing | (name the actual object) |
| Activity | Vague | Movement, throughput |
| Performance | Vague | Yield, output, throughput |
| Efficiency | Vague | Yield (if QC), utilization (if press time) |
| Overview | Implies altitude without specificity | (name the specific view) |

---

## 5. Good vs bad examples

### Block labels

| Good | Bad | Why |
|---|---|---|
| `QPM` | `Quacks Per Month (Shipped)` | The label should be the shortest recognizable name. The definition lives in docs and tooltips, not the gauge face. |
| `PRESSED` | `PRESS OUTPUT` | One word wins. "Output" is implied — ENGINE is an output surface. |
| `YIELD` | `QC PASS RATE` | "Yield" is the industry term. It's shorter and immediately understood by anyone who has worked a production floor. |
| `REJECTED` | `QC FAILURES` | "Rejected" is active voice and matches the `progressLog` stage. "Failures" sounds like the system failed, not that a unit was caught. |
| `READY` | `STAGED FOR SHIPMENT` | "Ready" + the sub-text "on skids" says it all. |
| `ORDER BOOK` | `TOTAL ACTIVE ORDER QTY` | Two words with real meaning vs five words of corporate air. |

### Sub-text

| Good | Bad | Why |
|---|---|---|
| `out the door` | `total shipped and picked-up units for the selected period` | Sub-text should be a *glance*, not a *paragraph*. |
| `842 / 860 inspected` | `842 units passed out of 860 total QC inspected units` | The number pattern is self-explanatory. |
| `on skids` | `units in the ready state` | Floor language. People on the floor say "on skids." Use their words. |
| `no quacks yet` | `no outbound units have been logged` | Honest, brief, uses house language. |
| `2.1% rate` | `rejection percentage based on total inspections` | The number does the talking. |

### Detail view section titles

| Good | Bad | Why |
|---|---|---|
| `TREND` | `Historical Trend Over Time` | "TREND" on an instrument panel is unambiguous. |
| `CONTEXT` | `Comparison to Historical Averages` | One word. |
| `BY JOB` | `Per-Job Breakdown` | Floor-native phrasing. |
| `BREAKDOWN` | `Composition Analysis` | Direct and familiar. |

### Conversation and documentation

| Good | Bad |
|---|---|
| "We quacked 1,200 this month" | "Our QPM metric shows 1,200 shipped units" |
| "Yield dropped to 91 after lunch" | "The QC pass rate has decreased to 91%" |
| "Press 2 is offline" | "Press unit #2 has transitioned to an offline status" |
| "There's an Achtung on job 4022" | "Job 4022 has been flagged with a caution/blocker state" |

---

## 6. Suggested copy for block labels and detail views

### ENGINE console (pedalboard)

```
Block 1:  [duck] QPM          → 1,247       → out the door
Block 2:  PRESSED              → 3,810       → 3,810 / 12,400
Block 3:  QC PASSED            → 3,682       → 3,682 / 3,810 pressed
Block 4:  YIELD                → 96.6%       → 3,682 / 3,810
Block 5:  REJECTED             → 128         → 3.4% rate
Block 6:  PACKED               → 2,940       → 2,940 / 3,682 QC
Block 7:  READY                → 860         → on skids
Block 8:  ORDER BOOK           → 12,400      → 8 active jobs
```

### Detail view header

```
[duck] QPM
1,247
Month to date
```

### Detail view sections (stage-based metric)

```
── TREND ──────────────────────────
[canvas bar chart]
VS  [QC PASS]  [REJECTED]
    1D  7D  30D  MTD

── CONTEXT ────────────────────────
TODAY       ████████████████  312
7D AVG      ██████████        198
30D AVG     ████████          164
PEAK Mar 2  ████████████████████  402

── BY JOB ─────────────────────────
VINYL MOON 037  ██████████████  180
THIRD MAN 112   ████████        96
GOLD RUSH EP    ██████          72
```

### Detail view sections (yield)

```
── BREAKDOWN ──────────────────────
PASSED    ████████████████████  3,682
REJECTED  █                      128

── DAILY YIELD ────────────────────
[canvas bar chart]
    1D  7D  30D  MTD

── CONTEXT ────────────────────────
TODAY       ████████████████████  97.2%
7D AVG      ███████████████████   96.1%
30D AVG     ██████████████████    94.8%
PEAK Mar 1  ████████████████████  98.4%
```

---

## 7. Naming register summary

| Register | Where it appears | Examples |
|---|---|---|
| **Instrument** | ENGINE block labels, section titles | `QPM`, `YIELD`, `TREND`, `CONTEXT` |
| **Floor** | Sub-text, detail descriptions | `out the door`, `on skids`, `none staged` |
| **House-coded** | Quack family only | `QUACK`, `QPM`, `ACHTUNG` |
| **Technical** | Database, code, migrations | `shipped`, `picked_up`, `qc_passed`, `progress_log` |

The instrument register is for gauges. The floor register is for humans. The house-coded register is for identity. The technical register is for code. They do not mix.

---

*This guide governs labels for ENGINE, LOG SHIP mode, and related telemetry surfaces. For broader system terminology (RSP, Icon Zone, ASSET CARD, PACK CARD), see the information architecture docs.*
