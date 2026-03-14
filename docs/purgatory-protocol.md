# Purgatory Protocol

**Date**: 2026-03-06
**Type**: Doctrine
**Status**: Active

---

## What This Is

A decommissioning protocol for PMP OPS. When a surface, flow, or component is tabled — not needed now, but not obviously dead forever — it goes to **purgatory**. Purgatory is a defined state, not a vague limbo.

---

## Vocabulary

| Term | Meaning |
|------|---------|
| **Purge** | Send to purgatory. Remove from active runtime, nav, keyboard shortcuts, render paths, and save logic. Document the removal. Code may remain in the repo but must be inert. |
| **Purgatory** | Intentionally decommissioned. Documented. Recoverable. Not part of active runtime behavior. Not visible to users. Not consuming cycles. |
| **Delete** | Fully removed from active code. Recoverable only through Git history. No documentation obligation beyond the commit message. |

---

## When to Purge (→ Purgatory)

Use purgatory when:

- The feature worked but is no longer needed right now
- There is a reasonable chance it comes back (redesigned or restored)
- The feature has implementation weight worth preserving
- Removing it cleanly is more work than isolating it
- It serves as reference for a future replacement

## When to Delete

Use delete when:

- The feature is replaced and the replacement is stable
- The old code has no reference value
- Keeping it around creates confusion or maintenance drag
- The implementation is small enough that rebuilding from scratch is cheaper than reading the old code

## When to Leave Hidden

Do not use purgatory or delete when:

- The feature is actively toggled for a specific user role or mode (e.g., admin-only surfaces)
- The feature is temporarily suppressed for a release but will return within days

Hidden ≠ purged. Hidden means "off for now but still wired." Purged means "disconnected."

---

## Runtime Expectations

A purged item must NOT:

- Appear in navigation, dropdowns, or menus
- Render HTML into the DOM (even if hidden via CSS)
- Participate in keyboard shortcut handlers
- Execute in `renderAdminShell()` or any page-switch logic
- Participate in save paths, data sync, or polling
- Consume CPU, network, or memory during normal operation

A purged item MAY:

- Remain in the codebase as inert functions or HTML blocks
- Be wrapped in a `if (false)` or `/* PURGATORY: ... */` guard if full removal is risky
- Have its data model fields survive in the database (fields are cheap; runtime is not)

---

## Documentation Expectations

Every purge must be recorded in the **Purgatory Ledger** (section below) using the entry template. This is not optional. If it's not in the ledger, it's not in purgatory — it's just forgotten.

---

## Git / Reference Expectations

- The commit that purges a feature should have a clear message: `purge: [name] — [reason]`
- If the purge spans multiple files, one commit is preferred
- The commit hash should be recorded in the ledger entry
- Revival should start by reading the ledger entry, then checking the commit

---

## Revival Expectations

Reviving a purged item means:

1. Read the ledger entry
2. Assess revival risks listed in the entry
3. Check whether the codebase has moved past the assumptions the feature relied on
4. Re-integrate intentionally — do not just uncomment and hope

Revival is a deliberate act, not an accident.

---

## Periodic Review

Every quarter (or every major product pass), scan the ledger:

- Items in purgatory for >6 months with no revival discussion → candidate for delete
- Items whose replacement is stable and proven → candidate for delete
- Items with unresolved runtime entanglement → candidate for cleanup

---

## Entry Template

```markdown
### [Name]

| Field | Value |
|-------|-------|
| **Type** | surface / flow / component / utility |
| **Status** | purged / revived / deleted |
| **Date purged** | YYYY-MM-DD |
| **Former location** | page, nav position, render path |
| **Purpose** | what it did |
| **Why tabled** | why it was purged |
| **What replaced it** | what now serves its role, if anything |
| **Runtime dependencies** | what still touches it, if anything |
| **Files touched** | list of files where code was removed or guarded |
| **Revival conditions** | what would need to be true to bring it back |
| **Revival risks** | what has changed that could break a naive revival |
| **Git reference** | commit hash of the purge |
```

---

## Purgatory Ledger

### SHIP Page

| Field | Value |
|-------|-------|
| **Type** | surface |
| **Status** | hidden — candidate for formal purge |
| **Date purged** | 2026-03-04 (hidden from nav) |
| **Former location** | Main nav utility menu, `pg-ship` page |
| **Purpose** | Fulfillment phase grouping view — jobs organized by shipping stage |
| **Why tabled** | LOG SHIP actions and PACKING card now handle the late-stage workflow. SHIP page was redundant surface area with low daily use. |
| **What replaced it** | LOG SHIP actions (counting), Card Zone PACKING face (readiness), JOBS LIVE column (visibility) |
| **Runtime dependencies** | `renderShip()` still exists in render switch. `goPg('ship')` still works if called. Menu item hidden via `display:none`. `fulfillment_phase` field still in data model. Not yet formally purged from runtime — still wired, just not visible in nav. |
| **Files touched** | `index.html` (menu item hidden), `app.js` (utility menu toggle) |
| **Revival conditions** | If a dedicated fulfillment-phase grouping view is needed again beyond what JOBS filtering provides |
| **Revival risks** | JOBS LIVE column now covers most of the at-a-glance need. Reviving SHIP would create redundant signal unless it offers something JOBS + LOG don't. |
| **Git reference** | (record commit hash when formally purged) |

### AUDIT Page

| Field | Value |
|-------|-------|
| **Type** | surface |
| **Status** | hidden — candidate for formal purge |
| **Date purged** | 2026-03-04 (hidden from nav) |
| **Former location** | Admin utility dropdown menu |
| **Purpose** | Audit trail viewer (admin-only) |
| **Why tabled** | Linked in Supabase-synced footer instead. Low daily use for in-app surface. |
| **What replaced it** | Footer link to Supabase audit trail |
| **Runtime dependencies** | `renderAdminShell()` no longer calls audit render (guarded by page switch). Menu item hidden. |
| **Files touched** | `index.html` (menu item hidden), `app.js` (removed from `_showAdminUtils`) |
| **Revival conditions** | If in-app audit viewing is needed for non-Supabase-connected sessions |
| **Revival risks** | Low. The page implementation is intact. |
| **Git reference** | (record commit hash when formally purged) |

### Press Station

| Field | Value |
|-------|-------|
| **Type** | surface (station shell) |
| **Status** | purged |
| **Date purged** | 2026-03-06 |
| **Former location** | Launcher → "Press Station" button → press picker (p1–p4). Rendered into `#pressStationShell`. Entered via `openPressStation(pressId)`. |
| **Purpose** | Single-press focused shell: assign a job to a specific press, log pressed quantity via numpad, hold/resume, save notes. Essentially a parallel counted-movement logging surface scoped to one press. |
| **Why tabled** | LOG console now serves all counted movement (PRESS/PASS/REJECT/BOXED/READY/QUACK) with a 6-action interface. Press Station was a parallel logging path that muddied the distinction between *press information* (what's running where) and *logging behavior* (counted movement). FLOOR press grid + RSP already provide press information. |
| **What replaced it** | LOG console (counted movement for all actions), FLOOR page press grid (press information and assignment), RSP (job detail). |
| **Runtime dependencies removed** | Launcher button + press picker row (`index.html`). Shell HTML (`#pressStationShell`). All `ps-v1-*` rendering and CSS. All Press Station JS: `openPressStation`, `exitPressStation`, `renderPressStationShell`, `psNumpad*`, `pressStationLogPressed`, `pressStationHold`, `pressStationResume`, `pressStationSaveNote`, `selectPressStationJob`, `getStationPress`, `getStationJob`, `triggerPressStationRailGlow`, `updatePressStationProgress`. `S._pressStationWrite` flag and its error-logging paths in `storage.js`. `renderAll()` press station branch. `buildPressCardHTML` `linkTo='pressStation'` behavior. |
| **Files touched** | `index.html`, `stations.js`, `app.js`, `render.js`, `storage.js`, `styles.css` |
| **Intentionally preserved** | Shared station infrastructure (`getStationContext`, `setStationContext`, `isStationType`, `hideAllShells`, `showShell`, `returnToAdmin`, `isStationShellVisible`) — used by QC and Floor Manager. Press ASSIGNMENT logic (`syncJobPressFromPresses`, `setAssignment`, `assignJob`, `setPressOnDeck`, `sendOnDeckToPress`, `setPressStatus`) — this is press information, not Press Station. `.ps-numpad-btn` / `.ps-numpad-clear` / `.ps-numpad-back` CSS classes — shared with LOG console numpad. `getStationEditPermissions` / `mayEnterStation` with `'press'` cases — inert (no entry point reaches them) but preserved for auth role backward compatibility. |
| **Revival conditions** | If a dedicated per-press operator shell is needed again — e.g., for a locked-down tablet on each press that only shows that press's job and a log numpad. |
| **Revival risks** | LOG console is now the canonical movement surface. Reviving Press Station would recreate the parallel-logging problem unless it is redesigned as a *read-only press information surface* (no logging) or a *press-scoped LOG entry point* that routes through the same LOG infrastructure. `buildPressCardHTML` no longer has `pressStation` behavior. `S._pressStationWrite` error paths are gone. The full rendering code was removed, not commented — recovery requires reading this entry + Git history. |
| **Known leftovers** | `'press'` role in auth/database still exists; users with this role see an empty launcher (no available stations). Requires role reassignment or a future press-role routing decision. `getStationEditPermissions` still has a `case 'press'` branch that is now unreachable. `mayEnterStation` still has a `'press'` case. These are inert but present. |
| **Git reference** | (record commit hash of this purge) |

---

*End of Purgatory Protocol. For implementation details and current runtime state, see the codebase and relevant audit docs.*
