# Find suspicious binaries

- **Catalog id:** `find-backdoor-binaries`
- **Category:** evidence
- **Platforms:** both
- **Risk:** read

> Heuristic filenames/locations: nc in /tmp, SUID bash copies, 31337 process binaries.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Looks for nc/netcat/ncat/socat in /tmp /home /opt, suid copies of bash, meterpreter-like names, and binaries bound to 31337. Does not include exploit payloads or attack other hosts.

## Why it scores in CyberPatriot

Loose reverse-admin tools in /tmp are plants. This is filename/location hygiene, not malware development.

## When to run it

With find-hidden-executables, find-suid-sgid, and audit-listening-ports.

## Step-by-step

1. Run the op. Snapshot paths into notes.
2. Do not execute the binary. Remove it after you know no forensics question needs the name.
3. Disable the user/cron/startup that dropped it.
4. Re-run plus audit-listening-ports.

## What “good” looks like

- No nc/ncat in /tmp or homes.
- No process on :31337.
- Expected system binaries in /usr only.

## Risks / confirm notes

- Read-only. Never run the found binary ‘to confirm.’
- Name matches can false-positive — check the path.
- No exploit payloads, no off-image attacks.

## Related ops

- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`find-suid-sgid`](./find-suid-sgid.md) — Find SUID/SGID files
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software

