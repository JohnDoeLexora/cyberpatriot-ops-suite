# List installed packages

- **Catalog id:** `list-installed-packages`
- **Category:** packages
- **Platforms:** both
- **Risk:** read

> Dump installed packages so you can match prohibited software.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Lists packages via dpkg-query / rpm / Get-Package. Large but filterable; input to find-prohibited-software.

## Why it scores in CyberPatriot

You cannot remove nmap if you never saw it in the inventory. Some READMEs also require a package to stay.

## When to run it

Software pass, before mass removal. Also when a forensics question asks ‘what is installed.’

## Step-by-step

1. Run the op. Search the output for names in config/prohibited-software.txt and the README banned list.
2. Note required stacks (openssh-server, apache2) so you do not purge them later.
3. Hand hits to find-prohibited-software / remove-package.

## What “good” looks like

- Inventory completes without hashes or credentials.
- Required services’ packages are present.

## Risks / confirm notes

- Read-only.
- A huge list is normal — do not delete ‘unknown’ packages blindly.

## Related ops

- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software
- [`remove-package`](./remove-package.md) — Remove a package
- [`list-services`](./list-services.md) — List services
- [`check-pending-updates`](./check-pending-updates.md) — Check pending updates

