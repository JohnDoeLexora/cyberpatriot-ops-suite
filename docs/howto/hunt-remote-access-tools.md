# Hunt remote-access tools and browser extensions

- **Catalog id:** `hunt-remote-access-tools`
- **Category:** packages
- **Platforms:** both
- **Risk:** read

> Find TeamViewer, AnyDesk, VNC, Chrome Remote Desktop, and similar on this image.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Looks for TeamViewer, AnyDesk, VNC, Chrome Remote Desktop, RustDesk and similar on the authorized image, plus browser extension directories (profile ids only — no extension source dump). Cross-checks config/remote-access-tools.txt. Discovery, not an exploit.

## Why it scores in CyberPatriot

Unauthorized remote-access tools are a frequent software finding and a persistence path. README-required remote support is the exception; everything else goes.

## When to run it

Software pass with find-prohibited-software, and again after persistence cleanup.

## Step-by-step

1. Confirm the README does not require a named remote-support tool.
2. Run the op. Note packages, binaries, and browser extension ids — not extension source.
3. Remove unauthorized packages with remove-package (confirm:true) and delete leftover binaries/extension dirs.
4. Re-run plus flag-risky-services (VNC listeners) and audit-listening-ports.

## What “good” looks like

- No TeamViewer/AnyDesk/VNC/RustDesk unless the README names it.
- No surprise unpacked Chrome/Edge remote-desktop extensions.
- No VNC listener on the host.

## Risks / confirm notes

- Read-only discovery. Removal is a separate confirm:true mutate.
- Do not dump extension source or attack other hosts.
- Do not keep a RAT ‘for testing’ on the scoring image.

## Related ops

- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software
- [`flag-risky-services`](./flag-risky-services.md) — Flag risky services
- [`audit-listening-ports`](./audit-listening-ports.md) — Audit listening ports
- [`remove-package`](./remove-package.md) — Remove a package

