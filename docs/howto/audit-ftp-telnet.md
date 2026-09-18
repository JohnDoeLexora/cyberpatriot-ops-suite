# Audit FTP and Telnet

- **Catalog id:** `audit-ftp-telnet`
- **Category:** services
- **Platforms:** both
- **Risk:** read

> Detect Telnet and FTP servers, sockets, and ports 21/23.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Looks for telnet/ftp units and listeners. Anonymous FTP and Telnet are almost never kosher on CP images.

## Why it scores in CyberPatriot

Port 23 and anonymous FTP are checkbox findings. The audit tells you which package/unit to disable.

## When to run it

With flag-risky-services and audit-listening-ports.

## Step-by-step

1. Run the op. Note whether the problem is a socket, a daemon, anonymous_enable, or just an open port.
2. If not README-required, disable-telnet and/or disable-service for vsftpd/ftpd.
3. Re-run this audit and audit-listening-ports.

## What “good” looks like

- No telnet.socket / TlntSvr.
- No anonymous FTP.
- Ports 21/23 closed unless the README requires a locked-down FTP.

## Risks / confirm notes

- Read-only.
- If the README requires FTP, do not disable it — tighten anonymous off and firewall instead.

## Related ops

- [`disable-telnet`](./disable-telnet.md) — Disable Telnet
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`disable-service`](./disable-service.md) — Disable a service

