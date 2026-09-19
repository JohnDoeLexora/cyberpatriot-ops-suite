# Disable display-manager guest and autologin

- **Catalog id:** `disable-display-manager-guest`
- **Category:** auth
- **Platforms:** linux
- **Risk:** mutate

> Turn off LightDM/GDM guest sessions and autologin.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Writes a LightDM drop-in (allow-guest=false, autologin-user empty) and sets GDM AutomaticLoginEnable=false. Distinct from disable-guest-account, which locks the Guest user.

## Why it scores in CyberPatriot

Ubuntu images often ship guest sessions and autologin. CAMS-style checklists call this out separately from the Guest account.

## When to run it

Linux auth pass with disable-guest-account.

## Step-by-step

1. dryRun:true to see current allow-guest / AutomaticLoginEnable.
2. Live confirm:true.
3. Also run disable-guest-account so the Guest user itself is off.

## What “good” looks like

- No guest session on the greeter.
- No autologin user.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If the README requires autologin for a kiosk account, stop — that is rare on CP.

## Related ops

- [`disable-guest-account`](./disable-guest-account.md) — Disable Guest account
- [`lock-root-account`](./lock-root-account.md) — Lock the root password
- [`audit-idle-lock`](./audit-idle-lock.md) — Audit screensaver / idle lock
- [`disable-user`](./disable-user.md) — Disable a local user

