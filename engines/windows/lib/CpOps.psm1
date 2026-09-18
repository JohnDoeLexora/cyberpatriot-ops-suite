# CyberPatriot Ops Suite — defensive Windows engine.
# Authorized competition images only. Never dumps password hashes.
#Requires -Version 5.1

Set-StrictMode -Version Latest

function Get-CpAllowlist {
    param([string]$Path = "config/allowed-users.txt")
    if (-not (Test-Path $Path)) { return @("Administrator", "alice", "bob", "coach") }
    Get-Content $Path | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -notmatch '^#' }
}

function Test-CpConfirm {
    param([switch]$ConfirmLive, [switch]$DryRun)
    if ($DryRun) { return $true }
    if ($ConfirmLive) { return $true }
    if ($env:CP_CONFIRM -eq "1") { return $true }
    throw "Mutation refused without -ConfirmLive (or CP_CONFIRM=1). See docs/SAFETY.md."
}

function ConvertTo-CpJson {
    param($InputObject)
    $InputObject | ConvertTo-Json -Depth 8 -Compress:$false
}

function Get-CpLocalUsers {
    $users = @()
    Get-LocalUser | ForEach-Object {
        $users += [pscustomobject]@{
            name           = $_.Name
            sid            = $_.SID.Value
            enabled        = [bool]$_.Enabled
            locked         = -not [bool]$_.Enabled
            lastLogin      = if ($_.LastLogon) { $_.LastLogon.ToString("o") } else { $null }
            passwordSet    = [bool]$_.PasswordRequired
            passwordEmpty  = -not [bool]$_.PasswordRequired
            passwordHidden = $true
            groups         = @()
            home           = $_.HomeDirectory
            description    = $_.Description
            platform       = "windows"
        }
    }
    # Simpler group membership pass
    $byName = @{}
    foreach ($u in $users) { $byName[$u.name] = $u; $u.groups = @() }
    foreach ($g in Get-LocalGroup) {
        try {
            Get-LocalGroupMember -Group $g.Name -ErrorAction Stop | ForEach-Object {
                $short = ($_.Name -split '\\')[-1]
                if ($byName.ContainsKey($short)) {
                    $byName[$short].groups += $g.Name
                }
            }
        } catch {}
    }
    [pscustomobject]@{ ok = $true; users = @($byName.Values) }
}

function Get-CpSuspiciousUsers {
    param([string]$AllowlistPath = "config/allowed-users.txt")
    $allow = Get-CpAllowlist -Path $AllowlistPath
    $bundle = Get-CpLocalUsers
    $pattern = '^(hacker|toor|flag|pwn|backdoor|guest|test\d*|admin\d+|nmap)$'
    $scored = @()
    foreach ($u in $bundle.users) {
        $signals = @()
        $score = 0
        $human = $u.name -notin @("DefaultAccount", "WDAGUtilityAccount")
        if ($human -and -not $u.lastLogin) { $signals += "never-logged-in"; $score += 10 }
        if ($u.name -match $pattern) { $signals += "name-pattern"; $score += 20 }
        if ($human -and ($allow -notcontains $u.name) -and $u.name -ne "Administrator") {
            $signals += "not-in-allowlist"; $score += 25
        }
        if ($u.passwordEmpty) { $signals += "empty-password"; $score += 35 }
        if ($u.groups -contains "Administrators" -and ($allow -notcontains $u.name) -and $u.name -ne "Administrator") {
            $signals += "extra-admin"; $score += 20
        }
        $u | Add-Member -NotePropertyName suspicionScore -NotePropertyValue ([Math]::Min(100, $score)) -Force
        $u | Add-Member -NotePropertyName signals -NotePropertyValue $signals -Force
        $scored += $u
    }
    [pscustomobject]@{ ok = $true; users = $scored }
}

function Get-CpServices {
    $svc = Get-Service | Select-Object -First 400 Name, Status, StartType, DisplayName
    [pscustomobject]@{
        ok       = $true
        services = @(
            $svc | ForEach-Object {
                [pscustomobject]@{
                    name        = $_.Name
                    state       = if ($_.Status -eq "Running") { "running" } else { "stopped" }
                    enabled     = $_.StartType -in @("Automatic", "AutomaticDelayedStart")
                    description = $_.DisplayName
                    platform    = "windows"
                }
            }
        )
    }
}

function Get-CpPorts {
    $conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue
    [pscustomobject]@{
        ok    = $true
        ports = @(
            $conns | ForEach-Object {
                [pscustomobject]@{
                    protocol = "tcp"
                    port     = $_.LocalPort
                    address  = $_.LocalAddress
                    pid      = $_.OwningProcess
                }
            }
        )
    }
}

function Get-CpFirewall {
    $profiles = Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction
    [pscustomobject]@{ ok = $true; extra = @{ profiles = $profiles } }
}

function Get-CpShares {
    $shares = Get-SmbShare -ErrorAction SilentlyContinue
    [pscustomobject]@{
        ok     = $true
        shares = @(
            $shares | ForEach-Object {
                [pscustomobject]@{ name = $_.Name; path = $_.Path; guest = [bool]$_.FolderEnumerationMode }
            }
        )
    }
}

function Invoke-CpOp {
    param(
        [Parameter(Mandatory)][string]$OpId,
        [string]$Username,
        [string]$Service,
        [string]$Package,
        [string]$AllowlistPath = "config/allowed-users.txt",
        [switch]$DryRun,
        [switch]$ConfirmLive
    )

    switch ($OpId) {
        "list-users" { return Get-CpLocalUsers }
        "flag-suspicious-users" { return Get-CpSuspiciousUsers -AllowlistPath $AllowlistPath }
        "list-admin-users" {
            $u = Get-CpLocalUsers
            $admins = @($u.users | Where-Object { $_.groups -contains "Administrators" })
            return [pscustomobject]@{ ok = $true; users = $admins }
        }
        "check-empty-passwords" {
            $u = Get-CpLocalUsers
            return [pscustomobject]@{ ok = $true; users = @($u.users | Where-Object { $_.passwordEmpty }) }
        }
        "audit-never-logged-in" {
            $u = Get-CpLocalUsers
            return [pscustomobject]@{ ok = $true; users = @($u.users | Where-Object { -not $_.lastLogin -and $_.enabled }) }
        }
        "list-groups" {
            $g = Get-LocalGroup | ForEach-Object { [pscustomobject]@{ name = $_.Name; members = @() } }
            return [pscustomobject]@{ ok = $true; groups = @($g) }
        }
        "list-services" { return Get-CpServices }
        "flag-risky-services" {
            $risky = @("TlntSvr", "FTPSVC", "TermService", "RemoteRegistry", "SSDPSRV", "upnphost", "SNMP", "RemoteAccess")
            $all = Get-CpServices
            $hits = @($all.services | Where-Object { $risky -contains $_.name -and ($_.enabled -or $_.state -eq "running") })
            return [pscustomobject]@{ ok = $true; services = $hits }
        }
        "audit-ftp-telnet" {
            $all = Get-CpServices
            $hits = @($all.services | Where-Object { $_.name -match "telnet|ftp|TlntSvr|FTPSVC" })
            return [pscustomobject]@{ ok = $true; services = $hits }
        }
        "audit-smb" {
            $cfg = Get-SmbServerConfiguration -ErrorAction SilentlyContinue
            return [pscustomobject]@{ ok = $true; extra = @{ EnableSMB1Protocol = $cfg.EnableSMB1Protocol; EnableSMB2Protocol = $cfg.EnableSMB2Protocol } }
        }
        "audit-listening-ports" { return Get-CpPorts }
        "audit-rdp" {
            $deny = (Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server" -ErrorAction SilentlyContinue).fDenyTSConnections
            return [pscustomobject]@{ ok = $true; extra = @{ fDenyTSConnections = $deny } }
        }
        "audit-hosts-file" {
            $text = Get-Content "$env:SystemRoot\System32\drivers\etc\hosts" -ErrorAction SilentlyContinue
            return [pscustomobject]@{ ok = $true; extra = @{ hosts = $text } }
        }
        "check-ntp" {
            $s = w32tm /query /status 2>&1 | Out-String
            return [pscustomobject]@{ ok = $true; extra = @{ w32tm = $s } }
        }
        "audit-firewall" { return Get-CpFirewall }
        "list-firewall-rules" {
            $rules = Get-NetFirewallRule -Enabled True -ErrorAction SilentlyContinue | Select-Object -First 80 DisplayName, Direction, Action, Profile
            return [pscustomobject]@{ ok = $true; extra = @{ rules = $rules } }
        }
        "find-media-files" {
            $roots = @("$env:USERPROFILE", "$env:PUBLIC", "C:\Users")
            $files = @()
            foreach ($r in $roots) {
                if (Test-Path $r) {
                    $files += Get-ChildItem $r -Recurse -Include *.mp3, *.mp4, *.wav, *.avi, *.mkv, *.flac -ErrorAction SilentlyContinue |
                        Select-Object -First 50 FullName
                }
            }
            return [pscustomobject]@{ ok = $true; files = @($files | ForEach-Object { [pscustomobject]@{ path = $_.FullName; note = "media" } }) }
        }
        "list-installed-packages" {
            $pkg = Get-Package -ErrorAction SilentlyContinue | Select-Object -First 200 Name, Version
            return [pscustomobject]@{ ok = $true; packages = @($pkg | ForEach-Object { [pscustomobject]@{ name = $_.Name; version = "$($_.Version)" } }) }
        }
        "find-prohibited-software" {
            $names = @("nmap", "hydra", "john", "wireshark", "ophcrack", "netcat", "nc", "Cain")
            $pkg = Get-Package -ErrorAction SilentlyContinue | Where-Object { $names -contains $_.Name.ToLower() }
            return [pscustomobject]@{ ok = $true; packages = @($pkg | ForEach-Object { [pscustomobject]@{ name = $_.Name; prohibited = $true } }) }
        }
        "audit-logging" {
            $logs = Get-WinEvent -ListLog Application, Security, System -ErrorAction SilentlyContinue |
                Select-Object LogName, RecordCount, MaximumSizeInBytes, IsEnabled
            return [pscustomobject]@{ ok = $true; extra = @{ logs = $logs } }
        }
        "check-pending-updates" {
            return [pscustomobject]@{ ok = $true; extra = @{ note = "Use Windows Update / PSWindowsUpdate on the image; not queried off-host." } }
        }
        "list-scheduled-tasks" {
            $tasks = Get-ScheduledTask | Where-Object { $_.TaskPath -notlike "\Microsoft\*" } |
                Select-Object TaskName, TaskPath, State
            return [pscustomobject]@{ ok = $true; extra = @{ tasks = $tasks } }
        }
        "audit-startup-items" {
            $run = Get-ItemProperty "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run" -ErrorAction SilentlyContinue
            return [pscustomobject]@{ ok = $true; extra = @{ run = $run } }
        }
        "audit-uac" {
            $p = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -ErrorAction SilentlyContinue
            return [pscustomobject]@{ ok = $true; policy = @{ EnableLUA = $p.EnableLUA; ConsentPromptBehaviorAdmin = $p.ConsentPromptBehaviorAdmin } }
        }
        "audit-powershell-logging" {
            $sb = Get-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" -ErrorAction SilentlyContinue
            return [pscustomobject]@{ ok = $true; extra = @{ EnableScriptBlockLogging = $sb.EnableScriptBlockLogging } }
        }
        "check-bitlocker-status" {
            $v = Get-BitLockerVolume -ErrorAction SilentlyContinue | Select-Object MountPoint, ProtectionStatus, VolumeStatus
            return [pscustomobject]@{ ok = $true; extra = @{ volumes = $v; note = "recovery keys omitted" } }
        }
        "audit-shared-folders" { return Get-CpShares }
        "export-evidence-bundle" {
            return [pscustomobject]@{
                ok      = $true
                users   = (Get-CpLocalUsers).users
                services= (Get-CpServices).services | Select-Object -First 40
                extra   = @{ note = "Redacted local evidence. No hashes, no private keys." }
            }
        }
        "one-click-hardening-checklist" {
            $uac = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -ErrorAction SilentlyContinue).EnableLUA
            $guest = Get-LocalUser -Name "Guest" -ErrorAction SilentlyContinue
            $items = @(
                [pscustomobject]@{ id = "guest"; title = "Guest disabled"; status = if ($guest -and $guest.Enabled) { "fail" } else { "pass" }; relatedOpId = "disable-guest-account" }
                [pscustomobject]@{ id = "uac"; title = "UAC enabled"; status = if ($uac -eq 1) { "pass" } else { "fail" }; relatedOpId = "audit-uac" }
            )
            return [pscustomobject]@{ ok = $true; checklist = $items }
        }
        "score-image-heuristics" {
            $s = Get-CpSuspiciousUsers -AllowlistPath $AllowlistPath
            $top = @($s.users | Sort-Object suspicionScore -Descending | Select-Object -First 10)
            return [pscustomobject]@{ ok = $true; users = $top; extra = @{ remainingWork = ($top | Measure-Object suspicionScore -Average).Average } }
        }
        "find-backdoor-binaries" {
            $hits = Get-ChildItem -Path $env:TEMP, "C:\Users" -Recurse -Include nc.exe, ncat.exe, netcat.exe, *.hidden.exe -ErrorAction SilentlyContinue |
                Select-Object -First 40 FullName
            return [pscustomobject]@{ ok = $true; files = @($hits | ForEach-Object { [pscustomobject]@{ path = $_.FullName } }) }
        }
        "find-hidden-executables" {
            $hits = Get-ChildItem "C:\Users" -Recurse -Force -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -like ".*" -and $_.Extension -in ".exe", ".bat", ".ps1", ".cmd" } |
                Select-Object -First 40 FullName
            return [pscustomobject]@{ ok = $true; files = @($hits | ForEach-Object { [pscustomobject]@{ path = $_.FullName; hidden = $true } }) }
        }
        default {
            if ($OpId -in @(
                    "disable-user", "lock-user", "remove-user-from-admins", "disable-guest-account",
                    "expire-user-password", "enforce-password-policy", "enable-account-lockout",
                    "disable-service", "disable-telnet", "disable-rdp", "enable-firewall",
                    "apply-default-deny-inbound", "remove-package", "apply-security-updates",
                    "disable-smbv1", "enable-windows-defender", "disable-autoplay"
                )) {
                Test-CpConfirm -ConfirmLive:$ConfirmLive -DryRun:$DryRun
                if ($DryRun) {
                    return [pscustomobject]@{ ok = $true; extra = @{ dryRun = $true; op = $OpId; username = $Username; service = $Service; package = $Package } }
                }
                switch ($OpId) {
                    "disable-user" { Disable-LocalUser -Name $Username; break }
                    "lock-user" { Disable-LocalUser -Name $Username; break }
                    "disable-guest-account" { Disable-LocalUser -Name "Guest" -ErrorAction SilentlyContinue; break }
                    "remove-user-from-admins" { Remove-LocalGroupMember -Group "Administrators" -Member $Username; break }
                    "expire-user-password" { net user $Username /logonpasswordchg:yes | Out-Null; break }
                    "disable-service" { Stop-Service -Name $Service -Force; Set-Service -Name $Service -StartupType Disabled; break }
                    "disable-telnet" { Stop-Service TlntSvr -ErrorAction SilentlyContinue; Set-Service TlntSvr -StartupType Disabled -ErrorAction SilentlyContinue; break }
                    "disable-rdp" {
                        Set-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server" -Name fDenyTSConnections -Value 1
                        Stop-Service TermService -Force -ErrorAction SilentlyContinue
                        break
                    }
                    "enable-firewall" { Set-NetFirewallProfile -Profile Domain, Public, Private -Enabled True; break }
                    "apply-default-deny-inbound" { Set-NetFirewallProfile -DefaultInboundAction Block -DefaultOutboundAction Allow; break }
                    "disable-smbv1" { Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart -ErrorAction SilentlyContinue; break }
                    "enable-windows-defender" { Set-MpPreference -DisableRealtimeMonitoring $false -ErrorAction SilentlyContinue; break }
                    "disable-autoplay" {
                        New-Item -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer" -Force | Out-Null
                        Set-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer" -Name NoDriveTypeAutoRun -Value 255
                        break
                    }
                    "enforce-password-policy" { net accounts /minpwlen:14 /maxpwage:90 /minpwage:1 /uniquepw:5 | Out-Null; break }
                    "enable-account-lockout" { net accounts /lockoutthreshold:5 /lockoutduration:10 /lockoutwindow:10 | Out-Null; break }
                    "remove-package" { Uninstall-Package -Name $Package -ErrorAction SilentlyContinue; break }
                    "apply-security-updates" { return [pscustomobject]@{ ok = $true; extra = @{ note = "Trigger Windows Update on-image; no off-host targeting." } }
                    }
                }
                return [pscustomobject]@{ ok = $true; extra = @{ op = $OpId; applied = $true } }
            }
            return [pscustomobject]@{ ok = $false; extra = @{ error = "Unhandled Windows op $OpId" } }
        }
    }
}

Export-ModuleMember -Function Invoke-CpOp, Get-CpLocalUsers, Get-CpSuspiciousUsers, Get-CpServices, Get-CpPorts, ConvertTo-CpJson
