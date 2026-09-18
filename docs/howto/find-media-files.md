# Find prohibited media files

- **Catalog id:** `find-media-files`
- **Category:** files
- **Platforms:** both
- **Risk:** read

> Inventory mp3/mp4/etc. under homes — CP READMEs usually forbid media.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Finds mp3/mp4/avi/mkv/mov/flac/wav/ogg under user homes and common stash dirs. Inventory for authorized deletion, not a wipe-without-review.

## Why it scores in CyberPatriot

Prohibited media is a frequent file-category scoring item. Deleting the wrong file can also cost forensics points, so list first.

## When to run it

After the critical user/firewall pass, when you have time to review names.

## Step-by-step

1. Run the op. Read each path — is it obviously a song/video, or could it be a forensics exhibit?
2. If the README forbids media and it is not needed for a question, delete on the image using OS tools.
3. Re-run until the inventory is empty (or only authorized exceptions).

## What “good” looks like

- No prohibited media under homes/Public.
- Forensics-related files you kept are documented in team notes.

## Risks / confirm notes

- Read-only discovery. Blind recursive delete can destroy evidence.
- Do not search other teams’ shares.

## Related ops

- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`find-prohibited-software`](./find-prohibited-software.md) — Find prohibited software
- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle

