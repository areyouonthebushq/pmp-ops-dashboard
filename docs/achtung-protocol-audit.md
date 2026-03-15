# ACHTUNG Protocol Audit

> **Status:** Findings incorporated into `docs/achtung-protocol.md`. Retained for detailed reference.

> Full codebase and product-behavior audit of the exception/blocker protocol known internally as "caution" and externally/house-coded as "ACHTUNG."
>
> Read-only. No code changes.

---

## 1. Executive Summary

ACHTUNG is PMP OPS's cross-system exception protocol. It marks jobs, assets, and pack items that are **not flowing normally** — stuck, waiting, blocked, or needing attention — without replacing the job's primary status.

Today it operates as **three related but distinct implementations** sharing visual grammar (amber color, ⚠ icon, note-linked resolution) but differing in data model, trigger paths, and note-requirement behavior:

| Scope | Data field | Note requirement? | Trigger surface |
|-------|-----------|-------------------|-----------------|
| **Job-level** | `job.caution = { reason, since, text }` | Yes — `cautionNeedsNote()` | RSP drawer, Floor Card edit, LOG SHIP achtung |
| **Asset-level** | `job.assets[key].status = 'caution'` + `cautionSince` | Yes — timestamp-based lock | Asset Card status cycle |
| **Pack-level** | `job.packCard[key].status = 'caution'` | **No** — no `cautionSince` or lock logic | Pack Card status cycle |

It is **not yet one unified protocol.** The underlying intent is consistent (flag → require context → resolve), but the implementations have drifted:
- Asset caution is the **most mature** (lock, pulse, inline note composer).
- Job-level caution is **well-built** (reasons, text, note nag, propagation to all surfaces).
- Pack-level caution is the **weakest** (status exists but no timestamp, no lock, no note-required behavior).

The term "ACHTUNG" is used publicly only in the LOG SHIP console. Everywhere else, the internal term "caution" persists in code, CSS classes, HTML labels, and most docs.

---

## 2. Canonical Meaning Audit

### What ACHTUNG currently means semantically

It means **all** of the following simultaneously, depending on context:

| Intended meaning | Where it appears |
|-----------------|-----------------|
| **Caution** (general warning) | Asset rows, pack items, Floor stats |
| **Blocker** | RSP drawer label: "Caution / Blocker" |
| **Hold** | TV "BLOCKERS" count includes cautioned jobs alongside `hold` status |
| **Needs attention** | LOG SHIP achtung button title: "flag job for attention" |
| **Exception** | Pipeline taxonomy: "represent blockers without new statuses" |

### Assessment

There is no single canonical meaning enforced in code. The `CAUTION_REASONS` enum tries to scope it — `stuck`, `customer`, `billing`, `traffic_jam`, `special`, `other`, `achtung` — but the reasons overlap with several other concepts (e.g., `hold` status, note-only conventions).

**Likely intended canonical meaning:** "This object is not flowing normally and needs human attention before it can proceed. The caution is not the explanation — notes are the explanation."

This is a good meaning. It should be stated and enforced.

---

## 3. Object Scope Audit

### 3.1 Asset rows (inside Asset Card)

| Aspect | Detail |
|--------|--------|
| **Object being ACHTUNG'd** | Individual asset (e.g., Test Press, Metal Parts) |
| **Data field** | `job.assets[key].status = 'caution'` + `job.assets[key].cautionSince` (ISO timestamp) |
| **Behavior type** | **State + Gate** — locks the asset row detail form until a note is added |
| **Trigger** | Status cycle click: `'' → received → na → caution → ''` |
| **Resolution** | Adding a note with matching `assetKey` after `cautionSince`, or cycling status away from caution |
| **Visual** | Amber border, ⚠ icon, `asset-row-caution-locked` class, pulsing row, disabled ⌕ button |
| **Note required?** | **Yes** — enforced via timestamp comparison; row is "locked" until satisfied |

### 3.2 Job-level

| Aspect | Detail |
|--------|--------|
| **Object being ACHTUNG'd** | The job as a whole |
| **Data field** | `job.caution = { reason, since, text }` (JSONB) or `null` |
| **Behavior type** | **State + Signal** — flags the job, propagates visually, nags for notes, but does not gate any workflow |
| **Trigger** | RSP drawer save, Floor Card quick-edit save, LOG SHIP achtung toggle |
| **Resolution** | Adding any note to the job's `notesLog` after `caution.since`, or clearing the caution manually |
| **Visual** | Amber row highlight, caution pill, `+ NOTE` button (pulsing), caution text inline |
| **Note required?** | **Yes** — enforced via `cautionNeedsNote()`, drives pulse animation and `+ NOTE` button |

### 3.3 Pack-level (inside Pack Card)

| Aspect | Detail |
|--------|--------|
| **Object being ACHTUNG'd** | Individual pack item (e.g., Sleeve, Shrink Wrap) |
| **Data field** | `job.packCard[key].status = 'caution'` |
| **Behavior type** | **State only** — flags the item but does not lock anything or require notes |
| **Trigger** | Status cycle click: `'' → ready → na → caution → ''` |
| **Resolution** | Cycling status away from caution (no note requirement) |
| **Visual** | Amber border, ⚠ icon, `pk-row-caution` class, ⌕ button (routes to Notes) |
| **Note required?** | **No** — there is no `cautionSince` field, no lock logic, no pulse nag |

### 3.4 Surface-by-surface presence matrix

| Surface | Job caution? | Asset caution? | Pack caution? | Achtung toggle? |
|---------|:---:|:---:|:---:|:---:|
| **Jobs page (table)** | ✅ pill + row + filter + `+ NOTE` | — | — | — |
| **Jobs page (cards)** | ✅ pill + card border + text + `+ NOTE` | — | — | — |
| **Floor page (table)** | ✅ row + ⚠ icon → Notes | — | — | — |
| **Floor Card (view)** | ✅ ⚠ icon → Notes | — | — | — |
| **Floor Card (edit)** | ✅ reason dropdown | — | — | — |
| **SHIP page (table)** | ✅ row + pill (no `+ NOTE`) | — | — | — |
| **RSP** | ✅ ⚠ button + drawer | — | — | — |
| **Card Zone / Asset Card** | — | ✅ full (lock, pulse, composer) | — | — |
| **Card Zone / Pack Card** | — | — | ✅ partial (status only) | — |
| **LOG PRESS mode** | — | — | — | — |
| **LOG SHIP mode** | ✅ (reads state for glow) | — | — | ✅ toggle button |
| **ENGINE** | ✅ BLOCKERS count | — | — | — |
| **TV** | ✅ BLOCKERS count | — | — | — |
| **NOTES page** | — | ✅ ⚠ icon on notes for cautioned assets | — | — |

---

## 4. Trigger / State Model Audit

### 4.1 Code paths that set ACHTUNG

| # | Code path | File:line | Scope | Reasons available | Text field? |
|---|-----------|-----------|-------|-------------------|-------------|
| 1 | RSP panel save | `app.js:2304` | job | All 7 visible in dropdown | ✅ |
| 2 | Floor Card quick-edit save | `render.js:745` | job | All 8 in `CAUTION_REASONS` | ❌ (not wired) |
| 3 | LOG SHIP achtung toggle | `app.js:2388` | job | `'achtung'` only (hardcoded) | ❌ |
| 4 | Asset Card status cycle | `render.js:1115` | asset | N/A (status = `'caution'`) | ❌ |
| 5 | Pack Card status cycle | `render.js:1307` | pack item | N/A (status = `'caution'`) | ❌ |

**Observation:** There are three distinct trigger families (job, asset, pack) with no shared trigger function. The RSP and Floor Card paths both go through `saveJob()` and create the same `{ reason, since, text }` shape. The LOG SHIP path uses `setCaution()` directly.

### 4.2 State fields

| Field | Location | Type | Purpose |
|-------|----------|------|---------|
| `job.caution` | jobs table, JSONB | `{ reason, since, text }` or `null` | Job-level exception state |
| `job.caution.reason` | inside caution | string | One of `CAUTION_REASONS[].v` |
| `job.caution.since` | inside caution | ISO-8601 string | Timestamp when caution was set |
| `job.caution.text` | inside caution | string | Optional short context |
| `job.assets[key].status` | inside assets JSONB | `'caution'` | Asset in caution state |
| `job.assets[key].cautionSince` | inside assets JSONB | ISO-8601 string | When asset was set to caution |
| `job.packCard[key].status` | inside packCard JSONB | `'caution'` | Pack item in caution state |

**Note:** Pack items have no `cautionSince` field. This is the primary gap in protocol consistency.

### 4.3 Active vs needs-note vs resolved

**Job-level:**
- **Active**: `job.caution.reason` is truthy → `isJobCautioned()` returns `true`
- **Needs note**: `cautionNeedsNote()` returns `true` — caution is active AND no entry in `job.notesLog[]` has `timestamp >= caution.since`
- **Resolved (soft)**: A note has been added since `caution.since` → pulse stops, `+ NOTE` disappears, but caution remains active
- **Resolved (full)**: `job.caution` is set to `null` (manually cleared via RSP, Floor Card edit, or LOG SHIP toggle)

**Asset-level:**
- **Active**: `getAssetStatus(asset) === 'caution'`
- **Needs note (locked)**: `cautionSince` is set AND no note in `job.notesLog[]` with matching `assetKey` has `timestamp >= cautionSince`
- **Resolved (soft)**: Asset-specific note added → row unlocks, detail form reappears
- **Resolved (full)**: Status cycled away from `'caution'`

**Pack-level:**
- **Active**: `getPackItemStatus(item) === 'caution'`
- **Needs note**: **Not implemented** — no timestamp, no check
- **Resolved**: Status cycled away from `'caution'`

### 4.4 Does adding a note resolve the caution?

**No.** Adding a note only satisfies the "needs context" requirement. The caution remains active in all cases. Full resolution requires explicit clearing (setting status to something else, or clearing `job.caution`).

This is the correct design — caution says "this needs attention," and a note says "here's what's going on." They are not the same thing.

---

## 5. Surface-by-Surface UI Audit

### 5.1 Jobs Page — Desktop Table

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes |
| **Visual** | `<tr class="job-row-cautioned">` — amber 3px left border + warm background |
| **Pill** | `cautionPill(j)` — `<span class="pill caution-pill">⚠ REASON</span>` with tooltip (reason + text + age) |
| **Pulses?** | Yes — pill gets `caution-pill-pulse` class when note is needed |
| **Clickable?** | Pill: no. `+ NOTE` button: yes. Row cells: open panel as usual |
| **Click action** | `+ NOTE` → `goToNotesAndOpenAdd(jobId)` — routes to NOTES, opens add form |
| **Consistent?** | ✅ Strongest implementation. Full pill + note nag + text display + filter. |

### 5.2 Jobs Page — Mobile Cards

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes |
| **Visual** | `<div class="job-card job-card-cautioned">` — amber card border |
| **Pill** | `cautionPill(j)` below status |
| **Text** | `<div class="jc-caution-text">⚠ [text]</div>` |
| **Pulses?** | Yes — pill pulses when note needed |
| **Clickable?** | Card opens panel. `+ NOTE` routes to NOTES |
| **Consistent?** | ✅ Matches desktop table in substance |

### 5.3 Floor Page — Table

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes |
| **Visual** | `<tr class="job-row-cautioned">` — amber left border |
| **Icon** | `<span class="floor-caution-icon">⚠</span>` — pulsing amber icon |
| **Pulses?** | Yes — the ⚠ icon always pulses (not gated on `cautionNeedsNote`) |
| **Clickable?** | ⚠ icon → `goToNotesWithFilter(jobId)` |
| **Click action** | Routes to NOTES, filtered to this job |
| **Consistent?** | ⚠ **Minor inconsistency**: Floor ⚠ always pulses regardless of note state. On Jobs page, pulse is conditional on `cautionNeedsNote()`. Floor also lacks the `+ NOTE` button — it routes directly to NOTES instead. This is intentional (Floor stays fast) but worth noting. |

### 5.4 Floor Card (View Mode)

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes |
| **Visual** | `<span class="fc-caution floor-caution-icon">⚠</span>` in the metadata strip |
| **Pulses?** | Yes — inherits `floor-caution-icon` animation |
| **Clickable?** | ⚠ icon → `goToNotesWithFilter(jobId)` |
| **Consistent?** | ✅ Matches Floor table behavior |

### 5.5 Floor Card (Quick-Edit Mode)

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes |
| **Visual** | `<select id="fcCautionReason">` dropdown in the edit form |
| **Options** | All `CAUTION_REASONS` values (8 options including `achtung`) |
| **Text field?** | ❌ No text input wired — only reason dropdown |
| **Consistent?** | ⚠ **Inconsistency**: The Floor Card edit has access to the `achtung` reason via `CAUTION_REASONS`, but the RSP panel dropdown in HTML only lists 7 reasons (excludes `achtung`). The Floor Card edit also lacks a text input field, unlike the RSP panel which has `jCautionText`. |

### 5.6 SHIP Page — Table

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes |
| **Visual** | `<tr class="ship-row job-row-cautioned">` — amber highlight |
| **Pill** | `cautionPill(j)` appended to status pill |
| **`+ NOTE` button?** | ❌ No — `cautionNoteBtn()` is not called in the SHIP template |
| **Clickable?** | Pill is display-only. Row cells open panel |
| **Consistent?** | ⚠ **Inconsistency**: SHIP shows the caution pill but lacks the `+ NOTE` nag button that Jobs page has. A cautioned job on SHIP provides no obvious prompt to add context. |

### 5.7 RSP (Right-Side Panel)

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes |
| **Visual** | `panelCautionBtn` (⚠) in Icon Zone — gets `caution-active` class (amber glow) when job is cautioned |
| **Drawer** | `panelCautionRow` — slides between Icon Zone and form body |
| **Fields** | Reason dropdown (`jCautionReason`, 7 options), text input (`jCautionText`) |
| **Auto-opens?** | Yes — drawer auto-opens when opening a cautioned job |
| **Saves?** | On panel save — preserves `since` timestamp if reason unchanged |
| **Consistent?** | ⚠ **Inconsistency**: RSP dropdown has 7 reasons (no `achtung`). `CAUTION_REASONS` in code has 8 (includes `achtung`). The `achtung` reason is only settable from LOG SHIP mode. |

### 5.8 Card Zone / Asset Card

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes — per-asset |
| **Visual** | `asset-row-caution` class, ⚠ icon, `astat-caution` status chip |
| **Locked state** | `asset-row-caution-locked` — detail inputs suppressed, row text says "add note or change state" |
| **Pulses?** | Yes — pulse timer activates after 3 seconds of locked state |
| **Note composer** | Inline `+ NOTE` composer per-asset row (opens without leaving Card Zone) |
| **⌕ button** | Routes to NOTES filtered by job + asset (disabled when locked until note added) |
| **Consistent?** | ✅ **Most mature implementation.** Full lock → pulse → note → unlock cycle. |

### 5.9 Card Zone / Pack Card

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes — per-item |
| **Visual** | `pk-row-caution` class, ⚠ icon, `pk-stat-caution` chip |
| **Locked state** | ❌ No lock logic — detail always accessible |
| **Pulses?** | ❌ No pulse animation |
| **Note requirement** | ❌ Not enforced — no `cautionSince`, no timestamp check |
| **⌕ button** | Routes to NOTES filtered by job |
| **Consistent?** | ⚠ **Weakest implementation.** Status exists but protocol is incomplete — no timestamp, no lock, no note-required behavior, no pulse. This is the biggest gap. |

### 5.10 LOG PRESS Mode

| Aspect | Detail |
|--------|--------|
| **Appears?** | ❌ No caution features |
| **Note** | PRESS mode is production counting, not exception handling |

### 5.11 LOG SHIP Mode

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes |
| **Visual** | `logAchtungCtrl` button — grey default, amber glow when active |
| **Pulses?** | Yes — `achtung-active` class triggers `cautionPulse` animation |
| **Click action** | `toggleShipAchtung()` — toggles `job.caution = { reason: 'achtung' }` on/off |
| **Text field?** | ❌ No text prompt — achtung reason is set with empty text |
| **Consistent?** | ⚠ **Inconsistency**: ACHTUNG from LOG SHIP has no opportunity to add context text at trigger time. RSP and Floor Card edit both support text/reason. The achtung toggle is the only "one-click" caution trigger — all others require at least selecting a reason. |

### 5.12 ENGINE Page

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes (as part of BLOCKERS count) |
| **Visual** | Cautioned jobs contribute to the "BLOCKERS" metric in the TV/ENGINE stats |
| **Clickable?** | ENGINE blocks have click-through detail, but CAUTIONED is counted within BLOCKERS alongside `hold` and offline presses |
| **Dedicated block?** | Not as a standalone "⚠ CAUTIONED" block — it is bundled into BLOCKERS |
| **Consistent?** | Acceptable for MVP. The metric map (`docs/engine-metric-map.md`) defines a standalone CAUTIONED block but it is not yet wired as a separate engine metric. |

### 5.13 TV Surface

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes |
| **Visual** | Cautioned jobs counted in the BLOCKERS stat displayed on the TV dashboard |
| **Consistent?** | Same as ENGINE — bundled, not standalone |

### 5.14 NOTES Page

| Aspect | Detail |
|--------|--------|
| **Appears?** | ✅ Yes — display-only |
| **Visual** | `<span class="notes-entry-caution-icon">⚠</span>` prepended to asset label on notes linked to currently-cautioned assets |
| **Clickable?** | Display-only |
| **Note** | Shows ⚠ on notes for currently-cautioned assets, not historically-cautioned ones. If the asset is cycled away from caution, the ⚠ disappears from its notes. |

---

## 6. Notes Relationship Audit

### 6.1 How ACHTUNG relates to NOTES

The relationship follows one pattern: **ACHTUNG flags; NOTES explains.**

Setting a caution does **not** automatically create a note or write to `notesLog` or `progressLog`. The protocol nags the user to add a note after flagging, but never writes one for them.

### 6.2 When a note is required vs optional

| Scope | Note required? | Mechanism | What satisfies it? |
|-------|:---:|-----------|---------------------|
| Job-level | ✅ Required (nag) | `cautionNeedsNote()` — checks `notesLog` for any entry with `timestamp >= caution.since` | Any note added to the job after the caution timestamp |
| Asset-level | ✅ Required (gate) | Timestamp comparison: `cautionSince` vs notes with matching `assetKey` | An asset-specific note added after `cautionSince` |
| Pack-level | ❌ Not required | No mechanism exists | N/A |

### 6.3 What happens after a note satisfies the requirement

**Job-level:** The `caution-pill-pulse` animation stops. The `+ NOTE` button disappears. The caution itself remains active (amber row, pill still visible). The caution must be cleared manually.

**Asset-level:** The `asset-row-caution-locked` class is removed. The detail form (date, person, note inputs) becomes accessible again. The ⌕ button enables. The pulse stops. The asset remains in caution status.

### 6.4 Does ACHTUNG write to LOG?

**No.** Setting/clearing caution writes only to `job.caution`. It does not create a `progressLog` entry. There is no "caution event" in the log feed.

This is a design gap — there is no audit trail of when caution was set/cleared except by inference from the `since` timestamp and notes.

### 6.5 How ACHTUNG appears in NOTES

Notes entries themselves do not carry an "ACHTUNG" flag. The ⚠ icon that appears on some notes entries in the Notes page is **live-computed** — it checks whether the note's associated asset is *currently* in caution status. If the asset is later cycled out of caution, the ⚠ disappears retroactively.

There is no permanent "this note was written because of a caution" marker.

### 6.6 Timestamp-based logic summary

```
caution.since
   │
   ├─ job.notesLog[].timestamp >= since?
   │     YES → cautionNeedsNote = false (nag stops)
   │     NO  → cautionNeedsNote = true  (pill pulses, + NOTE shows)
   │
   └─ asset.cautionSince
         │
         └─ job.notesLog[] where assetKey matches AND timestamp >= cautionSince?
               YES → row unlocks
               NO  → row locked, pulse, "add note or change state"
```

---

## 7. Terminology Audit

### 7.1 Code search results

The term "caution" appears extensively. The term "achtung" appears in limited, specific contexts.

**"caution" (internal term) — still used in:**

| Location | Type | Count | Should rename? |
|----------|------|-------|----------------|
| `CAUTION_REASONS` constant | Helper | 1 | Consider (house-coded rename later) |
| `isJobCautioned()` | Helper | 1 | Low priority — internal |
| `cautionReasonLabel()` | Helper | 1 | Low priority — internal |
| `cautionPill()` | Helper | 1 | Low priority — internal |
| `cautionNeedsNote()` | Helper | 1 | Low priority — internal |
| `cautionNoteBtn()` | Helper | 1 | Low priority — internal |
| `cautionSince` (asset field) | Data shape | ~20 | Safely internal |
| `cautionPulse` (CSS keyframe) | CSS | 1 | Safely internal |
| `caution-pill` (CSS class) | CSS | 3 | Safely internal |
| `caution-note-btn` (CSS class) | CSS | 2 | Safely internal |
| `caution-active` (CSS class) | CSS | 2 | Safely internal |
| `job-row-cautioned` (CSS class) | CSS | 3 | Safely internal |
| `job-card-cautioned` (CSS class) | CSS | 2 | Safely internal |
| `asset-row-caution` (CSS class) | CSS | 2 | Safely internal |
| `asset-row-caution-locked` (CSS class) | CSS | 2 | Safely internal |
| `rsp-caution-drawer` (CSS class) | CSS | 1 | Safely internal |
| `pk-row-caution` (CSS class) | CSS | 2 | Safely internal |
| `pk-stat-caution` (CSS class) | CSS | 1 | Safely internal |
| `floor-caution-icon` (CSS class) | CSS | 2 | Safely internal |
| `notes-entry-caution-icon` (CSS class) | CSS | 1 | Safely internal |
| `panelCautionBtn` (HTML id) | HTML | 1 | Safely internal |
| `panelCautionRow` (HTML id) | HTML | 1 | Safely internal |
| `jCautionReason` (HTML id) | HTML | 1 | Safely internal |
| `jCautionText` (HTML id) | HTML | 1 | Safely internal |
| `fcCautionReason` (HTML id) | HTML | 1 | Safely internal |
| RSP label: "⚠ Caution / Blocker" | **User-facing** | 1 | **Yes — rename to ACHTUNG** |
| RSP label: "Caution Note" | **User-facing** | 1 | **Yes — rename** |
| Jobs filter: "⚠ CAUTIONED" | **User-facing** | 1 | **Consider rename** |
| Floor stat: "⚠ CAUTIONED" | **User-facing** | 1 | **Consider rename** |
| Toast: "Caution cleared" | **User-facing** | 1 | **Yes — rename** |
| Toast: "⚠ {reason}" | **User-facing** | 1 | OK as-is (shows reason label) |
| Panel title: "Caution / blocker" | **User-facing** | 1 | **Yes — rename** |

**"achtung" — current usage:**

| Location | Type | Detail |
|----------|------|--------|
| `CAUTION_REASONS` entry `{ v: 'achtung', l: 'Achtung' }` | Constant | One of 8 reason values |
| `toggleShipAchtung()` | Function name | LOG SHIP toggle |
| `logAchtungCtrl` | HTML id | LOG SHIP button |
| `log-achtung-ctrl` | CSS class | LOG SHIP button styling |
| `achtung-active` | CSS class | LOG SHIP button active state |
| HTML title: "ACHTUNG — flag job for attention" | **User-facing** | Button tooltip |

### 7.2 Assessment

- All internal function names, CSS classes, and HTML ids can safely remain as "caution" — renaming would be high cost, low value.
- **User-facing labels should be normalized to ACHTUNG** where the protocol is being referenced. The RSP drawer label "Caution / Blocker" should become "⚠ ACHTUNG" or similar. Toasts and filter labels should follow.
- The `achtung` reason value is an oddity — it makes `achtung` both the **protocol name** and **one specific reason**. This should be resolved: either `achtung` as a reason means "generic attention" (which `other` already covers), or it should be deprecated as a reason value and reserved as the protocol name.

---

## 8. Scenario Coverage Audit

### 8.1 Scenarios that map well to ACHTUNG today

| Scenario | How it maps | Coverage |
|----------|-------------|----------|
| **Asset/material exceptions** (missing plates, wrong TP) | Asset-level caution with `cautionSince`, locked row, inline note | ✅ Strong |
| **Job-level blockers** (stuck, waiting) | Job-level caution with `reason: 'stuck'` or `'customer'` | ✅ Good |
| **Billing/payment issues** | `reason: 'billing'` | ✅ Good |
| **Special handling** (signed, handmade, split) | `reason: 'special'` | ✅ Adequate, though `text` field is the only nuance layer |
| **Traffic jam / added step** | `reason: 'traffic_jam'` | ✅ Good |
| **Outbound/ship holds** | LOG SHIP achtung toggle with `reason: 'achtung'` | ⚠ Functional but lacks text/reason granularity |

### 8.2 Scenarios that map poorly or fall through gaps

| Scenario | Gap |
|----------|-----|
| **Packing/finishing exceptions** | Pack-level caution exists (status = 'caution') but has **no timestamp, no note lock, no pulse nag.** An operator can flag a pack item as cautioned but there's no protocol enforcement to add context. |
| **Source-truth mismatch** (PMP OPS says X, reality is Y) | No dedicated reason. Would need `reason: 'other'` + text, or a new reason value. Not a first-class concept. |
| **Customer-response wait with deadline** | `reason: 'customer'` exists but there's no deadline/expiry field. Duration is display-only via `caution.since` age in tooltips. |
| **Multi-reason caution** | A job can only have one active caution reason. If a job is `stuck` AND has a `billing` issue, only one can be represented. |
| **Caution history / audit trail** | When a caution is cleared, the `job.caution` field is set to `null`. There is no log entry, no history. Previous cautions are invisible. |
| **Caution escalation** | No concept of severity or escalation. A 1-hour achtung and a 30-day achtung look the same except for the tooltip age text. |

---

## 9. Protocol Consistency Assessment

### Are we covering all bases in a similar way?

**No.** The three implementations (job, asset, pack) follow the same conceptual pattern but with decreasing completeness:

| Capability | Job-level | Asset-level | Pack-level |
|-----------|:---------:|:-----------:|:----------:|
| Status/flag | ✅ | ✅ | ✅ |
| Timestamp (`since`) | ✅ | ✅ | ❌ |
| Note-required logic | ✅ | ✅ | ❌ |
| Pulse/nag animation | ✅ | ✅ | ❌ |
| Lock/gate behavior | ❌ | ✅ | ❌ |
| Inline note composer | ❌ | ✅ | ❌ |
| Reason field | ✅ | ❌ | ❌ |
| Text field | ✅ | ❌ | ❌ |
| Visual (amber) | ✅ | ✅ | ✅ |
| Routes to NOTES | ✅ | ✅ | ✅ |

### Which implementation is strongest?

**Asset-level** is the canonical reference implementation. It has the full cycle: flag → timestamp → lock → pulse → note → unlock. Job-level is close but lacks the gating behavior (it nags but doesn't lock anything).

### Which implementations are drifting?

**Pack-level** is the most incomplete. It has the visual treatment but none of the protocol enforcement. An operator can mark a pack item as cautioned, but the system treats it as a status badge rather than an exception protocol.

**LOG SHIP achtung** is functionally correct but is the only trigger that provides no opportunity for context. The hardcoded `reason: 'achtung'` with no text means the flag conveys "needs attention" but not why.

### Does ACHTUNG feel like one thing everywhere?

**Almost.** The amber color, ⚠ icon, and NOTES routing are consistent. But the depth of protocol enforcement varies significantly. A user who learns the asset caution flow (flag → locked → must add note → unlocks) will expect the same behavior from pack caution — and be surprised that it's lighter.

---

## 10. Questions That Still Need Naming

1. **What exactly counts as ACHTUNG-worthy?**
   The current reason list is pragmatic (stuck, billing, customer, traffic jam, special, other, achtung) but there's no explicit guidance on when to use ACHTUNG vs. changing job status to `hold` vs. just adding a note. These three actions overlap.

2. **Should `achtung` remain as both a protocol name and a reason value?**
   Currently `'achtung'` is one of `CAUTION_REASONS`. This is confusing — is "Achtung" the protocol or a specific kind of exception? Recommendation: deprecate `'achtung'` as a reason value; use `'attention'` or `'general'` for the LOG SHIP quick-flag case.

3. **Should ACHTUNG auto-route to NOTES?**
   Currently, setting a caution does NOT navigate to Notes. The UI nags afterward. Should the LOG SHIP achtung toggle immediately open a note prompt? Should the RSP drawer save route to Notes?

4. **Should ACHTUNG write to the event log?**
   Currently there is no `progressLog` entry for caution set/clear events. This means there's no audit trail. Should setting/clearing a caution create a log entry?

5. **Should adding a note auto-resolve the caution?**
   Currently: no. Adding a note only stops the pulse/nag. The caution must be manually cleared. Is this the right behavior? Or should there be a "resolve" action that clears caution + adds a resolution note atomically?

6. **Should pack-level caution have the full protocol?**
   Pack items currently have `status: 'caution'` but no `cautionSince`, no lock, no note requirement. Should pack caution match asset caution? Or is the simpler model intentional?

7. **Should source-truth mismatch be a first-class reason?**
   "What we think we have vs. what we actually have" is a real plant scenario. It's currently covered by `'other'` + text. Should it be `'mismatch'` or `'discrepancy'`?

8. **What should happen to multi-reason cautions?**
   A job can only carry one caution reason. Should this remain? Or should cautions stack?

9. **Should there be caution expiry or escalation?**
   A 30-day-old caution currently looks the same as a 1-hour-old caution (except for tooltip text). Should old cautions escalate visually or generate alerts?

10. **Should the RSP dropdown include `achtung` as a reason?**
    Currently the HTML dropdown has 7 options (not including `achtung`). The `CAUTION_REASONS` constant has 8. Should they be in sync?

---

## 11. Docs Impact

### Existing docs that should be updated for unified ACHTUNG protocol

| Document | Current state | What needs updating |
|----------|--------------|---------------------|
| `docs/INFORMATION-ARCHITECTURE.md` | Uses "caution" throughout. References old overlay names. | Normalize to ACHTUNG terminology. Update Card Zone references. Add protocol summary section. |
| `docs/capability-map-overlay.md` | Uses "caution" throughout. | Normalize terminology. Add ACHTUNG as a cross-system protocol capability. |
| `docs/pipeline-taxonomy.md` | Uses "caution" to describe blocker recommendations. | Normalize terminology. Reference ACHTUNG as the canonical exception mechanism. |
| `docs/engine-page-spec.md` | Defines CAUTIONED block, references caution. | Rename to ACHTUNG in metric labels. Clarify standalone vs. BLOCKERS bundling. |
| `docs/engine-metric-map.md` | Defines CAUTIONED and CAUTION AGE metrics. | Normalize labels to ACHTUNG. |
| `docs/engine-language-guide.md` | Defines "Achtung" as house-coded term. | Already partially correct. Strengthen as canonical. |
| `docs/pack-card-v1-plan.md` | References caution protocol for pack items. | Update to note the pack-level protocol gap. |
| `docs/achtung-expansion-plan.md` (renamed from `caution-expansion-plan.md`) | The original planning doc. | Mark as historical / superseded by unified ACHTUNG protocol doc. |
| `docs/log-2-plan.md` | Brief mention of caution/outbound exceptions. | Minor — normalize terminology. |
| `docs/job-status-model-audit.md` | References asset status including caution. | Minor — normalize terminology. |

### Recommended new doc

**Yes — `docs/achtung-protocol.md` should exist** as the canonical, living reference for the unified exception protocol. It should define:

1. What ACHTUNG is (the exception overlay protocol)
2. The canonical data model for each scope (job, asset, pack)
3. The canonical lifecycle (flag → timestamp → require context → resolve)
4. The reason vocabulary
5. The note relationship contract
6. Surface-by-surface behavior expectations
7. What ACHTUNG is NOT (not a status, not a workflow gate, not a replacement for notes)

This doc would supersede `docs/achtung-expansion-plan.md` and serve as the source of truth for all future ACHTUNG work.
