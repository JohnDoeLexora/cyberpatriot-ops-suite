# Audit hosts file

- **Catalog id:** `audit-hosts-file`
- **Category:** network
- **Platforms:** both
- **Risk:** read

> Catch malicious redirects in /etc/hosts or drivers/etc/hosts.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads the hosts file for unexpected redirects (Windows Update, antivirus, scoring sites, social). Does not contact those hosts.

## Why it scores in CyberPatriot

Planted hosts entries can block updates or AV. That both costs update points and hides other findings.

## When to run it

Network pass, before apply-security-updates, and if updates seem ‘broken’.

## Step-by-step

1. Run the op. Expected: localhost, maybe the hostname.
2. Unexpected sinkholes of windowsupdate, defender, or scoring domains: plan to remove those lines on the image (this op is read-only).
3. Re-run after editing. Do not add your own redirects to third-party sites.

## What “good” looks like

- localhost and the machine hostname only, plus README-required entries.
- No Windows Update / AV sinkholes.

## Risks / confirm notes

- Read-only.
- Do not probe the redirected sites from the image as a ‘test.’

## Related ops

- [`check-pending-updates`](./check-pending-updates.md) — Check pending updates
- [`apply-security-updates`](./apply-security-updates.md) — Apply security updates
- [`enable-windows-defender`](./enable-windows-defender.md) — Enable Microsoft Defender
- [`audit-logging`](./audit-logging.md) — Audit logging configuration

