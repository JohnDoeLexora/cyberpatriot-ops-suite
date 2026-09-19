# Disable LLMNR / NetBIOS / WPAD

- **Catalog id:** `disable-llmnr-netbios-wpad`
- **Category:** network
- **Platforms:** windows
- **Risk:** mutate

> Turn off LLMNR, NetBIOS-over-TCP/IP, and WPAD on a Windows image.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Sets EnableMulticast=0 (LLMNR), SetTcpipNetbios 2 (disable), and WPAD AutoDetect/DisableWpad. Stops WinHttpAutoProxySvc. Local Windows image only.

## Why it scores in CyberPatriot

LLMNR/NBT-NS/WPAD spoofing is a classic Windows plant. Workstations do not need these name-resolution shortcuts.

## When to run it

Windows network pass with disable-smbv1 and audit-hosts-file. dryRun first to see current state.

## Step-by-step

1. dryRun:true — the result should show LLMNR/NetBIOS/WPAD on the unhardened image.
2. Confirm the README does not require NetBIOS name service (it almost never does).
3. Live confirm:true.
4. Re-run dryRun or audit-smb; LLMNR should be off and adapters NetBIOS-disabled.

## What “good” looks like

- EnableMulticast=0 and NetBIOS disabled on IP-enabled adapters.
- WPAD AutoDetect off and WinHttpAutoProxySvc disabled.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If a dinosaur README required NetBIOS browsing, stop. Otherwise disable it.
- Local image only — this does not attack LLMNR on other hosts.

## Related ops

- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`disable-smbv1`](./disable-smbv1.md) — Disable SMBv1

