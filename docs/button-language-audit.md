# Button & Control Language Audit

**Scope:** Every clickable element in PMP OPS — buttons, icon controls, nav items, toggles, pills, row-level actions, overlay openers, mode switches, and utility controls.

**Method:** Exhaustive codebase search across `index.html`, `render.js`, `core.js`, `app.js`, `stations.js`, and `styles.css`. Approximately **225+ distinct interactive controls** identified.

---

## 1. Executive Summary

### Overall assessment
The button language is **more coherent than expected** for a codebase this large. A clear visual grammar has emerged organically — green for primary/commit, ghost for secondary/cancel, red for destructive, amber for warning/ACHTUNG, cyan for ship/pack late-stage actions. The LOG console is the most thoroughly designed control surface, with per-action color coding and a consistent enter-button chameleon pattern.

### Biggest strengths
1. **Commit/save buttons** are universally `btn go` (green) — no exceptions.
2. **Cancel/dismiss buttons** are universally `btn ghost` or close-icon variants — no exceptions.
3. **Nav items** consistently use `icon + WORD` format with green active state.
4. **LOG action buttons** have the strongest per-action color identity in the entire app.
5. **Keyboard shortcuts** cover all major overlay/close operations with Escape, and `+`/`=`/`N`/`F`/`/` provide fast-path access.

### Biggest inconsistencies
1. **Close buttons** have three unrelated visual treatments (bordered ghost → red hover, filled pill, invisible text-only).
2. **Ghost button hover** diverges: some ghost buttons go green on hover (`.bar-btn`), others stay neutral (`.btn.ghost`). This blurs the primary/secondary distinction.
3. **"+ ADD X" buttons** use inconsistent grammar across pages — `+ ADD JOB`, `+ ADD PERSON`, `+ ADD ENTRY`, `+ ADD COMPOUND`, `+ ADD NOTE` vs just `ADD` on the notes composer.
4. **EDIT buttons** appear in different forms: icon-only `+` in RSP header, text `EDIT` on crew rows, text `QUICK EDIT` on floor card.
5. **No `:focus` styles** on any button — accessibility gap.

---

## 2. Full Inventory

### 2.1 Login & Launcher

| Surface | Label | Type | Action | Role | Style |
|---------|-------|------|--------|------|-------|
| Login | **SIGN IN** | text | form submit | primary/commit | `auth-btn` (green) |
| Login | **GUEST DEMO · NO LOGIN REQUIRED** | text | `enterGuestDemo()` | secondary | `auth-ghost` (ghost) |
| Launcher | **⬡ Admin** | icon+text | `enterByLauncher('admin')` | nav | `launcher-btn admin` (green) |
| Launcher | **▶ Floor Manager** | icon+text | `enterByLauncher('floor_manager')` | nav | `launcher-btn fm` (neutral) |
| Launcher | **⬢ Press Station** | icon+text | `toggleLauncherPressPicker()` | nav | `launcher-btn press` (neutral) |
| Launcher | **Press 1** / **2** / **3** / **7"** | text | `enterByLauncher('press','pN')` | nav | `launcher-press-btn` |
| Launcher | **⚠ QC Station** | icon+text | `enterByLauncher('qc')` | nav | `launcher-btn qc` (amber) |
| Launcher | **OPEN** | text | `openLastLauncherChoice()` | primary | `btn-open` (green) |
| Launcher | **SIGN OUT** (×2) | text | `signOutFully()` | destructive/exit | `btn-signout` (muted ghost) |

### 2.2 Top Bar

| Label | Type | Action | Role | Style |
|-------|------|--------|------|-------|
| **PMP·OPS** (logo) | text/clickable | `enterTV()` | nav shortcut | `bar-logo` |
| **MIN** | text | `toggleMinimalTheme()` | toggle | `bar-btn` |
| **⬛ TV** | icon+text | `enterTV()` | nav | `bar-btn` (hidden) |
| **QC** | text | `openQCStation()` | nav | `bar-btn` (hidden) |
| **↓ CSV** | icon+text | `exportCSV()` | export | `bar-btn` |
| **💾 BACKUP** | icon+text | `exportBackup()` | export | `bar-btn` (hidden) |
| **EXIT** | text | `doLogout()` | destructive/exit | `bar-btn warn` (red hover) |

### 2.3 Navigation Bar

| Label | Type | Action | Active Style |
|-------|------|--------|-------------|
| **⬡ FLOOR** | icon+text | `goPg('floor')` | green text + green underline |
| **▶ JOBS** | icon+text | `goPg('jobs')` | same |
| **✓ TODOS** | icon+text | `goPg('todos')` | same (hidden) |
| **⬡ LOG** | icon+text | `goPg('log')` | same |
| **◈ ENGINE** | icon+text | `goPg('engine')` | same |
| **◇ NOTES** | icon+text | `goPg('notes')` | same |
| **◇ SHIP** | icon+text | `goPg('ship')` | same |
| **◉ CREW** | icon+text | `goPg('crew')` | same |
| **◌ PVC** | icon+text | `goPg('compounds')` | same |
| **▣ AUDIT** | icon+text | `goPg('audit')` | same (hidden) |
| **♛ DEV** | icon+text | `goPg('dev')` | same (hidden) |

### 2.4 Floor Page

| Label | Type | Action | Role |
|-------|------|--------|------|
| **+ ADD JOB** | text | `openNewJobChooser()` | add/create |
| Stat blocks (PRESSES, ACTIVE, QUEUED, etc.) | text | `setFloorStatFilter('key')` | filter toggle |
| **clear** | text (underline) | `setFloorStatFilter(null)` | filter clear |
| Sortable column headers | text | `setFloorSort('key')` | sort toggle |
| Table row cells (catalog, artist, status) | text | `openPanel(id)` | panel opener |
| Press card name | text | `openPressStation(id)` | station opener |
| Press card job link | text | `openPanel(id)` / `openFloorCard(id)` | panel/card opener |
| Press card progress bar | text | `openProgressDetail(id)` | overlay opener |
| Press card assets bar | text | `openCardZone(id,'asset')` | card zone opener |
| Press card assign dropdown | select | `assignJob(pid, value)` | state change |
| Press card on-deck dropdown | select | `setPressOnDeck(pid, value)` | state change |
| Press card status dropdown | select | `setPressStatus(pid, value)` | state change |
| On-deck **↑** arrow | icon | `sendOnDeckToPress(id)` | state change |
| Recently completed **VIEW** | text | `openPanel(id)` | panel opener |
| ⚠ caution icon | icon | `goToNotesWithFilter(id)` | route to NOTES |

### 2.5 Jobs Page

| Label | Type | Action | Role |
|-------|------|--------|------|
| Filter dropdown (ALL JOBS, PRESSING, etc., **⚠ ACHTUNG**) | select | `renderJobs()` | filter |
| **+ ADD JOB** | text | `openNewJobChooser()` | add/create |
| **↑ IMPORT CSV** | icon+text (label) | triggers file input | import |
| Sortable column headers | text | `setJobsSort('key')` | sort toggle |
| Table row cells (catalog, artist, album) | text | `openPanel(id)` | panel opener |
| Assets column tap | text | `openCardZone(id,'asset')` | card zone opener |
| Packing column tap | text | `openCardZone(id,'pack')` | card zone opener |
| Job card (mobile) | card | `openPanel(id)` | panel opener |
| ⚠ cautionPill | icon+text | `goToNotesWithFilter(id)` | route to NOTES |

### 2.6 LOG Page

| Label | Type | Action | Role |
|-------|------|--------|------|
| **◉ PRESS** | icon+text | `setLogMode('press')` | mode toggle |
| **◇ SHIP** | icon+text | `setLogMode('ship')` | mode toggle |
| **⚠** (ACHTUNG ctrl) | icon | `toggleShipAchtung()` | ACHTUNG trigger/route |
| ACHTUNG composer input | text input | Enter → `confirmShipAchtung()` | inline composer |
| **⚠ FLAG** | icon+text | `confirmShipAchtung()` | commit ACHTUNG |
| **✕** (ACHTUNG cancel) | icon | `cancelShipAchtung()` | dismiss |
| **PRESS** / **PACKED** | text | `setLogAction('press')` / `setLogAction('packed')` | action select |
| **PASS** / **READY** | text | `setLogAction('qc_pass')` / `setLogAction('ready')` | action select |
| **REJECT** / **QUACK** (duck icon) | text/icon | `setLogAction('qc_reject')` / `setLogAction('shipped')` | action select |
| Numpad **0–9** | text | `logNumpadTap('N')` | quantity input |
| **C** (clear) | text | `logNumpadClear()` | numpad clear |
| **←** (back) | icon | `logNumpadBack()` | numpad backspace |
| **LOG [ACTION]** (enter btn) | text | `unifiedLogEnter()` | commit event |
| Reject picker types (FLASH, BLEMISH, etc.) | icon+text | `unifiedLogRejectWithDefect('type')` | defect select |
| **CANCEL** (reject picker) | text | `unifiedLogHideRejectPicker()` | dismiss |
| **◂ PREV** / **NEXT ▸** / **TODAY** | icon+text / text | `logDateStep()` / `logDateToday()` | date nav |
| Job picker chips | text | `selectLogJob(id)` | job select |
| Feed entries (asset_note) | text | `goToNotesWithFilter(id, key)` | route to NOTES |

### 2.7 ENGINE Page

| Label | Type | Action | Role |
|-------|------|--------|------|
| Metric blocks (QPM, PRESSED, etc.) | text | `openEngineDetail('key')` | detail opener |
| Period strip (1H, 1D, 1W, 1M, 1Y, YTD, ALL) | text | `setEnginePeriod('p')` | toggle |
| Chart period strip (1W, 2W, 1M, etc.) | text | `setEngChartPeriod('p')` | toggle |
| Compare toggles | text | `toggleEngCompare('k')` | overlay toggle |
| **✕** (detail close) | icon | `closeEngineDetail()` | dismiss |

### 2.8 NOTES Page

| Label | Type | Action | Role |
|-------|------|--------|------|
| Job select dropdown | select | `renderNotesPage()` | filter |
| **+** (add note) | icon | `toggleNotesUtility('add')` | utility toggle |
| **⌕** (search) | icon | `toggleNotesUtility('search')` | utility toggle |
| **📎** (attach) | icon | triggers file input | file action |
| **ADD** | text | `addNoteFromNotesPage()` | commit |
| **SEARCH** | text | `notesSearchAction()` | action |
| **CLEAR** (asset filter) | text | `clearNotesAssetFilter()` | filter clear |
| Note image thumbnails | image | `openPoImageLightbox(src)` | lightbox opener |

### 2.9 SHIP Page

| Label | Type | Action | Role |
|-------|------|--------|------|
| Filter dropdown (ALL LATE-STAGE, etc.) | select | `renderShip()` | filter |
| Table row catalog/artist cells | text | `openPanel(id)` | panel opener |
| Fulfillment phase dropdown | select | `setFulfillmentPhase(id, value)` | state change |
| **+ NOTE** (with count) | icon+text | `goToNotesAndOpenAdd(id)` | route to NOTES |
| **OPEN** | text | `openPanel(id)` | panel opener |
| ⚠ cautionPill | icon+text | `goToNotesWithFilter(id)` | route to NOTES |

### 2.10 CREW Page

| Label | Type | Action | Role |
|-------|------|--------|------|
| **+ ADD PERSON** | text | `openEmployeeWizard()` | add/create |
| **↑ IMPORT CSV** (crew) | icon+text (label) | triggers file input | import |
| **↑ IMPORT CSV** (schedule) | icon+text (label) | triggers file input | import |
| **+ ADD ENTRY** | text | `openScheduleEntryWizard()` | add/create |
| Sortable column headers (NAME, ROLE, etc.) | text | `setCrewSort('key')` | sort toggle |
| PFP thumbnail | image | `crewThumbClick(id)` | lightbox/upload |
| **EDIT** (crew row) | text | `editEmployee(id)` | edit opener |
| **EDIT** (schedule row) | text | `editScheduleEntry(id)` | edit opener |

### 2.11 PVC (Compounds) Page

| Label | Type | Action | Role |
|-------|------|--------|------|
| **+ ADD COMPOUND** | text | `openCompoundWizard()` | add/create |
| **↑ IMPORT CSV** | icon+text (label) | triggers file input | import |
| Compound card | card | `editCompound(id)` | edit opener |
| Compound thumbnail | image | `pvcThumbClick(id)` | lightbox/upload |

### 2.12 Slide Panel (RSP)

| Label | Type | Action | Role |
|-------|------|--------|------|
| **☆** (PO star) | icon | `panelPoStarClick()` | lightbox/upload |
| **⚠** (ACHTUNG) | icon | `togglePanelCaution()` | ACHTUNG drawer |
| **+** (edit toggle) | icon | `setPanelEditMode()` | mode toggle |
| **✕** (close) | icon | `closePanel()` | dismiss |
| **Refresh view** (data changed) | text | `dismissDataChangedNotice()` | action |
| **Apply** (status suggestion) | text | `applySuggestedStatus(id)` | action shortcut |
| **Upload image** / **Replace** / **Remove** | text | file input / `removePoImage()` | file actions |
| PO image preview | image | `openPoImageLightbox(src)` | lightbox opener |
| **CANCEL** | text | `closePanel()` | dismiss |
| **ARCHIVE** | text | `archiveJob()` | state change |
| **RESTORE** | text | `restoreJob()` | state change |
| **DELETE JOB** | text | `confirmDel()` | destructive |
| **SAVE JOB** | text | `saveJob()` | primary/commit |

### 2.13 Card Zone (Asset + Pack)

| Label | Type | Action | Role |
|-------|------|--------|------|
| **ASSET CARD** / **PACK CARD** tabs | text | `switchCardZoneFace('face')` | face toggle |
| **✕** (close) | icon | `closeCardZone()` | dismiss |
| Asset row status cycle | icon | `cycleAssetsOverlayStatus('key')` | state cycle |
| **+** (asset note) | icon | `openAssetNoteComposer(id, key)` | composer opener |
| **⌕** (view notes) | icon | `goToNotesWithFilter(id, key)` | route to NOTES |
| **ADD** (asset note composer) | text | `submitAssetNoteFromOverlay()` | commit |
| Pack row status cycle | icon | `cyclePackStatus('key')` | state cycle |
| Pack row expand arrow **▸** / **▾** | icon | `togglePackDetail('key')` | detail toggle |
| **⌕** (pack notes) | icon | `goToNotesWithFilter(id)` | route to NOTES |
| **◇ NOTES** (pack header) | icon+text | `goToNotesFromPackCard()` | route to NOTES |
| **SAVE & CLOSE** (asset) | text | `saveAssetsOverlay()` | primary/commit |
| **SAVE & CLOSE** (pack) | text | `savePackCard()` | primary/commit |
| **+ ADD NOTE** (pack) | text | `addNoteFromPackCard()` | action |
| **CANCEL** (asset/pack) | text | `closeCardZone()` | dismiss |

### 2.14 Overlays & Modals

| Surface | Label | Type | Action | Role |
|---------|-------|------|--------|------|
| Floor Card | **QUICK EDIT** | text | `toggleFloorCardEdit()` | mode toggle |
| Floor Card | **SAVE** / **CANCEL** | text | save / toggle | commit / dismiss |
| Floor Card | **✕** | icon | `closeFloorCard()` | dismiss |
| Progress Detail | **✕** | icon | `closeProgressDetail()` | dismiss |
| Confirm Dialog | **CANCEL** / **CONFIRM** | text | close / callback | dismiss / destructive |
| New Job Chooser | **Manual Entry** | text | `openWizard()` | primary |
| New Job Chooser | **Import CSV** / **Photo** / **PDF** | text | trigger file input | secondary |
| New Job Chooser | **✕** | icon | `closeNewJobChooser()` | dismiss |
| Import Review | **CANCEL** / **CREATE JOBS (N rows)** | text | close / confirm | dismiss / commit |
| Import Review | **✕** | icon | `closeImportReview()` | dismiss |
| Job Wizard | **Cancel** / **Back** / **Next** / **Save Job** | text | nav / commit | various |
| Job Wizard | **✕** | icon | `closeWizard()` | dismiss |
| Duplicate Modal | **Open Existing Job** / **Create Anyway** / **Cancel** | text | panel / save / close | various |
| Wizards (Employee, Schedule, Compound) | **Cancel** / **Add** or **Save** | text | close / commit | dismiss / commit |
| Wizards | **✕** | icon | close handler | dismiss |
| Image Lightbox | **×** (close) | icon | `closePoImageLightbox()` | dismiss |
| Image Lightbox | **Replace** | text | triggers file input | file action |

### 2.15 Station Shells

| Surface | Label | Type | Action | Role |
|---------|-------|------|--------|------|
| Press Station | **← BACK** | icon+text | `exitPressStation()` | exit/nav |
| Press Station | Numpad (0–9, C, ←) | text/icon | digit/clear/back | quantity input |
| Press Station | Presets (25, 50, 100) | text | set value | shortcut |
| Press Station | **LOG PRESSED** | text | `psNumpadSubmit()` | commit event |
| Press Station | **Hold** / **Resume** | text | state change | toggle |
| Press Station | **Save Note** | text | save | commit |
| QC Station | **← BACK** | icon+text | `exitQCStation()` | exit/nav |
| QC Station | Job buttons | text | `selectQCJob(id)` | job select |
| QC Station | Reject type buttons | icon+text | `qcStationLogReject(type)` | commit event |
| Floor Manager | **← BACK** | icon+text | `exitFloorManager()` | exit/nav |

### 2.16 Global / Utility

| Label | Type | Action | Role |
|-------|------|--------|------|
| **+** (FAB) | icon | `fabAction()` | contextual add |
| **FULLSCREEN** | text | `toggleFullscreen()` | toggle |
| **UNDO** (toast) | text | undo callback | undo |
| Escape key | keyboard | closes topmost overlay/panel/station | dismiss |
| **F** key | keyboard | `toggleFullscreen()` | toggle |
| **+** key | keyboard | contextual add/note | add shortcut |
| **=** key | keyboard | focus search / toggle notes search | search shortcut |
| **N** key | keyboard | `openNewJobChooser()` | add shortcut |
| **/** key | keyboard | focus search input | search shortcut |
| **1–6** keys | keyboard | `logQC(type)` on QC page | QC logging |
| All backdrop overlays | click | close handler | dismiss |

---

## 3. Taxonomy

### 3.1 Page Navigation (11 controls)
Nav bar items (`goPg`), station launcher buttons, station exit/back buttons.

### 3.2 Overlay / Card / Panel Entry (~30 controls)
`openPanel`, `openFloorCard`, `openCardZone`, `openProgressDetail`, `openEngineDetail`, `openPoImageLightbox`, `openNewJobChooser`, `openWizard`, `openEmployeeWizard`, `openScheduleEntryWizard`, `openCompoundWizard`. Triggered by row clicks, tap columns, icon buttons, and dedicated open buttons.

### 3.3 Commit / Save (~12 controls)
`SAVE JOB`, `SAVE & CLOSE` (×2), `SAVE` (floor card), `Save Job` (wizard), `ADD` (notes, asset note, dev), `ADD NOTE` (pack card), `⚠ FLAG` (ACHTUNG), `LOG [ACTION]` (log enter), `CREATE JOBS` (import review), wizard `Add`/`Save` buttons.

### 3.4 Logging / Count Events (~15 controls)
LOG action buttons (PRESS, PASS, REJECT, PACKED, READY, QUACK), numpad, enter button, reject defect picker, station log buttons, QC reject buttons.

### 3.5 State Toggles (~20 controls)
Status cycle buttons (asset, pack), ACHTUNG toggle, fulfillment phase dropdowns, press status/assignment dropdowns, archive/restore, hold/resume, suggested status apply.

### 3.6 Mode / Face Toggles (~10 controls)
LOG mode toggle (PRESS/SHIP), Card Zone tabs (ASSET CARD/PACK CARD), edit mode toggle, QUICK EDIT toggle, minimal theme toggle, PIZZAZ toggle, TV enter/exit.

### 3.7 Routing Shortcuts (~15 controls)
`goToNotesWithFilter` (from ⚠ icons, ⌕ buttons, feed entries), `goToNotesAndOpenAdd` (+ NOTE on SHIP), `goToNotesFromPackCard`, `openNotesForCurrentJob`.

### 3.8 Dismiss / Close / Cancel (~25 controls)
**✕** icon buttons on every overlay/panel/wizard, **CANCEL** text buttons, backdrop dismiss on overlays, Escape key handler, reject picker cancel.

### 3.9 Filter / Sort (~20 controls)
Search inputs (floor, jobs, ship, crew, FM), filter dropdowns (jobs, ship), stat filter cards (floor), sortable column headers (floor, jobs, crew), notes job select, notes asset filter clear.

### 3.10 Import / Export (~10 controls)
CSV import labels (jobs, crew, schedule, PVC), CSV export button, backup export, import review confirm.

### 3.11 File / Proof Launch (~10 controls)
PO image upload/replace/remove, compound image upload, crew photo upload, notes attachment, lightbox open (from images, thumbnails, PO preview).

### 3.12 Add / Create (~8 controls)
`+ ADD JOB` (×2), `+ ADD PERSON`, `+ ADD ENTRY`, `+ ADD COMPOUND`, FAB `+`, `+ ADD NOTE`, `Manual Entry` in job chooser.

### 3.13 Destructive (~4 controls)
`DELETE JOB`, confirm dialog `CONFIRM`, `EXIT` (bar), `SIGN OUT`.

---

## 4. Label / Language Audit

### Verb-first labels (strong)
`SAVE JOB`, `SAVE & CLOSE`, `DELETE JOB`, `SIGN IN`, `SIGN OUT`, `QUICK EDIT`, `LOAD`, `EXPORT`, `SEARCH`, `CANCEL`, `CONFIRM`.

### Noun/destination labels
`FLOOR`, `JOBS`, `LOG`, `ENGINE`, `NOTES`, `SHIP`, `CREW`, `PVC`, `AUDIT`, `DEV`, `ASSET CARD`, `PACK CARD`, `Manual Entry`.

### Ambiguous or weak labels
| Label | Issue | Suggestion |
|-------|-------|------------|
| **+** (RSP edit toggle) | `+` is the edit mode toggle, but `+` universally means "add" | Consider a different icon (pencil, ✎) |
| **ADD** (notes, asset note, dev) | Verb only, no object — "Add what?" | Acceptable in context but weaker than `SAVE JOB` |
| **OPEN** (SHIP table) | What does it open? Implicit "panel" | Acceptable — brief enough for table context |
| **Apply** (status suggestion) | Apply what? Implicit "suggested status" | Fine in its local context |
| **VIEW** (recently completed) | Generic — every row is a "view" | Works as a brief action in a list |
| **Replace** / **Remove** (PO image) | Lowercase, inconsistent with ALL-CAPS convention elsewhere | Should be **REPLACE** / **REMOVE** |
| **clear** (floor filter) | Lowercase, no border — subtle | Intentionally subtle? |

### Consistent patterns (good)
- `+ ADD [OBJECT]` — used for all creation buttons on data pages.
- `↑ IMPORT CSV` — used for all CSV import labels.
- `← BACK` — used for all station exits.
- `SAVE & CLOSE` — used for both card zone commit actions.
- `CANCEL` — universal dismiss word.

### Drifting patterns
| Pattern A | Pattern B | Where |
|-----------|-----------|-------|
| `SAVE JOB` (panel) | `Save Job` (wizard final step) | Case inconsistency |
| `Add` / `Save` (wizard new vs edit) | `Add Compound` / `Save` (compound wizard) | Mixed case, mixed formats |
| `+ ADD NOTE` (pack card) | `+ NOTE` (SHIP table) | Inconsistent: one is "add note", the other is "+ NOTE" |
| `ADD` (notes composer) | `ADD` (asset note composer) | Consistent with each other, but weaker than `SAVE` or `SEND` |
| `EDIT` (crew row) | `+` (RSP edit toggle) | Two different edit entry points with completely different labels |
| `Manual Entry` (job chooser) | `+ ADD JOB` (page toolbar) | Two paths to the same destination with different labels |

---

## 5. Icon Audit

### Icons used consistently

| Icon | Meaning | Surfaces | Consistent? |
|------|---------|----------|-------------|
| **✕** | Close/dismiss | Every overlay, panel, wizard, modal | Yes — universal |
| **⚠** | ACHTUNG signal | Floor, Jobs, SHIP, RSP, LOG, Cards | Yes — always amber |
| **⌕** | View in NOTES | Asset Card, Pack Card | Yes — always routes to NOTES |
| **+** | Add (FAB, asset note) | FAB, asset row | Mostly — but also edit-toggle in RSP |
| **←** | Back/exit | Station shells, numpad | Yes |
| **☆** / **★** | PO star (has/needs image) | RSP header | Yes — toggles fill state |
| **↑** | Import/upload | CSV import labels | Yes |
| **↓** | Export/download | CSV export button | Yes |
| **◂** / **▸** | Date navigation prev/next | LOG date controls | Yes |
| **▾** / **▸** | Expand/collapse | Pack Card detail rows | Yes |

### Icons with overloaded meanings

| Icon | Meaning 1 | Meaning 2 | Issue |
|------|-----------|-----------|-------|
| **+** | Add new item (FAB, create buttons) | Toggle edit mode (RSP) | Moderate confusion — `+` in the RSP icon zone means "edit", not "add" |
| **◇** | Nav icon for NOTES, SHIP | "Go to NOTES" button in Pack Card | Minor — slightly overloaded between nav and routing |
| **⬡** | Nav icon for FLOOR | Nav icon for LOG | Same icon for two different pages |

### Custom icon language

| Icon | Name | Where |
|------|------|-------|
| Duck head SVG | QUACK | LOG SHIP mode action button |
| Geometric shapes (⬡, ▶, ◈, ◇, ◉, ◌, ▣, ♛) | Nav icons | Navigation bar |

The geometric nav icon system is internally coherent — each page has a distinct shape. The shapes don't carry semantic meaning (they're identity marks, not functional indicators), which is intentional.

---

## 6. Placement / Hierarchy Audit

### Primary action placement
- **Panel footer:** `SAVE JOB` is always rightmost — correct.
- **Card Zone footer:** `SAVE & CLOSE` is leftmost — inverted from panel convention.
- **Wizard footer:** `Next` / `Save Job` rightmost — correct.
- **Import Review footer:** `CREATE JOBS` rightmost — correct.
- **Floor Card:** `SAVE` leftmost — inverted from panel convention.
- **LOG:** Enter button spans the bottom row — clear primary.

**Inconsistency:** Card Zone and Floor Card place primary on the left; Panel and Wizard place primary on the right. Recommendation: standardize to right-aligned primary.

### Secondary action placement
- **CANCEL** is consistently left of primary — correct.
- **`+ ADD NOTE`** in Pack Card footer sits between SAVE and CANCEL — unusual third position.

### Icon zone hierarchy (RSP)
The RSP header has four icon buttons: **☆ ⚠ + ✕** — reading left to right. This places the PO image action first, ACHTUNG second, edit third, close last. The close button being rightmost is correct. The order of the other three is somewhat arbitrary.

### Object click vs dedicated buttons
- **Jobs table:** Row cells are clickable (open panel) AND there's an `OPEN` button on SHIP table rows — inconsistent. Jobs table relies on implicit row click; SHIP adds an explicit button.
- **Floor table:** Row cells open panel — consistent with Jobs.
- **Crew table:** Row PFP is clickable (lightbox), plus an explicit `EDIT` button — clean separation.

### Potentially redundant controls
| Control A | Control B | Issue |
|-----------|-----------|-------|
| `+ ADD JOB` on Floor | `+ ADD JOB` on Jobs | Same button on two pages — intentional, provides access from either context |
| `FAB (+)` | `+ ADD JOB` on toolbar | FAB duplicates the toolbar button — FAB is mobile convenience |
| `openPanel` via row click | `OPEN` button on SHIP | SHIP adds explicit button because row has other interactive cells |
| `EXIT` on top bar | `SIGN OUT` on launcher | Different actions — EXIT returns to launcher, SIGN OUT clears session |

---

## 7. Color / Style Role Audit

### Token → Role mapping

| Color Token | Semantic Role | Used By |
|-------------|--------------|---------|
| `--g` (green) | Primary action / commit / online / active | `btn go`, nav `.on`, FAB, status "go", edit active |
| `--w` (amber) | Warning / ACHTUNG / press mode | Caution pills, ACHTUNG controls, LOG press mode, data-changed notice |
| `--r` (red) | Destructive / reject / offline / blocked | `btn del`, close hover, LOG reject, press offline |
| `--cy` (cyan) | Late-stage / ship / pack | LOG SHIP mode, pack card primary, Card Zone pack tab |
| `--d2` / `--d3` (muted) | Secondary / neutral / ghost | `btn ghost`, `bar-btn` resting, muted icons |
| `--b2` / `--b4` (border) | Structural / inactive | Ghost borders, filled close buttons |

### Consistent color roles (strong)
1. **Green for go/commit** — universally applied. No false greens.
2. **Red for destructive** — `btn del`, close-button hover, reject actions. Clean.
3. **Amber for ACHTUNG/warning** — caution pills, ACHTUNG controls, press mode. Clean.
4. **Cyan for ship/pack** — LOG SHIP mode, pack card accents. Clean.

### Muddy color roles
1. **Ghost hover divergence:** `.bar-btn:hover` goes green (making secondary look primary); `.btn.ghost:hover` stays neutral. The bar-btn green-hover blurs the hierarchy.
2. **Filled green outliers:** `.floor-card-quick-edit` and `.fab` are always-filled green, unlike the standard dark-green-resting pattern. Not wrong, but different.
3. **Raw hex vs tokens:** ACHTUNG styles sometimes use raw `#ffb300` and `rgba(255,179,0,...)` instead of `var(--w)`. Same visual, but inconsistent authoring.
4. **Close button backgrounds:** Some close buttons are ghost (`.panel-close`), some are filled (`.cz-close`, `.floor-card-close`), some are invisible (`.eng-detail-close`). No clear rule.

---

## 8. Exceptions

### Intentional exceptions (keep)
1. **LOG enter-button chameleon** — changes color to match selected action. This is deliberate and excellent UX.
2. **FAB always-filled green** — mobile FAB convention demands high visibility.
3. **QC numpad 2px borders** — intentional emphasis for large touch targets on factory floor.
4. **PIZZAZ button pulse animation** — intentional show/party mode treatment.
5. **Stat blocks as buttons** — Floor stat cards double as filter toggles, which is useful and well-understood.
6. **Row cells as panel openers** — implicit click-to-open on table rows is standard and efficient.

### Accidental inconsistencies (normalize)
1. **Close button visual treatment** — three patterns where one should suffice.
2. **Ghost hover green vs neutral** — should pick one rule.
3. **Lowercase labels** (`clear`, `Replace`, `Remove`) — should follow the ALL-CAPS convention.
4. **Primary button placement** — left vs right across surfaces.
5. **`+` icon dual meaning** — add vs edit in RSP.
6. **Card Zone SAVE & CLOSE on left** — inverted from panel convention.
7. **No `:focus` styles** — accessibility gap on all buttons.

---

## 9. Preliminary Rule Extraction

Based on the audit, these rules are already emerging and should be codified:

### Button hierarchy
1. **Primary** = `btn go` (dark green resting → filled green hover). One per action group.
2. **Secondary** = `btn ghost` (transparent, muted border/text). Cancel, back, alternatives.
3. **Destructive** = `btn del` (transparent, red border/text → dark red fill on hover). Delete, confirm-destructive.
4. **Icon buttons** = 28–36px square, `panel-close` pattern. Close, toggle, route.

### Label grammar
1. **Commit buttons** use `VERB` + `OBJECT`: SAVE JOB, SAVE & CLOSE, DELETE JOB, CREATE JOBS.
2. **Add buttons** use `+ ADD [OBJECT]`: + ADD JOB, + ADD PERSON, + ADD COMPOUND, + ADD NOTE.
3. **Cancel buttons** say `CANCEL`.
4. **Navigation** uses `ICON WORD` format: ⬡ FLOOR, ▶ JOBS, etc.
5. **Station exit** uses `← BACK`.
6. **Close** uses icon-only `✕`.
7. **All user-facing labels** should be ALL-CAPS (exceptions: wizard step buttons currently use Title Case).

### Color grammar
1. **Green** = commit / active / online / go.
2. **Amber** = warning / ACHTUNG / press-mode.
3. **Red** = destructive / reject / offline.
4. **Cyan** = ship / pack / late-stage.
5. **Neutral/ghost** = secondary / dismiss / cancel.

### Placement grammar
1. **Primary right, secondary left** in action rows (panel footer is reference).
2. **Close `✕` rightmost** in header icon zones.
3. **Search left, add right** in page toolbars.

### Close grammar
1. **`✕`** for overlay/panel/wizard close.
2. **Backdrop click** dismisses overlays.
3. **Escape** dismisses topmost layer.
4. All three mechanisms should exist for every closeable surface.

---

## 10. Known Docs Impact

The following docs should be updated once button/control language is normalized:

| Document | Why |
|----------|-----|
| `docs/achtung-protocol.md` | References button labels in trigger surfaces section |
| `docs/INFORMATION-ARCHITECTURE.md` | Entry/exit points section references control labels |
| `docs/STYLE-NORMALIZATION-PLAN.md` | Should incorporate button hierarchy and color role rules |
| `docs/engine-language-guide.md` | ENGINE block click behavior and chart controls |
| `docs/INTERACTION-CONSISTENCY-AUDIT.md` | Existing audit — should cross-reference this one |
| `docs/MICROCOPY-AUDIT.md` | Button labels are a subset of microcopy |

### Recommended new doc
A `docs/button-language-rules.md` or `docs/control-grammar.md` could codify the rules in Section 9 as a design-system reference for future builders.
