# Flag risky services

- **Catalog id:** `flag-risky-services`
- **Category:** services
- **Platforms:** both
- **Risk:** read

> Cross-check running services against the risky list and the README.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Flags telnet, rsh, anonymous FTP, SMBv1, RemoteRegistry, and similar unless the README requires them. Bulk audit, not a scan of other hosts.

## Why it scores in CyberPatriot

Insecure remote services are a large, predictable point block. A single flagged list is faster than reading every unit name.

## When to run it

Immediately after list-services.

## Step-by-step

1. Run the op. For each flag, open the README: is this service a scored requirement?
2. If not required, use the specific disable op (disable-telnet, disable-legacy-r-services, disable-smbv1) or disable-service.
3. If required, document why you left it on and harden around it (firewall, no anonymous, etc.).

## What “good” looks like

- Flags remaining are only README-required services.
- sshd/apache2 stay if required.

## Risks / confirm notes

- Read-only. Disabling is a mutate with confirm:true.
- Local image only — never a network vulnerability scan of other teams.

## Related ops

- [`list-services`](./list-services.md) — List services
- [`disable-service`](./disable-service.md) — Disable a service
- [`disable-telnet`](./disable-telnet.md) — Disable Telnet
- [`audit-ftp-telnet`](./audit-ftp-telnet.md) — Audit FTP and Telnet
- [`disable-legacy-r-services`](./disable-legacy-r-services.md) — Disable rsh/rlogin/rexec

