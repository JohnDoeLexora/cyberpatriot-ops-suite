# Apply default-deny inbound

- **Catalog id:** `apply-default-deny-inbound`
- **Category:** firewall
- **Platforms:** both
- **Risk:** mutate

> Default incoming deny, keep established outbound, allow required services.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Sets default incoming deny (ufw default deny incoming / public profile block) while leaving established outbound. Pairs with allow rules for required services.

## Why it scores in CyberPatriot

Default-deny is the actual hardening; ‘firewall on’ alone is not enough.

## When to run it

Right after enable-firewall, with the required-port list in hand.

## Step-by-step

1. Write down required inbound ports from the README.
2. dryRun:true — you should see default deny plus allows for those ports.
3. Live confirm:true.
4. Re-run list-firewall-rules and try the required service locally.

## What “good” looks like

- Default incoming deny.
- Explicit allows for required services only.
- Outbound established traffic still works.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Without the allow list, you can cut SSH/HTTP scoring. Console access first.
- Does not open or close ports on other machines.

## Related ops

- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`list-firewall-rules`](./list-firewall-rules.md) — List firewall rules
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`list-services`](./list-services.md) — List services

