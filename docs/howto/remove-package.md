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

## What it changes

On Linux it runs apt-get remove -y or dnf remove -y for that package name. On Windows it runs Uninstall-Package. Configuration files the package manager leaves behind may remain.

## How to undo

If a backup was made, restore from /var/backups/cyberpatriot-ops/<ts>/ on Linux or %ProgramData%\CyberPatriotOps\backups\<ts>\ on Windows. Reinstall from the distro only if the README requires it: apt-get install or dnf install on Linux, Install-Package on Windows. Do not download a random installer.

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
- Common mistake: confirming the live change before the account, service, or file matches the image README, or skipping the dry-run preview.

## Related ops

- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software
- [`list-installed-packages`](./list-installed-packages.md) — List installed packages
- [`list-services`](./list-services.md) — List services
- [`disable-service`](./disable-service.md) — Disable a service

