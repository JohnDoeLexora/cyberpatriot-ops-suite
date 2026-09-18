# Disable rsh/rlogin/rexec

- **Catalog id:** `disable-legacy-r-services`
- **Category:** services
- **Platforms:** linux
- **Risk:** mutate

> Turn off rsh, rlogin, and rexec trust-based remotes.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Disables rsh/rlogin/rexec and related xinetd entries. These have no place on a CP image.

## Why it scores in CyberPatriot

r-services are ancient remote-login plants. They trust by hostname and send secrets in the clear.

## When to run it

Linux services pass with disable-telnet.

## Step-by-step

1. Run flag-risky-services / list-services to see which r-* units exist.
2. dryRun:true, then live confirm:true.
3. Re-run list-services and audit-listening-ports (512–514).

## What “good” looks like

- rsh.socket, rlogin.socket, rexec.socket disabled.
- Ports 512–514 closed.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- If xinetd is only there for these, consider disabling xinetd too via disable-service after a README check.

## Related ops

- [`disable-telnet`](./disable-telnet.md) — Disable Telnet
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`disable-service`](./disable-service.md) — Disable a service

