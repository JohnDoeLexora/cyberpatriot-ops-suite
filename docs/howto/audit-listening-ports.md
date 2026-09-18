# Audit listening ports

- **Catalog id:** `audit-listening-ports`
- **Category:** ports
- **Platforms:** both
- **Risk:** read

> List this image’s TCP/UDP listeners and flag the ugly ones.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Uses ss / Get-NetTCPConnection on the local image. Flags 23, 111, 139, 445, 512–514, 5900, 31337, 4444, and unexpected 0.0.0.0 binds. Does not scan other hosts.

## Why it scores in CyberPatriot

A listener is a service you forgot. Backdoor ports (31337, 4444) are planted; 23/445 are insecure services. Scoring and forensics both care.

## When to run it

Early, and after every service disable. Pair with list-services.

## Step-by-step

1. Run the op. Keep the README required ports (22, 80, 443, …) as the allowlist.
2. For each unexpected bind: identify the process, then disable that service or investigate find-backdoor-binaries.
3. Re-run until only required listeners remain.

## What “good” looks like

- 22/80/443 (or whatever the README lists) only.
- No 23, 31337, 4444, or mystery 0.0.0.0 binds.

## Risks / confirm notes

- Read-only local audit. This is not nmap against the LAN or other teams.
- Killing the wrong listener can drop a scored service — identify first.

## Related ops

- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries
- [`disable-telnet`](./disable-telnet.md) — Disable Telnet
- [`list-firewall-rules`](./list-firewall-rules.md) — List firewall rules

