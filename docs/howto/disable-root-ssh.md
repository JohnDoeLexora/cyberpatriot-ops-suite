# Disable SSH root login

- **Catalog id:** `disable-root-ssh`
- **Category:** auth
- **Platforms:** linux
- **Risk:** mutate

> Stop the root account from logging in through SSH.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Sets PermitRootLogin no in sshd_config and reloads ssh if it is a required service.

## Why it scores in CyberPatriot

PermitRootLogin yes is one of the most common Linux network findings. Scoring checks the sshd config, not whether you can brute-force root.

## When to run it

After ssh-hardening-audit, if the README still wants SSH itself (usually yes).

## Step-by-step

1. Run ssh-hardening-audit. Confirm SSH is a required service.
2. Keep a sudo user session open so you do not lock the team out.
3. dryRun:true, then live confirm:true.
4. Re-run the audit; PermitRootLogin should be no. Pair with harden-sshd for the rest of the checklist.

## What “good” looks like

- PermitRootLogin no.
- sshd still running if the README requires SSH.
- A non-root README admin can still sudo.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If you have no sudo user other than root, you can strand the image — check list-admin-users first.
- Does not listen on other machines; local sshd only.

## Related ops

- [`ssh-hardening-audit`](./ssh-hardening-audit.md) — SSH hardening audit
- [`harden-sshd`](./harden-sshd.md) — Harden sshd_config
- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers
- [`disable-user`](./disable-user.md) — Disable a local user

