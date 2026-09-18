# List services

- **Catalog id:** `list-services`
- **Category:** services
- **Platforms:** both
- **Risk:** read

> Inventory running/enabled services vs required and risky lists.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists systemd/Windows services with active/enabled state and annotates them against config/required-services.txt and config/risky-services.txt.

## Why it scores in CyberPatriot

You cannot disable telnet if you never saw it. Extra services (ftp, cups, RemoteRegistry) and missing required ones (sshd, apache if the README says so) both score.

## When to run it

Early network/services pass, before you disable anything.

## Step-by-step

1. Read the image README for required services (web, SSH, database).
2. Update config/required-services.txt if this image differs from the sample.
3. Run the op. Sort mentally: required, risky, other.
4. Required but stopped: start/enable via the OS (this op is read-only).
5. Risky and not required: hand to disable-service / disable-telnet.

## What “good” looks like

- Every README-required service is running and enabled.
- Telnet, rsh, anonymous FTP, SMBv1, RemoteRegistry are not enabled unless the README explicitly wants them.

## Risks / confirm notes

- Read-only.
- Stopping a required scored service costs points — always README-check before disable-service.

## Related ops

- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`disable-service`](./disable-service.md) — Disable a service
- [`audit-ftp-telnet`](./audit-ftp-telnet.md) — Audit FTP and Telnet
- [`list-firewall-rules`](./list-firewall-rules.md) — List firewall rules

