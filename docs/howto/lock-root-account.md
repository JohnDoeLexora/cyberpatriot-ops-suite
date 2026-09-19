# Lock the root password

- **Catalog id:** `lock-root-account`
- **Category:** users
- **Platforms:** linux
- **Risk:** mutate

> Lock the root password with passwd -l (UID 0 remains).

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

passwd -l root so password auth as root fails. sudo can stay. Does not delete root or extra UID 0 accounts (use disable-user / audit-uid-zero for those).

## Why it scores in CyberPatriot

CAMS and Ubuntu checklists lock root so the only path is sudo for authorized admins.

## When to run it

After you have a working sudo admin from allowed-admins.txt. Not before.

## Step-by-step

1. Confirm alice (or another README admin) can sudo.
2. dryRun:true, then live confirm:true.
3. Do not lock root if the README requires a console root password — read it twice.

## What “good” looks like

- root still UID 0, password locked.
- sudo still works for allowed admins.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Locking root before you have sudo is a self-own. Check list-admin-users first.

## Related ops

- [`lock-user`](./lock-user.md) — Lock a local user password
- [`disable-root-ssh`](./disable-root-ssh.md) — Disable SSH root login
- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers
- [`audit-uid-zero`](./audit-uid-zero.md) — Audit UID 0 accounts

