# Disable Telnet

- **Catalog id:** `disable-telnet`
- **Category:** services
- **Platforms:** both
- **Risk:** mutate

> Stop Telnet and block tcp/23 on the host firewall.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Disables telnetd / TlntSvr / telnet.socket and adds a local deny for tcp/23.

## Why it scores in CyberPatriot

Telnet is almost never required and almost always scored. Combining unit disable + firewall is belt and suspenders.

## When to run it

As soon as audit-ftp-telnet or flag-risky-services shows Telnet and the README does not require it.

## Step-by-step

1. Confirm README does not require Telnet (it shouldn’t).
2. dryRun:true, then live confirm:true.
3. Re-run audit-ftp-telnet and audit-listening-ports.

## What “good” looks like

- Telnet unit disabled.
- Nothing listening on 23.
- Host firewall denies 23.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Local image only; this does not scan or block other teams.

## Related ops

- [`audit-ftp-telnet`](./audit-ftp-telnet.md) — Audit FTP and Telnet
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`disable-legacy-r-services`](./disable-legacy-r-services.md) — Disable rsh/rlogin/rexec

