# How to Prompt Cursor Successfully — PMP · OPS Project

This guide summarizes what has worked best when asking Cursor (the AI assistant) for help on this codebase. Use it to get more predictable, on-target results without over- or under-specifying.

---

## 1. What Worked Best in Our Communication

### 1.1 Structured, numbered requests

**Effective:** Breaking a task into explicit parts (e.g. PART 1 — Containment, PART 2 — Control rail, …) with sub-bullets. This:

- Keeps scope clear.
- Makes it easy to verify that every part was addressed.
- Reduces the chance of the assistant solving the wrong problem or redesigning too much.

**Example pattern:**

```text
PART 1 — Containment
1. Give the NOTES page a stronger sense of containment.
2. Controls + feed should feel like one unified notes terminal.
...

PART 2 — Control rail
5. Make the top controls feel like a compact instrument rail.
...
```

### 1.2 Concrete problem statements

**Effective:** Describing the *current* problem in specific terms, not just the desired end state.

- "Controls float too loosely above the feed"
- "Metadata competes too much with note text"
- "Too much empty dark field, so the feed feels smaller and less intentional"

This gives the assistant a clear *why* and avoids generic or heavy-handed solutions.

### 1.3 Design direction with constraints

**Effective:** A short design brief that sets tone and boundaries:

- "Think 'Vignelli discipline meets Pip-Boy purpose-built console.'"
- "No decorative sci-fi junk."
- "Structure over decoration."

Reference documents (e.g. Executive Summary, IA map) help the assistant stay aligned with the app’s purpose (floor operations console, not consumer app).

### 1.4 Explicit "do not" and "preserve"

**Effective:** Stating what must *not* happen and what must stay the same:

- "Do not turn this into chat UI."
- "Preserve PMP OPS visual language."
- "Do not redesign the whole app."
- "Minimal coherent refinement only."

Negative constraints prevent scope creep and keep changes incremental.

### 1.5 Requested report format

**Effective:** Asking for a short report *after* the change:

- "After patching, report: 1. exact files changed 2. what changed about X 3. …"

This creates a clear deliverable, makes review easier, and encourages the assistant to be precise about scope.

### 1.6 Read-only when you only want analysis

**Effective:** When you want documentation or audit only:

- "Do not touch any code. Do not make any changes. Only observe."

Saying this explicitly avoids unintended edits when you only want understanding or docs.

### 1.7 Acknowledging current state

**Effective:** Telling the assistant where things stand:

- "You're close. The page structure is now good. What remains is mostly editorial composition of the rows."

That sets the starting point and avoids redoing work that’s already done.

---

## 2. Framing and Tone That Work Well

| Prefer | Avoid |
|--------|--------|
| **Goal + constraints** ("Make X feel like Y, without breaking Z") | Vague goals ("Make it better") |
| **Project vocabulary** (terminal, control rail, payload, provenance, factory memory, append-only) | Generic UI terms only (navbar, card, feed) |
| **One primary goal per request** (e.g. one pass for layout, another for hierarchy) | One giant "fix everything" request |
| **Concrete examples** ("catalog in yellow, artist in white") | Purely abstract descriptions |
| **"Minimal / coherent / refinement"** when you want small, consistent changes | "Redesign" or "overhaul" unless you mean it |

The assistant responds well to:

- **Industrial / operational** framing (console, instrument, floor, station).
- **Explicit hierarchy** (identity vs payload vs provenance).
- **Guardrails** (no chat UI, no decoration, no breaking the app family).

---

## 3. Project-Specific Conventions to Reference

When prompting for this repo, it helps to align with how the app is already described:

- **App identity:** Floor-focused operations console; single-screen operations surface; industrial, console-like.
- **Core entities:** Jobs, presses, progress_log, qc_log, notes (job + channels), audit.
- **Principles:** Append-only logs; job as central unit; structure over decoration; same design language across LOG and NOTES (siblings, not strangers).
- **Audiences:** Admin, Floor Manager, Press Operator, QC Operator, TV/passive display, plant-wide (NOTES).

Mentioning these (or pointing at `docs/EXECUTIVE_SUMMARY.md`, `docs/INFORMATION-ARCHITECTURE.md`) keeps the assistant in the same mental model as the project.

---

## 4. Checklist for a Strong Prompt

Before sending, consider:

1. **Scope** — One clear goal or one coherent "pass" (e.g. "one final hierarchy pass on the NOTES rows").
2. **Problem** — What’s wrong or missing now (1–3 concrete sentences).
3. **Direction** — What "good" looks like (design brief, reference, or bullet list).
4. **Constraints** — What must not change and what must be preserved.
5. **Deliverable** — What you want back (code only, or code + short report with files changed and what changed).
6. **Mode** — Code changes allowed, or read-only (observe / document only).

---

## 5. Example Prompts (Patterns You Can Reuse)

**Refinement with report:**

```text
Apply a focused [X] pass to [page/component]. Goal: [one sentence].
Design direction: [1–2 sentences]. Current problem: [2–3 bullets].
What I want: [numbered list]. Requirements: [constraints].
After patching, report: 1. exact files changed 2. what changed about [A] 3. [B] 4. [C].
```

**Documentation only:**

```text
Review [scope] and create [deliverable]. Do not touch any code. Do not make any changes. Only observe.
```

**Feature with constraints:**

```text
Add [feature]. Goal: [one sentence]. Requirements: [list]. Keep [X] intact. Do not [Y].
After patching, report: [list].
```

---

## 6. Summary

The most effective prompts in this project have been:

- **Structured** (numbered parts, clear subsections).
- **Concrete** (specific problems and examples).
- **Constrained** (do not / preserve / minimal).
- **Aligned** with project language (console, terminal, operations, append-only).
- **Explicit about deliverable** (code + report, or observe-only).
- **Scoped** to one main goal per request.

Using this pattern will help you get the results you want without unnecessary redesign or scope creep.
