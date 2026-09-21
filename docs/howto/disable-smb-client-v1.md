# Disable SMBv1 client leftovers

- **Catalog id:** `disable-smb-client-v1`
- **Category:** windows
- **Platforms:** windows
- **Risk:** mutate

> Turn off leftover SMBv1 *client* knobs after the server feature is gone.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Sets EnableSMB1Protocol false on the SMB client, disables the SMB1Protocol optional feature if it remains, and stops mrxsmb10. Complements disable-smbv1 (server/feature) and disable-optional-windows-features.

## Why it scores in CyberPatriot

SMBv1 client leftovers still negotiate SMBv1 even when the server feature is off. Scoring and WannaCry-class exposure both care.

## When to run it

Right after disable-smbv1 / disable-optional-windows-features on a Windows image.

## Step-by-step

1. Run audit-smb so you know SMBv1 is actually still on the client.
2. dryRun:true, then live confirm:true.
3. Re-run audit-smb. SMBv2/3 can remain if shares are required.

## What “good” looks like

- EnableSMB1Protocol false on the client.
- mrxsmb10 stopped/disabled. SMBv2/3 may stay.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If a dinosaur README required SMBv1 (almost never), stop. Otherwise disable it. Does not scan other hosts.

## Related ops

- [`disable-smbv1`](./disable-smbv1.md) — Disable SMBv1
- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba
- [`disable-optional-windows-features`](./disable-optional-windows-features.md) — Disable optional Windows features
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall

