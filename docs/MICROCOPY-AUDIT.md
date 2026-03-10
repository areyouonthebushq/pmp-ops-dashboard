# PMP OPS — Microcopy Audit

**Goal:** Audit user-facing copy for redundancy, vagueness, misleading wording, and inconsistency. No design changes, no new features, no patches applied.

**Scope:** Page titles, section labels, nav labels, button text, mode labels, toasts, error messages, empty states, placeholders, confirm dialogs, status language.

---

## 1. Launcher

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 1.1 | Launcher sub | "Nashville · Press Floor Operations" (mode-sub) | Repeated in login footer and mode-city; redundant on same screen (title + city line below). | Keep once: either in mode-sub or in mode-city, not both with same text. |
| 1.2 | Admin button sub | "Full edit · assign · export" | "Full edit" is vague (edit what?). | e.g. "Edit jobs · assign presses · export" or "All jobs · assign · export". |
| 1.3 | Floor Manager sub | "Operations overview · statboard · quick edit" | "Statboard" is jargony; "quick edit" vs panel "edit" unclear. | "Floor overview · stats · quick edit" or align with "QUICK EDIT" used elsewhere. |
| 1.4 | Press Station sub | "Single-press view · log qty" | "log qty" is abbreviated; inconsistent with "LOG PRESS" / "Log pressed". | "Single press · log quantities" or "View one press · log qty". |
| 1.5 | QC Station sub | "Rapid reject logging" | Slightly marketing; rest of app is terse. | "Log rejects by type" or "Reject logging". |
| 1.6 | Last row | "Last: —" / "Last: Press 1" etc. | "Last" is vague (last what?). | "Last opened: —" or "Reopen: —". |
| 1.7 | Local banner | "Local mode — Supabase unavailable. Data not synced." | Technical ("Supabase"); long for a banner. | "Offline mode. Data not synced." or "Local only — not synced." |
| 1.8 | No-role banner | "No role assigned. Contact an admin." | "Contact an admin" is vague (how?). | "No role assigned." or "No role. Ask an admin." |

---

## 2. Login

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 2.1 | Auth sub | "Sign in to continue" | Generic; app uses "SIGN IN" on button. | Keep or shorten to "Sign in". |
| 2.2 | Guest button | "GUEST DEMO · NO LOGIN REQUIRED" | Redundant (guest = no login). | "GUEST DEMO" or "Continue without signing in". |
| 2.3 | Footer | "Nashville · Press Floor Operations" | Duplicates launcher; "Press Floor" may confuse (press as in vinyl). | Same as launcher: use once globally or "Nashville · OPS". |
| 2.4 | Error | "Email and password required." | Inconsistent punctuation (period in error, none in toasts). | Align with house: "Email and password required" (no period) or match other errors. |
| 2.5 | Error | "Sign in failed." | Doesn't say why; "Sign in failed" is generic. | Keep for security; optionally "Sign in failed. Check email and password." |

---

## 3. Admin shell (bar / nav)

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 3.1 | Bar button | "EXIT" | Inconsistent with launcher "SIGN OUT"; implies exit app vs sign out. | Use "SIGN OUT" everywhere or "EXIT" everywhere; document which is correct. |
| 3.2 | Bar button | "↓ CSV" | Arrow + CSV is clear but "EXPORT CSV" would match "Export" language. | Optional: "EXPORT CSV" for consistency with "export" in launcher. |
| 3.3 | Bar button | "💾 BACKUP" | "Backup" could mean restore; title says "Export full operational backup (JSON)". | Button: "EXPORT BACKUP" or keep; ensure tooltip matches. |
| 3.4 | Bar button | "MIN" (minimal theme) | Vague; users may not know "minimal". | Title only: "Toggle minimal theme" is OK; consider "THEME" if you add more. |
| 3.5 | Nav | "⬡ FLOOR" / "▶ JOBS" / "⬡ LOG" / "📋 AUDIT" | Icon + label is good; "LOG" is vague (log what?). | LOG could be "LOG (Press/QC)" in tooltip or leave as-is. |
| 3.6 | FAB label | "NEW JOB [N]" | Clear; "[N]" is keyboard hint. | No change or ensure [N] works. |
| 3.7 | Data notice | "Data updated elsewhere. <Refresh view>" | "Elsewhere" is vague. | "Data changed. Refresh view." |

---

## 4. Floor page

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 4.1 | Section | "PRESS STATUS" | Clear. | — |
| 4.2 | Section | "ACTIVE ORDERS" | "Orders" used here; "jobs" everywhere else. | Use "ACTIVE JOBS" for consistency. |
| 4.3 | Placeholder | "FILTER BY CATALOG, ARTIST, ALBUM…" | Good. | — |
| 4.4 | Button | "+ ADD JOB" | Consistent with FAB "NEW JOB". | — |
| 4.5 | Press card | "NO JOB ASSIGNED" | Clear. | — |
| 4.6 | Dropdown | "— ASSIGN JOB" | Dash as placeholder; "Assign job" is clear. | — |
| 4.7 | Empty row | "NO MATCHES FOR \"…\"" / "NO ACTIVE JOBS" | Good. | — |
| 4.8 | Stat filter hint | "Showing: **Active** clear" | "clear" is a button; label is good. | — |
| 4.9 | Count | "X jobs" / "X of Y" / "X Active" | "Active" vs "active" (lowercase in hint). | Unify casing: "X active" or "X Active". |
| 4.10 | Recent done | "RECENT DONE" (section) | "Recent done" is awkward. | "RECENTLY COMPLETED" or "DONE (RECENT)". |

---

## 5. Jobs page

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 5.1 | Filter options | "ALL JOBS" / "PRESSING" / "QUEUED" / "ON HOLD" / "DONE" | "QUEUED" vs panel "Queued" (casing). | Use same casing as STATUS_OPTS: "Queued" in dropdown or keep ALL CAPS for filters. |
| 5.2 | Placeholder | "SEARCH JOBS…" | Good. | — |
| 5.3 | Empty state | "NO JOBS IN SYSTEM · TAP + TO ADD" | "TAP +" is mobile; keyboard users "Add" or [N]. | "NO JOBS · ADD ONE WITH +" or "No jobs. Use + to add." |
| 5.4 | Empty (filtered) | "NO MATCHES FOR \"…\"" | Good. | — |
| 5.5 | Import label | "↑ IMPORT CSV" | Clear. | — |

---

## 6. Right-side panel

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 6.1 | Panel title (new) | "NEW JOB" | Good. | — |
| 6.2 | Panel title (edit) | Catalog or "Job" | Fallback "Job" is vague. | "Job (no catalog)" or keep "Job". |
| 6.3 | Section 1 | "1 JOB DETAILS" | Good. | — |
| 6.4 | Section 2 | "2 FORMAT & SPEC" | "SPEC" abbreviated. | "FORMAT & SPECS" or keep. |
| 6.5 | Section 3 | "3 ASSETS" | Good. | — |
| 6.6 | Hint (assets) | "TAP TO MARK RECEIVED · EXPAND FOR DETAILS · N/A IF NOT APPLICABLE" | All caps and long; "N/A if not applicable" is redundant. | "Tap to mark received · Expand for details" or shorten. |
| 6.7 | Section 4 | "4 PROGRESS" | Good. | — |
| 6.8 | Progress button | "+ LOG STACK" | "Stack" is jargon (qty of units). | "+ LOG QTY" or "+ LOG" with tooltip. |
| 6.9 | Progress empty | "SAVE JOB FIRST TO LOG PROGRESS." | Good. | — |
| 6.10 | Progress empty | "NO ENTRIES YET." | Period inconsistent with "No notes yet" (no period in some). | "NO ENTRIES YET" (no period) or add period to all empty states. |
| 6.11 | Section 5 | "5 NOTES" | Good. | — |
| 6.12 | Notes placeholder | "Add a production note..." | Good. | — |
| 6.13 | Notes button | "+ LOG NOTE" (both) | Same label for production and assembly; could confuse. | "+ ADD NOTE" for both or "Production note" / "Assembly note" in label. |
| 6.14 | Section 6 | "6 BILLING" | Good. | — |
| 6.15 | Billing toggle | "BILLING DETAILS" + "OPTIONAL" | Clear. | — |
| 6.16 | Footer | "CANCEL" / "DELETE JOB" / "SAVE JOB" | Good. | — |
| 6.17 | Press assigned | "— Unassigned" | Good. | — |
| 6.18 | Status options (panel) | "Queued" / "Pressing" / "Assembly" / "On Hold" / "Done" | Sentence case; filter uses "QUEUED", "ON HOLD". | One convention: either sentence case everywhere or ALL CAPS for filter-only. |
| 6.19 | Suggested status | "Suggested: **PRESSING** — reason" | Good. | — |
| 6.20 | Label | "Catalog / Matrix #" | Good. | — |
| 6.21 | Label | "Press Assigned" | Good. | — |
| 6.22 | Progress stage options | "PRESSED" / "QC PASSED" / "REJECTED" | All caps here; STATUS_OPTS are sentence case. | Align: either "Pressed" / "QC passed" / "Rejected" or keep caps for stages. |

---

## 7. Press station

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 7.1 | Header | "—" (press name when missing) | Placeholder dash. | "No press" or keep "—". |
| 7.2 | Back | "← BACK" | Consistent with other stations. | — |
| 7.3 | Idle | "NO JOB ASSIGNED" + "Assign a job from Admin to start logging." | "Admin" is mode name; could say "from the admin dashboard". | "Assign a job from the app to start logging." or keep. |
| 7.4 | Button | "LOG PRESSED" / "LOG +X PRESSED" | Clear. | — |
| 7.5 | Label | "X REMAINING" | Good. | — |
| 7.6 | Blocked | "Job on hold" / "Order complete" | "Order" again vs "job". | "Job complete" for order qty. |
| 7.7 | Toasts | "Job on hold" / "Job resumed" / "Note saved" | Good. | — |

---

## 8. LOG page

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 8.1 | Section | "SELECT JOB" | Good. | — |
| 8.2 | Dropdown | "Choose job" | Inconsistent with "Select a job above" and "— ASSIGN JOB" (different placeholder style). | "— Select job" or "Choose job" everywhere for LOG. |
| 8.3 | Job label (empty) | "Select a job above" | Good. | — |
| 8.4 | Section | "LOG" | Very terse; could mean activity log. | "LOG PRESS / QC" or keep "LOG" if context is clear. |
| 8.5 | Buttons | "PRESS" / "PASS" / "REJECT" | "PASS" is QC pass; clear in context. | — |
| 8.6 | Enter button | "LOG PRESS" / "LOG PASS" / "LOG REJECT" | Good. | — |
| 8.7 | Reject picker title | "REJECT — SELECT DEFECT TYPE" | Good. | — |
| 8.8 | Reject picker | "CANCEL" | Good. | — |
| 8.9 | Section | "RECENT" | Recent what? | "RECENT LOG" or "RECENT ENTRIES". |
| 8.10 | Section | "QC LOG" | Good. | — |
| 8.11 | Empty (recent) | "No entries for this job" | Good. | — |
| 8.12 | Empty (QC log) | "No rejects logged today" / "on this date" | Good. | — |
| 8.13 | Default empty (QC) | "NO REJECTS LOGGED TODAY" | Redundant with dynamic empty. | Use same component: "No rejects logged today". |
| 8.14 | Date nav | "◂ PREV" / "NEXT ▸" / "TODAY" | Good. | — |

---

## 9. QC Station

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 9.1 | Section | "CURRENT JOB" | Good. | — |
| 9.2 | Section | "TODAY (total = units · pills = events by type)" | Parenthetical is developer-speak; "pills" and "events by type" are vague. | "TODAY'S TOTALS" or "TODAY — units & reject types". |
| 9.3 | Section | "SELECT JOB" | Good. | — |
| 9.4 | Empty job list | "Select a job below" | But list is below; if no jobs, show different message. | If no jobs: "No jobs pressing or in assembly." (already present). |
| 9.5 | No jobs | "No jobs pressing / in assembly" | Good. | — |
| 9.6 | Section | "LOG REJECT" | Good. | — |
| 9.7 | Section | "RECENT" | Same as LOG page — recent what? | "RECENT REJECTS" or "RECENT LOG". |

---

## 10. Floor Manager

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 10.1 | Placeholder | "Filter…" | Vague; floor page uses "FILTER BY CATALOG, ARTIST, ALBUM…". | "Filter by catalog, artist…" for consistency. |
| 10.2 | Sections | "PRESS STATUS" / "ACTIVE ORDERS" | Same as floor; "ACTIVE ORDERS" → "ACTIVE JOBS". | Use "ACTIVE JOBS". |

---

## 11. Audit page

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 11.1 | Toolbar | "Limit" + "LOAD" | "Limit" is row limit; "LOAD" is vague (load what?). | "Rows: 100" and "LOAD AUDIT" or "REFRESH". |
| 11.2 | Empty | "No audit entries. Run \"LOAD\" or check Supabase admin." | Technical (Supabase); "Run LOAD" is odd. | "No entries. Tap LOAD to refresh." or "No audit entries yet." |
| 11.3 | Error empty | "Error loading audit log." | Good. | — |
| 11.4 | Hint (loading) | "Loading…" | Good. | — |
| 11.5 | Hint (no role) | "Audit requires Supabase and admin role." | Technical. | "Audit requires admin role." |

---

## 12. Modals / overlays

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 12.1 | Confirm button | "CONFIRM" (generic) | Sometimes "OPEN EXISTING" for duplicate; resets to CONFIRM. | Context-specific label is already overridden where needed. |
| 12.2 | Delete confirm | "DELETE JOB?" / "REMOVE X — Y? CANNOT BE UNDONE." | "REMOVE" vs "DELETE" (redundant). | "DELETE JOB?" / "Remove X — Y? This cannot be undone." |
| 12.3 | New job chooser | "New Job" / "Add a single job or import from CSV." | Good. | — |
| 12.4 | New job chooser | "Manual Entry" / "Import CSV" | Good. | — |
| 12.5 | Duplicate modal | "Job already exists" | Good. | — |
| 12.6 | Duplicate modal | "Open Existing Job" / "Create Anyway" / "Cancel" | "Create Anyway" is risky; tone is clear. | Optional: "Add anyway" (softer) or keep. |
| 12.7 | Wizard title | "New Job" | Good. | — |
| 12.8 | Wizard step | "Step 1 — Identity" | Good. | — |
| 12.9 | Wizard steps | "Identity" / "Production" / "Spec" / "Ops" / "Review" | "Ops" is abbreviated. | "Operations" or keep. |
| 12.10 | Assets overlay hint | "Tap to mark received · Expand for details · N/A if not applicable" | Same as panel; redundant phrase. | Shorten to "Tap to mark received · Expand for details." |
| 12.11 | Assets overlay | "SAVE & CLOSE" / "CANCEL" | Good. | — |
| 12.12 | Progress detail | "X% COMPLETE" / "Pressed X% · QC Y% · …" | Good. | — |
| 12.13 | Floor card | "QUICK EDIT" / "DONE" | Good. | — |
| 12.14 | Data changed | "Data updated elsewhere. Refresh view" | See 3.7. | "Data changed. Refresh view." |

---

## 13. Toasts and errors

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 13.1 | Save success | "JOB ADDED" / "JOB UPDATED" | All caps; some toasts mixed case. | Pick one: ALL CAPS for success/errors or sentence case. |
| 13.2 | Save error | "Save failed" (fallback) | Generic. | Keep; optional: "Job save failed." |
| 13.3 | Delete | "JOB DELETED" / "Delete failed" | Inconsistent casing. | "DELETE FAILED" or "Delete failed" everywhere. |
| 13.4 | Validation | "CATALOG # OR ARTIST REQUIRED" vs "Catalog # or Artist required" | Same rule, different casing (panel vs wizard). | One string: "Catalog # or artist required" or "CATALOG # OR ARTIST REQUIRED". |
| 13.5 | Log success | "+X pressed → Job" / "X QC passed → Job" | Good. | — |
| 13.6 | Log error | "Log failed" / "Reject log failed" | Generic. | Keep or "Press log failed" / "Reject log failed." |
| 13.7 | Sync/global | "Something went wrong. Error logged." / "Sync error. Will retry." | First is vague; second is good. | "Something went wrong." or keep. |
| 13.8 | Conflict | "X was/were updated on another device" | Good. | — |
| 13.9 | Role | "Not allowed for your role." | Vague (what is allowed?). | "You don't have permission for this." or keep. |
| 13.10 | Local mode | "Local mode — Supabase unavailable. Data not synced." | Technical. | "Offline. Data not synced." |
| 13.11 | Status suggestion | "Status set to PRESSING" | Good. | — |
| 13.12 | Notes | "NOTE LOGGED" (x2) | Same for production and assembly. | "Note saved" or "Production note saved" / "Assembly note saved". |
| 13.13 | CSV | "CSV EXPORTED" / "EMPTY CSV" / "X JOBS IMPORTED" / "IMPORT FAILED: …" | Good. | — |
| 13.14 | Backup | "BACKUP EXPORTED" | Good. | — |
| 13.15 | Undo | "UNDONE" | Good. | — |

---

## 14. Sync bar and offline

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 14.1 | Initial sync | "● READY" (index.html) | setSyncState never sets "READY"; uses "● SYNCED", "● SAVING…", etc. | Change initial to "● SYNCED" or add "ready" state to SYNC_STATES. |
| 14.2 | States | "loading" / "● SAVING…" / "● SYNCED" / "● ERR" / "● LOCAL" / "● OFFLINE" / "● STALE" | "loading" has no bullet; "● ERR" is terse. | "● LOADING" and "● ERROR" for consistency. |
| 14.3 | Offline banner | "Offline — showing cached data." | Good. | — |

---

## 15. TV mode

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 15.1 | Button | "◇ PIZZAZ" | Jargony. | "EFFECTS" or keep for brand. |
| 15.2 | Button | "ESC · EXIT TV" | Good. | — |
| 15.3 | Queue title | "◈ ORDERS IN PROGRESS" | "Orders" again. | "JOBS IN PROGRESS" for consistency. |
| 15.4 | Ticker | "★ NO ACTIVE JOBS ★" | Good. | — |

---

## 16. Misc (panel progress, notes, placeholders)

| # | Surface | Exact current copy | Problem | Smallest fix |
|---|---------|--------------------|--------|--------------|
| 16.1 | Progress bar text | "QC: X / Y ORDERED · PRESSED: Z" | Dense but clear. | — |
| 16.2 | Progress empty | "NO ENTRIES YET." | Period; "No notes yet." has period in one place, not another. | Standardize: no period for empty states or period for all. |
| 16.3 | Notes empty | "No notes yet." (x2) | Good. | — |
| 16.4 | Person fallback | "UNKNOWN" (progress log) vs "—" (display) | Inconsistent fallback for missing person. | Use "—" or "Unknown" everywhere for person. |
| 16.5 | Placeholder | "Rack, bay..." (floor card location) | Good. | — |
| 16.6 | Placeholder | "e.g. Bay 3" (wizard) | Good. | — |
| 16.7 | Catalog | "Catalog · Pop · Label" (jCPL) | Jargony. | Add tooltip or "Catalog / Pop / Label" if needed. |

---

## Top 20 copy issues (prioritized by impact)

1. **"ACTIVE ORDERS" vs "jobs"** — Floor, FM, TV use "orders"; rest of app uses "jobs". **Fix:** Use "ACTIVE JOBS" everywhere.
2. **"EXIT" vs "SIGN OUT"** — Bar says EXIT, launcher says SIGN OUT. **Fix:** Pick one (e.g. SIGN OUT everywhere).
3. **Sync bar "● READY"** — Initial state doesn't match SYNC_STATES (synced/saving/error). **Fix:** Initial "● SYNCED" or add READY to SYNC_STATES.
4. **Validation message casing** — "CATALOG # OR ARTIST REQUIRED" vs "Catalog # or Artist required". **Fix:** One canonical string.
5. **"Choose job" vs "Select a job above" vs "— ASSIGN JOB"** — Inconsistent placeholder/label for job selection. **Fix:** Standardize ("Select job" / "— Select job").
6. **"RECENT" without context** — LOG and QC: recent what? **Fix:** "RECENT LOG" or "RECENT ENTRIES".
7. **QC Station "TODAY (total = units · pills = events by type)"** — Developer language. **Fix:** "TODAY'S TOTALS" or short phrase.
8. **Assets hint redundancy** — "N/A if not applicable" and long all-caps. **Fix:** Shorten; drop redundant phrase.
9. **"No role assigned. Contact an admin."** — Vague. **Fix:** "No role assigned." or "Ask an admin for access."
10. **"Local mode — Supabase unavailable"** — Technical. **Fix:** "Offline. Data not synced."
11. **Audit empty** — "Run \"LOAD\" or check Supabase admin". **Fix:** "Tap LOAD to refresh." / "No audit entries yet."
12. **"Order complete" / "Order qty"** in press station — Use "job". **Fix:** "Job complete" (for qty).
13. **"Full edit" (launcher Admin)** — Vague. **Fix:** "Edit jobs · assign · export".
14. **"DELETE JOB?" + "REMOVE … CANNOT BE UNDONE"** — Remove vs delete. **Fix:** Use "Remove" or "Delete" consistently in one line.
15. **Empty state period** — "NO ENTRIES YET." vs "No notes yet." **Fix:** One rule: periods in empty states or none.
16. **Toast casing** — "JOB ADDED" vs "Save failed". **Fix:** All success/action toasts ALL CAPS or all sentence case.
17. **"Limit" (audit)** — Unclear. **Fix:** "Rows: 50" or "Show: 100".
18. **FM placeholder "Filter…"** — Too short vs floor. **Fix:** "Filter by catalog, artist…"
19. **"Last: —"** — Last what? **Fix:** "Last opened: —".
20. **"Create Anyway" (duplicate job)** — Slightly aggressive. **Fix:** Optional: "Add anyway" or keep.

---

## Top 10 highest-leverage fixes

1. **Replace "orders" with "jobs"** where the app means jobs: ACTIVE ORDERS → ACTIVE JOBS (floor, FM, TV queue title). One concept, one word.
2. **Unify EXIT vs SIGN OUT** across launcher and bar so one term is used for leaving/signing out.
3. **Sync bar initial state** — Make "● READY" match the rest of sync language (e.g. "● SYNCED" or add READY to SYNC_STATES).
4. **One validation string for catalog/artist** — Use the same copy in panel save and wizard ("Catalog # or artist required" or ALL CAPS everywhere).
5. **Standardize job-select placeholder/label** — "Choose job" / "Select a job above" / "— ASSIGN JOB": pick one pattern for "pick a job" (e.g. "— Select job" or "Choose job").
6. **Shorten technical messages** — "Supabase unavailable" → "Offline" or "Data not synced"; "Run LOAD or check Supabase admin" → "Tap LOAD to refresh."
7. **QC Station "TODAY" section** — Replace "(total = units · pills = events by type)" with "TODAY'S TOTALS" or similar.
8. **RECENT section labels** — Add one word: "RECENT LOG" or "RECENT ENTRIES" on LOG and QC so "recent" isn’t ambiguous.
9. **Assets/panel hint** — Remove "N/A if not applicable"; shorten to "Tap to mark received · Expand for details."
10. **Empty-state and toast casing** — Decide: ALL CAPS for toasts/empties or sentence case; apply consistently (and same for periods in empty states).

---

## House language summary (how labels/buttons should sound)

- **One noun for work items:** Use **"job"** everywhere (not "order" for the same thing). "Order" only if you mean purchase order or customer order in a different feature.
- **Actions:** Short, imperative. Buttons: **"SIGN IN"**, **"SAVE JOB"**, **"CANCEL"**, **"LOG PRESS"**. Avoid "Click to…" or "You can…".
- **Sections:** Uppercase or title case consistently. Prefer **ALL CAPS for section headers** (e.g. PRESS STATUS, ACTIVE JOBS) to match existing; status options in dropdowns can stay sentence case (Queued, Pressing, Done).
- **Placeholders:** Either dash-first ("— Select job") or instruction ("Choose job"); **pick one pattern** for similar controls (job picker, assign job).
- **Empty states:** One rule: **no period** for short phrases ("NO JOBS YET", "No notes yet") or **period for full sentences**; stick to one. Prefer **clear action**: "No jobs. Use + to add."
- **Errors and toasts:** **One casing** (e.g. ALL CAPS for success/errors: "JOB SAVED", "SAVE FAILED") or sentence case for all. **No technical jargon** in user-facing copy: avoid "Supabase", "JSON", "sync state" unless in a technical note. Prefer "Offline", "Not synced", "Refresh".
- **Sign out / exit:** One term app-wide: either **"SIGN OUT"** or **"EXIT"**, not both for the same action.
- **Tone:** Neutral, operational. No marketing ("Rapid reject logging"); no apology ("Sorry, something went wrong"). **Short and scannable** for floor/station use.

---

*End of audit. No patches applied.*
