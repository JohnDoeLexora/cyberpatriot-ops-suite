# Safety

This suite is **CyberPatriot competition-legal, authorized-image hardening only**.

It is not a red-team toolkit. It must never be used against other teams, scoring
servers, coaches' machines, or any host you do not have written authorization to
harden. There is no exploit development, no password-hash dumping, no remote
exploitation, and no “cheat the CCS” automation.

## Default is demo

- `POST /ops/:id/run` defaults to `{ "mode": "demo" }`.
- Demo mode returns **deterministic fixtures**. It does not read `/etc/shadow`,
  does not call `usermod`, and is **Mac-safe** for dashboard development.
- Demo mutations are simulated. The host is not changed.

## Live mode

- `{ "mode": "live" }` runs the Linux engine (this box / a Linux image) or the
  Windows PowerShell scripts on a Windows image.
- **Read** ops inventory the local image: users, services, ports, files, policy.
- **Mutate** ops (disable user, enable firewall, purge a package, …) are blocked
  unless the body includes `"confirm": true`.
- `params.dryRun: true` describes a mutation without applying it (confirm not
  required).
- Usernames, service names, and package names are validated before they are
  passed as argv (never interpolated into a shell string).

## Secrets and evidence

- Password **hashes are never returned**. Shadow entries are classified as
  empty / locked / set only.
- Private keys and `id_rsa` material are never copied into API responses.
- `export-evidence-bundle` is a redacted local pack (checksums, inventories,
  findings) for forensics write-ups — not off-image exfiltration.

## Heuristics are not the scoreboard

`flag-suspicious-users` and `score-image-heuristics` are **local** suspicion
scores to help a team prioritize. They are not the official CyberPatriot score
and must not be wired to attack the scoring service.

Signals for suspicious users:

1. Never logged in (interactive/human accounts)
2. Nonstandard shell (interpreters, `/tmp/*`, not a known login/nologin shell)
3. UID weirdness (non-root UID 0, duplicate UIDs, login shells on low UIDs)
4. Home outside `/home` (or `\Users\` on Windows)
5. Throwaway name patterns (`hacker`, `toor`, `flag`, `pwn`, …)
6. Recently created (default 7 days)
7. Missing from `config/allowed-users.txt` (README allowlist)

## Windows scripts

`engines/windows/*.ps1` are written for a Windows CP image. They may not execute
on this Linux builder. That is expected. Review them; run them on the Windows
VM.

## Maximalist-but-kosher

Automate everything the rules allow: bulk audits, one-click checklists,
exportable evidence, heuristic scoring. Stay inside the law of the competition —
authorized image, defensive only, no remote attacks.
