# Stabilization Sweep — 2026-03-06

Post-change-cluster bug bash covering: Press Station purge, SHIP page purge, Card Zone cohesion, Card ACHTUNG popup, RSP WRENCH rename/taxonomy/notes, save-integrity repairs, localStorage trust guard, image pipeline Phase 1–3, keyboard blocking-surface guard, LOG button mode-color, preflight syntax guard, wrench icon conversion.

---

## Fixes Applied During This Sweep

### FIX 1 — P0: `poImageLightbox` guard permanently disabling keyboard shortcuts

**File:** `app.js:4401`
**Symptom:** After opening the PO image lightbox even once, ALL keyboard shortcuts (`F` fullscreen, `+` notes, `=` search, `N` new job) permanently stop working for the rest of the session.
**Root cause:** `isBlockingSurfaceOpen()` checked `document.getElementById('poImageLightbox')` — testing for element existence. The lightbox DOM node is created on first open and never removed, only toggled via `open` class. After first use, the node persists, so the guard always returned `true`.
**Fix:** Changed to `has('poImageLightbox', 'open')` — matches every other guard in the function.
**Risk:** None. Exact same pattern used by all other overlay guards.

### FIX 2 — P1: `floorCardOverlay` missing from `isBlockingSurfaceOpen()`

**File:** `app.js:4388`
**Symptom:** Keyboard shortcuts (`F`, `+`, `N`, etc.) fire through the Floor Card overlay when it's open.
**Root cause:** The Floor Card overlay was never added to the blocking-surface list when the guard was created.
**Fix:** Added `has('floorCardOverlay')` to the guard. Uses `'on'` class (default), matching the actual open/close behavior.
**Risk:** None.

### FIX 3 — P2: Dead `logAchtungCtrl` DOM lookup

**File:** `render.js:1856–1857`
**Symptom:** No user-visible issue. Dead code looking up a purged element.
**Root cause:** The `logAchtungCtrl` button was removed during the ship-achtung composer purge, but the null-checked lookup in `renderLog()` remained.
**Fix:** Removed the two dead lines.
**Risk:** None.

---

## Fixes Applied — Issues 4–8 (Second Pass)

### FIX 4 — P2: Dead `saveAssetsOverlay()` / `savePackCard()` / `closeAssetsOverlay()` removed

**File:** `render.js`
**Fix:** Removed `closeAssetsOverlay()` (was ~883–885), `saveAssetsOverlay()` (was ~1040–1081), and `savePackCard()` (was ~1226–1246). No callers; dead code only.

### FIX 5 — P2: Dead `hideShipAchtungComposer` stub + caller removed

**Files:** `app.js`, `render.js`
**Fix:** Removed the no-op `hideShipAchtungComposer()` stub from app.js and the single call in `selectLogJob()` in render.js.

### FIX 6 — P2: `logMode` sessionStorage read at init

**File:** `render.js`
**Fix:** Initialization now reads `sessionStorage.getItem('logMode') || 'ship'` (with try/catch), so the existing `setLogMode()` write persists mode across refreshes.

### FIX 7 — P2: Clear WRENCH from RSP popup

**File:** `app.js`
**Fix:** WRENCH popup now includes full `CAUTION_REASONS` (including "— None"). Submitting with "— None" calls `setCaution(jobId, '', '')` to clear. Subtitle updated to "or choose — None to clear".

### FIX 8 — P2: Purgatory doc corrected

**File:** `docs/purgatory-protocol.md`
**Fix:** SHIP ledger entry updated: "hideShipAchtungComposer() stub removed 2026-03-06 (was called from selectLogJob in render.js)".

---

## Areas Confirmed Clean

| Area | Status | Notes |
|------|--------|-------|
| **RSP open/close/edit** | Clean | `panelEditToggle()` correctly saves via `saveJob()` on second `+` click |
| **RSP WRENCH set/popup/submit** | Clean | Popup opens, submits, closes panel, routes to NOTES correctly |
| **RSP icon zone — no stale ACHTUNG** | Clean | All RSP strings use "WRENCH" consistently |
| **RSP panelCautionBtn** | Clean | Uses inline SVG wrench, not emoji |
| **Card Zone RECEIVING/PACKING toggle** | Clean | Labels correct, shell min-height 420px shared, PACKING has cyan identity |
| **Card Zone close-save** | Clean | `closeCardZone()` persists both asset and pack data via `Storage.saveJob` |
| **Card Zone Save/Cancel removal** | Clean | No remnants in HTML or JS (dead functions removed in FIX 4) |
| **Card ACHTUNG popup 1.5s delay** | Clean | Both `cycleAssetsOverlayStatus` and `cyclePackStatus` use `stampedAt` guard |
| **Card ACHTUNG stale-popup cancel** | Clean | Guards compare `cautionSince !== stampedAt` before opening |
| **NOTES — wrench fields in both loops** | Clean | Both single-job and all-jobs entry loops pass `wrenchReason`/`wrenchLabel` |
| **NOTES — wrenchHtml uses SVG icon** | Clean | Uses `WRENCH_ICON` constant, not emoji |
| **NOTES — search includes wrenchLabel** | Clean | Added to haystack |
| **LOG mode behavior** | Clean | `logMode = 'ship'` is intentional LOG OUTBOUND mode, not the purged page |
| **LOG — no stale SHIP page refs** | Clean | No `renderShip`, no ship-page DOM lookups |
| **LOG — no stale Press Station refs** | Clean | No `openPressStation`, no station shell lookups |
| **LOG console rail percentages** | Clean | `shipped` uses `ordered` as denominator |
| **Keyboard — cardAchtungPopup in guard** | Clean | Uses `has('cardAchtungPopup', 'open')` |
| **Keyboard — cautionPopup in guard** | Clean | Uses `has('cautionPopup', 'open')` |
| **Keyboard — Escape behavior** | Clean | All popups/overlays handle Escape |
| **Purge — Press Station** | Clean | No P0/P1 stale references. Only purgatory comments remain |
| **Purge — SHIP page** | Clean | No P0/P1 stale references. Only purgatory comments remain |
| **logConsoleRailHTML shipped case** | Clean | `num = shipped + pickedUp`, `denom = ordered` |

---

## Recommended Fix Order

1. ~~**FIX 1** — P0 lightbox keyboard guard~~ ✅ Applied
2. ~~**FIX 2** — P1 floor card keyboard guard~~ ✅ Applied
3. ~~**FIX 3** — P2 dead logAchtungCtrl lookup~~ ✅ Applied
4. **ISSUE 4** — Remove dead Card Zone save functions (next cleanup pass)
5. **ISSUE 5** — Remove `hideShipAchtungComposer` stub + caller (next cleanup pass)
6. **ISSUE 6** — Remove or complete `sessionStorage` logMode persistence (next cleanup pass)
7. **ISSUE 7** — Design decision on WRENCH clear path (defer to product)
8. **ISSUE 8** — Fix purgatory doc caller reference (trivial, bundle with Issue 5)

---

## Highest-Risk Remaining Seam

**The `po-upload-prompt` guard** in `isBlockingSurfaceOpen()` uses `document.querySelector('.po-upload-prompt')` — a class-based existence check. If the upload prompt element is created and not removed (similar to the lightbox bug), this could also permanently disable shortcuts. The current implementation appears to remove the element on close (`el.remove()` in `closePoUploadPrompt`), so it's safe for now, but it's the only guard not using the `has(id, cls)` pattern and should be watched.
