# Spatial Surface Families

**Status:** Canonical reference — defines the surface families in PMP OPS and what each is optimized for.

**Based on:** `docs/spatial-size-audit.md` (full CSS/HTML/structure audit).

---

## Overview

PMP OPS has **six surface families**. Each family answers a different operational question and optimizes for a different kind of attention. When a surface's spatial behavior matches its family, it works. When it drifts, the user's attention drifts with it.

The families are:

| # | Family | Question it answers | Width model |
|---|--------|--------------------:|-------------|
| 1 | **Console** | What am I doing right now? | Narrow, contained |
| 2 | **Board** | What does the whole picture look like? | Wide, tabular |
| 3 | **Instrument** | Is the machine alive? | Medium, centered, gridded |
| 4 | **Library** | What do we have? | Medium, centered, list/card |
| 5 | **Workbench** | Let me edit this one thing. | Medium, docked or centered |
| 6 | **Station** | I am at this physical position on the floor. | Full-screen, centered, single-task |

---

## Family 1: CONSOLE

### What it is

A focused, single-task operational surface. The user is doing one thing — logging events, reading notes, writing dev context. The surface is contained in a bordered box, left-aligned or centered, with a clear vertical section rhythm. It feels like a dedicated instrument in a rack.

### What it optimizes for

- **Single-task focus** — one job at a time, one action at a time
- **Muscle memory** — controls are compact and always in the same place
- **Vertical flow** — sections stack downward: selector → control → input → output/feed

### Canonical spatial behavior

| Property | Value | Rationale |
|----------|-------|-----------|
| **Max-width** | 380–520px | Keeps the surface tight enough for one-hand operation and reading without horizontal scanning |
| **Alignment** | Left-aligned within page | User's eye starts at the top-left corner of a known box, not hunting across the screen |
| **Containment** | Bordered box (`1px solid --b2`), `--s1` background | Clearly separates the console from the page background. Reads as "this is an instrument" |
| **Padding** | Internal: `12px 16px`. Page-level: `16px` | Comfortable but compact |
| **Section rhythm** | `Special Elite` section labels, `1px --b1` bottom borders, `8px` vertical gap between sections | Familiar instrument-rack sections |
| **Typography** | 11–14px body. Section labels at 11px/2px letter-spacing. Feed entries at 12–13px | Monospace-dense, appropriate for event data |
| **Density** | High vertical density. Feed entries at `8px` padding. Minimal whitespace between sections | The user is working, not browsing |

### Members

| Surface | Max-width | Alignment | Clean fit? |
|---------|-----------|-----------|-----------|
| **LOG** | `min(380px, 92vw)` | Left | **Yes** — the purest console in the app. Numpad faceplate + job picker + feed. |
| **NOTES** | `min(520px, 92vw)` | Left | **Yes** — slightly wider because note text benefits from longer lines, but same containment and section rhythm. |
| **DEV** | `980px`, centered | Centered | **Partial** — structurally a console (bordered box, section rhythm, feed), but much wider. Functions as a wide-format console because dev notes are prose-heavy. Could be called a "wide console" variant. |

### What does NOT belong here

Surfaces that show many objects simultaneously, surfaces that require horizontal scanning across columns, surfaces where the user needs to compare items side-by-side. Those are boards.

---

## Family 2: BOARD

### What it is

A broad, multi-object operational surface. The user is scanning a manifest — many jobs, many rows, many statuses. The primary reading direction is horizontal across a table row, then vertical down the list. It feels like an operations board on a factory wall.

### What it optimizes for

- **Scan speed across rows** — the eye should travel from identity (catalog) through state (status) to context (due date) in one sweep
- **Multi-object comparison** — 10–50 rows visible simultaneously
- **Filter and sort** — toolbar at the top with search, filter dropdown, add button
- **Quick entry** — row click opens the workbench (RSP) for editing

### Canonical spatial behavior

| Property | Value | Rationale |
|----------|-------|-----------|
| **Max-width** | `1200px` (recommended, not yet implemented) | Prevents column-drift on wide monitors while remaining full-width on laptops |
| **Alignment** | Centered when constrained, full-width below breakpoint | Centered keeps the eye anchored |
| **Containment** | None — table sits directly in the page. Toolbar above, table below | Boards are the page. They don't need a border box to separate them from something else |
| **Row density** | `8px 12px` cell padding → ~34px row height | Tight enough to see many rows, loose enough to read 13px text |
| **Column typography** | Identity columns: 13px, bold/amber. State: 11–12px pills. Support: 11px, muted | Hierarchy is conveyed by column style, not column width |
| **Toolbar** | Search left, actions right. Filter dropdown adjacent to search. Consistent flex-wrap row | Same toolbar grammar across all boards |

### Members

| Surface | Current max-width | Clean fit? |
|---------|-------------------|-----------|
| **FLOOR** | None (unconstrained) | **Yes, structurally** — stat cards + press grid + table. The right shape for a board. Needs `max-width` to prevent over-stretch. |
| **JOBS** | None (unconstrained) | **Yes, structurally** — the canonical board. 14-column manifest with identity/state/support hierarchy. Needs `max-width`. |
| **SHIP** | None (`ship-shell` exists but unconstrained) | **Yes** — 9-column fulfillment board with filter, search, and inline phase controls. Needs `max-width`. |
| **CREW** | None (`crew-shell` exists but unconstrained) | **Yes** — directory table. Same board grammar (toolbar + table + inline actions). Needs `max-width`. |
| **AUDIT** | None (unconstrained) | **Yes** — admin log table. Same grammar. Needs `max-width`. |

### What does NOT belong here

Surfaces where the user is focused on one object (that is a workbench), surfaces where the content is a vertical feed (that is a console), surfaces with metric blocks (that is an instrument).

### Note on FLOOR

FLOOR is the most complex board because it has three zones: stat cards (top), press grid (middle), and active-orders table (bottom). The stat cards and press grid are board-adjacent — they are overview-level multi-object displays. The table is a standard board. All three share the same full-width, scan-optimized intent.

---

## Family 3: INSTRUMENT

### What it is

A data-first, read-primary telemetry surface. The user is not editing or logging — they are monitoring. The surface presents metrics in a structured grid, with each block as a discrete gauge. It feels like an engine room or mastering rack.

### What it optimizes for

- **At-a-glance status** — the user should know the factory state in 2 seconds
- **Metric hierarchy** — hero metrics are visually primary, context metrics recede
- **Click-through depth** — blocks are entry points to detail overlays
- **Machine aliveness** — subtle animation and role-colored accents convey that the system is live

### Canonical spatial behavior

| Property | Value | Rationale |
|----------|-------|-----------|
| **Max-width** | `660px`, centered | Keeps the 4×2 grid proportional. Wider would make blocks too large |
| **Alignment** | Centered (`margin: 0 auto`) | The instrument panel sits in the center of attention |
| **Containment** | Console box with `1px --b2` border, `box-shadow`, inner `1px` gap grid | Reads as a physical console housing |
| **Block shape** | `aspect-ratio: 1` (square) | Squares feel like gauges / meters. Rectangles feel like cards |
| **Typography** | Values: 30–36px bold. Labels: 9px, 1.5px letter-spacing, muted. Subs: 9px, muted | Big numbers, tiny labels. The number is the signal. The label is context |
| **Density** | Very dense — 1px gaps between blocks, minimal internal padding | Machine density, not card density |
| **Period selector** | Small text strip, right-aligned, below the console | Subordinate to the data. Does not compete with blocks |

### Members

| Surface | Max-width | Clean fit? |
|---------|-----------|-----------|
| **ENGINE** | `660px` | **Yes** — the only instrument surface. 4×2 grid of square metric blocks with role-colored accents, hero treatment, and click-through detail overlays. |

### What does NOT belong here

Surfaces where the user is editing data, surfaces with tables or lists of objects, surfaces with text-heavy content. Those are boards, consoles, or workbenches.

### Relationship to consoles

ENGINE is a cousin of the console family — it shares containment and centering — but its interaction model is fundamentally different. Consoles are input-heavy (the user is doing something). Instruments are output-heavy (the user is reading). This distinction is why ENGINE has a grid of blocks instead of a vertical section stack.

---

## Family 4: LIBRARY

### What it is

A browse-and-manage surface for a catalog of reference objects. The user is looking at a collection of things that exist (compounds, materials, etc.) rather than a queue of work to be done. It feels like a reference shelf.

### What it optimizes for

- **Browse** — scan thumbnails and names quickly
- **Quick identification** — image + name + key metadata visible at a glance
- **Entry point** — each card is clickable to edit or inspect
- **Manageable width** — reference data doesn't need 14 columns

### Canonical spatial behavior

| Property | Value | Rationale |
|----------|-------|-----------|
| **Max-width** | `980px`, centered | Comfortable for card-based browsing without over-stretch |
| **Alignment** | Centered (`margin: 0 auto`) | Centered reading position |
| **Containment** | Bordered box (`1px solid --b2`), `--s1` background, internal padding | Reads as a contained collection, not the whole page |
| **Card layout** | Stacked vertical list with `1px` gap | Each card is one object: thumbnail + name + metadata. Not a grid — the list layout keeps scan direction vertical |
| **Typography** | Name: 14px, bold. Number: 12px, muted. Notes: 12px, muted | Identity-first, then classification, then context |

### Members

| Surface | Max-width | Clean fit? |
|---------|-----------|-----------|
| **PVC** | `980px` | **Yes** — compound library. Bordered shell, toolbar, card list with thumbnails. The canonical library surface. |

### Potential future members

Any material catalog, supplier directory, template library, or asset reference collection would belong here.

### Where CREW sits

CREW is structurally a board (table with sortable headers), but functionally a library (browse a directory of people). It is currently rendered as a board. This is a reasonable choice because the crew directory has enough columns (name, role, specialty, phone, email, notes) that a table is the right container. However, if the crew page ever gained richer per-person content, it could evolve toward a library layout.

---

## Family 5: WORKBENCH

### What it is

A focused editing surface for a single object. The user has selected one job, one compound, or one entity and is now inspecting or modifying it. The workbench is always secondary to the board or console that opened it — it slides in, overlays, or pops up. It does not replace the page.

### What it optimizes for

- **Single-object focus** — everything on screen relates to one entity
- **Form editing** — inputs, selects, textareas, save/cancel
- **Contextual action** — ACHTUNG, archive, delete, navigate to notes
- **Dismissability** — close, escape, backdrop-click all exit

### Canonical spatial behavior

| Property | Value | Rationale |
|----------|-------|-----------|
| **Max-width** | Varies by content: 320–640px | Form-appropriate — not too wide for labels + inputs |
| **Position** | Right-docked (RSP) or centered (wizards, modals) | RSP slides from right so the board behind it remains partially visible |
| **Containment** | Solid background, bordered, animation on entry | Clearly a layer above the base page |
| **Form density** | Standard inputs at 34px, 2-column grid for form rows, `8–12px` gaps | Comfortable editing density |
| **Typography** | Object ID: 18px Special Elite. Labels: 10px spaced. Values: 14px | Object identity at top, then structured form |
| **Action footer** | Sticky bottom bar with CANCEL left, primary right | Consistent commit placement |

### Members

| Surface | Width | Position | Clean fit? |
|---------|-------|----------|-----------|
| **RSP (Slide Panel)** | `min(640px, 100vw)` | Right-docked | **Yes** — the primary workbench. Single-job editing form with icon zone, scrollable body, sticky footer. |
| **Card Zone** | `560px` | Centered overlay | **Yes** — ASSET CARD / PACK CARD. Single-job readiness editing. Two-face tabbed workbench. |
| **Wizards** (Job, Employee, Schedule, Compound) | `420px` | Centered overlay | **Yes** — create/edit flow. Step-based form. |
| **Import Review** | `480px` | Centered overlay | **Yes** — review/edit imported data before commit. |
| **Floor Card** | `900px` | Centered overlay | **Partial** — it is a read-primary statboard, not an editing form. The QUICK EDIT toggle adds editing, but the default state is display. It could be classified as a "read workbench" or a wide overlay. Currently functions well in the workbench family. |
| **ENGINE Detail** | `520px` | Centered overlay | **No** — this is a read-only deep-dive triggered from an instrument block. It does not edit anything. It is an **instrument detail**, not a workbench. Structurally it uses workbench-family overlay mechanics (centered, backdrop, close button), but its purpose is instrument-family (telemetry readout). |
| **Confirm Dialog** | `340px` | Centered overlay | **Yes** — minimal decision workbench (confirm or cancel). |
| **New Job Chooser** | `320px` | Centered overlay | **Yes** — method-selection workbench (manual, CSV, photo, PDF). |
| **Duplicate Modal** | `360px` | Centered overlay | **Yes** — conflict-resolution workbench. |

### What does NOT belong here

Surfaces that show many objects (boards), surfaces that log events (consoles), surfaces that monitor metrics (instruments). Those serve different attention models.

---

## Family 6: STATION

### What it is

A dedicated, full-screen, role-specific operational mode. The user is physically standing at a position on the factory floor — a press, a QC table, a manager's post. The station replaces the entire app with a single-purpose interface. It feels like a kiosk.

### What it optimizes for

- **Physical context** — the user is at a machine, not at a desk
- **Large touch targets** — controls are sized for gloved hands and factory conditions
- **Single workflow** — no page navigation, no tabs, no context switching
- **Quick entry and exit** — `← BACK` to return to launcher

### Canonical spatial behavior

| Property | Value | Rationale |
|----------|-------|-----------|
| **Max-width** | `900px` (standard) / `1200px` (Floor Manager) | Centered for readability, wide enough for a factory tablet or shared screen |
| **Position** | Fixed full-screen, replaces app | Full immersion |
| **Containment** | Full-screen background (`--bg`), centered inner container | Clean background, no distracting elements |
| **Control density** | Larger than standard: numpad at 56px rows, reject buttons at 56px min-height, 2px borders | Factory-floor touch targets |
| **Typography** | Station name: 18px Special Elite. Data: 14px. Display numbers: 48px+ | Readable from arm's length |

### Members

| Surface | Max-width | Clean fit? |
|---------|-----------|-----------|
| **Press Station** | `900px` | **Yes** — single-press numpad + log. Pure station. |
| **QC Station** | `900px` | **Yes** — rapid reject logging. Pure station. |
| **Floor Manager** | `1200px` (`.wide`) | **Yes** — wider station variant for a manager who needs the stat overview + table. |

---

## Ambiguous / Mismatched Surfaces

### FLOOR — Board with instrument elements

FLOOR is fundamentally a board (multi-object table for scanning), but its upper zones (stat cards, press grid) behave like instrument readouts. This is fine — the stat cards and press grid are legitimate overview-level data blocks sitting above a standard board table. The hybrid structure is intentional and works well. The only spatial issue is the unconstrained width.

**Verdict:** Board (with instrument prelude). Not mismatched — just needs `max-width`.

### DEV — Wide console

DEV uses console containment (bordered box, vertical sections, feed), but at `980px` centered — much wider than LOG or NOTES. It functions as a console for backstage notes, but the width makes it feel more like a library page.

**Verdict:** Console variant. The wider width is justified because dev notes are prose-heavy and benefit from longer line lengths. If this surface gained structured data (tables, grids), it would need to declare itself a different family.

### ENGINE Detail — Instrument detail, not workbench

ENGINE detail overlays use workbench overlay mechanics (centered, backdrop, close), but they are read-only telemetry deep-dives with charts and comparison controls. They do not edit data. They belong to the instrument family conceptually, even though they share overlay positioning with the workbench family.

**Verdict:** Instrument surface using workbench-family overlay mechanics. This is not a mismatch — it is acceptable reuse. The overlay pattern (centered, max-width, close button, backdrop dismiss) is a general-purpose container pattern, not exclusive to editing.

### Floor Card — Read-primary workbench

Floor Card is a centered overlay (workbench mechanics) that primarily displays a job statboard. QUICK EDIT mode enables editing, but the default experience is read-only display with large typography and progress bars. It is more of a "read workbench" or "inspection overlay" than a classic editing form.

**Verdict:** Workbench family, but read-primary. Its wide max-width (900px) reflects its statboard nature. Not mismatched, but distinct from form-editing workbenches (RSP, Card Zone, wizards).

### CREW — Board or library?

CREW renders as a board (table with sortable headers), but its purpose is closer to a library (browse a directory of people). The table format is appropriate for the current column set. If the page ever needed richer per-person profiles, it would lean toward library.

**Verdict:** Board — correct for current content. Monitor if it evolves.

### SHIP — Board with console aspirations

SHIP has a title + subtitle header that reads like a console identity label, but the surface itself is a standard board table. The `ship-shell` wrapper exists but adds `padding: 0` and no containment. It is a board that hints at wanting to be a contained shell.

**Verdict:** Board. The title/subtitle should move from being a shell-style header to being the standard board section header (matching FLOOR's `sec` pattern). This would make it clearly a board.

### TV — Standalone display

TV is none of these families. It is a full-viewport, read-only, ambient display surface designed for wall-mounted screens. It does not accept input beyond ESC and PIZZAZ. It is its own thing.

**Verdict:** Unique. No family membership needed.

### Login / Launcher — Entry gates

Login and Launcher are small centered containers (`360–380px`) that exist only during session start. They are structurally similar to small workbenches (centered overlay, form inputs, action buttons), but functionally they are gates — you pass through them, not work in them.

**Verdict:** Unique. Entry-gate surfaces. Share workbench overlay mechanics but serve a different purpose.

---

## Summary Table

| Surface | Family | Confidence | Max-width | Notes |
|---------|--------|------------|-----------|-------|
| **FLOOR** | Board | High | None → should be `1200px` | Hybrid: instrument prelude + board table |
| **JOBS** | Board | High | None → should be `1200px` | Canonical board |
| **SHIP** | Board | High | None → should be `1200px` | Has shell wrapper but unconstrained |
| **CREW** | Board | High | None → should be `1200px` | Directory board |
| **AUDIT** | Board | High | None → should be `1200px` | Admin log board |
| **LOG** | Console | High | `380px` | Purest console |
| **NOTES** | Console | High | `520px` | Feed-oriented console |
| **DEV** | Console (wide) | Medium | `980px` | Prose-heavy variant |
| **ENGINE** | Instrument | High | `660px` | Only instrument surface |
| **PVC** | Library | High | `980px` | Only library surface |
| **RSP** | Workbench | High | `640px` | Primary editing workbench |
| **Card Zone** | Workbench | High | `560px` | Readiness editing workbench |
| **Floor Card** | Workbench (read-primary) | Medium | `900px` | Inspection + quick edit |
| **ENGINE Detail** | Instrument (overlay) | Medium | `520px` | Read-only telemetry, workbench mechanics |
| **Wizards** | Workbench | High | `420px` | Create/edit flow |
| **Modals** | Workbench | High | `320–480px` | Small decision surfaces |
| **Press Station** | Station | High | `900px` | Factory-floor kiosk |
| **QC Station** | Station | High | `900px` | Factory-floor kiosk |
| **Floor Manager** | Station | High | `1200px` | Wide station variant |
| **TV** | (unique) | — | Viewport | Ambient display |
| **Login / Launcher** | (unique) | — | `360–380px` | Entry gates |
