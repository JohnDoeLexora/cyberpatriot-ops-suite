# Restrict at/cron to root

- **Catalog id:** `restrict-cron-at`
- **Category:** scheduled
- **Platforms:** linux
- **Risk:** mutate

> Allow only root (and listed admins) to use crontab and at.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Writes /etc/cron.allow and /etc/at.allow with root (plus allowed-admins) and removes cron.deny/at.deny. Existing root cron jobs stay. Complements audit-cron.

## Why it scores in CyberPatriot

World-usable cron/at is how plants persist. Restricting the scheduler to root is a CAMS staple.

## When to run it

After audit-cron / audit-at-jobs, once you have copied any required user cron aside.

## Step-by-step

1. Run audit-cron and snapshot any README-required user crontab.
2. dryRun:true, then live confirm:true.
3. Re-run audit-cron. Unauthorized users should no longer be able to crontab -e.

## What “good” looks like

- cron.allow and at.allow contain root.
- cron.deny/at.deny gone.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If a README user must have a crontab, add them to cron.allow after — do not leave deny-open.

## Related ops

- [`audit-cron`](./audit-cron.md) — Audit cron jobs
- [`audit-at-jobs`](./audit-at-jobs.md) — Audit at jobs
- [`audit-persistence-deep`](./audit-persistence-deep.md) — Deep startup persistence audit
- [`sync-authorized-users`](./sync-authorized-users.md) — Sync users from allowlists

