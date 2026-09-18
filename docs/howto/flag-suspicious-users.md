# Flag suspicious users

- **Catalog id:** `flag-suspicious-users`
- **Category:** users
- **Platforms:** both
- **Risk:** read

> Heuristic scoring so you know which accounts to lock first.

Read-only: this op does not change the image. See [SAFETY.md](../SAFETY.md).

Defensive, authorized-image CyberPatriot hardening only. No offense, no exploit recipes, no scoring-server tricks.

## What it is

Scores local accounts using never-logged-in humans, weird shells, UID weirdness, homes outside /home, throwaway name patterns, recent creates, and missing allowlist entries. Extra admins not on the README score higher. This is a bulk audit with reasons — not credential dumping.

## Why it scores in CyberPatriot

Planted backdoors are often named toor/hacker/flag, given UID 0, or never used. A ranked list beats scrolling passwd under time pressure and feeds disable/lock/remove-from-admins.

## When to run it

Right after list-users, before you mutate anything. Re-run after lock/disable to confirm scores dropped.

## Step-by-step

1. Confirm config/allowed-users.txt matches this image’s README (edit the allowlist if the README differs).
2. Run the op. Read the reasons column, not just the numeric score.
3. Triage: UID 0 aliases and extra admins first, then throwaway names, then never-logged-in humans.
4. For each hit, check the README once more — authorized coaches and service accounts can look odd.
5. Hand the remaining names to disable-user, lock-user, or remove-user-from-admins. Do not delete homes; forensics questions may need them.

## What “good” looks like

- README users (alice, bob, coach, …) score clean.
- toor, hacker123, Guest, and similar plants are at the top with written reasons.
- No hashes in the output — only scores and reasons.

## Risks / confirm notes

- Heuristics are not the official CCS score. Do not chase a number instead of the README.
- Read-only. Acting on a false positive (locking a required user) is a mutate op with confirm:true.
- Never used to attack other teams or scoring endpoints.

## Related ops

- [`list-users`](./list-users.md) — List local users
- [`audit-uid-zero`](./audit-uid-zero.md) — Audit UID 0 accounts
- [`disable-user`](./disable-user.md) — Disable a local user
- [`remove-user-from-admins`](./remove-user-from-admins.md) — Remove user from administrators
- [`score-image-heuristics`](./score-image-heuristics.md) — Score image heuristics

