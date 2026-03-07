# PMP OPS — Backup and recovery

## 1. App feature: operational export (in-app)

**What the app does:** An admin can click **💾 BACKUP** in the top bar to download a single JSON file containing a point-in-time snapshot of operational data. Same visibility as **↓ CSV** (admin only).

**Contents of the backup file:**

- `version`: 1
- `exportedAt`: ISO timestamp
- `jobs`: all jobs (including embedded `progressLog`)
- `presses`: all press rows
- `todos`: `{ daily, weekly, standing }`
- `qc_log`: all QC log entries
- `progress_log`: flattened array of all progress entries (for easy restore to `progress_log` table)

**Format:** JSON (human-readable, auditable). Filename: `pmp-ops-backup_YYYY-MM-DDTHH-MM-SS.json`.

**Use:** Manual “pull a backup now” (e.g. before a big change, or as part of a daily process). Not a substitute for Supabase’s own backups.

---

## 2. Recommended Supabase backup / recovery settings

**Done in Supabase Dashboard and/or billing — not in app code.**

| Setting | Recommendation | Where |
|--------|------------------|--------|
| **Daily backups** | Enable (default on paid plans). Free tier: daily backups with 7-day retention. | Dashboard → Project Settings → Database (or Backups). |
| **Point-in-time recovery (PITR)** | Recommended for production. Restore to any second within the retention window. | Pro/Team/Enterprise: Dashboard → Project Settings → Add-ons → PITR. Choose retention (e.g. 7 days). |
| **Physical backups** | Required for PITR; typically on by default on Pro+. | Same area as PITR / Backups. |
| **Backup schedule** | Supabase manages daily (and with PITR, continuous WAL). No app action. | N/A |

**Summary:** Use Supabase’s built-in daily backups as the primary safety net. For production, add PITR if your plan supports it so you can restore to a specific time (e.g. before an accidental delete or bad migration).

---

## 3. Point-in-time recovery (PITR) strategy

- **If your project tier supports PITR (Pro+):** Enable PITR with at least 7-day retention. Then you can restore the database to a new project (or time) from the Dashboard (Database → Backups → Restore to point in time). Document the restore procedure and test it periodically (see runbook).
- **If you are on Free tier:** You get daily backups and 7-day retention only. No PITR. Rely on daily backups plus in-app BACKUP exports for extra safety (e.g. before risky changes).

---

## 4. Operational runbook (draft)

**Daily backup expectation**

- Supabase performs automated daily backups (and with PITR, continuous WAL). No daily action required from the team for “backup taken.”
- Optional: Once per day (e.g. end of shift), an admin runs **💾 BACKUP** in PMP OPS and stores the JSON file in a designated place (e.g. shared drive, backup bucket). This gives an auditable, app-level snapshot in addition to Supabase.

**Restore test cadence**

- At least **quarterly**: Perform a restore test (e.g. restore a backup to a staging Supabase project or a local Postgres instance from the JSON export, or use Supabase “Restore to point in time” on a clone project). Confirm jobs, presses, todos, qc_log, progress_log are present and consistent.
- Document who ran the test and the outcome (e.g. in a simple runbook log or ticket).

**Who owns backup checks**

- **Backup availability:** [Role, e.g. “Tech lead” or “Ops manager”] confirms that Supabase backups are enabled and (if applicable) PITR is on and within retention.
- **Restore test:** [Same or delegated role] owns running the quarterly restore test and recording the result.
- **In-app BACKUP exports:** Any admin can run them; ownership of “we keep a daily export in X location” should be assigned (e.g. floor lead or ops).

*(Replace bracketed roles with your actual roles.)*

---

## 5. What must be done outside the codebase (gaps)

These cannot be solved purely in app code:

| Need | Where / how |
|------|--------------|
| Enable/configure Supabase daily backups | Supabase Dashboard (and plan). |
| Enable PITR and set retention | Supabase Dashboard → Add-ons → PITR (Pro+). |
| Restore from Supabase backup (full DB or PITR) | Supabase Dashboard → Database → Backups → Restore. |
| Store and retain in-app BACKUP JSON files | Process/policy: where to save, retention, access. |
| Restore from a BACKUP JSON file into Supabase | Not implemented in-app. Options: (1) Manual re-import via SQL/scripts using the JSON structure; (2) Future app feature “Restore from backup file.” |
| Audit that backups exist and restore works | Operational runbook and assigned owner (see above). |

**Summary:** The app provides an **export** (BACKUP button) and clear backup **format**. Everything else — enabling Supabase backups/PITR, running restores, storing exports, and testing — is **infrastructure and process**, not in the app code.
