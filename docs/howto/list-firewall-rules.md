# List firewall rules

- **Catalog id:** `list-firewall-rules`
- **Category:** firewall
- **Platforms:** both
- **Risk:** read

> Dump host rules and highlight allow-any and ugly ports.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists host firewall rules. Highlights allow-any inbound, allow 23/21/445, and disabled default-deny.

## Why it scores in CyberPatriot

A firewall that is ‘on’ but allows 0.0.0.0/0 any/any is still a finding.

## When to run it

After enable-firewall, before you declare the network pass done.

## Step-by-step

1. Run the op. Treat any/any inbound and 23/21/445 allows as to-fix.
2. Remove those rules on the image (OS tools); this op is read-only.
3. Keep allows for README-required ports only.

## What “good” looks like

- No 0.0.0.0/0 any/any inbound.
- No allow 23/21 unless README FTP/Telnet (shouldn’t).
- Required 22/80 present if those services are required.

## Risks / confirm notes

- Read-only.
- Deleting the wrong allow can drop a scored service — README next to the rule list.

## Related ops

- [`apply-default-deny-inbound`](./apply-default-deny-inbound.md) — Apply default-deny inbound
- [`audit-firewall`](./audit-firewall.md) — Audit host firewall
- [`disable-telnet`](./disable-telnet.md) — Disable Telnet
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports

