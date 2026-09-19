# Disable Remote Registry

- **Catalog id:** `disable-remote-registry`
- **Category:** windows
- **Platforms:** windows
- **Risk:** mutate

> Stop and disable the RemoteRegistry service.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Stops RemoteRegistry and sets startup Disabled. Workstations do not need remote hive access.

## Why it scores in CyberPatriot

Remote Registry is a frequent CP plant and a scoring item even when RDP stays.

## When to run it

Windows services pass with disable-rdp and disable-remote-assistance.

## Step-by-step

1. Confirm the README does not require Remote Registry (it almost never does).
2. dryRun:true, then live confirm:true.
3. Re-run list-services / flag-risky-services — RemoteRegistry should be stopped/disabled.

## What “good” looks like

- RemoteRegistry Stopped, StartupType Disabled.
- list-services no longer shows RemoteRegistry as running.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Do not confuse this with disabling the whole Remote Desktop stack — that is disable-rdp.

## Related ops

- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`disable-rdp`](./disable-rdp.md) — Disable Remote Desktop
- [`disable-remote-assistance`](./disable-remote-assistance.md) — Disable Remote Assistance
- [`disable-service`](./disable-service.md) — Disable a service

