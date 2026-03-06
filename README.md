# PMP OPS v7.1

Vinyl pressing plant operations dashboard — jobs, presses, todos, QC log, production progress.

## Supabase setup (multi-user persistence)

1. **Create a Supabase project** at [supabase.com](https://supabase.com).

2. **Run the SQL in order** (Dashboard → SQL Editor):
   - `supabase/schema.sql` — creates tables (jobs, progress_log, presses, todos, qc_log)
   - `supabase/policies.sql` — enables RLS and policies for authenticated users
   - `supabase/seed.sql` — optional sample data

3. **Configure the app** with your project URL and anon key:
   - **Option A (static):** In `index.html`, set the config script before `</head>`:
     ```html
     <script>
       window.SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
       window.SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
     </script>
     ```
   - **Option B (Vercel):** Add env vars `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the Vercel dashboard, then add a build step that injects them into `index.html` (e.g. replace placeholders).

4. **Auth (optional):** RLS policies currently allow full CRUD for `authenticated` users. To use the app with Supabase Auth, sign in and the client will send the session. For local/demo without auth, you can temporarily add anon policies (see comment in `policies.sql`) or use the service role (server-side only).

5. **Fallback:** If `SUPABASE_URL` or `SUPABASE_ANON_KEY` is empty, the app uses **localStorage** only (single-browser, no sync).

## Local run

Open `index.html` in a browser or serve the folder (e.g. `npx serve .`). With Supabase configured, data loads from and saves to Supabase. Without it, data stays in localStorage.

## File layout

- `index.html` — single-file app (HTML, CSS, JS)
- `supabase.js` — Supabase API layer (load/save jobs, presses, todos, progress, QC)
- `supabase/schema.sql` — table definitions
- `supabase/policies.sql` — RLS policies
- `supabase/seed.sql` — sample data
- `.env.local.example` — env var template
