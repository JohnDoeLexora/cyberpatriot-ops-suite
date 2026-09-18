# Disable Remote Desktop

- **Catalog id:** `disable-rdp`
- **Category:** network
- **Platforms:** windows
- **Risk:** mutate

> Turn Remote Desktop off and stop TermService when it is not required.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Sets fDenyTSConnections=1 and stops TermService if RDP is not a required service.

## Why it scores in CyberPatriot

When the README is silent on RDP, off is the scoring answer.

## When to run it

After audit-rdp says enabled and the README does not require RDP.

## Step-by-step

1. Confirm you have console or another admin path.
2. dryRun:true, then live confirm:true.
3. Re-run audit-rdp and audit-listening-ports (3389).

## What “good” looks like

- fDenyTSConnections=1
- TermService stopped
- 3389 closed

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Will refuse to be your only remote path if you still need it — README first.

## Related ops

- [`audit-rdp`](./audit-rdp.md) — Audit Remote Desktop
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`list-groups`](./list-groups.md) — List local groups
- [`disable-service`](./disable-service.md) — Disable a service

