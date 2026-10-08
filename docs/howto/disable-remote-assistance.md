# Disable Remote Assistance

- **Catalog id:** `disable-remote-assistance`
- **Category:** windows
- **Platforms:** windows
- **Risk:** mutate

> Turn off Remote Assistance offer/full-control on the local image.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Sets fAllowToGetHelp=0 and fAllowFullControl=0 under HKLM Remote Assistance. Complements disable-rdp; does not touch other hosts.

## Why it scores in CyberPatriot

Remote Assistance is a separate Windows scoring checkbox from RDP and is almost never authorized.

## What it changes

Sets fAllowToGetHelp and fAllowFullControl to 0 under HKLM\SYSTEM\CurrentControlSet\Control\Remote Assistance.

## How to undo

If a backup was made, restore from %ProgramData%\CyberPatriotOps\backups\<ts>\. Set fAllowToGetHelp back to 1 only if the README requires Remote Assistance.

## When to run it

With disable-rdp and disable-remote-registry.

## Step-by-step

1. Read the README. If a help-desk Remote Assistance item is required (rare), stop.
2. dryRun:true, then live confirm:true.
3. System Properties → Remote should show Remote Assistance unchecked.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: fAllowToGetHelp=0.

## What “good” looks like

- fAllowToGetHelp=0.
- RDP handled separately via disable-rdp if the README does not need it.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- This is not an attack against another team’s Remote Assistance.
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`disable-rdp`](./disable-rdp.md) — Disable Remote Desktop
- [`audit-rdp`](./audit-rdp.md) — Audit Remote Desktop
- [`disable-remote-registry`](./disable-remote-registry.md) — Disable Remote Registry
- [`hunt-remote-access-tools`](./hunt-remote-access-tools.md) — Hunt remote-access tools and browser extensions

