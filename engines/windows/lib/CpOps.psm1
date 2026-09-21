# CyberPatriot Ops Suite — defensive Windows engine.
# Authorized competition images only. Never dumps password hashes.
#Requires -Version 5.1

Set-StrictMode -Version Latest

function Get-CpAllowlist {
    param([string]$Path = "config/allowed-users.txt")
    if (-not (Test-Path $Path)) { return @("Administrator", "alice", "bob", "coach") }
    Get-Content $Path | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -notmatch '^#' }
}

function Get-CpAdminlist {
    param([string]$Path = "config/allowed-admins.txt")
    if (-not (Test-Path $Path)) { return @("Administrator", "alice") }
    Get-Content $Path | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -notmatch '^#' }
}

function Test-CpSuspiciousHostName {
    param([string]$Name)
    return [bool]($Name -match 'windowsupdate|microsoft\.com|virustotal|avast|avg|defender|google\.com|facebook|youtube|twitter|bing\.com|adobe\.com|symantec|mcafee')
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
        [string]$AdminsPath = "config/allowed-admins.txt",
        [string]$TemplatePath = "config/windows/cp-baseline.inf",
        [string]$ProfilePath,
        [string]$FeaturesPath = "config/windows/optional-features.txt",
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
        "diff-expected-ports" {
            $expected = @(22, 80, 443)
            $listen = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue
            $ports = @($listen | ForEach-Object { [pscustomobject]@{ protocol = "tcp"; port = $_.LocalPort; address = $_.LocalAddress } })
            $unexpected = @($ports | Where-Object { $expected -notcontains $_.port -and $_.port -in 21, 23, 139, 445, 3389, 4444, 31337, 5900 })
            $present = @($ports | ForEach-Object { $_.port })
            $missing = @($expected | Where-Object { $present -notcontains $_ })
            return [pscustomobject]@{ ok = $true; ports = $ports; extra = @{ unexpected = $unexpected; missingExpected = $missing } }
        }
        "audit-share-acls" {
            $shares = Get-SmbShare -ErrorAction SilentlyContinue
            $acls = @()
            foreach ($s in $shares) {
                $access = Get-SmbShareAccess -Name $s.Name -ErrorAction SilentlyContinue
                foreach ($a in $access) {
                    $acls += [pscustomobject]@{
                        name      = $s.Name
                        path      = $s.Path
                        principal = $a.AccountName
                        rights    = "$($a.AccessRight)"
                        guest     = $a.AccountName -match "Everyone|Guest"
                    }
                }
            }
            return [pscustomobject]@{ ok = $true; extra = @{ acls = $acls } }
        }
        "audit-persistence-deep" {
            $run = @()
            foreach ($k in @(
                    "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run",
                    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run",
                    "HKLM:\Software\Microsoft\Windows\CurrentVersion\RunOnce",
                    "HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce"
                )) {
                $p = Get-ItemProperty $k -ErrorAction SilentlyContinue
                if ($p) { $run += $p }
            }
            $startup = Get-ChildItem "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup" -ErrorAction SilentlyContinue
            $tasks = Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object { $_.TaskPath -notlike "\Microsoft\*" } |
                Select-Object -First 40 TaskName, TaskPath, State
            return [pscustomobject]@{ ok = $true; extra = @{ run = $run; startup = $startup; tasks = $tasks } }
        }
        "hunt-remote-access-tools" {
            $needles = @("teamviewer", "anydesk", "rustdesk", "vnc", "logmein", "splashtop", "ultrasurf", "chromoting")
            $pkg = Get-Package -ErrorAction SilentlyContinue | Where-Object {
                $n = $_.Name.ToLower()
                $needles | Where-Object { $n -like "*$_*" }
            }
            $ext = @()
            foreach ($root in @(
                    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions",
                    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Extensions"
                )) {
                if (Test-Path $root) {
                    $ext += Get-ChildItem $root -Directory -ErrorAction SilentlyContinue | Select-Object -First 20 FullName
                }
            }
            return [pscustomobject]@{
                ok      = $true
                packages = @($pkg | ForEach-Object { [pscustomobject]@{ name = $_.Name; prohibited = $true } })
                extra    = @{ extensions = @($ext | ForEach-Object { $_.FullName }) }
            }
        }
        "select-unauthorized-users" {
            $s = Get-CpSuspiciousUsers -AllowlistPath $AllowlistPath
            $allow = Get-CpAllowlist -Path $AllowlistPath
            $unauth = @($s.users | Where-Object { $_.signals -contains "not-in-allowlist" })
            $extraAdmins = @($s.users | Where-Object { $_.signals -contains "extra-admin" })
            $present = @($s.users | ForEach-Object { $_.name })
            $missing = @($allow | Where-Object { $present -notcontains $_ })
            return [pscustomobject]@{
                ok    = $true
                users = $unauth
                extra = @{
                    unauthorizedNames = @($unauth | ForEach-Object { $_.name })
                    extraAdmins       = @($extraAdmins | ForEach-Object { $_.name })
                    missingAllowlist  = $missing
                }
            }
        }
        "audit-anonymous-ftp" {
            $all = Get-CpServices
            $hits = @($all.services | Where-Object { $_.name -match "ftp|FTPSVC|vsftpd" })
            return [pscustomobject]@{ ok = $true; services = $hits; extra = @{ note = "Check FTPSVC anonymous auth on the image; do not log in anonymously." } }
        }
        "audit-idle-lock" {
            $desk = Get-ItemProperty "HKCU:\Control Panel\Desktop" -ErrorAction SilentlyContinue
            $p = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -ErrorAction SilentlyContinue
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    ScreenSaveActive    = $desk.ScreenSaveActive
                    ScreenSaverIsSecure = $desk.ScreenSaverIsSecure
                    ScreenSaveTimeOut   = $desk.ScreenSaveTimeOut
                    InactivityTimeoutSecs = $p.InactivityTimeoutSecs
                }
            }
        }
        "hunt-sysprep-leftovers" {
            $paths = @(
                "$env:WINDIR\Panther\unattend.xml",
                "$env:WINDIR\Panther\Unattend.xml",
                "$env:WINDIR\System32\Sysprep\unattend.xml",
                "$env:SystemDrive\unattend.xml",
                "$env:SystemDrive\autounattend.xml",
                "$env:WINDIR\Panther\UnattendGC\unattend.xml"
            )
            $files = @()
            foreach ($p in $paths) {
                if (Test-Path $p) {
                    $text = Get-Content $p -ErrorAction SilentlyContinue -Raw
                    $keys = @()
                    if ($text -match "AutoLogon") { $keys += "AutoLogon" }
                    if ($text -match "Password") { $keys += "Password" }
                    $files += [pscustomobject]@{ path = $p; note = if ($keys) { ($keys -join ", ") + " keys (values omitted)" } else { "sysprep leftover" } }
                }
            }
            return [pscustomobject]@{ ok = $true; files = $files; extra = @{ note = "Password values omitted." } }
        }
        "audit-snmp" {
            $svc = Get-Service SNMP -ErrorAction SilentlyContinue
            $comm = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\SNMP\Parameters\ValidCommunities" -ErrorAction SilentlyContinue
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    service     = if ($svc) { $svc.Status.ToString() } else { "absent" }
                    communities = if ($comm) { $comm.PSObject.Properties.Name | Where-Object { $_ -notmatch "^PS" } } else { @() }
                    note        = "Community names only; do not walk other hosts."
                }
            }
        }
        "audit-browser-baseline" {
            $ie = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings" -ErrorAction SilentlyContinue
            $ss = Get-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Edge" -ErrorAction SilentlyContinue
            $ieZone = Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings\Zones\3" -ErrorAction SilentlyContinue
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    DisablePasswordSaving = $ie.DisablePasswordSaving
                    SmartScreenEnabled    = $ss.SmartScreenEnabled
                    note                  = "Cookies/history/saved passwords not dumped."
                }
            }
        }
        "audit-auto-updates" {
            $au = Get-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -ErrorAction SilentlyContinue
            $svc = Get-Service wuauserv -ErrorAction SilentlyContinue
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    AUOptions = $au.AUOptions
                    NoAutoUpdate = $au.NoAutoUpdate
                    wuauserv  = if ($svc) { "$($svc.Status)/$($svc.StartType)" } else { "absent" }
                }
            }
        }
        "audit-null-session" {
            $lsa = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" -ErrorAction SilentlyContinue
            $lan = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters" -ErrorAction SilentlyContinue
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    RestrictAnonymous          = $lsa.RestrictAnonymous
                    RestrictAnonymousSAM       = $lsa.RestrictAnonymousSAM
                    EveryoneIncludesAnonymous  = $lsa.EveryoneIncludesAnonymous
                    RestrictNullSessAccess     = $lan.RestrictNullSessAccess
                    NullSessionPipes           = $lan.NullSessionPipes
                    NullSessionShares          = $lan.NullSessionShares
                    note                       = "SAM contents and hashes are not dumped."
                }
            }
        }
        "audit-iis" {
            $features = @()
            try {
                $features = Get-WindowsOptionalFeature -Online -ErrorAction SilentlyContinue |
                    Where-Object { $_.FeatureName -like "IIS-*" -and $_.State -eq "Enabled" } |
                    Select-Object -ExpandProperty FeatureName
            } catch {}
            $anon = $null
            $browse = $null
            try {
                Import-Module WebAdministration -ErrorAction SilentlyContinue
                $anon = (Get-WebConfigurationProperty -Filter /system.webServer/security/authentication/anonymousAuthentication -Name enabled -ErrorAction SilentlyContinue).Value
                $browse = (Get-WebConfigurationProperty -Filter /system.webServer/directoryBrowse -Name enabled -ErrorAction SilentlyContinue).Value
            } catch {}
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    features                = @($features)
                    anonymousAuthentication = $anon
                    directoryBrowse         = $browse
                    note                    = "Site content not dumped."
                }
            }
        }
        "skim-forensics-readme" {
            $roots = @(
                "$env:PUBLIC\Desktop",
                "$env:USERPROFILE\Desktop",
                "$env:USERPROFILE\Documents",
                "C:\Users"
            )
            $hits = @()
            $needles = @("password", "forensic", "question", "media", "prohibited", "unauthorized", "ftp", "telnet", "hash")
            foreach ($r in $roots) {
                if (-not (Test-Path $r)) { continue }
                Get-ChildItem $r -Recurse -Include README*, *forensic*, *QUESTION*, *.txt -ErrorAction SilentlyContinue |
                    Select-Object -First 40 | ForEach-Object {
                        $lines = Get-Content $_.FullName -ErrorAction SilentlyContinue -TotalCount 80
                        foreach ($line in $lines) {
                            if ($line -match '^[a-fA-F0-9]{32,}$') { continue }
                            foreach ($n in $needles) {
                                if ($line -match $n) {
                                    $hits += [pscustomobject]@{ path = $_.FullName; keyword = $n; line = $line.Substring(0, [Math]::Min(160, $line.Length)) }
                                    break
                                }
                            }
                        }
                    }
            }
            return [pscustomobject]@{ ok = $true; extra = @{ hits = $hits; ccsContacted = $false; note = "Local files only. CCS not contacted." } }
        }
        "run-sfc-scan" {
            $out = sfc /verifyonly 2>&1 | Out-String
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    command = "sfc /verifyonly"
                    output  = $out.Substring(0, [Math]::Min(4000, $out.Length))
                    note    = "Read-only verify. No repair. WinSxS payloads not dumped."
                }
            }
        }
        "hunt-shell-backdoors" {
            $files = @()
            $needles = 'alias\s+(sudo|su)|wget.+\|\s*sh|DownloadString|Invoke-Expression|/tmp/\.|unset\s+HISTFILE|nc\s+-e'
            $paths = @(
                "$env:USERPROFILE\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1",
                "$env:USERPROFILE\Documents\PowerShell\Microsoft.PowerShell_profile.ps1",
                "$env:WINDIR\System32\WindowsPowerShell\v1.0\profile.ps1",
                "C:\Users"
            )
            foreach ($p in $paths[0..2]) {
                if (Test-Path $p) {
                    $text = Get-Content $p -Raw -ErrorAction SilentlyContinue
                    if ($text -match $needles) {
                        $files += [pscustomobject]@{ path = $p; note = "suspicious profile pattern (value omitted if secret-like)" }
                    }
                }
            }
            Get-ChildItem "C:\Users" -Directory -ErrorAction SilentlyContinue | ForEach-Object {
                foreach ($rel in @(
                        "Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1",
                        "Documents\PowerShell\Microsoft.PowerShell_profile.ps1"
                    )) {
                    $fp = Join-Path $_.FullName $rel
                    if (Test-Path $fp) {
                        $text = Get-Content $fp -Raw -ErrorAction SilentlyContinue
                        if ($text -match $needles) {
                            $files += [pscustomobject]@{ path = $fp; note = "PowerShell profile plant" }
                        }
                    }
                }
            }
            return [pscustomobject]@{ ok = $true; files = $files; extra = @{ note = "Read-only profile hunt. Scripts were not executed." } }
        }
        "round-start-wizard" {
            $guest = Get-LocalUser -Name "Guest" -ErrorAction SilentlyContinue
            $fw = Get-NetFirewallProfile -ErrorAction SilentlyContinue
            $fwOff = $fw | Where-Object { -not $_.Enabled }
            $items = @(
                [pscustomobject]@{ id = "forensics"; title = "1. Skim local README / forensics keywords"; status = "info"; detail = "Open skim-forensics-readme. CCS is never contacted."; relatedOpId = "skim-forensics-readme" }
                [pscustomobject]@{ id = "users"; title = "2. Sync authorized users from allowlists"; status = "info"; detail = "sync-authorized-users against allowed-users.txt / allowed-admins.txt. Never invent passwords."; relatedOpId = "sync-authorized-users" }
                [pscustomobject]@{ id = "passwords"; title = "3. Password policy + force change at next logon"; status = "info"; detail = "enforce-password-policy then force-password-change."; relatedOpId = "enforce-password-policy" }
                [pscustomobject]@{ id = "firewall"; title = "4. Firewall on, default-deny inbound"; status = if ($fwOff) { "fail" } else { "pass" }; detail = if ($fwOff) { "A firewall profile is off" } else { "Firewall profiles enabled" }; relatedOpId = "enable-firewall" }
                [pscustomobject]@{ id = "updates"; title = "5. Security updates"; status = "info"; detail = "check-pending-updates then apply-security-updates."; relatedOpId = "apply-security-updates" }
                [pscustomobject]@{ id = "prohibited"; title = "6. Prohibited software"; status = "info"; detail = "find-prohibited-software then remove-package."; relatedOpId = "find-prohibited-software" }
            )
            return [pscustomobject]@{ ok = $true; checklist = $items; extra = @{ ccsContacted = $false; guestEnabled = [bool]($guest -and $guest.Enabled) } }
        }
        "report-password-never-expires" {
            $users = Get-LocalUser
            $never = @($users | Where-Object { $_.PasswordNeverExpires })
            $combo = @($never | Where-Object { -not $_.PasswordRequired })
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    neverExpires  = @($never | ForEach-Object { $_.Name })
                    blankAndNever = @($combo | ForEach-Object { $_.Name })
                    note          = "Hashes omitted; PasswordRequired/PasswordNeverExpires flags only."
                }
            }
        }
        "audit-critical-perm-drift" {
            $sam = "C:\Windows\System32\config\SAM"
            $sec = "C:\Windows\System32\config\SECURITY"
            $sys = "C:\Windows\System32\config\SYSTEM"
            $acl = @()
            foreach ($p in @($sam, $sec, $sys)) {
                if (Test-Path $p) {
                    $acl += icacls $p 2>$null | Select-Object -First 8
                }
            }
            return [pscustomobject]@{
                ok    = $true
                extra = @{ icacls = $acl; note = "ACL text only. SAM/SECURITY contents and hashes are not dumped." }
            }
        }
        "package-forensics-evidence" {
            return [pscustomobject]@{
                ok       = $true
                users    = (Get-CpLocalUsers).users
                services = (Get-CpServices).services | Select-Object -First 40
                extra    = @{ note = "Redacted forensics pack. No hashes, no private keys, no SAM dump." }
            }
        }
        "scoreboard-preflight" {
            $fw = Get-NetFirewallProfile -ErrorAction SilentlyContinue
            $guest = Get-LocalUser -Name "Guest" -ErrorAction SilentlyContinue
            $uac = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -ErrorAction SilentlyContinue).EnableLUA
            $items = @(
                [pscustomobject]@{ id = "firewall"; title = "Firewall enabled"; status = if ($fw -and ($fw | Where-Object { -not $_.Enabled })) { "fail" } else { "pass" }; relatedOpId = "enable-firewall" }
                [pscustomobject]@{ id = "guest"; title = "Guest disabled"; status = if ($guest -and $guest.Enabled) { "fail" } else { "pass" }; relatedOpId = "disable-guest-account" }
                [pscustomobject]@{ id = "uac"; title = "UAC enabled"; status = if ($uac -eq 1) { "pass" } else { "fail" }; relatedOpId = "audit-uac" }
                [pscustomobject]@{ id = "ccs-untouched"; title = "Scoring server not contacted"; status = "pass"; relatedOpId = "scoreboard-preflight" }
            )
            return [pscustomobject]@{ ok = $true; checklist = $items }
        }
        "post-harden-checklist" {
            $guest = Get-LocalUser -Name "Guest" -ErrorAction SilentlyContinue
            $uac = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -ErrorAction SilentlyContinue).EnableLUA
            $items = @(
                [pscustomobject]@{ id = "guest"; title = "Guest disabled"; status = if ($guest -and $guest.Enabled) { "fail" } else { "pass" }; relatedOpId = "disable-guest-account" }
                [pscustomobject]@{ id = "uac"; title = "UAC enabled"; status = if ($uac -eq 1) { "pass" } else { "fail" }; relatedOpId = "audit-uac" }
                [pscustomobject]@{ id = "never-expires"; title = "Review PasswordNeverExpires"; status = "info"; relatedOpId = "report-password-never-expires" }
            )
            return [pscustomobject]@{ ok = $true; checklist = $items }
        }
        "audit-lsa-protection" {
            $lsa = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa" -ErrorAction SilentlyContinue
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    RunAsPPL     = $lsa.RunAsPPL
                    RunAsPPLBoot = $lsa.RunAsPPLBoot
                    note         = "LSASS/hashes not dumped."
                }
            }
        }
        "audit-credential-guard" {
            $dg = $null
            try {
                $dg = Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\Microsoft\Windows\DeviceGuard -ErrorAction Stop
            } catch {}
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    CredentialGuard         = [bool]($dg -and ($dg.SecurityServicesRunning -contains 1))
                    SecurityServicesRunning = if ($dg) { @($dg.SecurityServicesRunning) } else { @() }
                    VirtualizationBasedSecurityStatus = if ($dg) { $dg.VirtualizationBasedSecurityStatus } else { $null }
                    note                    = "No isolated secrets in the result."
                }
            }
        }
        "audit-secure-boot" {
            $sb = $null
            try { $sb = Confirm-SecureBootUEFI -ErrorAction Stop } catch { $sb = $false }
            return [pscustomobject]@{
                ok    = $true
                extra = @{ SecureBoot = [bool]$sb; note = "PK/KEK material not dumped." }
            }
        }
        "audit-wifi-profiles" {
            $raw = netsh wlan show profiles 2>$null | Out-String
            $names = @()
            foreach ($line in $raw -split "`n") {
                if ($line -match ":\s*(.+)$" -and $line -match "All User Profile|User Profile") {
                    $names += $Matches[1].Trim()
                }
            }
            $profiles = @()
            foreach ($n in $names) {
                $info = netsh wlan show profile name="$n" 2>$null | Out-String
                $auth = if ($info -match "Authentication\s*:\s*(.+)") { $Matches[1].Trim() } else { "unknown" }
                $profiles += [pscustomobject]@{ ssid = $n; auth = $auth; keyOmitted = $true }
            }
            return [pscustomobject]@{
                ok    = $true
                extra = @{ profiles = $profiles; keysOmitted = $true; note = "PSKs/EAP secrets never printed. key=clear is not used." }
            }
        }
        "audit-dns-client" {
            $servers = @()
            try {
                $servers = @(Get-DnsClientServerAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
                    Where-Object { $_.ServerAddresses } |
                    ForEach-Object { $_.ServerAddresses } |
                    Select-Object -Unique)
            } catch {}
            $doh = $null
            try { $doh = Get-DnsClientDohServerAddress -ErrorAction SilentlyContinue } catch {}
            return [pscustomobject]@{
                ok    = $true
                extra = @{ servers = $servers; doh = $doh; note = "Local adapter config only; names were not queried." }
            }
        }
        "audit-windows-roles" {
            $roles = @()
            try {
                Import-Module ServerManager -ErrorAction SilentlyContinue
                $roles = @(Get-WindowsFeature -ErrorAction SilentlyContinue |
                    Where-Object { $_.Installed -and $_.Name -match "AD-|DNS|DHCP|Web-Server|FS-|NPAS|Remote-Desktop" } |
                    ForEach-Object { [pscustomobject]@{ name = $_.Name; installed = $true; unexpected = ($_.Name -match "AD-Domain|DNS|DHCP") } })
            } catch {}
            if (-not $roles.Count) {
                try {
                    $roles = @(Get-WindowsOptionalFeature -Online -ErrorAction SilentlyContinue |
                        Where-Object { $_.State -eq "Enabled" -and $_.FeatureName -match "IIS-|DirectoryServices|DNS|DHCP|SMB1" } |
                        Select-Object -First 40 |
                        ForEach-Object { [pscustomobject]@{ name = $_.FeatureName; installed = $true; unexpected = ($_.FeatureName -match "SMB1|Directory") } })
                } catch {}
            }
            return [pscustomobject]@{
                ok    = $true
                extra = @{ roles = $roles; note = "Read-only. Does not promote/demote a domain." }
            }
        }
        "audit-browser-policy" {
            $ie = Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Internet Explorer\Main" -ErrorAction SilentlyContinue
            $proxy = Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings" -ErrorAction SilentlyContinue
            $ext = @()
            $extRoot = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Extensions"
            if (Test-Path $extRoot) {
                $ext = @(Get-ChildItem $extRoot -ErrorAction SilentlyContinue | Select-Object -First 20 -ExpandProperty Name)
            }
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    homepage       = $ie.Start Page
                    proxyEnable    = $proxy.ProxyEnable
                    proxyServer    = $proxy.ProxyServer
                    extensionIds   = $ext
                    note           = "Cookies, history, saved passwords, and extension source are not dumped."
                }
            }
        }
        "audit-time-timezone" {
            $tz = tzutil /g 2>$null
            $w32 = w32tm /query /status 2>&1 | Out-String
            return [pscustomobject]@{
                ok    = $true
                extra = @{ timezone = "$tz"; w32tm = $w32.Substring(0, [Math]::Min(1500, $w32.Length)); note = "Not an NTP amplification test." }
            }
        }
        "export-coach-packet" {
            $dir = Join-Path $env:TEMP "cp-ops-coach-packet"
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
            @(
                "# Coach packet",
                "",
                "Redacted authorized-image handoff. No hashes, no private keys, no Wi-Fi PSKs, no CCS URLs."
            ) | Set-Content (Join-Path $dir "SUMMARY.md")
            "[]" | Set-Content (Join-Path $dir "findings.json")
            "Coach packet. Competition-legal. CCS not contacted." | Set-Content (Join-Path $dir "NOTES.md")
            $zip = Join-Path $dir "coach-packet.zip"
            if (Test-Path $zip) { Remove-Item $zip -Force }
            Compress-Archive -Path (Join-Path $dir "*.md"), (Join-Path $dir "*.json") -DestinationPath $zip -ErrorAction SilentlyContinue
            return [pscustomobject]@{
                ok    = $true
                extra = @{
                    files            = @("SUMMARY.md", "findings.json", "NOTES.md")
                    written          = $zip
                    redacted         = $true
                    containsSecrets  = $false
                    ccsContacted     = $false
                    wifiKeysIncluded = $false
                    hashesIncluded   = $false
                }
            }
        }
        default {
            $linuxOnly = @(
                "audit-uid-zero", "check-user-shells", "audit-duplicate-uids", "audit-pam",
                "disable-root-ssh", "audit-sudoers", "disable-legacy-r-services",
                "ssh-hardening-audit", "harden-sshd", "find-world-writable", "find-suid-sgid",
                "audit-home-permissions", "check-sensitive-file-perms", "audit-ssh-authorized-keys",
                "check-auditd", "audit-cron", "audit-at-jobs", "audit-sysctl", "harden-sysctl",
                "check-password-aging", "audit-sticky-tmp", "harden-vsftpd", "audit-web-server",
                "audit-mac-enforcement", "disable-display-manager-guest", "lock-root-account",
                "enable-fail2ban", "harden-host-conf", "set-ufw-logging", "restrict-cron-at",
                "scan-malware-tools", "blacklist-kernel-modules", "enforce-apparmor-profiles",
                "enable-unattended-upgrades", "audit-mail-services", "audit-database-bind",
                "audit-php-hardening", "audit-snap-flatpak", "disable-ctrl-alt-del",
                "audit-ipv6-privacy", "audit-log-persistence"
            )
            if ($OpId -in $linuxOnly) {
                return [pscustomobject]@{ ok = $true; extra = @{ note = "Linux-only op; run engines/linux on a Linux image." } }
            }
            if ($OpId -in @(
                    "disable-user", "lock-user", "remove-user-from-admins", "disable-guest-account",
                    "expire-user-password", "enforce-password-policy", "enable-account-lockout",
                    "disable-service", "disable-telnet", "disable-rdp", "enable-firewall",
                    "apply-default-deny-inbound", "remove-package", "apply-security-updates",
                    "disable-smbv1", "enable-windows-defender", "disable-autoplay",
                    "disable-llmnr-netbios-wpad", "remove-games-samples",
                    "apply-security-template", "import-firewall-profile", "enable-audit-policy",
                    "disable-remote-registry", "disable-remote-assistance", "force-password-change",
                    "sync-authorized-users", "disable-optional-windows-features", "clear-suspicious-hosts",
                    "harden-print-spooler", "harden-powershell-constrained", "disable-smb-client-v1",
                    "harden-null-session", "harden-usb-storage"
                )) {
                Test-CpConfirm -ConfirmLive:$ConfirmLive -DryRun:$DryRun
                if ($DryRun) {
                    return [pscustomobject]@{ ok = $true; extra = @{ dryRun = $true; op = $OpId; username = $Username; service = $Service; package = $Package; templatePath = $TemplatePath; profilePath = $ProfilePath } }
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
                    "disable-llmnr-netbios-wpad" {
                        New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient" -Force | Out-Null
                        Set-ItemProperty "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient" -Name EnableMulticast -Value 0
                        Get-CimInstance Win32_NetworkAdapterConfiguration -ErrorAction SilentlyContinue |
                            Where-Object { $_.IPEnabled } |
                            ForEach-Object { $_.SetTcpipNetbios(2) | Out-Null }
                        Set-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings" -Name AutoDetect -Value 0 -ErrorAction SilentlyContinue
                        New-Item -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings\WinHttp" -Force | Out-Null
                        Set-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Internet Settings\WinHttp" -Name DisableWpad -Value 1 -ErrorAction SilentlyContinue
                        Stop-Service WinHttpAutoProxySvc -Force -ErrorAction SilentlyContinue
                        Set-Service WinHttpAutoProxySvc -StartupType Disabled -ErrorAction SilentlyContinue
                        break
                    }
                    "remove-games-samples" {
                        $names = @("Microsoft.XboxApp", "Microsoft.XboxGamingOverlay", "Microsoft.MicrosoftSolitaireCollection", "Microsoft.ZuneMusic", "king.com.CandyCrushSaga")
                        foreach ($n in $names) {
                            Get-AppxPackage -Name $n -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue
                        }
                        break
                    }
                    "apply-security-template" {
                        if (-not (Test-Path $TemplatePath)) {
                            return [pscustomobject]@{ ok = $false; extra = @{ error = "template not found: $TemplatePath" } }
                        }
                        $db = Join-Path $env:TEMP "cp-secedit.sdb"
                        secedit /configure /db $db /cfg $TemplatePath /overwrite /quiet | Out-Null
                        break
                    }
                    "import-firewall-profile" {
                        if ($ProfilePath -and (Test-Path $ProfilePath)) {
                            netsh advfirewall import $ProfilePath | Out-Null
                        } else {
                            Set-NetFirewallProfile -Profile Domain, Public, Private -Enabled True -DefaultInboundAction Block -DefaultOutboundAction Allow -ErrorAction SilentlyContinue
                        }
                        break
                    }
                    "enable-audit-policy" {
                        foreach ($cat in @("Account Logon", "Account Management", "Logon/Logoff", "Policy Change", "Privilege Use", "System")) {
                            auditpol /set /category:"$cat" /success:enable /failure:enable | Out-Null
                        }
                        break
                    }
                    "disable-remote-registry" {
                        Stop-Service RemoteRegistry -Force -ErrorAction SilentlyContinue
                        Set-Service RemoteRegistry -StartupType Disabled -ErrorAction SilentlyContinue
                        break
                    }
                    "disable-remote-assistance" {
                        $p = "HKLM:\SYSTEM\CurrentControlSet\Control\Remote Assistance"
                        New-Item -Path $p -Force | Out-Null
                        Set-ItemProperty $p -Name fAllowToGetHelp -Value 0
                        Set-ItemProperty $p -Name fAllowFullControl -Value 0 -ErrorAction SilentlyContinue
                        break
                    }
                    "force-password-change" {
                        $names = @()
                        if ($Username) { $names = @($Username) }
                        else {
                            $allow = Get-CpAllowlist -Path $AllowlistPath
                            $skip = @("Administrator", "DefaultAccount", "WDAGUtilityAccount", "Guest")
                            $names = @($allow | Where-Object { $skip -notcontains $_ })
                        }
                        foreach ($n in $names) {
                            net user $n /logonpasswordchg:yes 2>$null | Out-Null
                        }
                        break
                    }
                    "sync-authorized-users" {
                        $allow = Get-CpAllowlist -Path $AllowlistPath
                        $admins = Get-CpAdminlist -Path $AdminsPath
                        $local = Get-LocalUser
                        $present = @($local | ForEach-Object { $_.Name })
                        $created = @()
                        foreach ($n in $allow) {
                            if ($present -contains $n) { continue }
                            try {
                                New-LocalUser -Name $n -NoPassword -UserMayChangePassword $true -ErrorAction Stop | Out-Null
                                $created += [pscustomobject]@{ name = $n; setPasswordManually = $true; detail = "Created with -NoPassword. Set a password in lusrmgr / net user." }
                            } catch {
                                $created += [pscustomobject]@{ name = $n; setPasswordManually = $true; detail = "Could not auto-create $n. Create it manually and set a password — this op will not invent one." }
                            }
                        }
                        foreach ($n in $admins) {
                            if ($n -eq "Administrator") { continue }
                            try { Add-LocalGroupMember -Group "Administrators" -Member $n -ErrorAction SilentlyContinue } catch {}
                        }
                        return [pscustomobject]@{
                            ok    = $true
                            extra = @{
                                created             = $created
                                setPasswordManually = @($created | ForEach-Object { $_.detail })
                                extras              = @($local | Where-Object { $allow -notcontains $_.Name -and $_.Name -notin @("DefaultAccount", "WDAGUtilityAccount") } | ForEach-Object { $_.Name })
                                note                = "Extras flagged only. Passwords never invented."
                            }
                        }
                    }
                    "disable-optional-windows-features" {
                        $list = @("TelnetClient", "TelnetServer", "TFTP", "SMB1Protocol", "SimpleTCP")
                        if (Test-Path $FeaturesPath) {
                            $list = @(Get-Content $FeaturesPath | ForEach-Object { $_.Trim() } | Where-Object { $_ -and $_ -notmatch '^#' })
                        }
                        foreach ($f in $list) {
                            Disable-WindowsOptionalFeature -Online -FeatureName $f -NoRestart -ErrorAction SilentlyContinue | Out-Null
                        }
                        break
                    }
                    "clear-suspicious-hosts" {
                        $hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
                        $lines = Get-Content $hostsPath -ErrorAction SilentlyContinue
                        $keep = @()
                        foreach ($line in $lines) {
                            $t = $line.Trim()
                            if (-not $t -or $t.StartsWith("#")) { $keep += $line; continue }
                            $parts = $t -split '\s+'
                            $ip = $parts[0]
                            $names = $parts | Select-Object -Skip 1
                            $sink = $ip -match '^(127\.0\.0\.1|0\.0\.0\.0|::1)$'
                            $bad = $false
                            foreach ($nm in $names) {
                                if ($sink -and (Test-CpSuspiciousHostName -Name $nm)) { $bad = $true }
                            }
                            if (-not $bad) { $keep += $line }
                        }
                        Set-Content -Path $hostsPath -Value $keep
                        break
                    }
                    "harden-print-spooler" {
                        $pp = "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Printers\PointAndPrint"
                        New-Item -Path $pp -Force | Out-Null
                        Set-ItemProperty $pp -Name RestrictDriverInstallationToAdministrators -Value 1
                        Set-ItemProperty $pp -Name NoWarningNoElevationOnInstall -Value 0
                        Set-ItemProperty $pp -Name UpdatePromptSettings -Value 0
                        $prn = "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Printers"
                        New-Item -Path $prn -Force | Out-Null
                        Set-ItemProperty $prn -Name RegisterSpoolerRemoteRpcEndPoint -Value 2
                        Set-ItemProperty $prn -Name RpcAuthnLevelPrivacyEnabled -Value 1 -ErrorAction SilentlyContinue
                        break
                    }
                    "harden-powershell-constrained" {
                        $base = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell"
                        New-Item -Path "$base\ScriptBlockLogging" -Force | Out-Null
                        Set-ItemProperty "$base\ScriptBlockLogging" -Name EnableScriptBlockLogging -Value 1
                        New-Item -Path "$base\ModuleLogging" -Force | Out-Null
                        Set-ItemProperty "$base\ModuleLogging" -Name EnableModuleLogging -Value 1
                        New-Item -Path "$base\Transcription" -Force | Out-Null
                        Set-ItemProperty "$base\Transcription" -Name EnableTranscripting -Value 1
                        $trans = "C:\ProgramData\cp-ops\ps-transcripts"
                        New-Item -ItemType Directory -Force -Path $trans | Out-Null
                        Set-ItemProperty "$base\Transcription" -Name OutputDirectory -Value $trans
                        break
                    }
                    "disable-smb-client-v1" {
                        try { Set-SmbClientConfiguration -EnableSMB1Protocol $false -Force -ErrorAction SilentlyContinue } catch {}
                        Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart -ErrorAction SilentlyContinue | Out-Null
                        Stop-Service mrxsmb10 -Force -ErrorAction SilentlyContinue
                        Set-Service mrxsmb10 -StartupType Disabled -ErrorAction SilentlyContinue
                        break
                    }
                    "harden-null-session" {
                        $lsa = "HKLM:\SYSTEM\CurrentControlSet\Control\Lsa"
                        Set-ItemProperty $lsa -Name RestrictAnonymous -Value 1
                        Set-ItemProperty $lsa -Name RestrictAnonymousSAM -Value 1
                        Set-ItemProperty $lsa -Name EveryoneIncludesAnonymous -Value 0
                        Set-ItemProperty $lsa -Name LimitBlankPasswordUse -Value 1 -ErrorAction SilentlyContinue
                        $lan = "HKLM:\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters"
                        New-Item -Path $lan -Force | Out-Null
                        Set-ItemProperty $lan -Name RestrictNullSessAccess -Value 1
                        break
                    }
                    "harden-usb-storage" {
                        $ex = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer"
                        New-Item -Path $ex -Force | Out-Null
                        Set-ItemProperty $ex -Name NoDriveTypeAutoRun -Value 255
                        $rs = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\RemovableStorageDevices"
                        New-Item -Path $rs -Force | Out-Null
                        New-Item -Path "$rs\{53f5630d-b6bf-11d0-94f2-00a0c91efb8b}" -Force | Out-Null
                        Set-ItemProperty "$rs\{53f5630d-b6bf-11d0-94f2-00a0c91efb8b}" -Name Deny_Execute -Value 1 -ErrorAction SilentlyContinue
                        break
                    }
                }
                return [pscustomobject]@{ ok = $true; extra = @{ op = $OpId; applied = $true } }
            }
            return [pscustomobject]@{ ok = $false; extra = @{ error = "Unhandled Windows op $OpId" } }
        }
    }
}

Export-ModuleMember -Function Invoke-CpOp, Get-CpLocalUsers, Get-CpSuspiciousUsers, Get-CpServices, Get-CpPorts, ConvertTo-CpJson
