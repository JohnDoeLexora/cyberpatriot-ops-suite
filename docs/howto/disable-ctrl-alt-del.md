# Disable Ctrl+Alt+Del and extra TTYs

- **Catalog id:** `disable-ctrl-alt-del`
- **Category:** kernel
- **Platforms:** linux
- **Risk:** mutate

> Mask ctrl-alt-del.target and extra serial gettys.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Masks the CAD reboot target and disables serial-getty@ttyS0. Does not disable tty1–tty6 needed for local login.

## Why it scores in CyberPatriot

CAD reboot is a cheap plant on a physical/console image. Extra serial gettys are unused attack surface.

## When to run it

Linux kernel extras with harden-sysctl, after you know a serial console is not required.

## Step-by-step

1. Confirm the README does not require a serial console.
2. dryRun:true, then live confirm:true.
3. tty1–6 stay. CAD should no longer reboot.

## What “good” looks like

- systemctl status ctrl-alt-del.target is masked.
- Local tty login still works.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Do not mask getty@tty1. Authorized-image only.

## Related ops

- [`harden-sysctl`](./harden-sysctl.md) — Apply sysctl hardening
- [`audit-idle-lock`](./audit-idle-lock.md) — Audit screensaver / idle lock
- [`disable-display-manager-guest`](./disable-display-manager-guest.md) — Disable display-manager guest and autologin
- [`lock-root-account`](./lock-root-account.md) — Lock the root password

