# Post-harden verification checklist

- **Catalog id:** `post-harden-checklist`
- **Category:** evidence
- **Platforms:** both
- **Risk:** read

> After-action verification: policy, SSH/UAC, UID 0, media, RATs, default-deny.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

After-action verification on the authorized image: password policy, SSH/UAC, extra UID 0, empty/never-expire passwords, media, prohibited software, default-deny firewall, remote-access tools. Read-only — does not re-apply hardening. Each fail points at the mutate op.

## Why it scores in CyberPatriot

End-of-round leaks (media, extra root, RATs still installed) are avoidable. A second checklist after you think you are done catches them.

## When to run it

After the main harden pass, and once more in the last 15 minutes.

## Step-by-step

1. Run the op. Treat remaining fails as the last work list.
2. Follow each linked op; live mutates still need confirm:true.
3. Re-run until remaining fails are README exceptions you can explain in notes.

## What “good” looks like

- No extra UID 0, no empty+never-expire humans, Guest off.
- Firewall default-deny, no RATs, no prohibited media/software.
- SSH/UAC hardened if those platforms apply.

## Risks / confirm notes

- Read-only. Does not re-apply hardening for you.
- Not CCS. Do not hide logs or delete evidence to make rows green.

## Related ops

- [`one-click-hardening-checklist`](./one-click-hardening-checklist.md) — One-click hardening checklist
- [`score-image-heuristics`](./score-image-heuristics.md) — Score image heuristics
- [`hunt-remote-access-tools`](./hunt-remote-access-tools.md) — Hunt remote-access tools and browser extensions
- [`report-password-never-expires`](./report-password-never-expires.md) — Report never-expires + blank password combo

