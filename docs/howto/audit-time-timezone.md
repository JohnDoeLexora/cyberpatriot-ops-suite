# Audit time sync and timezone

- **Catalog id:** `audit-time-timezone`
- **Category:** network
- **Platforms:** both
- **Risk:** read

> Deepen NTP: timezone sanity and fake 10.x time sources.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reads timedatectl/w32time plus /etc/timezone or tzutil, and NTP server lists. Flags RFC1918/planted servers and bizarre Etc/GMT+ offsets. Complements check-ntp. Not an NTP amplification test and not a CCS query.

## Why it scores in CyberPatriot

Wrong clocks break logs, Kerberos, and TLS. A planted NTP server is how images stay unsynced on purpose.

## When to run it

With check-ntp on both platforms, early enough that later logs have the right time.

## Step-by-step

1. Run the op. Note timezone vs the README (usually US/Eastern or the site’s zone) and NTP servers.
2. If NTP is 10.x/planted, point timesyncd/chrony/w32time at a normal pool or the README’s server — this op is read-only.
3. Do not run NTP flood tests. Do not query the CCS for the time.

## What “good” looks like

- Clock NTP-synchronized. Timezone matches the README.
- No 10.x NTP server unless the README says so.

## Risks / confirm notes

- Read-only. Changing timezone/NTP is a separate admin action.
- Not an amplification test. Authorized-image only. CCS is not contacted.

## Related ops

- [`check-ntp`](./check-ntp.md) — Check time synchronization
- [`audit-logging`](./audit-logging.md) — Audit logging configuration
- [`audit-dns-client`](./audit-dns-client.md) — Audit DNS client / DoH
- [`scoreboard-preflight`](./scoreboard-preflight.md) — Scoreboard preflight checklist

