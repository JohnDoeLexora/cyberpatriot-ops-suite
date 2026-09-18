# Check time synchronization

- **Catalog id:** `check-ntp`
- **Category:** network
- **Platforms:** both
- **Risk:** read

> See whether the clock is actually syncing.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Checks chronyd / systemd-timesyncd / w32time. Wrong clocks break logs and Kerberos. Local config audit, not an NTP amplification test.

## Why it scores in CyberPatriot

Disabled time sync is a small but real finding, and it poisons log evidence for forensics questions.

## When to run it

After logging/firewall basics, or if log timestamps look insane.

## Step-by-step

1. Run the op. Note inactive units and bogus NTP servers (10.0.0.1 plants).
2. Enable the distro time service via the OS; this op is read-only.
3. Do not point NTP at random internet pools if the README specifies an internal server.

## What “good” looks like

- timesyncd/chronyd/w32time active.
- Server list looks like the README or a sane vendor default — not a planted RFC1918 box.

## Risks / confirm notes

- Read-only.
- This is not a denial-of-service test against NTP servers.

## Related ops

- [`audit-logging`](./audit-logging.md) — Audit logging configuration
- [`check-auditd`](./check-auditd.md) — Check auditd
- [`audit-hosts-file`](./audit-hosts-file.md) — Audit hosts file

