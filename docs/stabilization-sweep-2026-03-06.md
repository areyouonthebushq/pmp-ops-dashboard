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

## Confirmed Issues — Document Only (Not Fixed in This Pass)

### ISSUE 4 — P2: Dead `saveAssetsOverlay()` / `savePackCard()` / `closeAssetsOverlay()` functions

**File:** `render.js:1040–1081` (saveAssetsOverlay), `render.js:1226–1246` (savePackCard), `render.js:883–885` (closeAssetsOverlay)
**What:** These three functions are remnants of the old Save & Close / Cancel buttons. They are never called from any HTML or JS. `saveAssetsOverlay()` uses a different save API (`Storage.updateJobAssets`) than the current canonical save path (`Storage.saveJob` in `closeCardZone`).
**Risk:** Low — dead code, but could cause confusion if someone accidentally re-introduces a call. `saveAssetsOverlay` would use the wrong save API.
**Recommended fix:** Remove all three functions. Quick, safe, no dependencies.

### ISSUE 5 — P2: Dead `hideShipAchtungComposer` no-op stub + caller

**Files:** `app.js:2530` (stub), `render.js:1586` (caller)
**What:** The no-op stub and its single caller in `selectLogJob()` are harmless but dead code.
**Risk:** None. Two lines total.
**Recommended fix:** Remove both. Quick, safe.

### ISSUE 6 — P2: `sessionStorage.setItem('logMode', mode)` is dead code

**File:** `render.js:1564`
**What:** `setLogMode()` writes the current log mode to sessionStorage, but the variable initialization at `render.js:1525` is hardcoded `let logMode = 'ship'`. There's no corresponding `sessionStorage.getItem('logMode')` anywhere. The write does nothing useful.
**Risk:** None. Dead write.
**Recommended fix:** Either remove the write, or add the read at init. If the intent was to persist mode across page refreshes, add the read; otherwise remove the write.

### ISSUE 7 — P2: No "clear WRENCH" path from the WRENCH popup

**File:** `app.js:2449`
**What:** The WRENCH popup filters out the empty "— None" option from `CAUTION_REASONS`, so there's no way to clear an existing WRENCH from the popup. Clearing requires using the Floor Card dropdown (which includes the full reason list).
**Risk:** Low — operators can still clear WRENCH, just not from the RSP popup. This may be intentional (the popup is for *setting*, not *clearing*).
**Recommended fix:** Design decision. If clearing from RSP is wanted, add a "CLEAR" button to the popup rather than adding the empty option back to the dropdown.

### ISSUE 8 — P2: Purgatory doc incorrectly says `hideShipAchtungComposer` is called from `setLogMode`

**File:** `docs/purgatory-protocol.md`
**What:** The doc says "called from setLogMode cleanup path" but the actual call site is `selectLogJob` in `render.js:1586`.
**Risk:** None (doc-only).
**Recommended fix:** Correct the doc, or remove both the stub and caller (Issue 5).

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
| **Card Zone Save/Cancel removal** | Clean | No remnants in HTML. Dead functions remain in JS (Issue 4) |
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
