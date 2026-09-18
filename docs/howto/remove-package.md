# Remove a package

- **Catalog id:** `remove-package`
- **Category:** packages
- **Platforms:** both
- **Risk:** mutate

> Purge one local package, with a safety catch for required services.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

apt-get remove --purge / dnf remove / Uninstall-Package. Refuses packages that look like required services (openssh-server, apache2) unless forced.

## Why it scores in CyberPatriot

This is the fix for find-prohibited-software. Confirmed, one name at a time, beats a reckless autoremove.

## When to run it

After find-prohibited-software, for each banned package the README does not require.

## Step-by-step

1. Copy the exact package name from the finder.
2. dryRun:true.
3. Live confirm:true. Do not force-remove openssh-server/apache2 unless you are sure.
4. Re-run find-prohibited-software.

## What “good” looks like

- Prohibited package gone.
- Required services still installed and running.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- force=true can remove a scored service.
- Purging may remove config you wanted for forensics — snapshot first if unsure.

## Related ops

- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software
- [`list-installed-packages`](./list-installed-packages.md) — List installed packages
- [`list-services`](./list-services.md) — List services
- [`disable-service`](./disable-service.md) — Disable a service

