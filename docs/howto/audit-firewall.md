# Audit host firewall

- **Catalog id:** `audit-firewall`
- **Category:** firewall
- **Platforms:** both
- **Risk:** read

> Is the host firewall even on, and is there a default deny?

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Reports ufw/firewalld/iptables or Windows Firewall profiles (Domain/Private/Public). A disabled host firewall is a high finding.

## Why it scores in CyberPatriot

‘Firewall off’ is one of the fastest network points. Profiles that are off individually (Public) also score.

## When to run it

Immediately in the network pass — often in the first ten minutes.

## Step-by-step

1. Run the op. If inactive/off, enable-firewall is the next click.
2. Then list-firewall-rules and apply-default-deny-inbound.
3. Allow required services (22/80/…) only after default deny.

## What “good” looks like

- ufw/firewalld active, or all Windows profiles on.
- Default incoming deny (see apply-default-deny-inbound).

## Risks / confirm notes

- Read-only.
- Enabling a firewall without allow rules for required services can drop scored ports — plan the allows.

## Related ops

- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`list-firewall-rules`](./list-firewall-rules.md) — List firewall rules
- [`apply-default-deny-inbound`](./apply-default-deny-inbound.md) — Apply default-deny inbound
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports

