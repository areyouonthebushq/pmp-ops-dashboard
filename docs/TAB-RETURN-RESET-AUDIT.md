# Tab Return Reset — Audit and Fix

## Press Station–specific regression (second fix)

**Cause:** When a **station shell** (Press Station, QC Station, or Floor Manager) is active, `showShell()` in stations.js hides `#app` and shows the shell. So when the auth callback runs on tab return, it sees `app.style.display === 'none'` and (with the first fix) would still call `showLauncher()`, kicking the user back to the launcher. Admin and LOG stay inside `#app`, so they were already preserved by the first fix.

**Fix:** In the `SIGNED_IN` branch, call `showLauncher()` only when the user is neither in the app nor in a station shell: `if (!inApp && !inStation) showLauncher()`, where `inStation = typeof isStationShellVisible === 'function' && isStationShellVisible()`.

---

## PHASE 1 — Audit (initial)

### 1. Callers of showLauncher / enterByLauncher / authBootstrap / showLoginScreen / doLogout / signOutFully

| Function | Callers |
|----------|---------|
| **showLauncher()** | authBootstrap (no auth / local), onAuthStateChange(SIGNED_IN), wireLoginForm (after sign-in), fetchAndStoreProfile then in authBootstrap (has session), enterGuestDemo, doLogout, signOutFully (no client), showLauncherWithLocalBanner |
| **enterByLauncher(...)** | Launcher buttons (index.html), openLastLauncherChoice (app.js) |
| **authBootstrap()** | Top-level (app.js L759) once on load |
| **showLoginScreen(...)** | authBootstrap, onAuthStateChange(SIGNED_OUT), signOutFully, wireLoginForm (error path) |
| **doLogout()** | Bar EXIT button, stations.js exitPressStation/exitQCStation/exitFloorManager when not admin |
| **signOutFully()** | Launcher SIGN OUT buttons (index.html) |

### 2. Listeners that could affect context

| Listener | File | Behavior |
|----------|------|----------|
| **visibilitychange** | app.js L43–46 | Only used for matrix rain (cancelAnimationFrame when hidden). Does **not** call showLauncher or reset context. |
| **online** | app.js L769 → storage.js onOnline | Runs loadAll + replayQueue when coming back online. Does **not** call showLauncher. |
| **popstate** | app.js L771–775 | Only exits TV mode. Does not show launcher. |
| **onAuthStateChange** | app.js L700–707 | On SIGNED_OUT → showLoginScreen(false). On **SIGNED_IN** → fetchAndStoreProfile().then(**showLauncher()**). |

No focus/blur or storage-event listeners call showLauncher or clear station context.

### 3. What fires when the user switches tabs and returns

- **visibilitychange** fires when the tab becomes visible again.
- Supabase Auth subscribes internally to **visibilitychange** and runs token refresh when the tab becomes visible (see e.g. supabase/supabase#7250, supabase/auth-js#579).
- After refresh (or session check), Supabase calls **onAuthStateChange** with event **SIGNED_IN** (and sometimes **TOKEN_REFRESHED**), even when the user was already signed in and only the tab focus changed.

### 4. Exact chain that resets to station select

1. User is in the app (station or admin); `#app` is visible.
2. User switches to another tab/window.
3. User returns to the app tab.
4. Browser fires **visibilitychange** (and possibly **online**).
5. Supabase Auth’s internal visibility handler runs and refreshes the session.
6. Supabase invokes **onAuthStateChange('SIGNED_IN', session)** (and possibly TOKEN_REFRESHED).
7. App’s callback runs: `fetchAndStoreProfile(session.user.id).then(() => showLauncher())`.
8. **showLauncher()** runs: hides `#app`, shows mode screen (launcher).
9. User is back on station select; current page/station context is lost.

### 5. Root cause

- **Auth/session handling:** The **onAuthStateChange** handler treats every **SIGNED_IN** as “just logged in” and always calls **showLauncher()**.
- Supabase intentionally fires **SIGNED_IN** (and/or **TOKEN_REFRESHED**) when the tab becomes visible after a token refresh, not only on first sign-in.
- So the regression is caused by **auth state change handling**: responding to tab-return token refresh with showLauncher().

---

## PHASE 2 — Fix

### Change made

**File:** `app.js`  
**Handler:** `window.PMP.Supabase.onAuthStateChange` callback (around L700–710).

**Before:** On `SIGNED_IN` && session: `fetchAndStoreProfile(session.user.id).then(() => showLauncher())`.  
**After:** On `SIGNED_IN` && session: `fetchAndStoreProfile(session.user.id).then(() => { const appEl = document.getElementById('app'); if (!appEl || appEl.style.display === 'none') showLauncher(); })`.

So **showLauncher()** is only called when the app block is not visible (still on login/launcher flow). When the user is already in the app (`#app` visible), we only refresh profile and do **not** call showLauncher(), so context is preserved.

---

## Report

1. **Exact root cause:** Supabase fires **SIGNED_IN** (and sometimes **TOKEN_REFRESHED**) when the tab becomes visible after a token refresh. The app’s **onAuthStateChange** treated every **SIGNED_IN** as “show launcher,” so returning to the tab triggered **showLauncher()** and reset to station select.

2. **Exact file changed:** `app.js` (only the **onAuthStateChange** callback).

3. **Exact handler/path fixed:** `authBootstrap()` → `window.PMP.Supabase.onAuthStateChange(...)` → branch `event === 'SIGNED_IN' && session` → after `fetchAndStoreProfile(...).then(...)` we now call **showLauncher()** only when `!appEl || appEl.style.display === 'none'`.

4. **Switching away and back:** No longer returns to station select; profile is refreshed but launcher is not shown when the user is already in the app.

5. **Real sign out:** Unchanged. **SIGNED_OUT** still runs `showLoginScreen(false)`. **signOutFully()** and **doLogout()** still call **showLauncher()** or **showLoginScreen** as before; they explicitly hide the app and then show launcher/login, so the guard does not affect them.
