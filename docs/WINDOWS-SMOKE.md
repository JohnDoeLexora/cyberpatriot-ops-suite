# Windows smoke

The driver is `engines/windows/tests/Invoke-WindowsSmoke.ps1`. It writes one JSON row per op and a markdown summary. It does not print password hashes or Wi-Fi keys. It refuses the scoring / CCS service by exact name (`ccs`, `scoring`, `cyberpatriot`, and the other names in `Test-CpCcsName`) and it never deletes that service.

Windows cmdlets have **not** been executed anywhere. Not on this Linux builder, not on a Windows VM, and not on GitHub Actions. Parse, PSScriptAnalyzer, and Pester on Linux are the only Windows-script checks that have run.

## Run it on a Windows VM (no Actions needed)

Use a disposable virtual machine only. Hyper-V or VirtualBox, Windows 10, Windows 11, or a Windows Server evaluation image. Take a snapshot before the first run. Do not use a scored competition image, a teammate's daily machine, or any host that has the CCS / scoring service installed. Revert the snapshot when you are done.

Open PowerShell as Administrator. PowerShell 7 (`pwsh`) or Windows PowerShell 5.1 both work. The driver launches each op with `powershell.exe`.

```powershell
git clone https://github.com/JohnDoeLexora/cyberpatriot-ops-suite.git
cd cyberpatriot-ops-suite
git checkout feat/cp-17-windows-smoke-kit
Install-Module -Name PSScriptAnalyzer -Force -Scope CurrentUser -AllowClobber
```

Safe mode is the default. It parses, runs PSScriptAnalyzer, dry-runs every op, and live-reads Windows ops. It does not create users, change the firewall, change password policy, or run undo.

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\engines\windows\tests\Invoke-WindowsSmoke.ps1 -RepoRoot (Get-Location).Path
```

Windows PowerShell 5.1, same safe mode:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\engines\windows\tests\Invoke-WindowsSmoke.ps1 -RepoRoot (Get-Location).Path
```

Full mode adds live-mutate and undo. Pass the switch only after the snapshot exists. The mutate phase creates `cp-test-alice` and `cp-test-mallory`, creates a throwaway service named `cp-test-svc`, and changes firewall, password policy, audit policy, and Guest. Undo puts that snapshot back, then the driver deletes the two test users and `cp-test-svc`.

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\engines\windows\tests\Invoke-WindowsSmoke.ps1 -RepoRoot (Get-Location).Path -IUnderstandThisIsADisposableVM
```

Results land in `smoke-out/` next to the repo root (or in `-OutDir` if you pass one):

| File | Contents |
| --- | --- |
| `smoke-out/results.json` | One object per op per phase: `opId`, `phase` (`dryrun`, `live-read`, `live-mutate`, `undo`), `exitCode`, `pass`, `reason`. |
| `smoke-out/summary.md` | Counts, failures, and expected skips. |

Share the folder back on the pull request. Zip `smoke-out` and attach it, or paste `summary.md` into a comment. The JSON reasons are scrubbed for hash-shaped strings and Wi-Fi key lines. Do not add a SAM hive, a registry dump, or `netsh wlan show profile key=clear` output.

A row with `pass: true` and a reason that starts with `expected-skip:` is a documented limitation, not a silent pass. Safe mode records `live-mutate` and `undo` as expected skips. On a non-Windows host the driver also skips per-op dry-run and live read, and the switch does not enable mutations there.

## What the phases check

| Phase | What it checks |
| --- | --- |
| `dryrun` (analyzer row) | Every `.ps1` parses. The row `opId` is `PSScriptAnalyzer`. Error and Warning fail the run. |
| `dryrun` | Every Windows op with `-DryRun`. Exit `0`, or `3` with a `Skipped:` reason. Summary or preview text is non-empty. |
| `live-read` | Every read op whose platform is Windows or both. Exit `0` or an encoded expected-skip. Structured JSON comes back. |
| `live-mutate` | Firewall on, password policy, audit policy, Guest disable, a throwaway service disable, and an allowlist sync of `cp-test-alice` (allowed) against `cp-test-mallory` (not on the allowlist). Independent `Get-NetFirewallProfile`, `net accounts`, `auditpol`, `Get-LocalUser`, and `Get-Service` checks prove the change. Runs only on GitHub Actions, or with `-IUnderstandThisIsADisposableVM` on Windows. |
| `undo` | `engines/windows/Restore-CpBackup.ps1` restores the snapshot taken before that apply. The same independent checks prove the prior state returned. |

Linux-only catalog ids return `Skipped:` and exit `3` instead of a fake success. A missing Guest account, BitLocker, Wi-Fi, Secure Boot, IIS, or Credential Guard is an **expected-skip** recorded with a reason. Anything else fails the run.

## Enable the GitHub Actions run

The workflow file is **not** in this repo. The builder token has scopes `gist`, `read:org`, and `repo`. It does not have `workflow`, so GitHub rejects any push of `.github/workflows/*`. Two ways to add it:

1. On the builder, refresh the token with an interactive device login:

   ```bash
   gh auth refresh -h github.com -s workflow
   ```

   After that login succeeds, a session can push the workflow commit `960215d` from the local-only branch `feat/cp-16-windows-workflow-local`. That commit is the file `.github/workflows/windows-smoke.yml`. Cherry-pick it onto current `main` (so the driver path below exists) and push that branch. Do not push `960215d` before the refresh.

2. In the GitHub web UI: Add file, Create new file, name it `.github/workflows/windows-smoke.yml`, paste the YAML below, and commit to `main` or to a branch. Then run it:

   ```bash
   gh workflow run windows-smoke.yml
   ```

   You can also use the Actions tab, select Windows smoke, and click Run workflow.

`GITHUB_ACTIONS=true` is the gate that lets the driver run live-mutate and undo on `windows-latest`. The YAML does not pass `-IUnderstandThisIsADisposableVM`. The job never touches a scoring service. Linux-only live-read specs skip themselves on `win32`. Screenshot baselines are linux-only.

```yaml
name: windows-smoke

# Disposable windows-latest VM. Live mutation is allowed here and nowhere else.
# Linux live reads stay on the builder. This job never touches a scoring service.
# GITHUB_ACTIONS=true lets engines/windows/tests/Invoke-WindowsSmoke.ps1 run
# live-mutate and undo. A local VM passes -IUnderstandThisIsADisposableVM instead.
on:
  workflow_dispatch:
  pull_request:

permissions:
  contents: read

jobs:
  smoke:
    name: Windows engine smoke
    runs-on: windows-latest
    timeout-minutes: 120
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install PSScriptAnalyzer
        shell: pwsh
        run: Install-Module -Name PSScriptAnalyzer -Force -Scope CurrentUser -AllowClobber

      - name: Run every Windows op
        shell: pwsh
        run: |
          ./engines/windows/tests/Invoke-WindowsSmoke.ps1 -RepoRoot (Get-Location).Path -OutDir "$env:GITHUB_WORKSPACE\smoke-out"

      - name: Upload per-op results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: windows-smoke
          path: smoke-out/
          if-no-files-found: warn

  e2e:
    name: Playwright on Windows
    runs-on: windows-latest
    timeout-minutes: 45
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Chromium
        run: npm exec -w dashboard -- playwright install chromium

      - name: Run Playwright
        shell: pwsh
        run: |
          $env:CI = "1"
          npm run test:e2e

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: windows-playwright
          path: |
            apps/dashboard/test-results/
            apps/dashboard/playwright-report/
          if-no-files-found: ignore
```

## Expected skips

These are the only skips the driver treats as success. The reason string is stored on the result row.

| Op | Reason the runner may skip |
| --- | --- |
| Linux-only ids (`audit-sudoers`, `ssh-hardening-audit`, `find-world-writable`, and the rest of the Linux-only list in `CpOps.psm1`) | `Skipped: <id> is Linux-only.` Exit 3. |
| `disable-guest-account` live mutate | Guest is not a local account on this image. |
| `check-bitlocker-status` | BitLocker or a TPM is not present. |
| `audit-wifi-profiles` | No Wi-Fi adapter. Profiles are listed without keys. `key=clear` is not used. |
| `audit-secure-boot` | `Confirm-SecureBootUEFI` is unavailable on this SKU. |
| `audit-credential-guard` | Credential Guard / Device Guard is not available. |
| `audit-iis` | IIS / WebAdministration is not installed. |
| `run-sfc-scan` | Dry-run returns a preview and does not start `sfc`. A live `sfc /verifyonly` that is still running after the smoke budget is an expected-skip. |
| `find-backdoor-binaries`, `find-hidden-executables`, `find-media-files`, `skim-forensics-readme`, `hunt-shell-backdoors` | A recursive walk that exceeds the per-op budget is an expected-skip. A walk that finishes is a normal pass. |
| Non-Windows host | Per-op dry-run, live read, live mutate, and undo are not started. |
| Windows host without the switch and outside GitHub Actions | Live mutate and undo are not started. Parse, lint, dry-run, and live read still run. |

## Latest results

Not run. Windows cmdlets have not been executed anywhere. There is no Actions run URL. After a disposable VM run or a `windows-latest` run, replace this section with the dry-run / live-read / live-mutate / undo counts from `summary.md`.
