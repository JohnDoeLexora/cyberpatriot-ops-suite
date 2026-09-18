# Disable a service

- **Catalog id:** `disable-service`
- **Category:** services
- **Platforms:** both
- **Risk:** mutate

> Stop and disable one local service by name, with a required-list safety catch.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

systemctl disable --now / Set-Service -StartupType Disabled for a named unit. Refuses names in required-services.txt unless force is set.

## Why it scores in CyberPatriot

This is the generic hammer after flag-risky-services. Safer than a blind ‘disable all’ script.

## When to run it

When a specific non-required service is running and you do not have a specialized op for it.

## Step-by-step

1. Copy the exact service name from list-services.
2. Confirm it is not in the README or required-services.txt.
3. dryRun:true, then live confirm:true.
4. Re-run list-services; the unit should be inactive and disabled.

## What “good” looks like

- Target unit dead and disabled.
- Required services still running.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- force=true can disable a scored service — only if you are sure the README does not need it.
- Wrong name (sshd vs ssh) can take down remote access; keep a console session.

## Related ops

- [`list-services`](./list-services.md) — List services
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`disable-telnet`](./disable-telnet.md) — Disable Telnet
- [`audit-startup-items`](./audit-startup-items.md) — Audit startup items

