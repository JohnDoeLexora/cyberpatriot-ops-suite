# Package redacted forensics evidence

- **Catalog id:** `package-forensics-evidence`
- **Category:** evidence
- **Platforms:** both
- **Risk:** read

> Deeper redacted forensics pack: persistence, share ACLs, perm drift, checksums.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Builds a redacted forensics pack with user/service/port inventories, persistence hints, share ACLs, critical permission drift, and config checksums. Never copies shadow hashes, SAM contents, private keys, or off-image data. For authorized-image write-ups only.

## Why it scores in CyberPatriot

Forensics questions often want persistence and ACL evidence, not just a user list. One redacted pack beats ad-hoc screenshots.

## When to run it

After the first persistence and files pass, and again before you submit forensics answers.

## Step-by-step

1. Run the op in demo or live read mode — it does not mutate.
2. Skim persistence, share ACLs, and perm-drift sections. Copy only what a forensics question needs.
3. Do not add shadow, SAM, or id_rsa files by hand. Keep the pack on the image.

## What “good” looks like

- Pack has inventories, ACLs, perm drift, and checksums — not secrets.
- notes.md snippet is something you could show a coach.

## Risks / confirm notes

- Read-only. Still: do not zip private keys or hashes into the pack.
- Not off-image exfiltration and not a scoring-server upload.

## Related ops

- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle
- [`audit-persistence-deep`](./audit-persistence-deep.md) — Deep startup persistence audit
- [`audit-share-acls`](./audit-share-acls.md) — Dump unauthorized share ACLs
- [`audit-critical-perm-drift`](./audit-critical-perm-drift.md) — Audit critical permission drift

