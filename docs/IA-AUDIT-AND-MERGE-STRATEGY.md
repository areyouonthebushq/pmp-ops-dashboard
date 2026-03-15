# IA Document Audit and Merge Strategy

**Date:** 2026-03-06  
**Scope:** Audit only. Code is source of truth. No code changes.  
**Documents audited:** `IMPORT-REVIEW-ARCHITECTURE.md`, `OLD_INFORMATION_ARCHITECTURE.md`, `OLD_informationarchitecturev3.md`, `OLD_INFORMATION-ARCHITECTUREv0-archive.md`

---

## 1. Code-anchored facts (source of truth)

Verified against `index.html`, `app.js`, `render.js`, `stations.js`, `docs/purgatory-protocol.md`.

### 1.1 Navigation and pages

| Surface | In code | Where |
|--------|---------|-------|
| **Main nav** | FLOOR · JOBS · LOG · NOTES (TODOS present but `display:none`) | index.html bar `.nav-item`, `data-pg`, `goPg()` |
| **Utility menu** | CREW, PVC, DEV (admin), AUDIT (admin) | `goPgUtil('crew'|'compounds'|'dev'|'audit')`, bar util dropdown |
| **ENGINE** | Reachable via clock click | `#clock` → `goPg('engine')`; no nav item |
| **Pages (pg-*)** | floor, jobs, todos, log, engine, notes, audit, dev, crew, compounds | index.html `id="pg-*"`; no `pg-ship` in DOM |
| **SHIP page** | **Purged.** No `pg-ship` div, no `renderShip`, no nav entry, no case in `renderAdminShell()` | purgatory-protocol.md; render.js PURGATORY comment |

### 1.2 Launcher

| Choice | In code | Note |
|--------|---------|------|
| Admin | Yes | `enterByLauncher('admin')` |
| Floor Manager | Yes | `enterByLauncher('floor_manager')`; launcher button has `style="display:none"` (role-gated) |
| QC Station | Yes | `enterByLauncher('qc')` |
| Press Station | **Purged.** No launcher button | Comment in index.html: PURGATORY: Press Station launcher removed |
| “Press 1–4” | Not in launcher | Only QC and FM (and Admin) visible per launcher HTML |

### 1.3 Station shells

| Shell | In code | Note |
|-------|---------|------|
| QC Station | `#qcStationShell` | stations.js, renderQCStationShell |
| Floor Manager | `#floorManagerShell` | stations.js |
| Press Station | **Purged.** No `#pressStationShell` in index.html | purgatory-protocol.md |

### 1.4 Overlays and key IDs

- RSP (panel): `#overlay` + panel body
- Floor card: `#floorCardOverlay`
- Card Zone: `#cardZoneOverlay` (RECEIVING / PACKING)
- New job chooser, compound wizard, confirm, PO image lightbox, TV (`#tv`)
- **Import Review:** `#importReviewWrap`, `S.importSession` exists; CSV/photo/PDF flow and review UI implemented in app.js

### 1.5 Data / entities

- **Dev notes:** Stored with `area`, `text`, `person`, `timestamp`; **and** (as of Step 4 DEV 2.0) optional `stage`, `type`, `entity`. Constants: `DEV_STAGES`, `DEV_WORK_TYPES`, `DEV_ENTITIES` in core.js; three rails on DEV page.
- **Job:** progressLog, notesLog, assets, packCard, caution, fulfillment_phase, poContract, etc. (as in v3 table).
- **SHIP:** No SHIP page. `fulfillment_phase` and `setFulfillmentPhase()` still used (e.g. RSP dropdown). `logMode = 'ship'` is LOG console state (BOXED/READY/QUACK), not a page.

---

## 2. Document-by-document audit

### 2.1 IMPORT-REVIEW-ARCHITECTURE.md

| Aspect | Match / mismatch | Notes |
|--------|-------------------|-------|
| Purpose | **Design doc** | Read-only “recommended” architecture for staged import-review. Not an IA map of the whole app. |
| S.importSession | ✅ | Exists in app.js; shape aligns (type, sourceRef, status, extractedRows). |
| Import Review UI | ✅ | `importReviewWrap`, confirm flow, CREATE JOBS in code. |
| New Job Chooser / Manual / CSV / Photo / PDF | ✅ | Chooser and import paths exist; review overlay exists. |
| Relation to IA | N/A | Describes one **flow** (import → review → create). Fits under “how jobs are created,” not “where pages live.” |

**Verdict:** Accurate for its scope (import-review design). Keep as a **feature design doc**, not the canonical IA. Reference it from the canonical IA under “Job creation / Import” or “Overlays.”

---

### 2.2 OLD_INFORMATION_ARCHITECTURE.md (no suffix)

| Aspect | Match / mismatch | Notes |
|--------|-------------------|-------|
| Nav | ⚠️ Partial | Lists JOBS, FLOOR, LOG, NOTES, AUDIT. Omits TODOS, ENGINE, CREW, PVC, DEV and that CREW/PVC/DEV/AUDIT are utility menu, not main nav. |
| Launcher | ⚠️ Outdated | Says “Admin, Floor Manager, Press Station, QC Station.” Press Station is purged; launcher has no Press 1–4. |
| Station shells | ⚠️ Outdated | Describes Press Station shell as active; it is purged. QC and Floor Manager correct. |
| Pages | ⚠️ Incomplete | No ENGINE, no CREW, no PVC, no DEV, no Card Zone (RECEIVING/PACKING), no WRENCH/ACHTUNG popup. |
| Data model | ✅ Broadly correct | Job, press, progress log, QC log, notes, todos, audit. Missing caution, packCard, fulfillment_phase, dev notes shape. |
| LOG | ⚠️ Incomplete | Describes “PRESS / PASS / REJECT” only; no BOXED/READY/QUACK or 6-action console. |

**Verdict:** Partially accurate; **outdated** on launcher, stations, nav, and LOG. Good high-level flow and entity overview. Use as input to merge, not as single source.

---

### 2.3 OLD_informationarchitecturev3.md

| Aspect | Match / mismatch | Notes |
|--------|-------------------|-------|
| Nav and pages | ✅ Largely correct | FLOOR, JOBS, TODOS, LOG, NOTES, PVC, CREW, DEV; AUDIT and SHIP “hidden.” ENGINE reached via clock. |
| SHIP / pg-ship | ❌ Outdated | States “Runtime still wired (`renderShip()` exists, `goPg('ship')` reachable). Not yet formally purged.” **Wrong:** SHIP was formally purged (purgatory-protocol.md). No `pg-ship` in DOM; no `renderShip`; no case in `renderAdminShell()`. |
| Launcher | ⚠️ Slight | Says “Press 1–4”; launcher HTML has no Press buttons (Press Station purged). “Admin, Floor Manager, Press, QC” → should be “Admin, Floor Manager, QC.” |
| File map (render.js) | ❌ Outdated | Lists “renderShip (hidden)”. Should say “renderShip removed (purgatory).” |
| DEV page | ⚠️ Slight | Describes “Dev area select, add note, dev feed.” Omitted: DEV 2.0 three rails (stage, type, entity) and constants. |
| Dev notes entity | ⚠️ Slight | Table says `area, text, person, timestamp` only; code now also has optional `stage`, `type`, `entity`. |
| Rest of v3 | ✅ Strong | One-sheets (FLOOR, JOBS, LOG, NOTES, PVC, RSP, Card Zone, Floor card), flows, role matrix, file map, glossary are accurate and code-anchored. |

**Verdict:** Best single reference but **needs corrections**: SHIP is purged (not “hidden/wired”); launcher and render.js file map updated; DEV page and dev notes entity updated for DEV 2.0 rails and fields. Use as **backbone for the single source of truth** after edits.

---

### 2.4 OLD_INFORMATION-ARCHITECTUREv0-archive.md

| Aspect | Match / mismatch | Notes |
|--------|-------------------|-------|
| Nav | ❌ Outdated | “Floor · Jobs · Todos · QC · Audit” — no LOG, NOTES, PVC, CREW, DEV, ENGINE. QC is a page in v0; in code QC Station is a shell and LOG is the page for logging. |
| Launcher | ⚠️ Outdated | “Press 1–4” and Press Station; both purged. |
| Bar | ⚠️ Outdated | “MIN, TV, QC, CSV, BACKUP, EXIT” — no clock→ENGINE, no util menu (CREW, PVC, DEV, AUDIT). |
| IA tree | ❌ Outdated | “QC” as nav page with job picker and reject buttons; today that’s LOG (6-action) + QC Station shell. No Card Zone, no RSP ACHTUNG popup. |
| Entity diagram | ✅ Still useful | Job, progress log, assets, press, QC log, todos — structure still valid; field lists partial. |

**Verdict:** **Historical.** Reflects an older product (QC as page, Press Station, no LOG console, no Card Zone). Keep for history; do **not** use as current IA. Fold into “IA Purgatory” or “Historical / alternate paths” in the merge.

---

## 3. Gaps and conflicts summary

| Topic | Code reality | v0 | INFORMATION_ARCHITECTURE | v3 | IMPORT-REVIEW |
|-------|--------------|-----|---------------------------|-----|----------------|
| SHIP page | Purged; no pg-ship, no renderShip | — | — | Says “hidden, wired” ❌ | — |
| Press Station | Purged | Present ❌ | Present ❌ | Purged ✅ | — |
| Launcher | Admin, FM (hidden), QC only | Press 1–4 ❌ | Press + QC ❌ | “Press 1–4” ❌ | — |
| ENGINE | Via clock; pg-engine | — | — | ✅ | — |
| CREW / PVC / DEV / AUDIT | Utility menu, not main nav | — | AUDIT only in nav | ✅ (DEV, CREW, PVC) | — |
| LOG | 6-action console (PRESS/PASS/REJECT/BOXED/READY/QUACK) | QC page ❌ | PRESS/PASS/REJECT only ❌ | ✅ | — |
| Card Zone | RECEIVING + PACKING overlay | — | — | ✅ | — |
| DEV 2.0 rails | stage, type, entity + constants | — | — | Not yet ❌ | — |
| Dev notes fields | area, text, person, timestamp, stage, type, entity | — | — | area, text, person, timestamp only ❌ | — |
| Import Review | S.importSession + importReviewWrap | — | — | — | ✅ Design only |

---

## 4. Recommended merge strategy

### 4.1 One source of truth: canonical IA document

- **Base:** Use **OLD_informationarchitecturev3.md** as the backbone (one-sheets, flows, role matrix, file map, glossary).
- **Actions on v3:**
  1. **SHIP:** Replace “hidden / still wired” with **purged.** Add pointer: “See § IA Purgatory and `docs/purgatory-protocol.md`.” Remove any implication that `renderShip()` exists or `goPg('ship')` shows a page.
  2. **Launcher:** State exactly what’s in the launcher: Admin, Floor Manager (role-gated), QC Station. Note “Press Station launcher and shell purged (date).”
  3. **File map (render.js):** Remove `renderShip (hidden)`; add “(SHIP purged).”
  4. **DEV page:** Add one short subsection: DEV 2.0 three rails (stage, type, entity); constants in core.js; optional fields on dev notes.
  5. **Dev notes entity:** Add optional `stage`, `type`, `entity` to the entity table.
  6. **ENGINE:** Already correct (clock → ENGINE); ensure it’s clear ENGINE has no nav item.

- **Name and location:** Rename or supersede with a single canonical doc, e.g. **`INFORMATION-ARCHITECTURE.md`** (replace the current shorter one with this expanded, corrected content), or keep **`OLD_informationarchitecturev3.md`** as the canonical name and archive/redirect the others. Recommendation: make **`INFORMATION-ARCHITECTURE.md`** the one source of truth (so the “main” IA doc is obvious) and set its content to the corrected v3 body plus the new sections below.

### 4.2 New section: IA Purgatory (historical / alternate paths)

Add a **single section** in the canonical doc, e.g. **“IA Purgatory — decommissioned surfaces and paths.”** Do not duplicate the full purgatory protocol; **reference** `docs/purgatory-protocol.md` for doctrine and ledger.

In the IA doc, in that section:

- **SHIP page:** One short paragraph: former fulfillment-phase grouping page; purged (date); `fulfillment_phase` and RSP dropdown remain; LOG SHIP actions and Card Zone PACKING cover the workflow. Link to purgatory-protocol.md SHIP entry.
- **Press Station:** One short paragraph: former launcher choice and shell for single-press logging; purged (date); LOG console and Floor press grid cover the workflow. Link to purgatory-protocol.md.
- **Historical nav/model (v0):** One note: “An earlier IA had QC as a top-level page and Press 1–4 in the launcher; current product uses LOG (6-action) and QC Station shell, and Press Station is purged.” No need to restate v0 in full; keep v0 doc as a separate historical artifact.

This keeps the canonical IA accurate and code-aligned while preserving “what used to be” and “why it’s gone” without cluttering the main flow.

### 4.3 Role of the other three documents

| Document | After merge |
|----------|-------------|
| **INFORMATION-ARCHITECTURE.md** | **Canonical.** Single source of truth (content = corrected v3 + IA Purgatory section + DEV 2.0/import refs). Or keep v3 as canonical and replace this file with a short “See informationarchitecturev3.md” pointer. |
| **OLD_informationarchitecturev3.md** | Archived. Superseded by INFORMATION-ARCHITECTURE.md; content retained as historical snapshot. |
| **OLD_INFORMATION-ARCHITECTUREv0-archive.md** | **Archive.** Renamed with OLD_ prefix. Add one-line at top (was: Rename to `INFORMATION-ARCHITECTUREv0-archive.md` or move to `docs/archive/`. Add one-line at top: “Historical IA; superseded by INFORMATION-ARCHITECTURE.md. Preserved for alternate/unchosen paths.” Do not maintain. |
| **IMPORT-REVIEW-ARCHITECTURE.md** | **Keep as-is.** It is a feature design doc, not the app IA. In the canonical IA, under “Job creation” or “Overlays,” add: “Staged import with review: see IMPORT-REVIEW-ARCHITECTURE.md.” |

### 4.4 Concrete merge steps (no code changes)

1. **Choose canonical file:** Either `INFORMATION-ARCHITECTURE.md` (recommended) or `OLD_informationarchitecturev3.md`.
2. **Apply corrections to the chosen doc** (SHIP purged, launcher, render.js, DEV 2.0, dev notes fields) as in § 4.1.
3. **Add “IA Purgatory” section** with SHIP, Press Station, and brief v0 note; link to purgatory-protocol.md.
4. **If canonical is INFORMATION-ARCHITECTURE.md:** Replace OLD_INFORMATION_ARCHITECTURE.md content with a pointer; keep `OLD_informationarchitecturev3.md` as archive copy.
5. **Archive v0:** Renamed to OLD_INFORMATION-ARCHITECTUREv0-archive.md with supersede notice.
6. **Cross-reference:** In canonical IA, add one line under job creation / overlays pointing to IMPORT-REVIEW-ARCHITECTURE.md.
7. **No code edits:** All of the above are doc-only.

---

## 5. Summary

| Question | Answer |
|----------|--------|
| Do the current IA docs reflect the code? | Partially. v3 is closest but has errors (SHIP, launcher, render map, DEV). INFORMATION_ARCHITECTURE is incomplete. v0 is historical. IMPORT-REVIEW is accurate for its scope. |
| Single source of truth? | Use one canonical IA doc (recommend INFORMATION-ARCHITECTURE.md) with corrected v3 content, an “IA Purgatory” section, and DEV 2.0/import refs. |
| Historical / alternate paths? | Honor them in an **IA Purgatory** section (SHIP, Press Station, brief v0) and by archiving v0; purgatory-protocol.md remains the ledger for purged runtime behavior. |
| Code changes? | None. Audit and merge are documentation-only. |
