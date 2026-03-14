# SHIP Page Roadmap — Lightweight Fulfillment / Pickup / Shipping

> **⚠ SUPERSEDED** — SHIP page was implemented, then hidden from nav (2026-03-04). Its role has been absorbed by LOG SHIP actions (BOXED/READY/QUACK), Card Zone PACKING face, and the JOBS LIVE column. This document is preserved as historical reference. See `docs/purgatory-protocol.md` for current status.

**Purpose:** Design a SHIP page for PMP OPS as a lightweight operational surface for late-stage fulfillment, pickup, and shipping — without building a full TMS or CRM.

**Scope:** Read-only planning/documentation. No code changes. Optimizes for practical plant usefulness.

*Nashville · Press Floor Operations · physicalmusicproducts.com*

---

## 1. Executive summary

- **Gap:** Bitrix exports, project threads, and plant usage show that **fulfillment and shipping** are one of the biggest operational gaps not yet covered in PMP OPS. Today, “ready to ship,” “local pickup,” “awaiting shipping instructions,” and proof (BOL, pickup images) live in notes, spreadsheets, or Bitrix — not in a dedicated floor-facing surface.
- **Intent:** SHIP is a **lightweight late-stage surface** for: ready for pickup, ready to ship, awaiting shipping instructions, local pickup, in-house fulfillment, held units/exceptions, and proof references (BOL, pickup images, shipping notes). It is **not** a full logistics platform, TMS, or customer portal.
- **Leverage:** One new page and a small, bounded data model (fulfillment phase + optional shipping proof) give the plant a single place to see and act on “what’s going out the door” and “what’s stuck at the dock,” with minimal overlap with existing job status or NOTES.
- **Recommendation:** Implement in two phases: Phase 1 = SHIP page + fulfillment_phase on job + filter/list + basic proof (notes/attachments); Phase 2 = richer proof (BOL/pickup image slots), exceptions list, and optional integrations.

---

## 2. Why SHIP is the highest-leverage next operational page

- **Pipeline taxonomy** (`docs/pipeline-taxonomy.md`) already calls out fulfillment as the main missing piece: READY TO SHIP, LOCAL PICK UP, NEED SHIPPING QUOTE, AWAITING FINAL PAYMENT, IN HOUSE FULFILLMENT today have no first-class home; they are “notes or future fulfillment_phase.”
- **Job status** correctly stays **done** when production is complete; “ready to ship” and “shipped” are **post-production** states. A dedicated SHIP page avoids overloading the job status rail and gives a clear mental model: Floor = run the press; Jobs = all work; SHIP = get it out the door.
- **Plant feedback** (PLANT-FEEDBACK-SYNTHESIS) emphasizes traceability and proof (photos, change visibility). SHIP is the natural place for **shipping proof** (BOL, pickup photos, shipping notes) without turning NOTES into a shipping-only channel.
- **Bitrix** remains the place for invoicing, customer comms, and full project lifecycle; PMP OPS SHIP is the place for **plant-side** visibility and proof for pickup/ship, so the two systems complement rather than duplicate.
- **Single surface:** Today, “what’s ready to ship?” and “what’s waiting on shipping instructions?” require scanning Jobs (status = done) and reading notes. A SHIP page with a simple phase filter and list gives one answer.

---

## 3. Scope boundary: what SHIP is and is not

### 3.1 SHIP *is*

- An **operational late-stage surface** for jobs that are done (or in assembly) and in a fulfillment/shipping phase.
- **Visibility:** Ready for pickup, ready to ship, awaiting shipping instructions, local pickup, in-house fulfillment, held units / exceptions.
- **Proof references:** BOL, pickup images, shipping notes — stored or linked per job (reuse notes/attachments or a small proof structure).
- **Filtering and listing** by fulfillment phase (and optionally by exception/hold).
- **Lightweight edits:** Set fulfillment phase; add a shipping note or attach proof; mark exceptions. No rate shopping, no carrier booking, no customer portal.

### 3.2 SHIP is *not*

- A **full TMS or logistics platform** — no carrier selection, rate shopping, label generation, tracking integration, or shipment creation in external carriers.
- A **CRM or customer portal** — no customer-facing tracking, no “my order” views, no sales pipeline. Bitrix (or similar) stays the system for that.
- A **replacement for job status** — job status (queue → pressing → assembly → hold → done) is unchanged. Fulfillment phase is a **separate dimension** (see §7.1).
- A **replacement for NOTES** — NOTES remains the place for general job and channel communication. SHIP can **show** recent shipping-related notes and **add** shipping notes or proof that also appear in NOTES (or in a dedicated shipping-proof area) so there is one source of truth.

---

## 4. Phase 1 capabilities

- **SHIP page** in the admin shell: one new nav item and page (`pg-ship`), same shell as FLOOR, JOBS, LOG, NOTES.
- **Fulfillment phase** on job: single field, e.g. `fulfillment_phase`: `null | 'packing' | 'ready_for_pickup' | 'ready_to_ship' | 'awaiting_instructions' | 'local_pickup' | 'shipped' | 'held_exception'`. Not part of STATUS_ORDER; used only for filtering and display on SHIP (and optionally on Jobs/Floor as a secondary badge or column).
- **SHIP list:** Jobs that are **relevant to SHIP** — e.g. `status === 'done'` or `status === 'assembly'`, optionally filtered by `fulfillment_phase` (or “all late-stage”). Default view: e.g. “Ready to ship” + “Awaiting instructions” + “Held / exception” so the plant sees what needs attention.
- **Toolbar:** Filter by fulfillment phase (All, Ready for pickup, Ready to ship, Awaiting instructions, Local pickup, Shipped, Held / exception); optional search by catalog/artist.
- **Row/card per job:** Catalog, artist, album, format, qty, job status pill, **fulfillment phase** pill or label, due (if any), last shipping note or “—”. Click row → open **panel** (existing) or a **SHIP-focused mini-panel** (phase, shipping notes, proof).
- **Set phase:** From SHIP page, quick action to set fulfillment phase (dropdown or buttons) and save; no need to open full panel for that alone.
- **Proof and notes:** Use **existing** job notes/attachments for “shipping note” and “BOL/pickup image.” Option A: add a note from SHIP with a tag or prefix (e.g. “[SHIP] BOL received”) that lands in `job.notesLog` (and optionally `job.assemblyLog`). Option B: one dedicated “shipping note” text field and one “shipping proof” image ref on job (e.g. `job.shippingProof` URL + optional caption). Phase 1 can stay with Option A (notes + convention) to avoid schema change; if proof is critical, add one image ref in Phase 1.
- **Link to job:** Every SHIP row opens the existing job panel (or floor card) so full job detail, NOTES, Assets, and Progress remain one click away.

**Phase 1 out of scope:** Carrier APIs, labels, tracking numbers, customer portal, multi-stop routes, or warehouse management.

---

## 5. Phase 2 possibilities

- **Structured proof slots:** Dedicated BOL image, pickup/ship photo, and shipping notes field (or a small `job.shipping_proof` object: `{ bolUrl?, pickupImageUrl?, note?, at?: iso date }`) so SHIP can show “BOL ✓”, “Pickup photo ✓” without parsing notes.
- **Exceptions / held units list:** Filter or section “Held / exception” with short reason (reuse `hold_reason` or a `fulfillment_hold_reason` text) so the team can triage “billing hold,” “damage,” “awaiting approval,” etc.
- **In-house fulfillment flag:** Optional boolean or tag “In-house fulfillment” for jobs that are fulfilled on-site (vs drop-ship or third-party) for filtering or reporting.
- **Export:** “SHIP list” CSV (catalog, artist, phase, due, last note) for dock or office use.
- **Lightweight “shipped” confirmation:** Mark as shipped (phase → `shipped`) with optional date and one-line note; no carrier tracking required.
- **Optional Bitrix sync:** If Bitrix holds “shipped” or “delivered” state, one-way read of that state for display only (e.g. “Bitrix: Shipped”) without making PMP OPS the source for carrier data.

Phase 2 stays within “operational surface + proof”; it does not add TMS or CRM features.

---

## 6. Core data objects / fields

### 6.1 Job (existing; extend for SHIP)

- **Existing:** `id`, `catalog`, `artist`, `album`, `status`, `due`, `press`, `format`, `qty`, `notes`, `notesLog`, `assemblyLog`, `assets`, `poContract`, etc. No change to `status` enum.
- **Add for SHIP (Phase 1):**
  - **fulfillment_phase** (string, nullable): `null | 'packing' | 'ready_for_pickup' | 'ready_to_ship' | 'awaiting_instructions' | 'local_pickup' | 'shipped' | 'held_exception'`. Persist in `jobs` (e.g. column `fulfillment_phase`). Used for SHIP list filter and row display; optional display on Jobs/Floor.
- **Optional Phase 1 or Phase 2:**
  - **shipping_note** (string, nullable): One-line or short “shipping instructions” or “BOL #” for quick display on SHIP. Can be derived from last note with tag “[SHIP]” if preferred.
  - **shipping_proof_url** (string, nullable): Single image URL for BOL or pickup photo; view in SHIP and in panel. Alternative: store in `job.poContract` or a small `job.shippingProof` JSONB `{ url?, note?, at? }`.

### 6.2 Notes / proof (existing pattern)

- **job.notesLog** (and optionally **job.assemblyLog**): Continue to support `attachment_url`, `attachment_name`, `attachment_type` for proof images. Phase 1: add notes from SHIP that land in notesLog (with optional “[SHIP]” or “BOL” in text) so NOTES and SHIP both show them.
- **Convention:** Notes that are “shipping proof” or “BOL” can be tagged in text (e.g. “[SHIP] BOL attached”, “[BOL]”) so SHIP page can optionally highlight or filter “proof” entries when displaying recent activity.

### 6.3 No new entities for Phase 1

- No separate “shipment” or “order” entity. A **job** is the unit of work; fulfillment phase and proof are attributes (or linked notes) on the job. This keeps the model simple and avoids sync issues with Jobs/Floor/Panel.

---

## 7. How SHIP relates to existing surfaces

### 7.1 Job status

- **Job status** (queue, pressing, assembly, hold, done) is **unchanged**. “Done” means production complete. Fulfillment phase is **independent**: a job can be `status = 'done'` and `fulfillment_phase = 'ready_to_ship'` or `'awaiting_instructions'`.
- SHIP page **scope:** Show jobs where `status === 'done'` (and optionally `status === 'assembly'` for “packing”). Do not show queue/pressing unless product explicitly wants “coming up for ship” (Phase 2).
- **Panel / Floor card:** Can show a **fulfillment phase** dropdown or read-only pill when present, so setting phase can happen from Panel or Floor card as well as from SHIP. Single source of truth: `job.fulfillment_phase`.

### 7.2 Notes

- **NOTES** remains the channel for all job and team communication. SHIP does not replace NOTES.
- **Shipping-related notes** can be added from SHIP (e.g. “BOL received”, “Pickup scheduled”) and stored in `job.notesLog` (or assemblyLog) so they appear in NOTES and in panel. SHIP page can show “Last shipping note” or “Recent shipping activity” by filtering notes that contain a tag or by showing last N notes for the job.
- **Proof images:** Either (a) note attachment (existing) with tag “[SHIP]” or “[BOL]”, or (b) dedicated `shipping_proof_url` / `shippingProof` for one primary image. (a) requires no schema change; (b) gives a clear “proof” slot on SHIP.

### 7.3 Proof / image attachments

- **Existing:** job.notesLog entries can have `attachment_url`, `attachment_name`, `attachment_type`; job.poContract has PO/contract image. Reuse the same storage (e.g. Supabase storage) for BOL or pickup images.
- **SHIP usage:** “Add proof” from SHIP → upload image → create note with attachment (and optional “[BOL]” or “[PICKUP]” in text) or set `job.shipping_proof_url`. View proof in SHIP row detail or in panel. One image per job is enough for Phase 1; Phase 2 can add a second slot (BOL + pickup) if needed.

### 7.4 Floor / Jobs / Panel

- **Floor:** No change to Floor table or stats. Optionally show a small “SHIP” or fulfillment pill on the row when `fulfillment_phase` is set (Phase 1 or 2) so the floor sees “this one’s ready to ship” at a glance.
- **Jobs:** Jobs page can add an optional **fulfillment** column or filter (e.g. “Fulfillment: Ready to ship”) so power users can filter Jobs by phase. Not required for Phase 1.
- **Panel:** When a job is open, show **fulfillment phase** (dropdown to set, or read-only) and “Shipping proof” (link to image or last shipping note). Save fulfillment_phase with SAVE JOB so Panel remains a single place to edit job + fulfillment.

**Summary:** SHIP is a **focused view and quick-edit surface** over the same job data; it does not duplicate job or notes storage. Panel (and optionally Floor card) can still edit fulfillment phase so SHIP is not the only entry point.

---

## 8. Suggested page layout / IA placement

### 8.1 Nav placement

- **Recommendation:** Add **SHIP** to the main nav after **NOTES** (or after **CREW**), e.g.:
  - `⬡ FLOOR` · `▶ JOBS` · `⬡ LOG` · `◇ NOTES` · **`◈ SHIP`** · `◉ CREW` · `◌ PVC` · …
- **Rationale:** SHIP is part of the “operational flow” (production → logging → notes → out the door). Placing it after NOTES keeps the sequence: run (Floor/Jobs) → log (LOG) → communicate (NOTES) → fulfill (SHIP) → support (CREW, PVC). Alternative: place after CREW so SHIP is “last” before AUDIT/DEV.

### 8.2 Page structure (SHIP page)

- **Toolbar:** Title “SHIP” or “Fulfillment”; filter dropdown (All late-stage | Ready for pickup | Ready to ship | Awaiting instructions | Local pickup | Shipped | Held / exception); optional search (catalog, artist); no “Add job” (jobs are created on Floor/Jobs).
- **Summary strip (optional):** Counts per phase (e.g. “Ready to ship: 4 · Awaiting instructions: 2 · Held: 1”) for at-a-glance.
- **List:** Table or cards. Columns/card fields: Catalog, Artist, Album, Format, Qty, Job status (pill), **Fulfillment phase** (pill or label), Due, Last shipping note or “—”, Proof (✓ / — or thumbnail). Row click → open panel (or SHIP mini-panel). Optional: inline “Set phase” dropdown per row to change phase without opening panel.
- **Empty state:** “No jobs in this phase” or “No late-stage jobs. Jobs appear here when status is Done (or Assembly) and fulfillment phase is set.”
- **No FAB** on SHIP (jobs are created elsewhere). Optional: “Add shipping note” or “Add proof” that opens panel to the job’s notes section or a small proof upload flow.

### 8.3 Panel / Floor card

- In **panel:** Add one row or section “Fulfillment”: dropdown for `fulfillment_phase`, optional “Shipping note” line, optional “Proof” image (view/upload). Save with existing SAVE JOB.
- In **Floor card** (if space): Optional read-only fulfillment phase pill, or omit for Phase 1 to keep Floor card minimal.

---

## 9. Recommended implementation sequence

1. **Schema and state (Phase 1)**  
   - Add `fulfillment_phase` to job (Supabase `jobs` column, nullable text or enum).  
   - Map in `supabase.js` and app state (read/write on load and save).  
   - No change to STATUS_ORDER or status logic.

2. **SHIP page shell**  
   - Add nav item “SHIP” and page `pg-ship` in `index.html`; register in `goPg` and nav highlight.  
   - Add `renderShip()` (or equivalent) that builds the SHIP list from `S.jobs` filtered by `status === 'done'` (and optionally `assembly`), with optional filter by `fulfillment_phase`.  
   - Toolbar: phase filter dropdown; optional search.  
   - Table or cards: catalog, artist, album, format, qty, status pill, fulfillment phase, due, last shipping note (from notesLog if tagged or last note), proof indicator.  
   - Row click → `openPanel(job.id)`.

3. **Set phase from SHIP**  
   - Inline dropdown or “Set phase” control per row; on change, set `job.fulfillment_phase`, call `Storage.saveJob(job)`, re-render.  
   - Optional: same control in panel under a “Fulfillment” section.

4. **Notes and proof (Phase 1)**  
   - Document note convention: e.g. “[SHIP]” or “[BOL]” in note text so “last shipping note” can be derived (e.g. last note containing “[SHIP]” or any note if no tag).  
   - “Add shipping note” from SHIP → open panel with focus on notes, or small composer that appends to job.notesLog with tag.  
   - Proof: use existing note attachment; “Add proof” = add note with image attachment and “[BOL]” or “[PICKUP]” in text. Optionally add `job.shipping_proof_url` and one “Proof image” upload in panel for a dedicated slot.

5. **Polish**  
   - Default SHIP filter to “Ready to ship” + “Awaiting instructions” + “Held / exception” so the first thing the plant sees is “what needs attention.”  
   - Optional summary counts by phase.  
   - Ensure SHIP list sorts by due date or phase so urgent items are visible.

6. **Phase 2 (later)**  
   - Structured proof (BOL URL, pickup image URL) if note-based proof is insufficient.  
   - Exceptions list and optional `fulfillment_hold_reason`.  
   - Export SHIP list to CSV.  
   - Optional “Mark shipped” with date and one-line note.

---

*End of SHIP Page Roadmap. See `docs/pipeline-taxonomy.md` for fulfillment stage mapping and `docs/informationarchitecturev3.md` for current IA and data model.*
