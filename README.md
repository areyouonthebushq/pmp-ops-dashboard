# PMP OPS — Vinyl Press Floor Operations System

**Physical Music Products · Nashville, TN**
[pmp-ops-dashboard.vercel.app](https://pmp-ops-dashboard.vercel.app/)

---

## What it is

PMP OPS is a real-time operations system for a vinyl record pressing plant. It tracks every job from intake through pressing, QC, assembly, and shipping — across multiple presses, multiple operators, and multiple roles.

It replaces whiteboards, text messages, spreadsheets, and the question "where is that job?"

## Who uses it

| Role | Station | What they do |
|------|---------|-------------|
| **Admin** | Full workspace | Create jobs, assign presses, manage assets, export data |
| **Press Operator** | LOG + Floor | Log pressed quantities via LOG console and Floor (Press Station purged) |
| **QC Inspector** | QC Station | Rapid reject logging by defect type, tied to jobs |
| **Floor Manager** | Floor Manager | Scan-first operations overview, quick-edit statboard |
| **Everyone** | TV Mode | Wall-mounted display showing press status and queue |

## What it tracks

- **Jobs**: Catalog, artist, album, format, color spec, quantity, due date, status lifecycle (queue → pressing → assembly → hold → done)
- **Presses**: 4 presses (3 LP + 1 7"), online/idle/warning/offline status, automatic job assignment and release
- **Production Progress**: Append-only log of pressed/QC passed/rejected quantities per person, dual-layer progress bars (yellow = pressed, green = QC passed)
- **Assets**: 15-item checklist per job (stampers through outer packaging), received/N/A/pending with date and person tracking
- **QC Rejects**: 6 defect types (flash, blemish, off-center, audio, untrimmed, biscuit/flash), date-navigable history, job-linked
- **Todos**: Daily (auto-reset midnight), weekly (auto-reset Monday), standing (persistent)

## Architecture

Single-page vanilla HTML/CSS/JS application. No framework, no build step.

```
index.html      → HTML structure (~600 lines)
styles.css      → All CSS including design system, stations, themes (~2,000 lines)
app.js          → All application logic, rendering, state management (~2,000 lines)
supabase.js     → Persistence layer: Supabase API mapping
```

### Persistence

- **Primary**: Supabase (PostgreSQL) — 5 tables: `jobs`, `progress_log`, `presses`, `todos`, `qc_log`
- **Fallback**: localStorage (when Supabase is unavailable)
- **Polling**: 15-second sync interval, skips render when panel is open
- **Guard**: Empty Supabase responses don't overwrite populated local state (transient failure protection)

### Design System

Five semantic colors — color carries meaning, not decoration:

| Token | Hex | Meaning |
|-------|-----|---------|
| `--g` | `#00e676` | Good / complete / online |
| `--w` | `#ffb300` | Warning / needs attention |
| `--r` | `#ff3d3d` | Blocked / overdue / offline |
| `--p` | `#e040fb` | 7" format / accent |
| `--d` | `#c8d6c8` | Data / body text |

Three fonts: Special Elite (identity), VT323 (navigation), Inconsolata (data).

Minimal theme available (toggle: `MIN` button) — same layout, black/white/gray, no glow.

### Station System

Role-based stations share a common `station-shell` CSS component and read from the same state object `S`. Each station has scoped edit permissions:

- **Admin**: Full panel access, all fields editable
- **QC Station**: Log rejects only
- **Floor Manager**: Quick-edit statboard (status, press, location, due, notes)

## Deployment

Deployed on Vercel at [pmp-ops-dashboard.vercel.app](https://pmp-ops-dashboard.vercel.app/).

### Supabase Setup

1. Create project at [supabase.com](https://supabase.com)
2. SQL Editor → run `supabase/schema.sql`, then `supabase/policies.sql`
3. (Optional) Run `supabase/seed.sql` for demo data
4. Settings → API → copy Project URL and anon public key
5. Paste into `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY` in `index.html`
6. Deploy to Vercel

### Current Auth

Anon key with open RLS policies (full CRUD for `anon` role). Suitable for internal/demo use. Supabase Auth can be added later — swap `anon` policies to `authenticated`, add login screen.

## File Structure

```
pmp-ops-dashboard/
├── index.html              # HTML structure
├── styles.css              # Design system + all CSS
├── app.js                  # Application logic
├── supabase.js             # Supabase API layer
├── supabase/
│   ├── schema.sql          # CREATE TABLE statements
│   ├── policies.sql        # RLS policies (anon access)
│   └── seed.sql            # Demo data (5 jobs, 4 presses, QC history)
├── .env.local.example      # Environment variable template
└── README.md
```

## Status

**Production-adjacent prototype.** Data persists across devices and browsers via Supabase. All core workflows functional. Used for real job tracking at Physical Music Products.

### Known Limitations

- No authentication (anon key, open RLS)
- Todo reset is client-side only (requires someone to open the app)
- CSV import can break on 7" format (quote character in field value)
- Single-page: no URL routing, no deep links