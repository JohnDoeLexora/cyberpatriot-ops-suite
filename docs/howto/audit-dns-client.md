# Audit DNS client / DoH

- **Catalog id:** `audit-dns-client`
- **Category:** network
- **Platforms:** windows
- **Risk:** read

> Read DNS servers and DoH on the local adapters — do not query those names.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists DnsClientServerAddress, DoH, and NRPT. Flags 10.x/bogus servers. Complements audit-hosts-file (poisoning) without contacting those hosts.

## Why it scores in CyberPatriot

A planted DNS server or hosts sinkhole is how images break Windows Update and Defender. Seeing the adapter list is the check.

## When to run it

Windows network pass with audit-hosts-file and clear-suspicious-hosts.

## Step-by-step

1. Run the op. Note unexpected 10.x/RFC1918 DNS servers.
2. If hosts-file poisoning is also present, run audit-hosts-file / clear-suspicious-hosts next.
3. Do not nslookup the scoring server or other teams. Local config only.

## What “good” looks like

- DNS servers match the README or a normal ISP/AD resolver.
- No query was made to those names from this op.

## Risks / confirm notes

- Read-only. Changing DNS is a separate admin action.
- Do not probe other hosts or the CCS. Authorized-image only.

## Related ops

- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file
- [`clear-suspicious-hosts`](./clear-suspicious-hosts.md) — Clear suspicious hosts-file entries
- [`audit-wifi-profiles`](./audit-wifi-profiles.md) — Audit leftover Wi-Fi profiles
- [`disable-llmnr-netbios-wpad`](./disable-llmnr-netbios-wpad.md) — Disable LLMNR / NetBIOS / WPAD

