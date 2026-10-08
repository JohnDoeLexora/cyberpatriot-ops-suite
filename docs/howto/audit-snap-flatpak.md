# Audit Snap/Flatpak unnecessary apps

- **Catalog id:** `audit-snap-flatpak`
- **Category:** packages
- **Platforms:** linux
- **Risk:** read

> List snap/flatpak apps and flag games, remote-desktop, and leftovers.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Runs snap list / flatpak list and flags steam, discord, anydesk, vlc, wine, and similar. Discovery only — this op does not uninstall.

## Why it scores in CyberPatriot

Unnecessary snaps/flatpaks are prohibited-software cousins on Ubuntu images. Knowing the name feeds remove-package.

## What it changes

Nothing - read-only audit

## How to undo

Nothing to undo

## When to run it

Linux packages pass with find-prohibited-software and hunt-remote-access-tools.

## Step-by-step

1. Run the op. Note suspicious snap/flatpak names.
2. Confirm they are not README-required, then remove-package (confirm) or `snap remove` on the image.
3. core/snapd/gtk-common-themes are ignored on purpose.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: No steam/discord/anydesk/vlc leftovers, or they are README-required.

## What “good” looks like

- No steam/discord/anydesk/vlc leftovers, or they are README-required.
- This op did not uninstall anything.

## Risks / confirm notes

- Read-only. Removal is a mutate op with confirm:true.
- Do not remove snapd itself unless the README says so.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software
- [`hunt-remote-access-tools`](./hunt-remote-access-tools.md) — Hunt remote-access tools and browser extensions
- [`remove-package`](./remove-package.md) — Remove a package
- [`remove-games-samples`](./remove-games-samples.md) — Remove games and sample content

