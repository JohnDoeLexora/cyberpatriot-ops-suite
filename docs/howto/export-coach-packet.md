# Export redacted coach packet ZIP

- **Catalog id:** `export-coach-packet`
- **Category:** evidence
- **Platforms:** both
- **Risk:** read

> Redacted ZIP for coach handoff: summaries and inventories, no secrets.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Writes SUMMARY.md, findings.json, and user/service/port inventories (hashes omitted) into a local ZIP. Distinct from export-evidence-bundle: this is the coach-facing packet. Never includes shadow/SAM, private keys, Wi-Fi PSKs, cookies, or CCS URLs.

## Why it scores in CyberPatriot

Coaches want a clean handoff without secrets. Scoring does not want you to exfiltrate the image. This is Sabbath-coffee maximalism still inside the rules.

## What it changes

Creates a folder and coach-packet.zip under the temp directory (Linux /tmp/cp-ops-coach-packet, Windows %TEMP%\cp-ops-coach-packet) or the outputDir you pass. Accounts, services, and policies are not modified.

## How to undo

Nothing to undo on system settings. Delete that folder if you do not want the zip left on disk.

## When to run it

End of a pass or when a coach asks for status. After the high-value mutates, not instead of them.

## Step-by-step

1. Run the op. Optional outputDir must be a local path (never a URL or UNC).
2. Open SUMMARY.md on the image. Confirm hashesIncluded=false, wifiKeysIncluded=false, ccsContacted=false.
3. Hand the ZIP to a coach on a USB stick from the authorized image if the rules allow — do not email secrets.
4. How to verify: run this check again and compare the output to the image README. You are done when this is true: ZIP contains SUMMARY.md + inventories. redacted=true.

## What “good” looks like

- ZIP contains SUMMARY.md + inventories. redacted=true.
- No hashes, PSKs, cookies, or CCS URLs.

## Risks / confirm notes

- Read-only assembly. Still do not copy shadow, SAM, or Wi-Fi keys into the packet — the engine will not.
- Not off-image exfiltration. Not a CCS scrape. Authorized-image only.
- Common mistake: treating this read-only result as already fixed, or changing the computer before the findings are copied into Team notes.

## Related ops

- [`export-evidence-bundle`](./export-evidence-bundle.md) — Export evidence bundle
- [`package-forensics-evidence`](./package-forensics-evidence.md) — Package redacted forensics evidence
- [`scoreboard-preflight`](./scoreboard-preflight.md) — Scoreboard preflight checklist
- [`round-start-wizard`](./round-start-wizard.md) — Round-start wizard

