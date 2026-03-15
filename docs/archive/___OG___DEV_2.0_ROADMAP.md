# DEV 2.0 Roadmap

**Archived:** Original roadmap; canonical version is `docs/DEV_2_0_ROADMAP.md` (merged and updated with 12-entity model, EXCEPTION, semantic grouping, tune label).

---

## Purpose

DEV 2.0 is not a PM suite, not Jira, and not kanban theater.

DEV 2.0 is a lightweight internal operating layer for turning raw notes into structured work objects that can move from thought to production without losing context.

Its job is to reduce:

- copy-paste repetition
- prompt babysitting
- stage confusion
- ghost ideas
- context loss between me, ChatGPT, and Cursor

Its job is to improve:

- idea capture
- idea grouping
- promotion clarity
- prompt generation
- implementation discipline
- stabilization follow-through

---

## Core Principle

A note is just a note until it earns structure.

DEV 2.0 should not force every thought into a ticket.
It should allow raw capture first, then promotion into a more structured object when useful.

---

## Stage Model

### NOTE
Default state.
A note is just a note.

Use for:
- raw thoughts
- fragments
- reminders
- questions
- quick captures

### PLAYGROUND
Iterate. Explore. Mock up.
Try forms and interactions without treating them as integrated truth.

Use for:
- visual experiments
- DEV-only ideas
- mockups
- rough new surface concepts
- isolated concept trials

### TESTING
Integrate.
Wire into the real app enough to see whether the idea survives contact with real state, routing, behavior, and doctrine.

Use for:
- provisional implementation
- integrated but not yet trusted behavior
- trial changes in active runtime
- things that need proving before being treated as real

### LIVE
Stable enough to count as part of the real app.

Use for:
- active product behavior
- trusted surfaces
- current truth

### THE SHOP
Real, but needs bench work.
Something is live and known, but needs fixing, cleanup, tightening, tuning, or fallout repair.

Use for:
- post-landing cleanup
- interaction tightening
- bug fallout
- small repairs
- recently landed work that needs attention

### PURGATORY
Intentionally decommissioned.
Documented, recoverable, inert, not active runtime truth.

Use for:
- purged surfaces
- tabled flows
- decommissioned UI
- intentionally retired concepts

---

## Work Types

### bug
Something is wrong and needs correction.

### polish
Something works but needs visual, interaction, or wording tightening.

### think
This needs doctrine, taxonomy, naming, architecture, tradeoff analysis, or framing before implementation.

### tune-up
Repair, cleanup, or tightening work on something already integrated or recently landed.

### purge
Decommissioning work. Remove from active runtime and document in Purgatory.

### debug
The app is broken right now. Restore loading, sync, or runtime truth first.

---

## Entity Model

Entity means: what system or surface this note is mainly about.

### Current entity set (v1)

- RSP
- CARD
- LOG
- NOTES
- FLOOR
- JOBS
- ENGINE
- DEV
- CREW
- PVC
- AUDIT

### Rules
- one primary entity max for v1
- entity is optional
- if absent, note remains a plain note

---

## Interaction Model

### Composer model
- note text remains primary
- optional entity rail
- optional type rail
- optional stage rail
- all should feel tactile and immediate
- push-state buttons preferred over dropdowns where practical

### Rules
- note may exist with no tags
- one entity max
- one type max
- one stage max
- tags are optional, not required
- structure should be earned, not mandatory

---

## Promotion Logic

### Typical flow
- NOTE → PLAYGROUND
- PLAYGROUND → TESTING
- TESTING → LIVE
- LIVE → THE SHOP
- LIVE / THE SHOP → PURGATORY

Not every note needs a full path.

Some notes may remain in NOTE forever.
Some may jump directly from NOTE to LIVE for tiny obvious fixes.
Some may go from NOTE to PURGATORY as a decommission record.

---

## Prompt Packet Vision

DEV 2.0 should eventually generate prompt packets from structured note data, not manually rebuilt every time.

### A prompt packet contains
- control preface
- main prompt
- output format expectations
- optional stabilization prompt
- optional debug prompt

### Prompt generation inputs
- entity
- type
- stage
- note body
- ruleset
- linked docs / files

### Prompt generation rule
Use templates, not freeform AI improvisation.

> **Pre-Phase 4 requirement:** A template library must exist before Phase 4 is built.
> One template per work type: bug, polish, think, tune-up, purge, debug.
> This is a ChatGPT/doctrine pass, not a Cursor build.
> Cursor should not invent templates on the fly.

---

## Ruleset Vision

DEV 2.0 may eventually attach implementation discipline to a work object.

### Example rulesets
- Preserve Doctrine
- One Surface Only
- Additive Only
- No Runtime Touch
- Monkey Mode
- Docs First
- Stabilize, Don't Expand

### v1 stance
List them. Don't over-model inheritance yet.

> **Pre-Phase 4 decision required:** Before Phase 4, decide whether rulesets are per-item, per-entity, per-type, or preset bundles. Not now.

---

## Run History Schema

> **Pre-Phase 5 requirement:** Define run history schema before building Phase 5.

Minimum fields:
- timestamp
- summary
- outcome (worked / partial / broke something)
- files changed
- next suggested stage

---

## What DEV 2.0 Should Not Become

- Jira
- full kanban theater
- a metadata tax
- a required ticket form
- tag soup
- a second product inside the product
- an autonomous agent pretending to replace judgment

DEV 2.0 should remain:
- fast
- light
- truthful
- operational
- useful for real work

---

## Relationship to Cursor / ChatGPT

DEV 2.0 is the source of truth for work objects. It is not the coding agent itself.

### Division of labor
- DEV 2.0 stores notes, tags, stage, and prompt packets
- ChatGPT helps define doctrine, templates, and prompt logic
- Cursor executes bounded implementation work
- human approves promotion between meaningful stages

### Important principle
Cursor should not be trusted to invent its own process from scratch.
DEV 2.0 should generate constrained prompt packets from known templates.

---

## Deferred / Parked (Not in v1)

These were considered and intentionally set aside.

| Item | Reason | Revisit |
|---|---|---|
| FACTORY (entity) | Not yet doctrine-stable. Concept audit required before it earns entity status. | After FACTORY concept audit. |
| spec (work type) | May split from `think` after real use. For now, think covers both. | After a few weeks of real use. |
| Ruleset inheritance model | Per-item vs per-entity vs per-type vs preset bundles. Too early to decide. | Before Phase 4. |
| Prompt runner / semi-automatic execution | Phase 6 only. Not until structure proves useful. | Phase 6. |

---

## Roadmap

### Phase 1 — Structured DEV Notes
Goal: add the smallest useful structure.

**Build**
- keep existing note composer
- add optional entity buttons
- add optional type buttons
- add optional stage buttons
- keep note text primary
- preserve ability to submit an unstructured note

**Success condition**
A DEV note can become a plain note, entity-tagged note, typed note, or staged work object — without adding friction.

---

### Phase 2 — Grouping + Filtering
Goal: make the structure useful.

**Build**
- filter DEV notes by entity
- filter by type
- filter by stage
- allow quick views: CARD bugs, LOG polish, PLAYGROUND items, THE SHOP items

**Success condition**
DEV becomes browsable as a lightweight internal workboard.

---

### Phase 3 — Promotion Actions
Goal: let notes move intentionally.

**Build**
- promote stage
- demote stage
- move to THE SHOP
- move to PURGATORY

**Success condition**
A note can be promoted without being rewritten or duplicated.

---

### Phase 4 — Prompt Packet Generation
Goal: reduce copy-paste babysitting.

> Requires template library to exist first. See Prompt Packet Vision above.

**Build**
- generate prompt from entity, type, stage, note body
- support template families: bug, polish, think, tune-up, purge, debug

**Success condition**
A structured DEV item can produce a strong first-pass Cursor prompt.

---

### Phase 5 — Run History
Goal: connect idea to implementation outcomes.

> Requires run history schema to be defined first. See Run History Schema above.

**Build**
- attach result summaries
- attach files changed
- attach next recommended stage
- store what happened after a Cursor run

**Success condition**
DEV items become traceable across implementation and fallout.

---

### Phase 6 — Semi-Automatic Runner (Optional)
Goal: reduce glue without losing control.

**Build**
- one-button packet export
- local runner reads one item
- executes one bounded run
- stores summary back
- suggests next stage

**Hard rule**
Agent may suggest promotion. Human approves promotion.

**Success condition**
DEV 2.0 acts as a lightweight backend for guided execution without becoming a runaway automation loop.

---

## Immediate Recommendation

Start with Phase 1 only.

- note text stays primary
- add entity rail
- add type rail
- optionally add stage rail if still simple
- no automation
- no packet runner
- no smart kanban brain

That is enough to prove whether DEV 2.0 is actually useful before building anything bigger.
