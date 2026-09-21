# Audit leftover Wi-Fi profiles

- **Catalog id:** `audit-wifi-profiles`
- **Category:** windows
- **Platforms:** windows
- **Risk:** read

> List saved SSIDs and auth types. Never prints Wi-Fi keys.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Inventories netsh WLAN profiles: SSID + authentication only. Flags Open networks and leftover home/contest SSIDs. `key=clear` is never used.

## Why it scores in CyberPatriot

Leftover Open or home Wi-Fi profiles are a Windows extras item and a persistence/credential leak if keys were printed — we do not print them.

## When to run it

Windows network pass with audit-dns-client and disable-llmnr-netbios-wpad.

## Step-by-step

1. Run the op. Note Open vs WPA2 profiles.
2. Delete leftover SSIDs on the image (`netsh wlan delete profile`) if they are not README-required. This op is read-only.
3. Confirm the result has keyOmitted=true and no PSK/EAP password fields.

## What “good” looks like

- Only README-required SSIDs remain.
- No PSK, EAP password, or key=clear material in the output.

## Risks / confirm notes

- Read-only. Do not run `netsh wlan show profile key=clear`.
- Do not put Wi-Fi keys in the coach packet or Git.

## Related ops

- [`audit-dns-client`](./audit-dns-client.md) — Audit DNS client / DoH
- [`disable-llmnr-netbios-wpad`](./disable-llmnr-netbios-wpad.md) — Disable LLMNR / NetBIOS / WPAD
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`export-coach-packet`](./export-coach-packet.md) — Export redacted coach packet ZIP

