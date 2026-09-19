# Hunt unattended / sysprep leftovers

- **Catalog id:** `hunt-sysprep-leftovers`
- **Category:** files
- **Platforms:** both
- **Risk:** read

> Find leftover unattend.xml / sysprep / kickstart files; never print passwords.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Hunts unattend.xml, autounattend.xml, sysprep.xml, Panther, and ks.cfg. Flags AutoLogon/Password keys by name only — values are omitted. Local files; Bend-parallel when available.

## Why it scores in CyberPatriot

Answer files left on disk often contain the local admin password in the clear. Scoring wants them gone; forensics may want the *path* noted first.

## When to run it

Files/persistence pass, early enough that you can snapshot the path for notes.

## Step-by-step

1. Run the op. Record paths in team notes (not the password values).
2. If a forensics question might reference the file, snapshot the path then remove or redact the leftover on the image.
3. Re-run until the inventory is empty.

## What “good” looks like

- No unattend.xml under Panther, Sysprep, /root, or the drive root.
- Output never includes password values.

## Risks / confirm notes

- Read-only hunt. Deleting is a separate action — snapshot first if forensics may need the path.
- Do not paste AutoLogon passwords into chat, tickets, or CCS.

## Related ops

- [`find-hidden-executables`](./find-hidden-executables.md) — Find hidden executables
- [`audit-persistence-deep`](./audit-persistence-deep.md) — Deep startup persistence audit
- [`check-empty-passwords`](./check-empty-passwords.md) — Check for empty passwords
- [`package-forensics-evidence`](./package-forensics-evidence.md) — Package redacted forensics evidence

