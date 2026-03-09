# Auth / sign-out paths audit (no patch)

Audit-only. Purpose: trace every path that can send the user back to login or clear auth/session, and determine if “sign in twice” is caused by app logic vs Supabase.

---

## 1. doLogout()

**Location:** app.js, function `doLogout()` (lines 773–783).

**Does it call Supabase signOut()?** **No.** It does not call `window.PMP.Supabase.signOut()` or any auth API.

**What it does:**  
`setStationContext({})` → `hideStationShellsOnly()` → `hideLauncherPressPicker()` → `renderLauncherLast()` → hide `#app` and `#fab`, remove `tv` class → `stopDataSync()` → **`showLauncher()`**.

**Does it always “sign out” or only in some cases?** It never signs out. It always only switches UI to the launcher (mode screen). Session and auth state are left unchanged.

---

## 2. Every caller of doLogout()

| Caller | Location | When |
|--------|----------|------|
| **EXIT button** | index.html line 170 | `onclick="doLogout()"` — bar button in app shell. |
| **exitPressStation()** | stations.js line 228 | When `getAuthRole() !== 'admin' && S.mode !== 'admin'` → `doLogout()`. |
| **exitQCStation()** | stations.js line 444 | Same condition → `doLogout()`. |
| **exitFloorManager()** | stations.js line 518 | Same condition → `doLogout()`. |
| **Escape key** | app.js line 1752 | When `stationVisible` (station shell open) → `doLogout()`. |

**Launcher / back:** No other launcher or “back” handler calls `doLogout()`. The launcher’s “SIGN OUT” buttons call **`signOutFully()`**, not `doLogout()`.

---

## 3. authBootstrap()

**Location:** app.js, async function `authBootstrap()` (lines 666–701). Called once at load (line 736).

**Flow:**

1. If `!authRequired()` → **showLauncher()** and return (no login, no Supabase).
2. **showLoginScreen(true)** (login visible, “Checking session…”).
3. `initSupabase()`; if `!inited` → **showLauncherWithLocalBanner()** and return.
4. **onAuthStateChange** registered (see §4).
5. **getSession()**:
   - If `sessionError` → **showLoginScreen(false)**, wire form, return.
   - If **session** → **fetchAndStoreProfile(session.user.id)** then **showLauncher()**, return.
   - If no session → **showLoginScreen(false)**, wire form.

**Sign-out:** authBootstrap does not call `signOut()` or `signOutFully()`. It only shows login when there is no session or session error.

---

## 4. onAuthStateChange()

**Location:** app.js, inside `authBootstrap()` (lines 677–685). Subscribes to `window.PMP.Supabase.onAuthStateChange(callback)`.

**Handler:**

- **SIGNED_OUT:** `window.PMP.userProfile = null`, **showLoginScreen(false)**. User sees login; session is already gone (Supabase fired the event).
- **SIGNED_IN** and session: **fetchAndStoreProfile(session.user.id)** then **showLauncher()**.

**Real sign-out trigger:** The only way the app calls Supabase sign-out is **signOutFully()** → **Supabase signOut()**. After that, Supabase emits **SIGNED_OUT**; this handler then clears profile and shows login. So the **trigger** for going back to login after a real sign-out is this handler reacting to **SIGNED_OUT**.

---

## 5. showLoginScreen(), showLauncher(), enterByLauncher()

- **showLoginScreen(showLoading)** (app.js 528–556): Shows `#loginScreen`, hides `#modeScreen`. Does not touch Supabase or session. UI only.
- **showLauncher()** (app.js 568–575): Hides login, shows `#modeScreen`, hides `#app`, calls **applyLauncherByRole()**. Does not touch Supabase or session. UI only.
- **enterByLauncher(choice, pressId)** (app.js 406+): Called when user picks Admin / Floor Manager / Press / QC from launcher. Hides mode screen, sets `S.mode`, loads data, opens app or station. Does not call signOut, doLogout, or showLoginScreen. UI/navigation only.

None of these perform a real sign-out.

---

## 6. Paths where exiting a station or returning to launcher could unintentionally sign out

**Finding:** **No path that exits a station or returns to launcher performs a real sign-out.**

- **Station BACK (exitPressStation / exitQCStation / exitFloorManager):** Call **doLogout()** when not admin → **showLauncher()** only. Session and Supabase auth unchanged.
- **EXIT (bar):** Calls **doLogout()** → **showLauncher()** only. Session unchanged.
- **Escape from station:** Calls **doLogout()** → **showLauncher()** only. Session unchanged.

**signOutFully()** is only bound to the two **“SIGN OUT”** controls on the launcher (index.html 117 and 125). No station exit or “back to launcher” path calls **signOutFully()** or **Supabase signOut()**.

So station exit is **not** incorrectly using real logout; it only changes the UI to the launcher.

---

## Report summary

### 1. Exact places that trigger real sign-out

- **signOutFully()** (app.js 785–814) is the only place that:
  - Calls **Supabase signOut()** (when not guest and client exists), and
  - Then sets **userProfile = null** and **showLoginScreen(false)**.
- **Invoked only from:**
  - index.html ~117: launcher **“SIGN OUT”** button.
  - index.html ~125: launcher footer **“SIGN OUT”** link.

So real sign-out is triggered **only** by the user explicitly clicking one of those two SIGN OUT controls.

---

### 2. Exact places that only change UI (no sign-out)

- **doLogout()** → **showLauncher()** (session unchanged). Called by: EXIT bar button, exitPressStation/exitQCStation/exitFloorManager (when not admin), Escape from station.
- **showLauncher()** (from authBootstrap when no auth required, or after getSession() has a session, or after sign-in form submit, or from signOutFully when there is no Supabase client).
- **showLoginScreen()** (from authBootstrap when no session / session error, from onAuthStateChange on SIGNED_OUT, from signOutFully after signOut).
- **enterByLauncher()** (launcher choice → app or station). No auth change.

---

### 3. Whether station exit is incorrectly using real logout

**No.** Station exit (BACK or Escape from station) always uses **doLogout()** → **showLauncher()** only. It never calls **signOutFully()** or **Supabase signOut()**. Session remains; user is not asked to sign in again unless something else triggers login (e.g. Supabase SIGNED_OUT or a full sign-out from launcher).

---

### 4. Smallest likely fix (if “sign in twice” persists)

- **If the issue is “I click EXIT and then have to sign in again”:** EXIT already does **not** sign out; it only shows the launcher. So either (a) something else is calling signOut/showLoginScreen, or (b) the user is clicking **SIGN OUT** on the launcher and interpreting that as “exit.” No app change needed for (b) except possibly UX (e.g. label EXIT vs SIGN OUT). If (a), add a single guard so that **only** **signOutFully()** can call **Supabase signOut()** and **showLoginScreen** for sign-out; ensure no other path (e.g. doLogout, station exit, bootstrap) ever calls signOut or showLoginScreen for “return to launcher.”
- **If the issue is “I sign in successfully, then the login screen appears again shortly after”:** That implies **showLoginScreen()** is being called after a successful sign-in. The only callers of **showLoginScreen()** are: authBootstrap (no session / session error), onAuthStateChange(SIGNED_OUT), signOutFully(). So either (1) **SIGNED_OUT** is firing after sign-in (Supabase/session handling), or (2) authBootstrap or something is running again and getSession() fails or returns null. Smallest app-side mitigation: in **onAuthStateChange**, ignore **SIGNED_OUT** if it occurs within a short window (e.g. 1–2 s) after a **SIGNED_IN** for the same user, to avoid a spurious SIGNED_OUT (e.g. from token refresh) flipping the UI back to login. Alternatively, only show login on SIGNED_OUT when the user explicitly requested sign-out (e.g. a flag set in signOutFully); that requires a small state flag.

---

### 5. Whether “sign in twice” is app logic vs Supabase session handling

- **App logic:** Station exit and EXIT do **not** sign out; they only show the launcher. So the app does **not** intentionally send the user back to login when exiting a station or pressing EXIT. The only intentional “go to login” after sign-out is in **signOutFully()** and in **onAuthStateChange(SIGNED_OUT)**.
- **Supabase/session:** If the user sees the login screen again **without** clicking SIGN OUT, then either:
  - **SIGNED_OUT** is being emitted by Supabase (e.g. session expiry, token refresh behavior, or sign-out in another tab), and the app’s **onAuthStateChange** correctly shows login, or
  - **getSession()** is returning null/error on a subsequent run (e.g. authBootstrap run again, or a second load), and the app shows login.

So “sign in twice” in the sense of “I signed in and then was shown login again without clicking SIGN OUT” is most likely **Supabase session handling** (or environment: multiple tabs, storage cleared, etc.), with the app reacting correctly to **SIGNED_OUT** or to no session. The app’s own flows (station exit, EXIT, launcher, enterByLauncher) do not perform or trigger a second sign-out.
