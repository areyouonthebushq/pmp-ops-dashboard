# PIN Login for Press Operators (Design — Future)

Design note for a future feature. **No implementation yet**; this documents the direction for when it’s time to build.

## Goal

The iPad stays on the press. When an operator starts their shift, they enter a **4-digit PIN** to identify themselves. That identity is used as the **person** field in progress logs and notes (and anywhere else we log “who did it”).

## Concept

- **PIN → person name:** e.g. `1234` → Colby, `5678` → Alex.
- **Press Station load:** Show a PIN entry screen first (4 digits, numeric keypad).
- **On valid PIN:** Set `S.currentPerson = 'Colby'` and use it everywhere we log person (progress log, notes, etc.).
- **Session:** Can timeout after **30 minutes of inactivity**; then re-prompt for PIN.
- **Auth model:** Separate from Supabase Auth — this is a **lightweight identity layer for the floor**, not full app login.

## When Implementing Later

1. **Supabase**
   - Add a `pins` table, e.g.:
     - `pin` (text, 4 digits), `name` (text), `role` (e.g. `'press'`).
   - Secure so only admins can manage PINs; press view can only validate a PIN and get the name.

2. **Press Station UI**
   - On load, if no valid session, show PIN entry screen (4-digit input, numeric keypad).
   - On valid PIN: set `S.currentPerson = name`, store session (e.g. in memory + optional short-lived persistence), then show the normal Press Station.

3. **Usage**
   - Everywhere we currently capture or display “person” for progress logs and notes, use `S.currentPerson` when set (e.g. progress log, production/assembly note “LOG NOTE”, press station note if we wire it to notes log).

4. **Session timeout**
   - After 30 minutes of inactivity, clear session and re-show PIN screen.

5. **Scope**
   - No change to Supabase Auth or dashboard login; this is only for identifying the operator at the press device.

---

*Design noted for future implementation.*
