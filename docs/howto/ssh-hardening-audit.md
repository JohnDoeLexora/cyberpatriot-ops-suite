# SSH hardening audit

- **Catalog id:** `ssh-hardening-audit`
- **Category:** network
- **Platforms:** linux
- **Risk:** read

> Read sshd_config for root login, empty passwords, protocol, and related knobs.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Parses PermitRootLogin, PasswordAuthentication, Protocol, X11Forwarding, MaxAuthTries, PermitEmptyPasswords, ciphers/MACs, AllowUsers. Read-only; no outbound SSH.

## Why it scores in CyberPatriot

sshd_config is a dense scoring surface. PermitRootLogin yes and PermitEmptyPasswords yes are the usual plants.

## When to run it

Linux network pass, before harden-sshd / disable-root-ssh.

## Step-by-step

1. Confirm SSH is required (almost always).
2. Run the audit and list every weak setting.
3. Apply harden-sshd (and disable-root-ssh if you want that one knob isolated).
4. Re-run the audit.

## What “good” looks like

- PermitRootLogin no, PermitEmptyPasswords no, Protocol 2, X11Forwarding no, MaxAuthTries ≤ 4.
- sshd still running.

## Risks / confirm notes

- Read-only.
- Do not disable sshd if it is a required service just to ‘hide’ findings — harden it.

## Related ops

- [`harden-sshd`](./harden-sshd.md) — Harden sshd_config
- [`disable-root-ssh`](./disable-root-ssh.md) — Disable SSH root login
- [`audit-ssh-authorized-keys`](./audit-ssh-authorized-keys.md) — Audit SSH authorized_keys
- [`list-admin-users`](./list-admin-users.md) — List administrators and sudoers

