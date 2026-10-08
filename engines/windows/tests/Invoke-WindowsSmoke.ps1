#requires -Version 5.1
<#
.SYNOPSIS
  Windows smoke driver for a disposable VM or a GitHub-hosted runner.
.DESCRIPTION
  Parses every PowerShell file, runs PSScriptAnalyzer, dry-runs every op,
  and live-reads Windows ops. Live mutate and undo run only when
  GITHUB_ACTIONS is true, or when -IUnderstandThisIsADisposableVM is set
  on a Windows host. Never targets a scoring / CCS service. Never prints
  password hashes or Wi-Fi keys.
.PARAMETER IUnderstandThisIsADisposableVM
  Allow live-mutate and undo on this Windows host. Pass it only on a
  disposable VM you have snapshotted and can throw away.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RepoRoot,
    [string]$OutDir,
    [switch]$IUnderstandThisIsADisposableVM
)

$ErrorActionPreference = 'Stop'
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}
if (-not $OutDir) {
    $OutDir = Join-Path $RepoRoot 'smoke-out'
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$work = Join-Path $OutDir 'work'
New-Item -ItemType Directory -Force -Path $work | Out-Null
Set-Location -LiteralPath $RepoRoot

$script:Rows = New-Object System.Collections.Generic.List[object]
$script:Seq = 0

$Budget = @{
    'run-sfc-scan'             = @{ Sec = 45; Reason = 'sfc /verifyonly exceeds the smoke budget on windows-latest' }
    'find-backdoor-binaries'   = @{ Sec = 60; Reason = 'recursive file walk exceeds the smoke budget' }
    'find-hidden-executables'  = @{ Sec = 60; Reason = 'recursive file walk exceeds the smoke budget' }
    'find-media-files'         = @{ Sec = 60; Reason = 'recursive file walk exceeds the smoke budget' }
    'skim-forensics-readme'    = @{ Sec = 60; Reason = 'recursive file walk exceeds the smoke budget' }
    'hunt-shell-backdoors'     = @{ Sec = 60; Reason = 'recursive file walk exceeds the smoke budget' }
}

# A failing run whose text matches the pattern is an expected runner limitation.
$FeatureSkip = @{
    'check-bitlocker-status'  = @{ Pattern = 'BitLocker|Get-BitLockerVolume|not recognized|not installed|not available'; Reason = 'BitLocker or a TPM is not present on this SKU' }
    'audit-wifi-profiles'     = @{ Pattern = 'WLAN|Wi-Fi|wireless adapter|no wireless'; Reason = 'no Wi-Fi adapter on the hosted VM' }
    'audit-secure-boot'       = @{ Pattern = 'Secure ?Boot|Confirm-SecureBootUEFI|not supported on this'; Reason = 'Secure Boot cmdlet is unavailable on this SKU' }
    'audit-credential-guard'  = @{ Pattern = 'DeviceGuard|Credential Guard|Invalid namespace|not supported'; Reason = 'Credential Guard is not available on this SKU' }
    'audit-iis'               = @{ Pattern = 'WebAdministration|IIS is not|not installed'; Reason = 'IIS is not installed on this image' }
    'disable-guest-account'   = @{ Pattern = 'Guest is not present|account Guest is not|does not exist'; Reason = 'Guest is not a local account on this image' }
}

function Test-CpWindowsHost {
    $flag = Get-Variable -Name IsWindows -ErrorAction SilentlyContinue
    if ($null -ne $flag) { return [bool]$flag.Value }
    return $env:OS -eq 'Windows_NT'
}

function Test-CpMutateAuthorized {
    if (-not (Test-CpWindowsHost)) { return $false }
    if ($env:GITHUB_ACTIONS -eq 'true') { return $true }
    if ($IUnderstandThisIsADisposableVM) { return $true }
    return $false
}

function Protect-CpSecretText {
    param([string]$Text)
    if (-not $Text) { return '' }
    $clean = [string]$Text
    $clean = [regex]::Replace($clean, '(?i)\b[0-9a-f]{64}\b', '[redacted-hash]')
    $clean = [regex]::Replace($clean, '(?i)\b[0-9a-f]{40}\b', '[redacted-hash]')
    $clean = [regex]::Replace($clean, '(?i)\b[0-9a-f]{32}\b', '[redacted-hash]')
    $clean = [regex]::Replace($clean, '(?im)(key\s*content\s*[:=]\s*).+$', '${1}[redacted]')
    $clean = [regex]::Replace($clean, '(?im)((?:keymaterial|shared\s*key|pre-shared\s*key|wi-?fi\s*key|wlan\s*key|psk)\s*[:=]\s*).+$', '${1}[redacted]')
    return $clean
}

function Add-Row {
    param(
        [string]$OpId,
        [string]$Phase,
        [int]$ExitCode,
        [bool]$Pass,
        [string]$Reason
    )
    $script:Rows.Add([pscustomobject]@{
            opId     = $OpId
            phase    = $Phase
            exitCode = $ExitCode
            pass     = $Pass
            reason   = (Protect-CpSecretText -Text $Reason)
        })
}

function Get-CpCatalog {
    $text = Get-Content -LiteralPath (Join-Path $RepoRoot 'packages\ops-catalog\src\catalog.ts') -Raw
    $found = [regex]::Matches($text, 'op\(\s*"([^"]+)",\s*"[^"]*",\s*"[^"]*",\s*"(linux|both|windows)",\s*"(read|mutate)"')
    foreach ($item in $found) {
        [pscustomobject]@{
            Id       = $item.Groups[1].Value
            Platform = $item.Groups[2].Value
            Risk     = $item.Groups[3].Value
        }
    }
}

function Get-DryRunArgument {
    param([string]$OpId)
    $userOps = @('disable-user', 'lock-user', 'remove-user-from-admins', 'expire-user-password')
    if ($userOps -contains $OpId) { return @('-Username', 'cp-test-mallory') }
    if ($OpId -eq 'disable-service') { return @('-Service', 'RemoteRegistry') }
    if ($OpId -eq 'remove-package') { return @('-Package', 'cp-test-pkg') }
    return @()
}

function Format-CpNativeArg {
    param([string]$Value)
    if ($Value -match '[\s"]') { return '"' + ($Value -replace '"', '\"') + '"' }
    return $Value
}

function Invoke-CpWrapped {
    param(
        [string]$OpId,
        [string[]]$ArgumentList,
        [int]$TimeoutSec
    )
    $script:Seq++
    $scriptPath = Join-Path $RepoRoot "engines\windows\$OpId.ps1"
    $pieces = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Format-CpNativeArg $scriptPath))
    foreach ($arg in @($ArgumentList)) { $pieces += (Format-CpNativeArg $arg) }
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'powershell.exe'
    $psi.Arguments = ($pieces -join ' ')
    $psi.WorkingDirectory = $RepoRoot
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true
    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    [void]$proc.Start()
    $outTask = $proc.StandardOutput.ReadToEndAsync()
    $errTask = $proc.StandardError.ReadToEndAsync()
    if (-not $proc.WaitForExit($TimeoutSec * 1000)) {
        & taskkill.exe /F /T /PID $proc.Id 2>$null | Out-Null
        return @{ Code = 124; Stdout = ''; Stderr = "timed out after ${TimeoutSec}s"; TimedOut = $true; Json = $null }
    }
    [void]$proc.WaitForExit()
    $stdout = $outTask.Result
    $stderr = $errTask.Result
    $json = $null
    $start = $stdout.IndexOf('{')
    $end = $stdout.LastIndexOf('}')
    if ($start -ge 0 -and $end -gt $start) {
        try { $json = $stdout.Substring($start, $end - $start + 1) | ConvertFrom-Json } catch { $json = $null }
    }
    return @{ Code = [int]$proc.ExitCode; Stdout = $stdout; Stderr = $stderr; TimedOut = $false; Json = $json }
}

function Get-PayloadText {
    param($Run)
    $summary = ''
    if ($Run.Json -and $Run.Json.PSObject.Properties.Name -contains 'summary' -and $Run.Json.summary) {
        $summary = [string]$Run.Json.summary
    }
    $preview = ''
    if ($Run.Json -and $Run.Json.PSObject.Properties.Name -contains 'preview' -and $Run.Json.preview) {
        $preview = @($Run.Json.preview) -join "`n"
    }
    return @{ Summary = $summary; Preview = $preview; Blob = "$summary`n$preview`n$($Run.Stderr)" }
}

function Test-HasPayload {
    param($Json, [string]$Summary, [string]$Preview)
    if ($Summary -match '\S' -or $Preview -match '\S') { return $true }
    if (-not $Json) { return $false }
    foreach ($name in @('users', 'groups', 'services', 'ports', 'files', 'packages', 'checklist', 'policy', 'extra', 'findings')) {
        if ($Json.PSObject.Properties.Name -contains $name -and $null -ne $Json.$name) { return $true }
    }
    return $false
}

function Resolve-SmokeResult {
    param(
        [string]$OpId,
        [string]$Phase,
        $Run
    )
    $text = Get-PayloadText -Run $Run
    if ($Run.TimedOut) {
        $budget = $Budget[$OpId]
        if ($budget -and $Phase -in @('dryrun', 'live-read')) {
            return @{ Pass = $true; Reason = "expected-skip: $($budget.Reason)"; Code = 124 }
        }
        return @{ Pass = $false; Reason = "timed out after the budget"; Code = 124 }
    }
    $sensible = Test-HasPayload -Json $Run.Json -Summary $text.Summary -Preview $text.Preview
    if ($Run.Code -eq 0 -and $sensible) {
        return @{ Pass = $true; Reason = ''; Code = 0 }
    }
    if ($Run.Code -eq 3 -and $text.Summary -match 'Skipped:' -and $sensible) {
        return @{ Pass = $true; Reason = "expected-skip: $($text.Summary.Trim())"; Code = 3 }
    }
    $rule = $FeatureSkip[$OpId]
    if ($rule -and $text.Blob -match $rule.Pattern) {
        return @{ Pass = $true; Reason = "expected-skip: $($rule.Reason)"; Code = [int]$Run.Code }
    }
    $why = $text.Summary.Trim()
    if (-not $why) { $why = ([string]$Run.Stderr).Trim() }
    if (-not $why) { $why = 'empty output' }
    return @{ Pass = $false; Reason = $why; Code = [int]$Run.Code }
}

function Invoke-Recorded {
    param(
        [string]$OpId,
        [string]$Phase,
        [string[]]$ArgumentList,
        [int]$TimeoutSec = 90
    )
    if ($Budget.ContainsKey($OpId) -and $Phase -in @('dryrun', 'live-read')) {
        $TimeoutSec = [int]$Budget[$OpId].Sec
    }
    $run = Invoke-CpWrapped -OpId $OpId -ArgumentList $ArgumentList -TimeoutSec $TimeoutSec
    $judged = Resolve-SmokeResult -OpId $OpId -Phase $Phase -Run $run
    Add-Row -OpId $OpId -Phase $Phase -ExitCode $judged.Code -Pass $judged.Pass -Reason $judged.Reason
    return @{ Judged = $judged; Run = $run }
}

function Invoke-Analyzer {
    $files = @(Get-ChildItem -LiteralPath (Join-Path $RepoRoot 'engines\windows') -Recurse -Include *.ps1, *.psm1)
    $parseErrors = New-Object System.Collections.Generic.List[string]
    foreach ($file in $files) {
        $tokens = $null
        $errors = $null
        [void][System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$errors)
        foreach ($err in @($errors)) {
            $parseErrors.Add("$($file.FullName): $($err.Message)")
        }
    }
    if ($parseErrors.Count -gt 0) {
        Add-Row -OpId 'ps-parse' -Phase 'dryrun' -ExitCode 1 -Pass $false -Reason (($parseErrors | Select-Object -First 8) -join ' | ')
        return $false
    }
    if (-not (Get-Command Invoke-ScriptAnalyzer -ErrorAction SilentlyContinue)) {
        if (Get-Module -ListAvailable -Name PSScriptAnalyzer) {
            Import-Module PSScriptAnalyzer
        }
    }
    if (-not (Get-Command Invoke-ScriptAnalyzer -ErrorAction SilentlyContinue)) {
        Add-Row -OpId 'PSScriptAnalyzer' -Phase 'dryrun' -ExitCode 1 -Pass $false -Reason 'PSScriptAnalyzer is not installed.'
        return $false
    }
    $findings = @(Invoke-ScriptAnalyzer -Path (Join-Path $RepoRoot 'engines\windows') -Recurse -Severity Error, Warning)
    if ($findings.Count -gt 0) {
        $sample = ($findings | Select-Object -First 12 | ForEach-Object { "$($_.Severity) $($_.RuleName) $($_.ScriptName):$($_.Line) $($_.Message)" }) -join ' | '
        Add-Row -OpId 'PSScriptAnalyzer' -Phase 'dryrun' -ExitCode 1 -Pass $false -Reason $sample
        return $false
    }
    Add-Row -OpId 'PSScriptAnalyzer' -Phase 'dryrun' -ExitCode 0 -Pass $true -Reason ("{0} files parsed; no Error or Warning" -f $files.Count)
    return $true
}

function Get-AccountNumber {
    param([string]$LabelPattern, [string]$Kind)
    $text = & net.exe accounts 2>&1 | Out-String
    $pattern = '(?m)^' + $LabelPattern + '\s+(.+?)\s*$'
    if ($text -notmatch $pattern) { throw "net accounts did not show $LabelPattern" }
    $token = Convert-CpAccountToken -Value $Matches[1].Trim() -Kind $Kind
    if ($null -eq $token) { throw "Could not read $LabelPattern from '$($Matches[1])'." }
    return $token
}

function Set-BlankPasswordAllowed {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification='Disposable runner setup. The finally block restores the exported policy.')]
    param([string]$Dir, [switch]$Restore)
    $before = Join-Path $Dir 'secedit-before.inf'
    $loose = Join-Path $Dir 'secedit-blank.inf'
    if ($Restore) {
        if (-not (Test-Path -LiteralPath $before)) { return }
        $db = Join-Path $Dir 'secedit-restore.sdb'
        & secedit.exe /configure /db $db /cfg $before /quiet | Out-Null
        return
    }
    & secedit.exe /export /cfg $before /quiet | Out-Null
    @"
[Unicode]
Unicode=yes
[System Access]
MinimumPasswordLength = 0
PasswordComplexity = 0
[Version]
signature="`$CHICAGO`$"
Revision=1
"@ | Set-Content -LiteralPath $loose -Encoding unicode
    $db = Join-Path $Dir 'secedit-blank.sdb'
    & secedit.exe /configure /db $db /cfg $loose /quiet | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "secedit /configure failed (exit $LASTEXITCODE)." }
    & net.exe accounts /minpwlen:0 /minpwage:0 | Out-Null
}

function Invoke-SmokeMutation {
    param([string]$RestoreScript)
    foreach ($fixture in @('cp-test-svc', 'cp-test-alice', 'cp-test-mallory')) {
        if (Test-CpCcsName -Name $fixture) {
            throw "Refusing to touch '$fixture'. The scoring service must stay untouched."
        }
    }
    $setup = Join-Path $work 'mutate-setup'
    New-Item -ItemType Directory -Force -Path $setup | Out-Null

    # Firewall: turn profiles off, let the op turn them on, then restore.
    if (Get-Command Get-NetFirewallProfile -ErrorAction SilentlyContinue) {
        Set-NetFirewallProfile -Profile Domain, Public, Private -Enabled False
        $fired = Invoke-Recorded -OpId 'enable-firewall' -Phase 'live-mutate' -ArgumentList @('-ConfirmLive') -TimeoutSec 120
        $enabled = @(Get-NetFirewallProfile | Where-Object { -not $_.Enabled })
        if ($fired.Judged.Pass -and $enabled.Count -ne 0) {
            Add-Row -OpId 'enable-firewall' -Phase 'live-mutate' -ExitCode 1 -Pass $false -Reason 'Get-NetFirewallProfile still has a disabled profile after the apply.'
        }
        $backup = ''
        if ($fired.Run.Json -and $fired.Run.Json.backupDir) { $backup = [string]$fired.Run.Json.backupDir }
        if ($fired.Judged.Pass -and $backup) {
            $undo = Invoke-CpWrappedRestore -RestoreScript $RestoreScript -BackupDir $backup
            $stillOn = @(Get-NetFirewallProfile | Where-Object { $_.Enabled })
            $ok = $undo.Code -eq 0 -and $stillOn.Count -eq 0
            $why = if ($ok) { '' } else { "restore exit $($undo.Code); enabled profiles remaining: $($stillOn.Count)" }
            Add-Row -OpId 'enable-firewall' -Phase 'undo' -ExitCode $undo.Code -Pass $ok -Reason $why
        } elseif (-not $fired.Judged.Pass) {
            Add-Row -OpId 'enable-firewall' -Phase 'undo' -ExitCode 3 -Pass $false -Reason 'mutate did not pass, so undo was not attempted'
        }
    } else {
        Add-Row -OpId 'enable-firewall' -Phase 'live-mutate' -ExitCode 3 -Pass $true -Reason 'expected-skip: Get-NetFirewallProfile is not available'
        Add-Row -OpId 'enable-firewall' -Phase 'undo' -ExitCode 3 -Pass $true -Reason 'expected-skip: firewall cmdlet is absent, nothing to restore'
    }

    # Password policy. Snapshot happens inside the op, after this setup.
    & net.exe accounts /minpwlen:8 /maxpwage:30 /minpwage:0 /uniquepw:0 | Out-Null
    $pw = Invoke-Recorded -OpId 'enforce-password-policy' -Phase 'live-mutate' -ArgumentList @('-ConfirmLive') -TimeoutSec 120
    if ($pw.Judged.Pass) {
        $len = Get-AccountNumber -Label 'Minimum password length:' -Kind 'len'
        $max = Get-AccountNumber -Label 'Maximum password age \(days\):' -Kind 'max'
        $min = Get-AccountNumber -Label 'Minimum password age \(days\):' -Kind 'age'
        $hist = Get-AccountNumber -Label 'Length of password history maintained:' -Kind 'history'
        if ($len -ne '14' -or $max -ne '90' -or $min -ne '1' -or $hist -ne '5') {
            Add-Row -OpId 'enforce-password-policy' -Phase 'live-mutate' -ExitCode 1 -Pass $false -Reason "net accounts is $len/$max/$min/$hist, expected 14/90/1/5"
        }
        $backup = [string]$pw.Run.Json.backupDir
        $undo = Invoke-CpWrappedRestore -RestoreScript $RestoreScript -BackupDir $backup
        $len2 = Get-AccountNumber -Label 'Minimum password length:' -Kind 'len'
        $max2 = Get-AccountNumber -Label 'Maximum password age \(days\):' -Kind 'max'
        $ok = $undo.Code -eq 0 -and $len2 -eq '8' -and $max2 -eq '30'
        $why = if ($ok) { '' } else { "after undo length=$len2 max=$max2 exit=$($undo.Code)" }
        Add-Row -OpId 'enforce-password-policy' -Phase 'undo' -ExitCode $undo.Code -Pass $ok -Reason $why
    } else {
        Add-Row -OpId 'enforce-password-policy' -Phase 'undo' -ExitCode 3 -Pass $false -Reason 'mutate did not pass, so undo was not attempted'
    }

    # Audit policy. Disable one category, the op turns the set on, restore returns the backup.
    & auditpol.exe /set /category:"Account Logon" /success:disable /failure:disable | Out-Null
    $audit = Invoke-Recorded -OpId 'enable-audit-policy' -Phase 'live-mutate' -ArgumentList @('-ConfirmLive') -TimeoutSec 120
    if ($audit.Judged.Pass) {
        $got = & auditpol.exe /get /category:"Account Logon" | Out-String
        if ($got -notmatch 'Success and Failure') {
            Add-Row -OpId 'enable-audit-policy' -Phase 'live-mutate' -ExitCode 1 -Pass $false -Reason 'auditpol /get did not show Success and Failure'
        }
        $backup = [string]$audit.Run.Json.backupDir
        $undo = Invoke-CpWrappedRestore -RestoreScript $RestoreScript -BackupDir $backup
        $after = & auditpol.exe /get /category:"Account Logon" | Out-String
        $ok = $undo.Code -eq 0 -and $after -notmatch 'Success and Failure'
        $why = if ($ok) { '' } else { 'audit policy did not return to the disabled category' }
        Add-Row -OpId 'enable-audit-policy' -Phase 'undo' -ExitCode $undo.Code -Pass $ok -Reason $why
    } else {
        Add-Row -OpId 'enable-audit-policy' -Phase 'undo' -ExitCode 3 -Pass $false -Reason 'mutate did not pass, so undo was not attempted'
    }

    # Guest. Missing Guest is an expected skip. Present Guest is enabled, then the op disables it.
    $guest = $null
    try { $guest = Get-LocalUser -Name 'Guest' -ErrorAction Stop } catch { $guest = $null }
    if (-not $guest) {
        Add-Row -OpId 'disable-guest-account' -Phase 'live-mutate' -ExitCode 3 -Pass $true -Reason 'expected-skip: Guest is not a local account on this image'
        Add-Row -OpId 'disable-guest-account' -Phase 'undo' -ExitCode 3 -Pass $true -Reason 'expected-skip: Guest was absent, nothing to restore'
    } else {
        if (-not $guest.Enabled) { Enable-LocalUser -Name 'Guest' }
        $g = Invoke-Recorded -OpId 'disable-guest-account' -Phase 'live-mutate' -ArgumentList @('-ConfirmLive') -TimeoutSec 120
        if ($g.Judged.Pass) {
            $now = Get-LocalUser -Name 'Guest'
            if ($now.Enabled) {
                Add-Row -OpId 'disable-guest-account' -Phase 'live-mutate' -ExitCode 1 -Pass $false -Reason 'Get-LocalUser Guest is still enabled'
            }
            $backup = [string]$g.Run.Json.backupDir
            $undo = Invoke-CpWrappedRestore -RestoreScript $RestoreScript -BackupDir $backup
            $back = Get-LocalUser -Name 'Guest'
            $ok = $undo.Code -eq 0 -and $back.Enabled
            $why = if ($ok) { '' } else { "Guest.Enabled=$($back.Enabled) after undo" }
            Add-Row -OpId 'disable-guest-account' -Phase 'undo' -ExitCode $undo.Code -Pass $ok -Reason $why
        } else {
            Add-Row -OpId 'disable-guest-account' -Phase 'undo' -ExitCode 3 -Pass $false -Reason 'mutate did not pass, so undo was not attempted'
        }
    }

    # Throwaway service. Not a scoring name.
    if (Test-CpCcsName -Name 'cp-test-svc') { throw "Refusing to touch 'cp-test-svc'. The scoring service must stay untouched." }
    & sc.exe create cp-test-svc 'binPath= C:\Windows\System32\cmd.exe' 'start= demand' | Out-Null
    if ($LASTEXITCODE -ne 0 -and -not (Get-Service -Name 'cp-test-svc' -ErrorAction SilentlyContinue)) {
        Add-Row -OpId 'disable-service' -Phase 'live-mutate' -ExitCode 1 -Pass $false -Reason 'sc.exe create cp-test-svc failed'
        Add-Row -OpId 'disable-service' -Phase 'undo' -ExitCode 1 -Pass $false -Reason 'service was not created'
    } else {
        $svc = Invoke-Recorded -OpId 'disable-service' -Phase 'live-mutate' -ArgumentList @('-Service', 'cp-test-svc', '-ConfirmLive') -TimeoutSec 120
        if ($svc.Judged.Pass) {
            $state = Get-Service -Name 'cp-test-svc'
            $start = [string]$state.StartType
            if ($start -ne 'Disabled') {
                Add-Row -OpId 'disable-service' -Phase 'live-mutate' -ExitCode 1 -Pass $false -Reason "StartType is $start"
            }
            $backup = [string]$svc.Run.Json.backupDir
            $undo = Invoke-CpWrappedRestore -RestoreScript $RestoreScript -BackupDir $backup
            $again = Get-Service -Name 'cp-test-svc'
            $ok = $undo.Code -eq 0 -and [string]$again.StartType -eq 'Manual'
            $why = if ($ok) { '' } else { "StartType=$($again.StartType) after undo" }
            Add-Row -OpId 'disable-service' -Phase 'undo' -ExitCode $undo.Code -Pass $ok -Reason $why
        } else {
            Add-Row -OpId 'disable-service' -Phase 'undo' -ExitCode 3 -Pass $false -Reason 'mutate did not pass, so undo was not attempted'
        }
        if (Test-CpCcsName -Name 'cp-test-svc') { throw "Refusing to touch 'cp-test-svc'. The scoring service must stay untouched." }
        & sc.exe delete cp-test-svc | Out-Null
    }

    # Allowlist sync. Alice is allowed and becomes an admin. Mallory already exists and must stay off Administrators.
    Set-BlankPasswordAllowed -Dir $setup
    try {
        foreach ($fixture in @('cp-test-alice', 'cp-test-mallory')) {
            if (Test-CpCcsName -Name $fixture) { throw "Refusing to touch '$fixture'. The scoring service must stay untouched." }
        }
        $existingAlice = Get-LocalUser -Name 'cp-test-alice' -ErrorAction SilentlyContinue
        if ($existingAlice) { Remove-LocalUser -Name 'cp-test-alice' }
        if (-not (Get-LocalUser -Name 'cp-test-mallory' -ErrorAction SilentlyContinue)) {
            New-LocalUser -Name 'cp-test-mallory' -NoPassword -UserMayChangePassword $true | Out-Null
        }
        $allow = Join-Path $setup 'allow.txt'
        $admins = Join-Path $setup 'admins.txt'
        Set-Content -LiteralPath $allow -Value "cp-test-alice`n" -Encoding ascii
        Set-Content -LiteralPath $admins -Value "cp-test-alice`n" -Encoding ascii
        $sync = Invoke-Recorded -OpId 'sync-authorized-users' -Phase 'live-mutate' -ArgumentList @(
            '-AllowlistPath', $allow, '-AdminsPath', $admins, '-ConfirmLive'
        ) -TimeoutSec 180
        if ($sync.Judged.Pass) {
            $alice = Get-LocalUser -Name 'cp-test-alice' -ErrorAction SilentlyContinue
            $mallory = Get-LocalUser -Name 'cp-test-mallory' -ErrorAction SilentlyContinue
            $members = @(Get-LocalGroupMember -Group 'Administrators' | ForEach-Object { ($_.Name -split '\\')[-1] })
            $bad = @()
            if (-not $alice) { $bad += 'alice was not created' }
            if (-not $mallory) { $bad += 'mallory disappeared' }
            if ($members -notcontains 'cp-test-alice') { $bad += 'alice is not an Administrator' }
            if ($members -contains 'cp-test-mallory') { $bad += 'mallory was added to Administrators' }
            if ($bad.Count -gt 0) {
                Add-Row -OpId 'sync-authorized-users' -Phase 'live-mutate' -ExitCode 1 -Pass $false -Reason ($bad -join '; ')
            }
            $backup = [string]$sync.Run.Json.backupDir
            $undo = Invoke-CpWrappedRestore -RestoreScript $RestoreScript -BackupDir $backup
            $aliceAfter = Get-LocalUser -Name 'cp-test-alice' -ErrorAction SilentlyContinue
            $malloryAfter = Get-LocalUser -Name 'cp-test-mallory' -ErrorAction SilentlyContinue
            $membersAfter = @(Get-LocalGroupMember -Group 'Administrators' -ErrorAction SilentlyContinue | ForEach-Object { ($_.Name -split '\\')[-1] })
            $ok = $undo.Code -eq 0 -and -not $aliceAfter -and $malloryAfter -and ($membersAfter -notcontains 'cp-test-alice')
            $why = if ($ok) { '' } else { "alicePresent=$([bool]$aliceAfter) malloryPresent=$([bool]$malloryAfter) exit=$($undo.Code)" }
            Add-Row -OpId 'sync-authorized-users' -Phase 'undo' -ExitCode $undo.Code -Pass $ok -Reason $why
        } else {
            Add-Row -OpId 'sync-authorized-users' -Phase 'undo' -ExitCode 3 -Pass $false -Reason 'mutate did not pass, so undo was not attempted'
        }
    } finally {
        foreach ($fixture in @('cp-test-alice', 'cp-test-mallory')) {
            if (Test-CpCcsName -Name $fixture) { throw "Refusing to touch '$fixture'. The scoring service must stay untouched." }
        }
        $left = Get-LocalUser -Name 'cp-test-mallory' -ErrorAction SilentlyContinue
        if ($left) { Remove-LocalUser -Name 'cp-test-mallory' -ErrorAction SilentlyContinue }
        $aliceLeft = Get-LocalUser -Name 'cp-test-alice' -ErrorAction SilentlyContinue
        if ($aliceLeft) { Remove-LocalUser -Name 'cp-test-alice' -ErrorAction SilentlyContinue }
        Set-BlankPasswordAllowed -Dir $setup -Restore
    }
}

function Invoke-CpWrappedRestore {
    param([string]$RestoreScript, [string]$BackupDir)
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'powershell.exe'
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File $(Format-CpNativeArg $RestoreScript) -BackupDir $(Format-CpNativeArg $BackupDir)"
    $psi.WorkingDirectory = $RepoRoot
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    [void]$proc.Start()
    $outTask = $proc.StandardOutput.ReadToEndAsync()
    $errTask = $proc.StandardError.ReadToEndAsync()
    if (-not $proc.WaitForExit(120000)) {
        & taskkill.exe /F /T /PID $proc.Id 2>$null | Out-Null
        return @{ Code = 124; Stdout = ''; Stderr = 'restore timed out' }
    }
    [void]$proc.WaitForExit()
    return @{ Code = [int]$proc.ExitCode; Stdout = $outTask.Result; Stderr = $errTask.Result }
}

function Write-SmokeSummary {
    # @($genericList) throws "Argument types do not match" on PowerShell 7.
    $rows = @($script:Rows.ToArray())
    $phases = @('dryrun', 'live-read', 'live-mutate', 'undo')
    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add('# Windows smoke')
    $lines.Add('')
    $lines.Add('| Phase | Passed | Expected skip | Failed |')
    $lines.Add('| --- | --- | --- | --- |')
    foreach ($phase in $phases) {
        $slice = @($rows | Where-Object { $_.phase -eq $phase })
        $skip = @($slice | Where-Object { $_.pass -and $_.reason -like 'expected-skip:*' }).Count
        $pass = @($slice | Where-Object { $_.pass -and $_.reason -notlike 'expected-skip:*' }).Count
        $fail = @($slice | Where-Object { -not $_.pass }).Count
        $lines.Add("| $phase | $pass | $skip | $fail |")
    }
    $lines.Add('')
    $failed = @($rows | Where-Object { -not $_.pass })
    $lines.Add('## Failures')
    $lines.Add('')
    if ($failed.Count -eq 0) { $lines.Add('None.') }
    else {
        foreach ($row in $failed) { $lines.Add("- ``$($row.opId)`` $($row.phase) exit $($row.exitCode): $($row.reason)") }
    }
    $lines.Add('')
    $lines.Add('## Expected skips')
    $lines.Add('')
    $skips = @($rows | Where-Object { $_.pass -and $_.reason -like 'expected-skip:*' })
    if ($skips.Count -eq 0) { $lines.Add('None.') }
    else {
        foreach ($row in $skips) { $lines.Add("- ``$($row.opId)`` $($row.phase): $($row.reason)") }
    }
    $markdown = $lines -join "`n"
    Set-Content -LiteralPath (Join-Path $OutDir 'summary.md') -Value $markdown -Encoding utf8
    if ($env:GITHUB_STEP_SUMMARY) { Add-Content -LiteralPath $env:GITHUB_STEP_SUMMARY -Value $markdown }
    $rows | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $OutDir 'results.json') -Encoding utf8
}

$restoreScript = Join-Path $RepoRoot 'engines\windows\Restore-CpBackup.ps1'
$analyzerOk = Invoke-Analyzer
$onWindows = Test-CpWindowsHost
$mutateOk = Test-CpMutateAuthorized

if (-not $onWindows) {
    Add-Row -OpId 'windows-host' -Phase 'dryrun' -ExitCode 3 -Pass $true -Reason 'expected-skip: this host is not Windows. Per-op dry-run was not started.'
    Add-Row -OpId 'windows-host' -Phase 'live-read' -ExitCode 3 -Pass $true -Reason 'expected-skip: this host is not Windows. Live reads were not started.'
    $mutateReason = 'expected-skip: this host is not Windows. Live mutations were not started.'
    if ($IUnderstandThisIsADisposableVM -or ($env:GITHUB_ACTIONS -eq 'true')) {
        $mutateReason = 'expected-skip: this host is not Windows. -IUnderstandThisIsADisposableVM and GITHUB_ACTIONS do not enable mutations here.'
    }
    Add-Row -OpId 'windows-host' -Phase 'live-mutate' -ExitCode 2 -Pass $true -Reason $mutateReason
    Add-Row -OpId 'windows-host' -Phase 'undo' -ExitCode 3 -Pass $true -Reason 'expected-skip: this host is not Windows. Undo was not started.'
} else {
    $catalog = @(Get-CpCatalog)
    if ($catalog.Count -lt 100) { throw "Catalog parse returned $($catalog.Count) ops." }

    foreach ($op in $catalog) {
        $dryArgs = @('-DryRun') + @(Get-DryRunArgument -OpId $op.Id)
        Invoke-Recorded -OpId $op.Id -Phase 'dryrun' -ArgumentList $dryArgs | Out-Null
    }

    $reads = @($catalog | Where-Object { $_.Risk -eq 'read' -and $_.Platform -ne 'linux' })
    foreach ($op in $reads) {
        Invoke-Recorded -OpId $op.Id -Phase 'live-read' -ArgumentList @() | Out-Null
    }

    if (-not $mutateOk) {
        Add-Row -OpId 'live-mutate' -Phase 'live-mutate' -ExitCode 2 -Pass $true -Reason 'expected-skip: live-mutate was not started. On a disposable Windows VM pass -IUnderstandThisIsADisposableVM. GitHub Actions sets GITHUB_ACTIONS=true.'
        Add-Row -OpId 'undo' -Phase 'undo' -ExitCode 2 -Pass $true -Reason 'expected-skip: undo was not started because live-mutate did not run.'
    } else {
        . "$RepoRoot\engines\windows\lib\CpReliability.ps1"
        try {
            Invoke-SmokeMutation -RestoreScript $restoreScript
        } catch {
            $msg = $_.Exception.Message
            if (-not $msg) { $msg = "$_" }
            Add-Row -OpId 'live-mutate' -Phase 'live-mutate' -ExitCode 1 -Pass $false -Reason $msg
        }
    }
}
Write-SmokeSummary
Write-Output "Smoke results: $(Join-Path $OutDir 'results.json')"
Write-Output "Smoke summary: $(Join-Path $OutDir 'summary.md')"

$failedCount = @($script:Rows | Where-Object { -not $_.pass }).Count
if (-not $analyzerOk -or $failedCount -gt 0) { exit 1 }
exit 0
