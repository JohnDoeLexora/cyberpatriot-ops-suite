# Import firewall profile

- **Catalog id:** `import-firewall-profile`
- **Category:** firewall
- **Platforms:** windows
- **Risk:** mutate

> Import a .wfw export or apply a known-good local firewall profile.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

If you pass a netsh .wfw path, it is imported. Otherwise Domain/Private/Public are enabled with default-deny inbound and allow outbound — the same known-good stance as apply-default-deny-inbound.

## Why it scores in CyberPatriot

Windows Firewall off or allow-all inbound is a staple finding. Importing a known-good profile is how many public kits do it in one click.

## When to run it

After audit-firewall, once you know which inbound ports the README requires (then add those rules separately).

## Step-by-step

1. Run audit-firewall / list-firewall-rules so you know current profile state.
2. dryRun:true to see whether a .wfw would be imported or the known-good profile applied.
3. Live confirm:true. Re-run audit-firewall — profiles should be on, inbound Block.
4. If the README requires a listener (80/443/22), add an allow rule after default-deny — do not leave inbound Allow.

## What “good” looks like

- All profiles Enabled, DefaultInboundAction Block, outbound Allow.
- README-required ports still reachable on the image.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- A leftover .wfw from another image can be wrong — prefer the known-good apply unless you exported this image yourself.

## Related ops

- [`audit-firewall`](./audit-firewall.md) — Audit host firewall
- [`enable-firewall`](./enable-firewall.md) — Enable host firewall
- [`apply-default-deny-inbound`](./apply-default-deny-inbound.md) — Apply default-deny inbound
- [`list-firewall-rules`](./list-firewall-rules.md) — List firewall rules

