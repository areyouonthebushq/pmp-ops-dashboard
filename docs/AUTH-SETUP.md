# PMP OPS — Auth Setup (Supabase Email/Password)

## Overview

The app uses **Supabase Auth** with email/password when `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set. When they are not set, the app runs in **local mode** (no login, launcher shown immediately; data in localStorage only).

- **Auth enabled**: Login screen → after sign-in, launcher → stations. Session is restored on refresh. EXIT signs out and returns to login.
- **Auth disabled**: Launcher shown immediately (current behavior). EXIT returns to launcher only.
- **Supabase configured but init fails** (e.g. CDN down): Launcher is shown with an explicit “Local mode — Supabase unavailable” banner; data is not synced.

## File-by-File Changes

### New files

| File | Purpose |
|------|--------|
| `supabase/auth-and-profiles.sql` | Creates `public.profiles` table, RLS, and trigger to create a profile row when a user signs up. Run once in Supabase SQL Editor after `schema.sql`. |
| `docs/AUTH-SETUP.md` | This file. |

### Modified files

| File | Changes |
|------|--------|
| **index.html** | Added `#loginScreen` (login form: email, password, SIGN IN, error area). Added `#localModeBanner` inside mode screen for explicit local-fallback message. |
| **styles.css** | Added `.auth-screen`, `.auth-wrap`, `.auth-form`, `.auth-error`, `.auth-btn`, and `.local-mode-banner` so login and banner match the design system. |
| **supabase.js** | Added: `getSession()`, `signInWithPassword()`, `signOut()`, `onAuthStateChange()`, `getProfile(userId)`, `getClientOrNull()`. No change to existing data APIs. |
| **app.js** | **Bootstrap**: If Supabase not configured → show launcher. If configured → init Supabase; on success, get session. If session → fetch profile, show launcher, subscribe to auth changes. If no session → show login and wire form. On Supabase init failure → show launcher + local banner. **Login form**: submit calls `signInWithPassword`, then `getProfile`, then show launcher; errors shown in `#loginError`. **doLogout**: When auth is enabled, calls `signOut()` then shows login screen; otherwise unchanged (show launcher). **Helpers**: `authRequired()`, `showLoginScreen()`, `hideLoginScreen()`, `showLauncher()`, `showLauncherWithLocalBanner()`, `fetchAndStoreProfile()`, `wireLoginForm()`. |

### What stayed the same

- All station shells, launcher buttons, admin/floor/press/QC behavior.
- Data layer: `Storage.loadAllData()`, `saveJob`, etc. unchanged; `useSupabase()` still drives Supabase vs localStorage.
- No role-based UI locking yet; profile is fetched and stored in `window.PMP.userProfile` for future use.
- Supabase config block and `supabase.js` load order in `index.html` unchanged.

## Supabase SQL to Run

1. **Schema** (if not already applied): `supabase/schema.sql`
2. **Auth & profiles** (once): `supabase/auth-and-profiles.sql`
3. **Policies** (if not already applied): `supabase/policies.sql`

In the Supabase Dashboard:

- **Authentication → Providers**: Enable **Email**.
- **Authentication → Users**: Create a user (email + password) for testing, or use Sign up from the app if you add a sign-up flow later.

If you already have users in `auth.users`, run the optional backfill in `auth-and-profiles.sql` (uncomment the `INSERT INTO public.profiles ...` block) so they get a profile row.

## Manual QA Checklist

- [ ] **No Supabase config** (comment out or remove `SUPABASE_URL` / `SUPABASE_ANON_KEY` in index.html): Page load shows launcher immediately; no login. EXIT returns to launcher.
- [ ] **Supabase configured + no user**: Page load shows “Checking session…” then login form. Invalid email/password shows error in red; success shows launcher.
- [ ] **Supabase configured + signed in**: Page load shows “Checking session…” then launcher (no login form). Choose Admin (or any station), use app, then EXIT → login form. Refresh while signed in → launcher again (session restore).
- [ ] **Sign out**: From app bar, EXIT → login form. Sign in again → launcher.
- [ ] **Local fallback**: With Supabase URL/KEY set but Supabase CDN blocked or key invalid, launcher appears with “Local mode — Supabase unavailable. Data not synced.” (and optional toast). No login form.
- [ ] **Stations unchanged**: After login, Admin, Floor Manager, Press (p1–p4), QC, TV, and FAB behave as before; no new role-based restrictions.
