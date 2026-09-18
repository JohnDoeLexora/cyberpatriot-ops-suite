# Harden sshd_config

- **Catalog id:** `harden-sshd`
- **Category:** network
- **Platforms:** linux
- **Risk:** mutate

> Write a conservative sshd drop-in and reload sshd.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Drop-in with PermitRootLogin no, PermitEmptyPasswords no, X11Forwarding no, MaxAuthTries 4, Protocol 2. Reloads sshd.

## Why it scores in CyberPatriot

One confirmed mutate beats five error-prone hand edits, and the audit op can verify it.

## When to run it

After ssh-hardening-audit, with a sudo user session already open.

## Step-by-step

1. Keep a local/console session as a sudo README user.
2. dryRun:true to preview the drop-in path (99-cp-hardening.conf).
3. Live confirm:true.
4. Re-run ssh-hardening-audit. If sshd is required, confirm it reloaded successfully.

## What “good” looks like

- Drop-in present, audit clean.
- Team can still SSH as a non-root authorized user.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- A bad sshd reload can drop remote access — console first.
- Local sshd only; not a tool for connecting to other hosts.

## Related ops

- [`ssh-hardening-audit`](./ssh-hardening-audit.md) — SSH hardening audit
- [`disable-root-ssh`](./disable-root-ssh.md) — Disable SSH root login
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`audit-ssh-authorized-keys`](./audit-ssh-authorized-keys.md) — Audit SSH authorized_keys

