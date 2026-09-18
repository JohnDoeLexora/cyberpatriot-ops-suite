# Audit Remote Desktop

- **Catalog id:** `audit-rdp`
- **Category:** network
- **Platforms:** windows
- **Risk:** read

> See whether Remote Desktop is on, and whether NLA is on if it stays.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Checks fDenyTSConnections, NLA, and TermService. RDP should be off unless the README requires it; NLA on if it stays.

## Why it scores in CyberPatriot

Open RDP without NLA is a common Windows finding. Extra RDP when not required is also scored.

## When to run it

Windows network pass with audit-firewall and list-groups (Remote Desktop Users).

## Step-by-step

1. README: is RDP a required service?
2. Run the audit.
3. If not required: disable-rdp.
4. If required: leave it on, require NLA, restrict Remote Desktop Users.

## What “good” looks like

- RDP off when not required.
- If on: NLA enabled, TermService running, membership tight.

## Risks / confirm notes

- Read-only.
- Disabling RDP when it is the only remote path can strand you — know your console story.

## Related ops

- [`disable-rdp`](./disable-rdp.md) — Disable Remote Desktop
- [`list-groups`](./list-groups.md) — List local groups
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports

