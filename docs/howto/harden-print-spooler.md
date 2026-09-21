# Harden Print Spooler / disable remote print

- **Catalog id:** `harden-print-spooler`
- **Category:** windows
- **Platforms:** windows
- **Risk:** mutate

> Close PrintNightmare-class remote driver install and remote spooler RPC.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Sets PointAndPrint RestrictDriverInstallationToAdministrators, turns off no-warning elevation, disables the remote spooler RPC endpoint, and requires RPC auth privacy. Leaves the local Spooler running unless the README says printing is unused.

## Why it scores in CyberPatriot

Remote printer driver install (PrintNightmare-class) is a staple Windows finding. Scoring wants remote print locked down even when a local printer stays.

## When to run it

Windows services pass with disable-remote-registry and audit-smb, after you know whether printing is required.

## Step-by-step

1. Confirm the README: is a local printer required? If yes, do not stop Spooler — only remote RPC.
2. dryRun:true to see the PointAndPrint / RegisterSpoolerRemoteRpcEndPoint values.
3. Live confirm:true. Re-run; remote RPC should be disabled and driver install restricted to Administrators.
4. If printing is unused, separately disable-service Spooler (confirm) after this op.

## What “good” looks like

- RestrictDriverInstallationToAdministrators=1, NoWarningNoElevationOnInstall=0.
- RegisterSpoolerRemoteRpcEndPoint disabled. Local print still works if the README needs it.

## Risks / confirm notes

- Mutation. Live requires confirm:true (or dryRun:true to preview).
- Do not stop Spooler on an image that scores a printer. Authorized-image only.

## Related ops

- [`disable-service`](./disable-service.md) — Disable a service
- [`audit-smb`](./audit-smb.md) — Audit SMB / Samba
- [`disable-remote-registry`](./disable-remote-registry.md) — Disable Remote Registry
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services

