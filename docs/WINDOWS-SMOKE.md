# Windows smoke

Live Windows checks run on a disposable GitHub-hosted `windows-latest` VM. This Linux builder never applies a Windows change, and the workflow never touches a scoring or CCS service.

## Status

**Blocked.** The builder's `gh` token scopes are `gist`, `read:org`, and `repo`. GitHub rejected the push of `.github/workflows/windows-smoke.yml`:

```
refusing to allow an OAuth App to create or update workflow `.github/workflows/windows-smoke.yml` without `workflow` scope
```

No Actions run URL exists yet. The workflow file, the driver, and the undo helper are committed only on the local branch `feat/cp-16-windows-workflow-local` (not pushed).

Unblock:

```bash
gh auth refresh -h github.com -s workflow
git push -u origin feat/cp-16-windows-workflow-local
gh workflow run windows-smoke.yml --ref feat/cp-16-windows-workflow-local
gh run list --workflow windows-smoke.yml
gh run watch <id>
```

Opening a PR from a branch that contains `.github/workflows/windows-smoke.yml` also starts the `pull_request` run.

## What the workflow does

`.github/workflows/windows-smoke.yml` has two jobs.

1. **Windows engine smoke** (`windows-latest`, 120 minutes). Installs PSScriptAnalyzer, then runs `engines/windows/tests/Invoke-WindowsSmoke.ps1`.
2. **Playwright on Windows.** `npm ci`, Playwright Chromium, then `CI=1 npm run test:e2e`. Linux-only live-read specs skip themselves on `win32` with an explicit reason. Screenshot baselines are linux-only; `shot()` does not compare pixels on Windows.

The driver, not the YAML, does the work:

| Phase | What it checks |
| --- | --- |
| `dryrun` (analyzer row) | Every `.ps1` parses. The row `opId` is `PSScriptAnalyzer`. Error and Warning fail the run. |
| `dryrun` | Every Windows op with `-DryRun`. Exit `0`, or `3` with a `Skipped:` reason. Summary or preview text is non-empty. |
| `live-read` | Every read op whose platform is Windows or both. Exit `0` or an encoded expected-skip. Structured JSON comes back. |
| `live-mutate` | Firewall on, password policy, audit policy, Guest disable, a throwaway service disable, and an allowlist sync of `cp-test-alice` (allowed) against `cp-test-mallory` (not on the allowlist). Independent `Get-NetFirewallProfile`, `net accounts`, `auditpol`, `Get-LocalUser`, and `Get-Service` checks prove the change. |
| `undo` | `engines/windows/Restore-CpBackup.ps1` restores the snapshot taken before that apply. The same independent checks prove the prior state returned. |

Linux-only catalog ids return `Skipped:` and exit `3` instead of a fake success. A missing Guest account, BitLocker, Wi-Fi, Secure Boot, IIS, or Credential Guard on the Server SKU is an **expected-skip** recorded with a reason. Anything else fails the job.

The scoring-service refusal (`ccs`, `scoring`, `cyberpatriot`, and the other exact names) stays in place. The smoke service is `cp-test-svc`, created by the driver and deleted after undo.

## How to read the artifact

The `windows-smoke` artifact is the `smoke-out/` directory:

| File | Contents |
| --- | --- |
| `results.json` | One object per op per phase: `opId`, `phase` (`dryrun`, `live-read`, `live-mutate`, `undo`), `exitCode`, `pass`, `reason`. |
| `summary.md` | Counts and the failures. The same markdown is appended to `$GITHUB_STEP_SUMMARY`. |

```bash
gh run download <id> -n windows-smoke -D /tmp/windows-smoke
```

A row with `pass: true` and a reason that starts with `expected-skip:` is a documented runner limitation, not a silent pass.

## Expected skips

These are the only skips the driver treats as success. The reason string is stored on the result row.

| Op | Reason the runner may skip |
| --- | --- |
| Linux-only ids (`audit-sudoers`, `ssh-hardening-audit`, `find-world-writable`, and the rest of the Linux-only list in `CpOps.psm1`) | `Skipped: <id> is Linux-only.` Exit 3. |
| `disable-guest-account` live mutate | Guest is not a local account on this image. |
| `check-bitlocker-status` | BitLocker or a TPM is not present on the hosted VM. |
| `audit-wifi-profiles` | No Wi-Fi adapter. |
| `audit-secure-boot` | `Confirm-SecureBootUEFI` is unavailable on this SKU. |
| `audit-credential-guard` | Credential Guard / Device Guard is not available. |
| `audit-iis` | IIS / WebAdministration is not installed. |
| `run-sfc-scan` | Dry-run returns a preview and does not start `sfc`. A live `sfc /verifyonly` that is still running after the smoke budget is an expected-skip. |
| `find-backdoor-binaries`, `find-hidden-executables`, `find-media-files`, `skim-forensics-readme`, `hunt-shell-backdoors` | A recursive walk that exceeds the per-op budget is an expected-skip. A walk that finishes is a normal pass. |

## Latest results

Not run. The workflow file never reached GitHub. After the scope refresh, replace this section with the run URL and the dry-run / live-read / live-mutate+undo counts from `summary.md`.
