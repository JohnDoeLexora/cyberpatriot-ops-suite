# Diff listeners vs expected ports

- **Catalog id:** `diff-expected-ports`
- **Category:** ports
- **Platforms:** both
- **Risk:** read

> Compare this image’s listeners to config/expected-ports.txt — local ss only.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Diffs TCP/UDP listeners on this image against config/expected-ports.txt (README-allowed services). Reports unexpected listeners and missing expected ports. Uses local ss / Get-NetTCPConnection only.

## Why it scores in CyberPatriot

Unexpected 23/31337/445 are plants; a missing required 22/80/443 can cost service points. A baseline file is faster than eyeballing ss.

## When to run it

Right after audit-listening-ports, and again after disabling risky services.

## Step-by-step

1. Confirm expected-ports.txt matches the README (proto/port per line).
2. Run the op. Unexpected listeners are the disable/investigate list; missing expected ports are required services that died.
3. Disable unexpected services or hunt the process with find-backdoor-binaries. Restore required listeners.
4. Re-run until unexpected is empty and expected ports are present.

## What “good” looks like

- Listeners match the README allowlist.
- No 23, 31337, 4444, or other surprise binds.
- Required 22/80/443 (or whatever the README lists) still listening.

## Risks / confirm notes

- Read-only local audit. Never scans other hosts, the LAN, or the scoring server.
- Killing a required listener costs points — identify first.
- Bend may score the inventory on Linux live; demo never invokes Bend.

## Related ops

- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries
- [`list-firewall-rules`](./list-firewall-rules.md) — List firewall rules

