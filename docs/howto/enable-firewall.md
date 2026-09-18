# Enable host firewall

- **Catalog id:** `enable-firewall`
- **Category:** firewall
- **Platforms:** both
- **Risk:** mutate

> Turn the host firewall on (ufw/firewalld or all Windows profiles).

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Enables ufw/firewalld or Set-NetFirewallProfile -Enabled True for all profiles. Does not change other machines.

## Why it scores in CyberPatriot

The audit finding ‘firewall disabled’ is fixed by this mutate.

## When to run it

As soon as audit-firewall says off, after you know which ports must stay open.

## Step-by-step

1. Note required ports from the README.
2. dryRun:true, then live confirm:true.
3. Follow with apply-default-deny-inbound and explicit allows if needed.
4. Re-run audit-firewall.

## What “good” looks like

- Firewall enabled on all profiles.
- Required services still reachable on this image.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Can cut your own SSH/RDP if default deny is already in place without allows — have console access.

## Related ops

- [`audit-firewall`](./audit-firewall.md) — Audit host firewall
- [`apply-default-deny-inbound`](./apply-default-deny-inbound.md) — Apply default-deny inbound
- [`list-firewall-rules`](./list-firewall-rules.md) — List firewall rules
- [`harden-sshd`](./harden-sshd.md) — Harden sshd_config

