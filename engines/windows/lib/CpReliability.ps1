# CyberPatriot Windows reliability helpers.
# Dot-sourced by CpOps.psm1. Pure functions are safe to test on Linux pwsh.
# Live cmdlets (Get-LocalUser, Set-ItemProperty, ...) run only on the apply path.

function Get-CpAllowlistStrict {
    param([string]$Path)
    $names = New-Object System.Collections.Generic.List[string]
    if ($Path -and (Test-Path -LiteralPath $Path)) {
        foreach ($line in @(Get-Content -LiteralPath $Path -ErrorAction SilentlyContinue)) {
            $name = ($line -split '#', 2)[0].Trim()
            if ($name) { $names.Add($name) }
        }
    }
    # The comma keeps a 0- or 1-item array from being unrolled into $null.
    return ,$names.ToArray()
}

function Test-CpCcsName {
    param([string]$Name)
    if (-not $Name) { return $false }
    $exact = @(
        'ccs', 'ccs.service', 'ccsclient', 'ccsclient.service', 'scoring', 'scoring.service',
        'cyberpatriot', 'cyberpatriot.service', 'cpsscoring', 'cpsscoring.service',
        'scoringengine', 'scoringengine.service'
    )
    $low = $Name.Trim().ToLowerInvariant()
    return [bool]($exact -contains $low)
}

function Test-CpSelfAccount {
    param([string]$Name)
    if (-not $Name) { return $false }
    foreach ($self in @($env:USERNAME, $env:USER)) {
        if ($self -and ($self -eq $Name)) { return $true }
    }
    return $false
}

function Format-CpSummary {
    param([int]$Changed, [int]$AlreadyOk, [bool]$DryRun)
    if ($DryRun) {
        return "Preview: would change $Changed settings, $AlreadyOk already OK"
    }
    return "Changed $Changed settings, $AlreadyOk already OK"
}

# In-memory result object. Dry-run never calls the helpers that write to the host.
function New-CpResult {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification='Constructs a result object in memory. It does not change the host.')]
    param(
        [bool]$Ok,
        [string]$Status,
        [string]$Summary,
        [string[]]$Preview = @(),
        [string[]]$Details = @(),
        [string[]]$Warnings = @(),
        [string]$BackupDir = '',
        [hashtable]$Extra
    )
    $extra = @{
        preview   = @($Preview)
        details   = @($Details)
        backupDir = $(if ($BackupDir) { $BackupDir } else { $null })
        status    = $Status
    }
    if ($Extra) {
        foreach ($key in @($Extra.Keys)) { $extra[$key] = $Extra[$key] }
    }
    return [pscustomobject]@{
        ok        = $Ok
        status    = $Status
        summary   = $Summary
        warnings  = @($Warnings)
        preview   = @($Preview)
        details   = @($Details)
        backupDir = $(if ($BackupDir) { $BackupDir } else { $null })
        extra     = $extra
    }
}

function Get-CpRepoRoot {
    if ($env:CP_REPO_ROOT) { return $env:CP_REPO_ROOT }
    return (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
}

function Test-CpRequiredName {
    param([string]$Name)
    if ($env:CP_FORCE -eq '1') { return $false }
    $path = if ($env:CP_REQUIRED_SERVICES) { $env:CP_REQUIRED_SERVICES } else { Join-Path (Get-CpRepoRoot) 'config/required-services.txt' }
    foreach ($item in (Get-CpAllowlistStrict -Path $path)) {
        if ($item -and ($item -eq $Name)) { return $true }
    }
    return $false
}

function Test-CpMutationConfirmed {
    param([switch]$ConfirmLive, [switch]$DryRun)
    if ($DryRun) { return $true }
    if ($ConfirmLive) { return $true }
    if ($env:CP_CONFIRM -eq '1') { return $true }
    return $false
}

# Called only after -ConfirmLive. -DryRun returns before this runs.
function New-CpBackupDir {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification='Backup directory is created only on a confirmed apply. Dry-run is the preview switch and already returned.')]
    param()
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $base = if ($env:ProgramData) {
        Join-Path $env:ProgramData 'CyberPatriotOps\backups'
    } else {
        Join-Path ([System.IO.Path]::GetTempPath()) 'CyberPatriotOps\backups'
    }
    $dir = Join-Path $base $stamp
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    return $dir
}

function Backup-CpPath {
    param([string]$Path, [string]$BackupRoot)
    if (-not $BackupRoot -or -not (Test-Path -LiteralPath $Path)) { return $null }
    New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null
    $safe = ($Path -replace '[^A-Za-z0-9._-]', '_')
    $dest = Join-Path $BackupRoot $safe
    Copy-Item -LiteralPath $Path -Destination $dest -Force
    return $dest
}

function Export-CpRegistryKey {
    param([string]$Key, [string]$BackupRoot)
    if (-not $BackupRoot) { return $null }
    if (-not (Get-Command reg.exe -ErrorAction SilentlyContinue)) { return $null }
    New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null
    $safe = ($Key -replace '[^A-Za-z0-9._-]', '_')
    $dest = Join-Path $BackupRoot "$safe.reg"
    $regPath = $Key -replace '^HKLM:', 'HKLM' -replace '^HKCU:', 'HKCU'
    & reg.exe export $regPath $dest /y | Out-Null
    if ($LASTEXITCODE -ne 0) { return $null }
    return $dest
}

# Confirmed apply only. The caller already refused dry-run and printed the preview.
function Set-CpDword {
    [Diagnostics.CodeAnalysis.SuppressMessageAttribute('PSUseShouldProcessForStateChangingFunctions', '', Justification='Registry writes happen only after confirm. A second ShouldProcess switch would duplicate -DryRun.')]
    param(
        [string]$Path,
        [string]$Name,
        [int]$Value,
        [ref]$Changed,
        [ref]$Already,
        [string]$BackupRoot
    )
    $current = $null
    if (Test-Path -LiteralPath $Path) {
        Export-CpRegistryKey -Key $Path -BackupRoot $BackupRoot | Out-Null
        $prop = Get-ItemProperty -LiteralPath $Path -Name $Name -ErrorAction SilentlyContinue
        if ($null -ne $prop -and $prop.PSObject.Properties[$Name]) {
            $current = $prop.$Name
        }
    } else {
        New-Item -Path $Path -Force | Out-Null
    }
    if ($null -ne $current -and [int]$current -eq $Value) {
        $Already.Value++
        return
    }
    Set-ItemProperty -LiteralPath $Path -Name $Name -Value $Value -Type DWord
    $Changed.Value++
}

function Invoke-CpWindowsMutation {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OpId,
        [string]$Username,
        [string]$Service,
        [string]$Package,
        [string]$AllowlistPath = 'config/allowed-users.txt',
        [string]$AdminsPath = 'config/allowed-admins.txt',
        [string]$TemplatePath = 'config/windows/cp-baseline.inf',
        [string]$ProfilePath,
        [string]$FeaturesPath = 'config/windows/optional-features.txt',
        [switch]$DryRun,
        [switch]$ConfirmLive
    )

    if (-not (Test-CpMutationConfirmed -ConfirmLive:$ConfirmLive -DryRun:$DryRun)) {
        return New-CpResult -Ok $false -Status 'refused' -Summary 'Mutation refused without -ConfirmLive (or CP_CONFIRM=1). See docs/SAFETY.md.'
    }

    $ccsTarget = @($Service, $Package, $Username) | Where-Object { $_ }
    foreach ($name in $ccsTarget) {
        if (Test-CpCcsName -Name $name) {
            return New-CpResult -Ok $false -Status 'refused' -Summary "Refusing to change '$name'. The scoring service must stay untouched."
        }
    }

    $userOps = @('disable-user', 'lock-user', 'remove-user-from-admins', 'expire-user-password')
    if ($OpId -in $userOps) {
        if (-not $Username) {
            return New-CpResult -Ok $false -Status 'error' -Summary 'username is required. Nothing was changed.'
        }
        if (Test-CpSelfAccount -Name $Username) {
            return New-CpResult -Ok $false -Status 'refused' -Summary "Refusing to change the current user '$Username'. That could lock you out of this session."
        }
    }

    if ($OpId -eq 'remove-user-from-admins') {
        $admins = Get-CpAllowlistStrict -Path $AdminsPath
        if ($admins.Count -eq 0) {
            return New-CpResult -Ok $false -Status 'refused' -Summary "Allowlist $AdminsPath is missing or empty. Refusing to change administrators."
        }
        if (($admins -contains $Username) -and $env:CP_FORCE -ne '1') {
            return New-CpResult -Ok $false -Status 'refused' -Summary "Refusing to remove '$Username' from Administrators: the name is on the admin allowlist. Pass CP_FORCE=1 only when the README says otherwise."
        }
    }

    if ($OpId -eq 'sync-authorized-users') {
        $allow = Get-CpAllowlistStrict -Path $AllowlistPath
        if ($allow.Count -eq 0) {
            return New-CpResult -Ok $false -Status 'refused' -Summary "Allowlist $AllowlistPath is missing or empty. Refusing to create accounts."
        }
    }

    if ($OpId -eq 'force-password-change' -and -not $Username) {
        $allow = Get-CpAllowlistStrict -Path $AllowlistPath
        if ($allow.Count -eq 0) {
            return New-CpResult -Ok $false -Status 'refused' -Summary "Allowlist $AllowlistPath is missing or empty. Refusing to expire passwords."
        }
    }

    if ($OpId -eq 'disable-service') {
        if (-not $Service) {
            return New-CpResult -Ok $false -Status 'error' -Summary 'service is required. Nothing was changed.'
        }
        if (Test-CpRequiredName -Name $Service) {
            return New-CpResult -Ok $false -Status 'refused' -Summary "Refusing to disable $Service. It is listed in required-services.txt."
        }
    }

    $preview = New-Object System.Collections.Generic.List[string]
    $already = 0

    switch ($OpId) {
        'disable-user' { $preview.Add("Will disable local user $Username") }
        'lock-user' { $preview.Add("Will lock local user $Username") }
        'disable-guest-account' { $preview.Add('Will disable the Guest account') }
        'remove-user-from-admins' { $preview.Add("Will remove $Username from the Administrators group") }
        'expire-user-password' { $preview.Add("Will require $Username to change the password at next logon") }
        'force-password-change' {
            if ($Username) { $preview.Add("Will require $Username to change the password at next logon") }
            else { $preview.Add('Will require each allowlisted account (except built-in system accounts) to change the password at next logon') }
        }
        'disable-service' { $preview.Add("Will disable service $Service") }
        'disable-telnet' { $preview.Add('Will disable service TlntSvr') }
        'disable-rdp' { $preview.Add('Will set fDenyTSConnections 1 in HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server and stop TermService') }
        'enable-firewall' { $preview.Add('Will enable Windows Firewall for Domain, Public, and Private') }
        'apply-default-deny-inbound' { $preview.Add('Will set the default inbound action to Block and leave outbound Allow') }
        'disable-smbv1' { $preview.Add('Will disable the optional feature SMB1Protocol') }
        'enable-windows-defender' { $preview.Add('Will turn on Microsoft Defender real-time monitoring') }
        'disable-autoplay' { $preview.Add('Will set NoDriveTypeAutoRun 255 in HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer') }
        'enforce-password-policy' { $preview.Add('Will set minimum password length 14, maximum age 90, minimum age 1, and password history 5') }
        'enable-account-lockout' { $preview.Add('Will set lockout threshold 5, duration 10, and observation window 10') }
        'remove-package' {
            if (-not $Package) {
                return New-CpResult -Ok $false -Status 'error' -Summary 'package is required. Nothing was changed.'
            }
            $preview.Add("Will uninstall package $Package")
        }
        'apply-security-updates' { $preview.Add('Will remind you to run Windows Update on this image. This op does not contact other hosts.') }
        'disable-llmnr-netbios-wpad' { $preview.Add('Will disable LLMNR multicast, NetBIOS over TCP/IP, and WPAD') }
        'remove-games-samples' { $preview.Add('Will remove installed game AppX packages (Xbox, Solitaire, Zune Music, Candy Crush) when they are present') }
        'apply-security-template' {
            if (-not (Test-Path -LiteralPath $TemplatePath)) {
                return New-CpResult -Ok $false -Status 'skipped' -Summary "Skipped: security template was not found at $TemplatePath. Point templatePath at config/windows/cp-baseline.inf."
            }
            $preview.Add("Will configure local security from $TemplatePath (secedit /configure)")
        }
        'import-firewall-profile' {
            if ($ProfilePath) { $preview.Add("Will import the firewall profile $ProfilePath") }
            else { $preview.Add('Will enable the firewall and set default inbound Block') }
        }
        'enable-audit-policy' { $preview.Add('Will enable success and failure auditing for Account Logon, Account Management, Logon/Logoff, Policy Change, Privilege Use, and System') }
        'disable-remote-registry' { $preview.Add('Will disable service RemoteRegistry') }
        'disable-remote-assistance' { $preview.Add('Will set fAllowToGetHelp 0 under HKLM:\SYSTEM\CurrentControlSet\Control\Remote Assistance') }
        'sync-authorized-users' { $preview.Add('Will create missing allowlist accounts with no password and add allowlisted admins. Extras are not disabled. Passwords are never invented.') }
        'disable-optional-windows-features' { $preview.Add('Will disable Telnet client/server, TFTP, SMB1Protocol, and SimpleTCP (or the names in the features file)') }
        'clear-suspicious-hosts' { $preview.Add('Will remove suspicious sinkhole lines from the hosts file after a backup. localhost lines stay.') }
        'harden-print-spooler' { $preview.Add('Will set RestrictDriverInstallationToAdministrators 1 and turn off PointAndPrint silent elevation') }
        'harden-powershell-constrained' { $preview.Add('Will enable PowerShell script block logging, module logging, and transcription') }
        'disable-smb-client-v1' { $preview.Add('Will disable the SMB1 client protocol') }
        'harden-null-session' { $preview.Add('Will set RestrictAnonymous 1, RestrictAnonymousSAM 1, and RestrictNullSessAccess 1') }
        'harden-usb-storage' { $preview.Add('Will set NoDriveTypeAutoRun 255 and deny execute on USB storage') }
        default {
            return New-CpResult -Ok $false -Status 'error' -Summary "No Windows apply plan for $OpId."
        }
    }

    $summary = Format-CpSummary -Changed $preview.Count -AlreadyOk $already -DryRun $true
    if ($DryRun) {
        return New-CpResult -Ok $true -Status 'preview' -Summary $summary -Preview @($preview.ToArray())
    }

    $changed = 0
    $okCount = 0
    $backup = ''
    try {
        $backup = New-CpBackupDir
        $changedRef = [ref]$changed
        $alreadyRef = [ref]$okCount
        switch ($OpId) {
            'disable-user' { Disable-CpLocalAccount -Name $Username -Changed $changedRef -Already $alreadyRef }
            'lock-user' { Disable-CpLocalAccount -Name $Username -Changed $changedRef -Already $alreadyRef }
            'disable-guest-account' { Disable-CpLocalAccount -Name 'Guest' -Changed $changedRef -Already $alreadyRef -MissingOk }
            'remove-user-from-admins' {
                $member = Get-LocalGroupMember -Group 'Administrators' -ErrorAction SilentlyContinue | Where-Object { ($_.Name -split '\\')[-1] -eq $Username }
                if (-not $member) { $okCount++ }
                else {
                    Remove-LocalGroupMember -Group 'Administrators' -Member $Username
                    $changed++
                }
            }
            'expire-user-password' { & net.exe user $Username /logonpasswordchg:yes | Out-Null; $changed++ }
            'force-password-change' {
                $names = @()
                if ($Username) { $names = @($Username) }
                else {
                    $skip = @('Administrator', 'DefaultAccount', 'WDAGUtilityAccount', 'Guest', 'root')
                    $rawAllow = Get-CpAllowlistStrict -Path $AllowlistPath
                    $names = @($rawAllow | Where-Object { $skip -notcontains $_ })
                }
                foreach ($n in $names) { & net.exe user $n /logonpasswordchg:yes | Out-Null; $changed++ }
            }
            'disable-service' { Disable-CpWindowsService -Name $Service -Changed $changedRef -Already $alreadyRef }
            'disable-telnet' { Disable-CpWindowsService -Name 'TlntSvr' -Changed $changedRef -Already $alreadyRef -MissingOk }
            'disable-rdp' {
                Set-CpDword -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server' -Name 'fDenyTSConnections' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Disable-CpWindowsService -Name 'TermService' -Changed $changedRef -Already $alreadyRef -MissingOk
            }
            'enable-firewall' {
                $off = @(Get-NetFirewallProfile | Where-Object { -not $_.Enabled })
                if ($off.Count -eq 0) { $okCount++ }
                else {
                    Set-NetFirewallProfile -Profile Domain, Public, Private -Enabled True
                    $changed++
                }
            }
            'apply-default-deny-inbound' {
                $open = @(Get-NetFirewallProfile | Where-Object { $_.DefaultInboundAction -ne 'Block' })
                if ($open.Count -eq 0) { $okCount++ }
                else {
                    Set-NetFirewallProfile -Profile Domain, Public, Private -DefaultInboundAction Block -DefaultOutboundAction Allow
                    $changed++
                }
            }
            'disable-smbv1' {
                Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart | Out-Null
                $changed++
            }
            'enable-windows-defender' {
                Set-MpPreference -DisableRealtimeMonitoring $false
                $changed++
            }
            'disable-autoplay' {
                Set-CpDword -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer' -Name 'NoDriveTypeAutoRun' -Value 255 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
            }
            'enforce-password-policy' { & net.exe accounts /minpwlen:14 /maxpwage:90 /minpwage:1 /uniquepw:5 | Out-Null; $changed++ }
            'enable-account-lockout' { & net.exe accounts /lockoutthreshold:5 /lockoutduration:10 /lockoutwindow:10 | Out-Null; $changed++ }
            'remove-package' { Uninstall-Package -Name $Package -ErrorAction Stop; $changed++ }
            'apply-security-updates' { $okCount++ }
            'disable-llmnr-netbios-wpad' {
                Set-CpDword -Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient' -Name 'EnableMulticast' -Value 0 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Set-CpDword -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings\WinHttp' -Name 'DisableWpad' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Get-CimInstance Win32_NetworkAdapterConfiguration -ErrorAction SilentlyContinue |
                    Where-Object { $_.IPEnabled } |
                    ForEach-Object { $_.SetTcpipNetbios(2) | Out-Null }
            }
            'remove-games-samples' {
                $games = @('Microsoft.XboxApp', 'Microsoft.XboxGamingOverlay', 'Microsoft.MicrosoftSolitaireCollection', 'Microsoft.ZuneMusic', 'king.com.CandyCrushSaga')
                $found = $false
                foreach ($n in $games) {
                    $pkg = Get-AppxPackage -Name $n -ErrorAction SilentlyContinue
                    if ($pkg) { $pkg | Remove-AppxPackage -ErrorAction Stop; $found = $true; $changed++ }
                }
                if (-not $found) { $okCount++ }
            }
            'apply-security-template' {
                Copy-Item -LiteralPath $TemplatePath -Destination (Join-Path $backup 'template.inf') -Force
                $db = Join-Path $env:TEMP 'cp-secedit.sdb'
                & secedit.exe /configure /db $db /cfg $TemplatePath /overwrite /quiet | Out-Null
                if ($LASTEXITCODE -ne 0) { throw "secedit /configure failed (exit $LASTEXITCODE). The template was copied to $backup." }
                $changed++
            }
            'import-firewall-profile' {
                if ($ProfilePath -and (Test-Path -LiteralPath $ProfilePath)) {
                    & netsh.exe advfirewall import $ProfilePath | Out-Null
                } else {
                    Set-NetFirewallProfile -Profile Domain, Public, Private -Enabled True -DefaultInboundAction Block -DefaultOutboundAction Allow
                }
                $changed++
            }
            'enable-audit-policy' {
                foreach ($cat in @('Account Logon', 'Account Management', 'Logon/Logoff', 'Policy Change', 'Privilege Use', 'System')) {
                    & auditpol.exe /set /category:"$cat" /success:enable /failure:enable | Out-Null
                }
                $changed++
            }
            'disable-remote-registry' { Disable-CpWindowsService -Name 'RemoteRegistry' -Changed $changedRef -Already $alreadyRef -MissingOk }
            'disable-remote-assistance' {
                Set-CpDword -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Remote Assistance' -Name 'fAllowToGetHelp' -Value 0 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Set-CpDword -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Remote Assistance' -Name 'fAllowFullControl' -Value 0 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
            }
            'sync-authorized-users' {
                $allow = Get-CpAllowlistStrict -Path $AllowlistPath
                $admins = Get-CpAllowlistStrict -Path $AdminsPath
                $present = @(Get-LocalUser | ForEach-Object { $_.Name })
                foreach ($n in $allow) {
                    if ($present -contains $n) { $okCount++; continue }
                    New-LocalUser -Name $n -NoPassword -UserMayChangePassword $true -ErrorAction Stop | Out-Null
                    $changed++
                }
                foreach ($n in $admins) {
                    if ($n -eq 'Administrator') { continue }
                    try {
                        Add-LocalGroupMember -Group 'Administrators' -Member $n -ErrorAction Stop
                    } catch {
                        # Already a member, or the account is not a local principal yet. The next run retries.
                        $msg = $_.Exception.Message
                        if ($msg -notmatch 'already') { throw }
                    }
                }
            }
            'disable-optional-windows-features' {
                $list = @('TelnetClient', 'TelnetServer', 'TFTP', 'SMB1Protocol', 'SimpleTCP')
                if (Test-Path -LiteralPath $FeaturesPath) {
                    $fromFile = Get-CpAllowlistStrict -Path $FeaturesPath
                    if ($fromFile.Count -gt 0) { $list = $fromFile }
                }
                foreach ($feature in $list) {
                    if (Test-CpCcsName -Name $feature) { throw "Refusing to change '$feature'. The scoring service must stay untouched." }
                    Disable-WindowsOptionalFeature -Online -FeatureName $feature -NoRestart -ErrorAction SilentlyContinue | Out-Null
                    $changed++
                }
            }
            'clear-suspicious-hosts' {
                $hostsPath = Join-Path $env:SystemRoot 'System32\drivers\etc\hosts'
                Backup-CpPath -Path $hostsPath -BackupRoot $backup | Out-Null
                $lines = @(Get-Content -LiteralPath $hostsPath -ErrorAction SilentlyContinue)
                $keep = New-Object System.Collections.Generic.List[string]
                $removed = 0
                foreach ($line in $lines) {
                    $trim = $line.Trim()
                    if (-not $trim -or $trim.StartsWith('#')) { $keep.Add($line); continue }
                    $parts = @($trim -split '\s+')
                    $ip = $parts[0]
                    $sink = $ip -match '^(127\.0\.0\.1|0\.0\.0\.0|::1)$'
                    $bad = $false
                    if ($sink -and $parts.Count -gt 1) {
                        foreach ($nm in $parts[1..($parts.Count - 1)]) {
                            if (Test-CpSuspiciousHostName -Name $nm) { $bad = $true }
                        }
                    }
                    if ($bad) { $removed++ } else { $keep.Add($line) }
                }
                if ($removed -eq 0) { $okCount++ }
                else {
                    Set-Content -LiteralPath $hostsPath -Value @($keep.ToArray()) -Encoding ascii
                    $changed++
                }
            }
            'harden-print-spooler' {
                $pp = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Printers\PointAndPrint'
                Set-CpDword -Path $pp -Name 'RestrictDriverInstallationToAdministrators' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Set-CpDword -Path $pp -Name 'NoWarningNoElevationOnInstall' -Value 0 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Set-CpDword -Path $pp -Name 'UpdatePromptSettings' -Value 0 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                $prn = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Printers'
                Set-CpDword -Path $prn -Name 'RegisterSpoolerRemoteRpcEndPoint' -Value 2 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Set-CpDword -Path $prn -Name 'RpcAuthnLevelPrivacyEnabled' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
            }
            'harden-powershell-constrained' {
                $base = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell'
                Set-CpDword -Path "$base\ScriptBlockLogging" -Name 'EnableScriptBlockLogging' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Set-CpDword -Path "$base\ModuleLogging" -Name 'EnableModuleLogging' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Set-CpDword -Path "$base\Transcription" -Name 'EnableTranscripting' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                $trans = 'C:\ProgramData\cp-ops\ps-transcripts'
                New-Item -ItemType Directory -Force -Path $trans | Out-Null
                if (-not (Test-Path -LiteralPath "$base\Transcription")) { New-Item -Path "$base\Transcription" -Force | Out-Null }
                $cur = (Get-ItemProperty -LiteralPath "$base\Transcription" -Name 'OutputDirectory' -ErrorAction SilentlyContinue).OutputDirectory
                if ($cur -eq $trans) { $okCount++ }
                else {
                    Set-ItemProperty -LiteralPath "$base\Transcription" -Name 'OutputDirectory' -Value $trans
                    $changed++
                }
            }
            'disable-smb-client-v1' {
                Set-SmbClientConfiguration -EnableSMB1Protocol $false -Force
                Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart -ErrorAction SilentlyContinue | Out-Null
                Disable-CpWindowsService -Name 'mrxsmb10' -Changed $changedRef -Already $alreadyRef -MissingOk
                $changed++
            }
            'harden-null-session' {
                $lsa = 'HKLM:\SYSTEM\CurrentControlSet\Control\Lsa'
                Set-CpDword -Path $lsa -Name 'RestrictAnonymous' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Set-CpDword -Path $lsa -Name 'RestrictAnonymousSAM' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Set-CpDword -Path $lsa -Name 'EveryoneIncludesAnonymous' -Value 0 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                Set-CpDword -Path $lsa -Name 'LimitBlankPasswordUse' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                $lan = 'HKLM:\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters'
                Set-CpDword -Path $lan -Name 'RestrictNullSessAccess' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
            }
            'harden-usb-storage' {
                Set-CpDword -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer' -Name 'NoDriveTypeAutoRun' -Value 255 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
                $guid = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\RemovableStorageDevices\{53f5630d-b6bf-11d0-94f2-00a0c91efb8b}'
                Set-CpDword -Path $guid -Name 'Deny_Execute' -Value 1 -Changed $changedRef -Already $alreadyRef -BackupRoot $backup
            }
        }
    } catch {
        $msg = $_.Exception.Message
        if (-not $msg) { $msg = "$_" }
        if ($msg -like 'Skipped:*') {
            return New-CpResult -Ok $false -Status 'skipped' -Summary $msg -BackupDir $backup
        }
        if ($msg -like 'Refusing*') {
            return New-CpResult -Ok $false -Status 'refused' -Summary $msg -BackupDir $backup
        }
        return New-CpResult -Ok $false -Status 'error' -Summary "Failed: $msg. Re-run as Administrator on the authorized image." -BackupDir $backup -Warnings @($msg)
    }

    $applied = Format-CpSummary -Changed $changed -AlreadyOk $okCount -DryRun $false
    $details = @("Backup directory: $backup")
    return New-CpResult -Ok $true -Status 'ok' -Summary $applied -Preview @($preview.ToArray()) -Details $details -BackupDir $backup
}

function Disable-CpLocalAccount {
    param(
        [string]$Name,
        [ref]$Changed,
        [ref]$Already,
        [switch]$MissingOk
    )
    if (Test-CpSelfAccount -Name $Name) {
        throw "Refusing to change the current user '$Name'."
    }
    if (-not (Get-Command Get-LocalUser -ErrorAction SilentlyContinue)) {
        throw "Skipped: Get-LocalUser is not available. Run this on a Windows CyberPatriot image."
    }
    $user = $null
    try { $user = Get-LocalUser -Name $Name -ErrorAction Stop } catch { $user = $null }
    if (-not $user) {
        if ($MissingOk) { throw "Skipped: account $Name is not present." }
        throw "User '$Name' does not exist. Nothing was changed."
    }
    if (-not $user.Enabled) { $Already.Value++; return }
    Disable-LocalUser -Name $Name
    $Changed.Value++
}

function Disable-CpWindowsService {
    param(
        [string]$Name,
        [ref]$Changed,
        [ref]$Already,
        [switch]$MissingOk
    )
    if (Test-CpCcsName -Name $Name) { throw "Refusing to change '$Name'. The scoring service must stay untouched." }
    if (-not (Get-Command Get-Service -ErrorAction SilentlyContinue)) {
        throw "Skipped: Get-Service is not available. Run this on a Windows CyberPatriot image."
    }
    $svc = Get-Service -Name $Name -ErrorAction SilentlyContinue
    if (-not $svc) {
        if ($MissingOk) { throw "Skipped: service $Name is not installed." }
        throw "Skipped: service $Name is not installed. Nothing to disable."
    }
    $start = ''
    if ($svc.PSObject.Properties['StartType']) { $start = [string]$svc.StartType }
    if ($start -eq 'Disabled' -and $svc.Status -ne 'Running') { $Already.Value++; return }
    if ($svc.Status -eq 'Running') { Stop-Service -Name $Name -Force -ErrorAction SilentlyContinue }
    Set-Service -Name $Name -StartupType Disabled
    $Changed.Value++
}
