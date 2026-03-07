# Deployment consistency report

**Goal:** Verify deployed app (Vercel) matches current local source. No redesign; find cause of any copy/visual drift only.

---

## 1. Canonical local source (current `index.html`)

Use this as the **expected** state. Compare to what you see on the live URL.

| Location | Exact string(s) in source |
|----------|---------------------------|
| **Add job buttons** | `+ ADD JOB` (bar + jobs page toolbar) |
| **Import CSV** | `↑ IMPORT CSV` |
| **Jobs filter (select)** | First option: `ALL JOBS`. Options: `PRESSING`, `QUEUED`, `ASSEMBLY`, `ON HOLD`, `DONE` |
| **QC picker label** | `SELECT JOB FOR THIS REJECT` (static HTML and in `renderQC`) |
| **Panel footer** | `CANCEL`, `DELETE JOB`, `SAVE JOB` |
| **Confirm modal** | Title: `DELETE JOB?`. Body: `REMOVE … ? CANNOT BE UNDONE.` Buttons: `CANCEL`, `CONFIRM` |
| **Billing toggle** | `INVOICE & PAYMENT DETAILS` and `(EXPAND)` |
| **Panel section headers** | `1 JOB DETAILS` (primary), `2 FORMAT & SPEC`, `3 ASSETS`, `4 PROGRESS` (primary), `5 NOTES` (recede), `6 BILLING` (recede) |
| **Press card assign dropdown** | First option: `— ASSIGN JOB` |

**Note:** The **Status** dropdown inside the job panel (id `jStat`) still uses mixed case in source: "Queued", "Pressing", "Assembly", "On Hold", "Done". That is intentional in current source (only toolbar filter was normalized). If live shows uppercase there, live would be from a different edit.

---

## 2. Mismatch check (you do this)

1. Open the **live Vercel URL** in a browser.
2. For each row in the table above, confirm the visible text matches.
3. If anything differs, note: **what you see on live** vs **expected (table above)**.

---

## 3. Root cause (if live ≠ source)

| Cause | What to check | Fix |
|-------|----------------|-----|
| **Stale deploy** | Vercel last deploy time vs last commit (`977f338`). | Trigger a new deploy from Vercel dashboard (Deployments → … → Redeploy) or push an empty commit: `git commit --allow-empty -m "chore: trigger deploy" && git push` |
| **Wrong branch** | Vercel project → Settings → Git → Production Branch. | Set to `main` (or the branch you commit to) and redeploy. |
| **Cached asset** | Browser or CDN cache serving old `index.html`. | Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) or open in incognito. If still wrong, purge Vercel cache or redeploy. |
| **Local not committed** | This workspace shows clean tree; your real machine might have uncommitted edits. | If the canonical strings above are what you want live: commit and push from the repo that has those changes, then redeploy. |
| **Build output wrong** | App is static; Vercel should serve repo files. No build step in repo. | If you added a build (e.g. env inject) that overwrites `index.html`, ensure it uses current `index.html` as input. |
| **Duplicate HTML** | Only one `index.html` in repo (root). | Not applicable. |

---

## 4. Minimal fix

- **If live matches the table:** No code change. No deploy step needed.
- **If live is stale/wrong branch/cache:** No code change. **Run:** push latest (if needed), then in Vercel → Deployments → **Redeploy** the latest deployment, or push an empty commit to trigger a new build.
- **If live differs because a different commit is deployed:** Ensure `main` (or your production branch) has the commit that contains the strings in the table, then **Redeploy** from that branch.

---

## 5. Repo state at report time

- **Branch:** main (up to date with origin/main)
- **Working tree:** clean
- **Last commit:** `977f338 "elegantrobotpass2"`
- **Single `index.html`:** at repo root; no other HTML entrypoint found.
