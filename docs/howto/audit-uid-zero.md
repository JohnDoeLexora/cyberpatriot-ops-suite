# Audit UID 0 accounts

- **Catalog id:** `audit-uid-zero`
- **Category:** users
- **Platforms:** linux
- **Risk:** read

> Find every account with UID 0 — only root should own UID 0.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads passwd for UID 0. Extra UID 0 names (toor, sync-with-shell, etc.) are classic Linux backdoors. Windows is out of scope for this op.

## Why it scores in CyberPatriot

A second UID 0 user is root. Scoring engines love this plant. It is one of the highest-priority user findings on Linux images.

## When to run it

In the first pass of user audits, before you spend time on media files.

## Step-by-step

1. Run the op. Expect root. Anything else is a problem.
2. Record home and shell for extras (often /tmp/toor).
3. Disable or lock the extra account with disable-user / lock-user — do not try to “reassign UID” under the clock.
4. Re-run until only root has UID 0.

## What “good” looks like

- Exactly one UID 0 row: root, shell a normal admin shell, home /root.
- No toor, no second root in /tmp.

## Risks / confirm notes

- Read-only. Disabling the extra account is a separate mutate op (confirm:true).
- Do not delete root. Do not experiment with usermod -u 0 on other users.
- This is an inventory, not a privilege-escalation recipe.

## Related ops

- [`audit-duplicate-uids`](./audit-duplicate-uids.md) — Audit duplicate UIDs
- [`flag-suspicious-users`](./flag-suspicious-users.md) — Flag suspicious users
- [`disable-user`](./disable-user.md) — Disable a local user
- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers

