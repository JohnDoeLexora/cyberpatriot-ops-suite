# Audit Firefox/IE/Edge security baseline

- **Catalog id:** `audit-browser-baseline`
- **Category:** files
- **Platforms:** both
- **Risk:** read

> Firefox/IE/Edge baseline: Safe Browsing, password saving, SmartScreen — no dumps.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Checks system Firefox policies/user.js and IE/Edge SmartScreen / password-saving flags. Does not dump cookies, history, or saved passwords.

## Why it scores in CyberPatriot

Safebrowsing off and password-saving on a shared image are common browser findings. SmartScreen off is a Windows favorite.

## When to run it

Software/browser pass with hunt-remote-access-tools (extensions) and audit-hosts-file.

## Step-by-step

1. Run the op. Note safebrowsing, password manager, SmartScreen, and insecure protocol handlers.
2. Fix via enterprise policy / IE zone / Edge policy on the image (this op is read-only).
3. Do not export the profile; cookies and saved passwords stay on disk.

## What “good” looks like

- Safe Browsing / SmartScreen on.
- Password saving off on a shared competition image.
- No cookies or password blobs in the result.

## Risks / confirm notes

- Read-only. Never dump browser password stores into notes.
- Do not browse other teams’ sites as a ‘test’ of SmartScreen.

## Related ops

- [`hunt-remote-access-tools`](./hunt-remote-access-tools.md) — Hunt remote-access tools and browser extensions
- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`disable-autoplay`](./disable-autoplay.md) — Disable Autoplay

