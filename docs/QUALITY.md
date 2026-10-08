# Engine quality

This is the reliability contract for every catalog op. A stressed operator should be able to click a check twice and understand the result.

## Contract

- **Preflight.** A missing tool, a non-root mutate, or an unsupported service returns a plain-English `Skipped:` line and exit code 3. It does not crash and it does not pretend the check passed.
- **Dry-run.** Linux scripts take `--dry-run` (or `CP_DRY_RUN=1`). Windows scripts take `-DryRun`. The API accepts `params.dryRun: true` or a top-level `dryRun: true`. A preview changes nothing. Applying still requires `confirm: true` and the dashboard confirm dialog.
- **Backup.** Config edits are copied to `/var/backups/cyberpatriot-ops/<timestamp>/` on Linux and `%ProgramData%\CyberPatriotOps\backups\<timestamp>\` on Windows. Registry edits export a `.reg` file first. `sshd -t` and `visudo -c` restore the backup when they fail.
- **Exit codes.** `0` success or preview, `1` error, `2` refused (no confirm, empty allowlist, current user, or the scoring service), `3` skipped. The runner copies that into `ok`, `summary`, and `data.extra.exitCode`. The summary line comes first (`Changed 2 settings, 1 already OK` or `Preview: would change …`).
- **Safety.** Hashes, shadow lines, and Wi-Fi keys are not printed. The scoring / CCS service is refused by exact name. An empty allowlist refuses allowlist-driven changes.

## Gaps (honest)

- This builder is Debian, not Windows. Every `.ps1` parses under PowerShell 7.5, PSScriptAnalyzer reports no Error or Warning, and Pester covers the helper logic (allowlist, CCS name, current user, preview text). The cmdlets themselves were not executed here.
- Live **read** ops in the API still use the TypeScript collectors so the dashboard keeps the rich user/service/port shape. The shell scripts are what you run by hand, and what `npm test` exercises for a small read set.
- Heavy file walks (world-writable, SUID, media, backdoors, listening ports, checklist scans) are shellchecked and are not pointed at the whole disk by the unit harness.
- `apply-security-updates` on a real preview runs `apt-get -s upgrade`, which can be slow. The harness sets `CP_FAST=1` and does not install or upgrade packages.
- Windows `net accounts` and `auditpol` re-apply the same policy. They do not report the previous value, so a second run may still say a setting changed. Registry, firewall, service, local-user, and hosts edits compare the current value first.
- Bend programs score inventories. They do not mutate. `npm run lint:engines` typechecks every `.bend` file with `bend --check-only`. Division is written `(len / 2n : Nat)` because Bend 2.0.35 rejects a bare `/`. If `bend` fails at runtime, `engines/bend/run.sh` falls back to Python and still exits non-zero when that fallback fails.

## Per-op status

| op id | engine | idempotent | preflight | dry-run | backup | lint | tests | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `list-users` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | live script on this box | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `flag-suspicious-users` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `disable-user` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `lock-user` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `remove-user-from-admins` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `list-admin-users` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-uid-zero` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `check-empty-passwords` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-never-logged-in` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `check-user-shells` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `list-groups` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | live script on this box | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `disable-guest-account` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-duplicate-uids` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `expire-user-password` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-password-policy` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `enforce-password-policy` | linux+windows | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness; fixture re-run | Live confirm runs the shell script. Dry-run was exercised here. |
| `check-password-aging` | linux | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-pam` | linux | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `enable-account-lockout` | linux+windows | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `disable-root-ssh` | linux | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-sudoers` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-uac` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `list-services` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `flag-risky-services` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `disable-service` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-ftp-telnet` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `disable-telnet` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `disable-legacy-r-services` | linux | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-smb` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-listening-ports` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `ssh-hardening-audit` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | live script on this box | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `harden-sshd` | linux | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-rdp` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `disable-rdp` | windows | yes | yes | yes | yes | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-hosts-file` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | live script on this box | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `check-ntp` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-firewall` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | live script on this box | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `enable-firewall` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `list-firewall-rules` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `apply-default-deny-inbound` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `find-world-writable` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `find-suid-sgid` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `find-media-files` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `audit-home-permissions` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `check-sensitive-file-perms` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-ssh-authorized-keys` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `find-hidden-executables` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `list-installed-packages` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `find-prohibited-software` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `remove-package` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-logging` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `check-auditd` | linux | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `check-pending-updates` | linux+windows | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `apply-security-updates` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. Real preview runs apt-get -s. Tests set CP_FAST=1. |
| `audit-cron` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-at-jobs` | linux | yes | yes | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `list-scheduled-tasks` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-sysctl` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `harden-sysctl` | linux | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-startup-items` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `disable-smbv1` | windows | yes | yes | yes | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `enable-windows-defender` | windows | yes | yes | yes | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-powershell-logging` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `disable-autoplay` | windows | yes | yes | yes | yes | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `check-bitlocker-status` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `export-evidence-bundle` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `package-forensics-evidence` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `one-click-hardening-checklist` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `score-image-heuristics` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `find-backdoor-binaries` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `audit-shared-folders` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `diff-expected-ports` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `audit-share-acls` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-persistence-deep` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `hunt-remote-access-tools` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `report-password-never-expires` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-critical-perm-drift` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `scoreboard-preflight` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `post-harden-checklist` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `select-unauthorized-users` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-sticky-tmp` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `audit-anonymous-ftp` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `harden-vsftpd` | linux | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-web-server` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `disable-llmnr-netbios-wpad` | windows | yes | yes | yes | yes | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-null-session` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-idle-lock` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `hunt-sysprep-leftovers` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `audit-snmp` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-mac-enforcement` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-browser-baseline` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-auto-updates` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `remove-games-samples` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-iis` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `skim-forensics-readme` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `apply-security-template` | windows | yes | yes | yes | yes | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `import-firewall-profile` | windows | yes | yes | yes | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `enable-audit-policy` | windows | yes | yes | yes | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. net/auditpol re-applies; those tools do not report the previous value. |
| `disable-remote-registry` | windows | yes | yes | yes | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `disable-remote-assistance` | windows | yes | yes | yes | yes | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `force-password-change` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `sync-authorized-users` | linux+windows | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `disable-optional-windows-features` | windows | yes | yes | yes | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `run-sfc-scan` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `clear-suspicious-hosts` | linux+windows | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `disable-display-manager-guest` | linux | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `lock-root-account` | linux | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `enable-fail2ban` | linux | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `harden-host-conf` | linux | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `set-ufw-logging` | linux | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `restrict-cron-at` | linux | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `hunt-shell-backdoors` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | shellcheck only; not walked in unit tests | API live read uses the TypeScript collector. The shell script is the standalone path. Full-disk walk is intentionally outside the unit harness. |
| `scan-malware-tools` | linux | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. Dry-run is inventory only. confirm:true may install distro clamav/chkrootkit. |
| `round-start-wizard` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `harden-print-spooler` | windows | yes | yes | yes | yes | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-lsa-protection` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-credential-guard` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-secure-boot` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-wifi-profiles` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `harden-powershell-constrained` | windows | yes | yes | yes | yes | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `disable-smb-client-v1` | windows | yes | yes | yes | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-dns-client` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `audit-windows-roles` | windows | yes | partial | n/a | n/a | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `harden-null-session` | windows | yes | yes | yes | yes | pwsh parse | parser+Pester helpers; not executed here | Needs a Windows image. -DryRun previews; -ConfirmLive applies. |
| `blacklist-kernel-modules` | linux | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `enforce-apparmor-profiles` | linux | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `enable-unattended-upgrades` | linux | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-mail-services` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-database-bind` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-php-hardening` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-snap-flatpak` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `disable-ctrl-alt-del` | linux | yes | yes | yes | n/a | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-ipv6-privacy` | linux | yes | partial | yes (only if disableIPv6) | yes (only if disableIPv6) | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-log-persistence` | linux | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `audit-browser-policy` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `harden-usb-storage` | linux+windows | yes | yes | yes | yes | shellcheck+pwsh parse | dry-run harness | Live confirm runs the shell script. Dry-run was exercised here. |
| `audit-time-timezone` | linux+windows | yes | partial | n/a | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. |
| `export-coach-packet` | linux+windows | yes | partial | yes (CP_DRY_RUN) | n/a | shellcheck+pwsh parse | demo + shellcheck; live read stays on TS collector | API live read uses the TypeScript collector. The shell script is the standalone path. Read path writes a redacted packet unless CP_DRY_RUN=1. |
