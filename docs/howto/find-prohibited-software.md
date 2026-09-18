# Find prohibited software

- **Catalog id:** `find-prohibited-software`
- **Category:** packages
- **Platforms:** both
- **Risk:** read

> Match installed packages and well-known paths against the prohibited list.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Matches nmap, hydra, john, netcat, ophcrack, aircrack, and friends from config/prohibited-software.txt. Read-only discovery; removal is a separate op.

## Why it scores in CyberPatriot

Hacking tools and games on a CP image are scored. Discovery first keeps you from removing a required look-alike.

## When to run it

Right after list-installed-packages, and anytime you find nc in /tmp.

## Step-by-step

1. Skim the README prohibited list; update config/prohibited-software.txt if needed.
2. Run the op. Each hit should name a package or path.
3. remove-package for packages; for loose binaries in /tmp, delete the file after snapshotting (see find-backdoor-binaries).

## What “good” looks like

- No nmap/hydra/john/netcat/ophcrack unless the README amazingly requires them (it will not).
- Required servers (openssh-server, apache2) still installed.

## Risks / confirm notes

- Read-only. This is not a tutorial for using nmap or hydra.
- netcat may be named nc, ncat, or netcat-traditional — read the hit.

## Related ops

- [`remove-package`](./remove-package.md) — Remove a package
- [`list-installed-packages`](./list-installed-packages.md) — List installed packages
- [`find-backdoor-binaries`](./find-backdoor-binaries.md) — Find suspicious binaries
- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables

