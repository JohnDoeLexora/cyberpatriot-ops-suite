# Skim local README for forensics keywords

- **Catalog id:** `skim-forensics-readme`
- **Category:** evidence
- **Platforms:** both
- **Risk:** read

> Keyword-skim local README/forensics files. Never contacts CCS.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Searches Desktop/homes/README/forensics/question text on the authorized image for keywords (password, media, unauthorized, …). Helps answer forensics questions from files *on the box*. Hash-looking lines are skipped. CCS, other teams, and the internet are never contacted.

## Why it scores in CyberPatriot

Forensics questions are answered from the image README and planted files. A keyword skim is faster than opening every Desktop txt, and it stays inside the rules because it never talks to the scoring server.

## When to run it

First ten minutes (README on the desktop) and again when a forensics question cites a filename. Optional searchRoot for a folder you already found.

## Step-by-step

1. Run with defaults — it skims /home, /root, Desktop-like paths. On Windows it skims user Desktops.
2. Read the hit lines. They are hints, not CCS answers. Copy into team notes.
3. Follow up with find-media-files, list-users, or package-forensics-evidence as the hits suggest.
4. Never paste a CCS URL into searchRoot. Never fetch the scoring site.

## What “good” looks like

- Hits from local README files only.
- ccsContacted=false in the extra payload.
- No 32+ hex dumps (hash-looking lines omitted).

## Risks / confirm notes

- Read-only. Still: do not copy password values from unattend files into chat.
- This is not a scoring-server scrape and not a search of other teams’ shares.
- searchRoot must be a local path, never a URL.

## Related ops

- [`package-forensics-evidence`](./package-forensics-evidence.md) — Package redacted forensics evidence
- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle
- [`find-media-files`](./find-media-files.md) — Find prohibited media files
- [`list-users`](./list-users.md) — List local users

