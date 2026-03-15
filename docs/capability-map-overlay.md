# PMP OPS — Capability Map Overlay

**Strategic capability mapped onto the current Information Architecture.**  
Use with `docs/INFORMATION-ARCHITECTURE.md`.  
*Read-only planning memo — no code changes.*

---

## 1. Executive Summary

**What PMP OPS is now**  
PMP OPS is the **floor execution and operational visibility** layer for the plant: one place to see what’s running where, log production and outbound movement (LOG 2.0 with PRESS and OUTBOUND modes), track job-level notes and asset readiness, check packing readiness (Card Zone PACKING), see fulfillment phase via LOG SHIP and Card Zone (SHIP page purged), manage a compound library, and (with CREW) who’s here and who’s scheduled today. It holds job state, progress log (8 stages from pressed through held), QC log, notes channels, assets per job, pack card state, fulfillment phase, caution/blocker state, and audit history. It is optimized for real-time use in the room—press grid, LOG faceplate, station shells, TV view—and for “project memory” that lives next to the job (notes, assembly log, assets, PO/contract image).

**What it is not**  
It is not a CRM, not a general document store, not a customer-facing portal, not a full project/task scheduler, and not (yet) the single source of truth for “job” across the business. It does not own lead pipeline, contracts/invoicing, broad task boards, or formal approval workflows. It does not replace Bitrix for those.

**How it complements Bitrix**  
Bitrix today owns (or can own) job creation, pipeline stages, client communication, contracts/invoices, and broader task/project management. PMP OPS owns **execution truth**: what actually ran, what was pressed and rejected, what was packed and shipped, what the floor said about a job, what assets are ready, and whether a job is ready to box correctly. Handoff is currently manual or CSV: jobs can be created in either system; production events and floor state live in PMP OPS. The capability map makes that split explicit so we can decide where to invest next and where to keep boundaries.

**Why this map matters**  
Without it, “what to build next” and “what stays in Bitrix” are fuzzy. This overlay answers: which surfaces are already stronger than Bitrix in their lane, which are partial, what Bitrix still owns, where the next high-leverage moves attach in the IA, and what not to build yet. It keeps strategy aligned with the actual app and the existing IA.

---

## 2. Surface-by-Surface Capability Map

*(Surfaces from canonical IA. SHIP page purged; PACK CARD = Card Zone PACKING. LOG 2.0 single 6-action console; CREW as implemented.)*

### FLOOR (pg-floor)

| Aspect | Assessment | Label |
|--------|------------|--------|
| What’s running where, press grid, stats, floor table | Single pane for “what’s on which press right now” and open jobs; filter/sort by catalog, artist, status. | **Strong / Replaced well** |
| On-deck per press, send-to-press | One on-deck job per press; assign and send to press without leaving the view. | **Strong / Replaced well** |
| Quick navigation to job detail or floor card | Tap row → panel (admin) or floor card (FM). | **Strong** |
| Historical floor state, forecasting | Only current state; no “what was running yesterday” or capacity planning. | **Not in scope** |

**Vs Bitrix:** Bitrix does not provide real-time “which press, which job, on deck” in a floor-optimized view. PMP OPS is stronger here. **Recommendation:** Keep FLOOR as the home for production truth and on-deck awareness; do not dilute it with non-floor views.

---

### JOBS (pg-jobs)

| Aspect | Assessment | Label |
|--------|------------|--------|
| Job list, filter, search, full CRUD | Table/cards, status filter, search, ADD JOB, CSV import; panel for full edit. | **Strong / Replaced well** |
| Job identity and spec (catalog, artist, format, qty, status, due, press) | Full FIELD_MAP in panel; good for “what work exists and how it’s configured.” | **Strong** |
| Progress and assets summary on list | Progress bar, assets bar per row. | **Partial** (summary only; detail in panel/assets) |
| Invoice, client, billing, contract lifecycle | Fields exist in job/panel but are not the focus; no workflow. | **Partial** — display/edit only; **should stay in Bitrix** for pipeline and billing. |
| Job creation from upstream (Bitrix/CRM) | CSV import only; no API sync or “create from Bitrix.” | **Not in scope** for now. |

**Vs Bitrix:** PMP OPS is stronger for **operational job list and edit** (status, press, due, location, notes). Bitrix is stronger for **pipeline, client, and contract**. **Recommendation:** JOBS stays the operational roster; do not turn it into a CRM or pipeline board.

---

### LOG 2.0 (pg-log)

| Aspect | Assessment | Label |
|--------|------------|--------|
| Log production events (press, pass, reject) by job and date — **PRESS mode** | Job picker, 3-button faceplate (PRESS / PASS / REJECT), numpad, date nav, daily feed; writes progress_log and qc_log. | **Strong / Replaced well** |
| Reject type (defect picker) | FLASH, BLEMISH, OFF-CENTER, etc.; logged with job and date. | **Strong** |
| Log outbound events (packed, ready, shipped, picked up, held) by job and date — **OUTBOUND mode** | Same console, same numpad, 5-button faceplate (PACKED / READY / SHIPPED / PICKED UP / HELD); HELD has reason picker. Writes to same progress_log. | **Strong / New** |
| Quantity gates (outbound) | packed ≤ qcPassed; ready ≤ packed; shipped + picked_up + held ≤ ready. Prevents impossible counts. | **Strong / New** |
| Mode toggle | PRESS ◉ / OUTBOUND ◇ toggle at top of console. Persisted in session. Swaps actions, colors, job filter, and feed. | **Strong / New** |
| Feed lane distinction | Outbound entries carry ◇ prefix, OUTBOUND meta tag, colored left-border accent. Press entries use + prefix. Same family, instantly distinguishable. | **Strong / New** |
| Units moved today, by type and mode | Feed shows what was logged for the selected date, filtered by active mode. | **Strong** |
| Historical analytics, reporting | Raw feed only; no charts or export tailored to LOG. | **Not in scope** (AUDIT covers change history; LOG is execution). |

**Vs Bitrix:** Bitrix does not own per-unit production or outbound logging with defect/held-reason types and date-scoped feed. PMP OPS is now stronger on *both sides* of the floor: what went through the press (PRESS mode) and what went out the door (OUTBOUND mode). **Recommendation:** LOG remains the single counted-movement console for the plant. PRESS mode = production truth. OUTBOUND mode = late-stage movement truth. Do not fragment into separate consoles or put counting on other pages.

---

### NOTES (pg-notes)

| Aspect | Assessment | Label |
|--------|------------|--------|
| Job-scoped and channel-scoped notes (!TEAM, !ALERT, job id) | Channel picker, add note, search, feed; notes in job.notesLog or notes_channels. | **Strong / Replaced well** |
| Provenance (person, timestamp) | Every note has person and timestamp. | **Strong** |
| Optional image attachment | Camera/upload, store with note; thumb in feed, lightbox. | **Strong** |
| Threading, @mentions, formal approvals | Flat feed only; no threads or sign-off workflow. | **Not in scope** — should stay lightweight. |

**Vs Bitrix:** Bitrix often has task comments and project comms; PMP OPS gives **operational, job-anchored notes with optional proof (image)** in one place with the job. For “what did we say about this job,” PMP OPS is stronger on the floor. **Recommendation:** NOTES stays the project-memory and communication home for the plant; do not add chat or approval bureaucracy.

---

### CREW (pg-crew)

| Aspect | Assessment | Label |
|--------|------------|--------|
| Directory: who works here, contact, specialty | Table with name, role, phone, email, specialty, notes; optional photo; search; add/edit person. | **Strong** for operational directory. |
| TODAY: who is scheduled today | Schedule entries by date; employee, shift, area, note; add/edit entry. | **Partial** — one day only; no calendar or recurring. |
| HR, payroll, PTO, time clock | Explicitly out of scope. | **Should stay in Bitrix** (or elsewhere). |

**Vs Bitrix:** Bitrix may have employee/contact and broader scheduling. PMP OPS owns **who’s here and who’s on the floor today** in a single, scannable view. **Recommendation:** CREW stays operational directory + today schedule; do not grow into HR or full scheduling.

---

### SHIP (purged — pg-ship removed)

SHIP page purged. Fulfillment phase and RSP dropdown remain; LOG SHIP actions and Card Zone PACKING cover the workflow. See `purgatory-protocol.md` and INFORMATION-ARCHITECTURE.md § IA Purgatory.

| Aspect | Assessment | Label |
|--------|------------|--------|
| Jobs grouped by fulfillment phase (awaiting instructions, ready to ship, local pickup, etc.) | Job cards grouped by `fulfillment_phase` column; clickable to open RSP; notes/proof context links. | **Strong / New** |
| Update fulfillment phase | Phase select dropdown on each row; also settable from RSP panel. | **Strong / New** |
| Shipping labels, rate shopping, carrier integration | Not in scope. | **Not in scope** — stay in dedicated shipping tools or Bitrix. |
| Customer shipping comms | Not in scope. | **Not in scope** — stay in Bitrix. |

**Vs Bitrix:** Bitrix may track a "shipping" stage; PMP OPS now gives the *plant* a scannable view of "what's ready to go, what's held, what's been picked up" grouped by fulfillment state. For floor/warehouse staff answering "what do I need to deal with right now," SHIP is stronger than a CRM stage column. **Recommendation:** SHIP stays a lightweight phase/visibility surface. It does not count units (that's LOG OUTBOUND) and does not replace carrier/label tools. It answers "where is each job in the outbound pipeline" at a glance.

---

### PVC (pg-compounds)

| Aspect | Assessment | Label |
|--------|------------|--------|
| Compound library (operational reference) | Cards: number, code name, amount, color, notes, image; CSV import, add/edit compound. | **Strong / Replaced well** |
| Fulfillment nuance (which compound for which job) | Job has specialty/color; compounds are a separate list. Link is implicit (human) not structured. | **Partial** |

**Vs Bitrix:** Bitrix is unlikely to own “floor compound library with visual reference.” PMP OPS is stronger here. **Recommendation:** PVC stays the operational compound reference; optional later: link job to compound (e.g. preferred compound id) for fulfillment clarity.

---

### AUDIT (pg-audit)

| Aspect | Assessment | Label |
|--------|------------|--------|
| Who changed what, when (jobs, presses, todos, progress_log, qc_log) | Limit, LOAD, table: when, table, id, action, by, changed fields. Admin only. | **Strong / Replaced well** |
| Proof / compliance export | Table view only; no formal export or retention policy in app. | **Partial** |

**Vs Bitrix:** Bitrix may have audit on its entities; PMP OPS audit is **execution and job-state change**. For “what changed in the plant system,” PMP OPS is the source. **Recommendation:** AUDIT stays; consider “export audit range” as a small power move if compliance asks for it.

---

### DEV (pg-dev)

| Aspect | Assessment | Label |
|--------|------------|--------|
| Backstage product memory (by area) | Channel select, add note, feed; areas like JOBS, FLOOR, LOG, NOTES, etc. | **Strong** for internal/dev use. |
| Customer-facing or formal documentation | Not intended. | **Not in scope** |

**Vs Bitrix:** N/A; DEV is internal. **Recommendation:** Keep as-is; no need to compete with Bitrix here.

---

### RSP — Right-Side Panel (slide panel, overlay + panel)

| Aspect | Assessment | Label |
|--------|------------|--------|
| Full job detail and edit (FIELD_MAP, status, press, due, notes, assembly) | Single-scroll form; view vs edit mode; Save, Delete. | **Strong / Replaced well** |
| PO/contract image and fields | Section with image ref and poContract; view/replace image. | **Strong** — proof / image evidence lives here. |
| Progress summary, notes section, link to assets | Progress display; notes; link to open assets overlay. | **Strong** |
| Icon Zone (top-right control cluster) | Star (PO flag), Caution (toggle caution drawer), PACK (open PACK CARD), Edit, Close. Exception-style controls live here, not in the form body. | **Strong / New** |
| Source-of-truth access | RSP is the canonical edit surface for job; S.editId, saveJob. Also the gateway to overlays (Assets, PACK CARD). | **Strong** |
| Invoice/client workflow, contract lifecycle | Fields present; no workflow. | **Should stay in Bitrix** for pipeline. |

**Vs Bitrix:** RSP is where **operational job truth** is viewed and updated. Bitrix may hold “contract” or “order”; PMP OPS holds “what we’re doing with it on the floor” and the PO image as evidence. **Recommendation:** RSP stays the job-detail workbench and proof anchor. The Icon Zone is the right place for exception-style controls (caution) and late-stage context gateways (PACK CARD); do not bloat the form body with them.

---

### Assets Overlay (assetsOverlay) — Incoming Readiness

| Aspect | Assessment | Label |
|--------|------------|--------|
| Per-job asset readiness (ASSET_DEFS: stampers, compound, test press, labels, etc.) | Rows: status (received/na/caution), date, person, note; + add note, view notes. | **Strong / Replaced well** |
| Caution mode (lock until new note) | Caution state and unlock-on-note behavior. | **Strong** |
| Asset-level proof (photo per asset) | Note attachments exist; no dedicated “asset photo” yet. | **Partial** |

**Vs Bitrix:** Bitrix does not typically own per-job asset checklist with caution and notes. PMP OPS is stronger here. **Recommendation:** Assets overlay stays the home for *incoming* readiness. It is complementary to PACK CARD (which handles *outgoing* readiness). Together they bookend the production flow: Assets answers "are the materials here?" and PACK CARD answers "are we ready to box this correctly?"

---

### PACK CARD (packCardOverlay) — Late-Stage / Packing Readiness

| Aspect | Assessment | Label |
|--------|------------|--------|
| Per-job packing readiness checklist (PACK_DEFS: Sleeve, Jacket, Insert, Wrap, Sticker, Box Label, Special Handling) | Items with status cycle (blank / ready / na / caution); expandable detail with note and person fields. | **Strong / New** |
| Health display (done/total, % ready) | `packHealth()` counts items at `ready` status, excluding `na`. Visual at-a-glance readiness. | **Strong / New** |
| Caution-to-NOTES protocol | Item at `caution` routes to NOTES for context; same flag / require context / resolve protocol as Assets. | **Strong / New** |
| Special handling notes | Dedicated field for packing-specific instructions; saved with card. | **Strong / New** |
| Entry from job context | Jobs page PACK button per row; RSP Icon Zone box icon. | **Strong / New** |
| Counted packing throughput | Not in scope. LOG OUTBOUND PACKED counts units. PACK CARD tracks *readiness*, not quantity. | **Intentional boundary** |

**Vs Bitrix:** Bitrix does not provide a per-job, item-level packing readiness checklist with caution protocol and notes linkage. This is a floor/warehouse concern that Bitrix has no answer for. **Recommendation:** PACK CARD stays a readiness/nuance surface. It answers "is this job ready to pack correctly?" and "what exceptions or special handling apply?" It does not count units (LOG does that) and does not track fulfillment phase (SHIP does that).

---

### Floor Card (floorCardOverlay)

| Aspect | Assessment | Label |
|--------|------------|--------|
| Quick edit without full panel (status, press, location, due, notes, assembly) | Used when canUseFullPanel is false (e.g. Floor Manager); single overlay. | **Strong** |
| Full job editing | Not intended; panel does that. | **Not in scope** |

**Vs Bitrix:** N/A; floor card is a PMP OPS UX shortcut. **Recommendation:** Keep as-is; FM stays fast without opening full panel.

---

### Press / QC / Floor Manager station shells

| Aspect | Assessment | Label |
|--------|------------|--------|
| Focused execution context (one press, or QC, or floor table) | Press: current job, log pressed, assign; QC: job picker, reject buttons, today summary; FM: stats, press grid, floor table, floor card. | **Strong / Replaced well** |
| Role-based entry (launcher) | Admin, Floor Manager, Press (p1–p4), QC; last choice restored. | **Strong** |
| Scheduling or task assignment beyond “current job” | On-deck is in admin/FM; stations show “what to do now.” | **Partial** — on-deck is there; no broad task board. |

**Vs Bitrix:** Bitrix does not provide press/QC/floor-specific shells with numpad and reject picker. PMP OPS is stronger for floor execution. **Recommendation:** Stations stay execution-only; do not turn them into generic task dashboards.

---

### Launcher / entry flow (modeScreen, login)

| Aspect | Assessment | Label |
|--------|------------|--------|
| Role-based entry (Admin, FM, Press, QC) | Buttons by role; press picker for Press; OPEN last. | **Strong** |
| Auth (Supabase email/password, guest demo) | Login when configured; launcher after auth. | **Strong** |
| SSO or Bitrix identity | Not implemented. | **Should stay in Bitrix** for now (or separate IdP). |

**Recommendation:** Launcher stays the single entry to app vs stations; identity integration is a later, deliberate move.

---

## 3. Bitrix Ownership Map

Areas Bitrix still owns better today, and how to treat them.

| Capability area | Why Bitrix still owns it | PMP OPS eventually compete? | Long-term home |
|-----------------|--------------------------|----------------------------|----------------|
| **CRM / lead pipeline** | Deals, stages, lead-to-job progression, client history. | No. | **Stay in Bitrix.** PMP OPS consumes “job” once it exists; it does not own pipeline. |
| **Contracts / invoices / doc storage** | Contract lifecycle, invoicing, document repository. | No. | **Stay in Bitrix.** Panel can show PO image and refs; contract creation and storage stay upstream. |
| **Broad task/project management** | Company-wide tasks, projects, assignments. | No. | **Stay in Bitrix.** PMP OPS todos are daily/weekly/standing operational lists, not full task board. |
| **Customer-facing comms** | Client communication, portals. | No. | **Stay in Bitrix.** NOTES is internal plant comms. |
| **Approvals / formal workflow** | Sign-off, multi-step approvals. | No. | **Stay in Bitrix.** PMP OPS has no approval engine. |
| **Attachment-heavy project archive** | Large doc sets, versioning, folder structure. | No. | **Stay in Bitrix.** PMP OPS has note attachments and PO/compound images, not a doc library. |
| **Scheduling / planning beyond floor** | Capacity planning, multi-week scheduling, resource allocation. | Maybe, later. | **Transitional.** CREW TODAY is “who’s on today”; broader planning could stay Bitrix or a dedicated tool. |
| **Shipping / fulfillment stage** | Bitrix may track a "shipped" CRM stage. | **Weakened.** SHIP + LOG OUTBOUND now cover fulfillment phase and outbound counting on the plant side. Bitrix retains value only for client-facing shipping comms and carrier/label integration. | **Transitional.** PMP OPS owns the operational side; Bitrix owns customer-facing shipping and carrier tools. |
| **Packing readiness / assembly checklist** | Bitrix has no floor-level packing checklist. | **No (Bitrix never competed here).** | **PMP OPS (PACK CARD).** New capability that Bitrix cannot match. |
| **Job creation / stage from pipeline** | Creating jobs from deals, stage transitions from CRM. | Optional (e.g. import from Bitrix). | **Transitional.** Today: manual or CSV. Later: sync or API from Bitrix for “create job” or “stage → status” if needed. |
| **Single source of truth for “job”** | Who defines job identity and stage across the business. | Undecided. | **Transitional.** See PLANT-FEEDBACK-SYNTHESIS: Option A/B/C; decision is separate from this map. |

---

## 4. Capability Overlay on IA

Where each capability currently lives in the IA (surface-by-surface). *Updated to reflect PACK CARD, LOG 2.0, and SHIP.*

| Capability | Primary home(s) | Fragmented? | Missing / weak? |
|------------|-----------------|-------------|------------------|
| **Production truth (press/QC)** | LOG PRESS mode (progress_log: pressed, qc_passed, rejected; qc_log). | No. | — |
| **Outbound movement truth** | LOG OUTBOUND mode (progress_log: packed, ready, shipped, picked_up, held). | No. **New.** | — |
| **Floor execution** | FLOOR, Press/QC/FM stations; on-deck, assign, log. | No. | — |
| **Incoming readiness** | Assets overlay (per job); job.assets; ASSET_DEFS. "Are the materials here?" | No. | — |
| **Packing readiness** | PACK CARD (per job); job.packCard; PACK_DEFS. "Is this job ready to box correctly?" | No. **New.** | — |
| **Fulfillment phase visibility** | SHIP (pg-ship); job.fulfillment_phase. "Where is this job in the outbound pipeline?" | No. **New.** | — |
| **Project memory** | NOTES (job + channels); job.notesLog, assemblyLog; DEV (backstage). | Slightly (job notes vs channels vs DEV). | No; intentional split. |
| **Source-of-truth access** | Panel (job edit); JOBS (list); FLOOR (current state). | No. | Source-of-truth *decision* (Bitrix vs PMP OPS) is unresolved. |
| **Source import/review** | JOBS: CSV import (no review step); no Bitrix/API import. | Partial. | Import review (confirm before create) is designed but not fully built; Bitrix sync is out of scope. |
| **Fulfillment nuance** | Assets overlay + PACK CARD + PVC (compound list). Link job to compound is implicit. | Slight. | Optional: explicit job to compound link. |
| **Proof / image evidence** | Panel (PO/contract image); note attachments (NOTES); PVC compound image. | No. | Asset-level proof (one image per asset type) is optional. |
| **Notes / communication** | NOTES (channels + job); panel notes section; assets overlay notes. | No. | — |
| **Backstage product memory** | DEV (area-scoped notes). | No. | — |
| **Scheduling / on-deck awareness** | FLOOR (on-deck per press, send-to-press); CREW TODAY (who’s scheduled today). | No. | Broader scheduling stays Bitrix or other. |
| **Approvals / sign-off** | None. | — | **Missing by design;** stay in Bitrix. |

**Summary:** The system now covers the full production-to-outbound arc without fragmentation. Production truth (LOG PRESS), outbound movement truth (LOG OUTBOUND), incoming readiness (Assets), packing readiness (PACK CARD), fulfillment phase (SHIP), project memory (NOTES), and floor execution (FLOOR/stations) all have clear, non-overlapping homes. Source import/review is partial (CSV exists; review step and Bitrix are future). Fulfillment nuance is cleaner now (Assets + PACK CARD + PVC), though compound-to-job linking remains implicit. Approvals and full scheduling are intentionally not in PMP OPS.

---

## 5. Architecture Rationale: Why Overlays, Not Pages

Before listing next moves, it is worth documenting why the current direction — PACK CARD as an overlay, LOG as a dual-mode console, SHIP as a lightweight phase surface — is strategically better than the alternative of building dedicated pages for each late-stage concern.

### 5.1 Why PACK CARD is an overlay, not a page

| Alternative | Problem |
|-------------|---------|
| **Dedicated PACKING page** | Creates a new top-level surface that duplicates job context. Operators would have to navigate away from the job to check packing readiness, then navigate back. The overlay keeps packing context *inside the job workflow* (RSP Icon Zone, Jobs page). |
| **Packing fields inside the RSP form** | Bloats the panel with late-stage concerns that are irrelevant for 80% of the job lifecycle. The overlay appears only when needed. |
| **Packing in NOTES** | Notes is communication, not a checklist. Packing readiness needs structured state (ready / na / caution per item), not free-form text. |

The overlay pattern (Assets, PACK CARD) works because packing readiness is a *job-scoped concern* that requires structured state, not a *plant-wide view* that requires its own navigation. The same pattern can be extended to other late-stage checklists (e.g. a QC detail card) without adding nav items.

### 5.2 Why outbound movement lives in LOG, not SHIP

| Alternative | Problem |
|-------------|---------|
| **Counting on SHIP page** | SHIP is a phase/visibility surface ("where is this job in the pipeline?"). Adding numpad and counted movement makes it a hybrid: part list, part counting console. The interaction grammar becomes confused. |
| **Separate OUTBOUND LOG console** | Fragments the event grammar. Two numpads, two feeds, two mental models. Violates "one source of truth" for counted movement. |
| **Counting in PACK CARD** | PACK CARD is readiness/nuance ("is this job ready?"). Mixing in "how many units were packed?" crosses concerns. Readiness is binary per item; throughput is numeric per stage. |

LOG 2.0's mode toggle gives operators one console family with one interaction grammar (select job, select action, enter quantity, log) and one event source (`job.progressLog`). The mode switch is explicit, the action palette swaps cleanly, and the feed distinguishes press from outbound with visual lane markers. No new muscle memory required.

### 5.3 How this weakens remaining Bitrix advantages

| Bitrix advantage | How PMP OPS now erodes it |
|------------------|---------------------------|
| **"We track shipping/fulfillment stages"** | SHIP page + LOG OUTBOUND mode give the plant its own fulfillment visibility *and* counted outbound movement. Bitrix may still track a CRM-level "shipped" stage, but the plant no longer needs to go there to answer "what went out today?" |
| **"We know what's packed and ready"** | PACK CARD gives per-job, per-item packing readiness with caution protocol. Bitrix has no equivalent floor-level checklist. |
| **"We have the full job lifecycle"** | PMP OPS now covers queue → pressing → QC → packing readiness → outbound movement → fulfillment phase. The only phases still owned exclusively by Bitrix are pre-production (leads, contracts, deposits) and post-delivery (final payment, project close). The operational middle is fully in PMP OPS. |
| **"We're the single source of truth"** | PMP OPS is now the stronger source of truth for *execution*: what was pressed, what passed QC, what was packed, what shipped, what's held and why. Bitrix remains stronger for *commercial* truth (contracts, invoices, client comms). The gap between them is narrower. |

---

## 6. Next 3 Power Moves

Concrete, code-informed next moves that attach to the existing IA.

---

### Power move 1: Job-level change history in the panel

**What it is**  
A small “Activity” or “What changed” section in the slide panel (or a tab/section in the panel body) that surfaces recent audit entries for the current job: who changed what field, when. Data already exists in `audit_log` / `audit_log_with_actor`; filter by `entity_id = job.id` and `table_name = 'jobs'` (and optionally progress_log, qc_log for same job).

**Problem it solves**  
“Why did this job’s status/press/due change?” and “Who updated it?” without leaving the job. Builds trust and traceability.

**Bitrix advantage it weakens**  
Bitrix often has activity feeds on deals/tasks; if PMP OPS has none, people go to Bitrix to see “what happened.” Putting change history next to the job keeps operational truth in one place.

**IA attachment**  
Right-side Panel (panel body). Compounds existing strength (panel as job source-of-truth access).

**Why this place**  
The panel is already where job detail and proof live; change history is another dimension of the same job. No new top-level surface; reuse existing audit data and panel render.

---

### Power move 2: Import review step (confirm before create)

**What it is**  
When user chooses “Import CSV” (or future: “Import from Bitrix”), do not create jobs immediately. Parse into an import session (extracted rows, per-field confidence if applicable); open a review surface (existing import-review pattern in docs) where user can fix/correct rows and then confirm “Create N jobs.” Jobs are created only after confirm. Optionally tag jobs as “verified from [CSV/Bitrix]” for traceability.

**Problem it solves**  
Bad CSV or upstream data no longer overwrites or creates junk jobs in one click. Reduces “clean up after import” and supports “source document verified” (see IMPORT-REVIEW-ARCHITECTURE).

**Bitrix advantage it weakens**  
If Bitrix is the source of job lists, “import from Bitrix” with review makes PMP OPS a safe consumer: we don’t blindly trust upstream; we confirm once and then own execution.

**IA attachment**  
JOBS (new job chooser / import flow). Creates a clearer “source import/review” path; today that path is partial.

**Why this place**  
Import is triggered from JOBS (ADD JOB → Import CSV or future Import from Bitrix). Review is the missing step between “file selected” and “jobs in S.jobs”; it belongs in the same flow, not a separate app.

---

### Power move 3: Reject origin (press vs packing)

**What it is**  
Extend QC log (or progress/reject model) so a reject event can carry an origin: e.g. “press” vs “packing” (or a small fixed list). LOG faceplate or QC station: when logging a REJECT, user selects defect type (already exists) and optionally origin. Persist and show in daily feed and in job-level reject summary.

**Problem it solves**  
“Where do our rejects come from?” is an operational question; today we only have defect type and job. Origin answers press vs downstream and informs where to focus quality.

**Bitrix advantage it weakens**  
Bitrix does not own per-unit reject logging with defect type; adding origin makes PMP OPS even more the place for production quality truth.

**IA attachment**  
LOG (pg-log): faceplate and daily feed; optionally QC Station. Compounds existing strength (LOG as production truth).

**Why this place**  
Reject events are created in LOG (and QC station); the extension is schema + one or two UI fields in the same flow. No new page; same feed and same job-level aggregation, with an extra dimension.

---

## 7. What Not to Build Yet

Tempting Bitrix-like or generic features that would distract from floor and execution focus.

| Temptation | Why avoid now |
|------------|----------------|
| **Full CRM** | Pipeline, leads, and client lifecycle are Bitrix’s lane. PMP OPS should consume “job” and own execution, not replace CRM. |
| **General doc management** | Folders, versioning, and broad document storage belong in Bitrix or a doc system. PMP OPS keeps PO image and note attachments only. |
| **Customer portal** | Customer-facing views and comms are Bitrix’s. PMP OPS is internal and plant-facing. |
| **Full project scheduling** | Multi-week capacity, resource planning, and Gantt-style planning are out of scope. CREW TODAY is “who’s on today”; more stays in Bitrix or a dedicated planner. |
| **Broad task board duplication** | Company-wide task boards and project tasks live in Bitrix. PMP OPS todos are operational (daily/weekly/standing), not a full task system. |
| **Over-structured note bureaucracy** | Threads, @mentions, and formal approval on notes add process. NOTES should stay lightweight and operational. |
| **Full Bitrix sync in one shot** | Source-of-truth and sync direction are unresolved. Building full sync before deciding Option A/B/C risks rework. Do discovery and a short “Bitrix + PMP OPS” options doc first (per PLANT-FEEDBACK-SYNTHESIS). |
| **Full stage pipeline from upstream** | Mapping every Bitrix/upstream stage into PMP OPS is a large model and UI effort. Map a small set of floor-visible stages first; leave the rest upstream. |
| **Full shipping/logistics platform** | Carrier integration, rate shopping, label printing, tracking numbers. SHIP is a phase/visibility surface, not a TMS. LOG OUTBOUND counts units; it does not replace shipping software. |
| **Turn PACK CARD into a standalone page** | PACK CARD is a job-scoped overlay. If it became a page, it would need its own job list, its own filters, its own navigation. The overlay pattern keeps it inside the job workflow. |
| **HR / payroll / PTO in CREW** | CREW is operational directory + today schedule. Payroll, PTO, and time clocks should stay in Bitrix or HR systems. |

---

## 8. Recommended Strategic Boundary

**What PMP OPS should own**

- **Production truth:** What was pressed, passed, rejected, when, by job and date (LOG PRESS, progress_log, qc_log).
- **Outbound truth:** What was packed, readied, shipped, picked up, held, when, by job and date (LOG OUTBOUND, progress_log).
- **Floor execution:** What’s running where, on-deck, assign to press, station shells for Press/QC/Floor Manager (FLOOR, stations).
- **Incoming readiness:** Are the materials here and accounted for (Assets overlay, ASSET_DEFS).
- **Packing readiness:** Is this job ready to box correctly (PACK CARD, PACK_DEFS).
- **Fulfillment phase:** Where is this job in the outbound pipeline (SHIP, fulfillment_phase).
- **Job operational state:** Status, press, due, location, caution, notes, assembly, PO image (JOBS, RSP, Floor card).
- **Project memory and comms:** Job-scoped and channel notes, attachments, backstage dev notes (NOTES, DEV).
- **Operational reference:** Compound library, directory, who’s scheduled today (PVC, CREW).
- **Change visibility:** Who changed what, when, on key entities (AUDIT).

**What Bitrix should still own**

- **CRM and pipeline:** Leads, deals, stages, client history.
- **Contracts and invoices:** Contract lifecycle, invoicing, formal doc storage.
- **Broad task and project management:** Company-wide tasks, projects, assignments.
- **Customer-facing communication and portals.**
- **Approvals and formal workflow.**
- **Identity and access** (until a deliberate integration choice is made).

**Transitional / bridge zones**

- **Job creation and stage:** Today manual or CSV; later possibly “create from Bitrix” or “stage → status” sync. Decision and design are separate.
- **Single source of truth for “job”:** Option A (Bitrix master), B (PMP OPS master for execution), or C (separate handoff) is not decided; keep boundaries clear and avoid building full sync until that decision is made.
- **Scheduling beyond today:** CREW TODAY is in PMP OPS; broader planning may stay in Bitrix or a dedicated tool.
- **Shipping / carrier integration:** PMP OPS now owns fulfillment phase (SHIP) and outbound counting (LOG OUTBOUND). Carrier labels, rate shopping, and tracking numbers remain outside PMP OPS. If Bitrix or a third-party tool handles those, the handoff point is "SHIP says ready to ship; carrier tool takes over from there."

---

*End of Capability Map Overlay. Updated to reflect PACK CARD, LOG 2.0 (PRESS + OUTBOUND), and SHIP architecture. Use with `docs/INFORMATION-ARCHITECTURE.md` for structure and `docs/PLANT-FEEDBACK-SYNTHESIS.md` for source-of-truth options and roadmap context.*
