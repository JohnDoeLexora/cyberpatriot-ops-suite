# Remove games and sample content

- **Catalog id:** `remove-games-samples`
- **Category:** packages
- **Platforms:** both
- **Risk:** mutate

> Purge games and vendor sample/content packages from the authorized image.

Live mutations require `confirm: true` (or `dryRun: true` to preview). See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Removes packages/AppX names in config/games-samples.txt (aisleriot, solitaire, Xbox apps, example-content, IIS samples). Refuses names that look like required services.

## Why it scores in CyberPatriot

Games and sample galleries are a frequent ‘prohibited software / sample content’ scoring item. A list beats hunting Add/Remove by hand.

## When to run it

After find-prohibited-software and a forensics glance — a README question might name a game.

## Step-by-step

1. Skim the README: are games/sample content forbidden? (Usually yes.)
2. dryRun:true to see which listed packages are actually installed.
3. If a forensics question might mention a game, snapshot the name, then live confirm:true.
4. Re-run list-installed-packages / this op until the list is empty.

## What “good” looks like

- No aisleriot/solitaire/Xbox/example-content leftovers.
- Required stacks (openssh-server, apache2) untouched.

## Risks / confirm notes

- Mutation. Live requires confirm:true.
- Blind purge can destroy a forensics exhibit — snapshot names first.
- wine/steam may be in the list; confirm they are not a required scored app.

## Related ops

- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software
- [`remove-package`](./remove-package.md) — Remove a package
- [`find-media-files`](./find-media-files.md) — Find prohibited media files
- [`list-installed-packages`](./list-installed-packages.md) — List installed packages

