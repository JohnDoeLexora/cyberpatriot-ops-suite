# Install and enable fail2ban

- **Catalog id:** `enable-fail2ban`
- **Category:** auth
- **Platforms:** linux
- **Risk:** mutate

> Install the distro fail2ban package and enable the service.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

apt/dnf install fail2ban, then systemctl enable --now. If the package is not in the image’s repos, the op reports unavailable — it will not curl a random installer.

## Why it scores in CyberPatriot

SSH brute-force defense on the local image is a common Linux item. Missing universe repo should not panic you.

## When to run it

After harden-sshd / disable-root-ssh, if the README does not forbid extra packages.

## Step-by-step

1. dryRun:true to see whether fail2ban is already active.
2. Live confirm:true. If apt/dnf cannot find the package, record that and move on.
3. This jails local sshd. It is not a remote attack tool.

## What “good” looks like

- fail2ban.service active.
- Or a clear ‘package unavailable’ note — not a random GitHub install.

## Risks / confirm notes

- Mutation (package install + enable). Live requires confirm:true.
- Do not fetch unofficial fail2ban installers. Do not point it at other teams.

## Related ops

- [`harden-sshd`](./harden-sshd.md) — Harden sshd_config
- [`disable-root-ssh`](./disable-root-ssh.md) — Disable SSH root login
- [`enable-account-lockout`](./enable-account-lockout.md) — Enable account lockout
- [`audit-logging`](./audit-logging.md) — Audit logging configuration

