# Audit screensaver / idle lock

- **Catalog id:** `audit-idle-lock`
- **Category:** auth
- **Platforms:** both
- **Risk:** read

> Check screensaver/idle lock: TMOUT, logind IdleAction, ScreenSaverIsSecure.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Linux: TMOUT in profile and systemd-logind IdleAction. Windows: ScreenSaveActive, ScreenSaverIsSecure, ScreenSaveTimeOut. Unlocked idle sessions are a frequent policy item.

## Why it scores in CyberPatriot

Idle lock is a common ‘physical access’ scoring item on both platforms. A missing TMOUT or ScreenSaverIsSecure=0 is an easy miss.

## When to run it

Auth/policy pass with audit-password-policy and audit-uac.

## Step-by-step

1. Run the op. Note TMOUT, IdleAction, and Windows screensaver secure/timeout.
2. On Linux set TMOUT in /etc/profile.d and IdleAction=lock if this is a workstation.
3. On Windows enable a password-protected screensaver with a short timeout (this op is read-only).
4. Re-run.

## What “good” looks like

- TMOUT set to a few minutes, or logind lock on idle.
- Windows ScreenSaverIsSecure=1 with a reasonable timeout (not 9999).

## Risks / confirm notes

- Read-only.
- A very short TMOUT can annoy a scored interactive service — README first.

## Related ops

- [`audit-password-policy`](./audit-password-policy.md) — Audit password policy
- [`audit-uac`](./audit-uac.md) — Audit User Account Control
- [`enable-account-lockout`](./enable-account-lockout.md) — Enable account lockout
- [`disable-guest-account`](./disable-guest-account.md) — Disable Guest account

