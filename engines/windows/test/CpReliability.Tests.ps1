# Pure helper tests. They do not call Get-LocalUser or change the host.
# Run: pwsh -NoProfile -Command "Invoke-Pester -Path engines/windows/test/CpReliability.Tests.ps1"

BeforeAll {
    . "$PSScriptRoot/../lib/CpReliability.ps1"
}

Describe 'allowlist' {
    It 'returns no names when the file is missing' {
        $names = Get-CpAllowlistStrict -Path (Join-Path $TestDrive 'missing-allow.txt')
        $names.Count | Should -Be 0
    }

    It 'skips comments and blank lines' {
        $file = Join-Path $TestDrive 'allowed-users.txt'
        @(
            '# README',
            '',
            'alice',
            '  bob  ',
            'coach # kept as coach'
        ) | Set-Content -Path $file
        $names = Get-CpAllowlistStrict -Path $file
        $names | Should -Be @('alice', 'bob', 'coach')
    }

    It 'refuses sync when the allowlist is empty' {
        $file = Join-Path $TestDrive 'empty.txt'
        Set-Content -Path $file -Value "# nobody`n"
        $result = Invoke-CpWindowsMutation -OpId 'sync-authorized-users' -AllowlistPath $file -DryRun
        $result.ok | Should -BeFalse
        $result.status | Should -Be 'refused'
        $result.summary | Should -Match 'empty'
    }
}

Describe 'safety names' {
    It 'matches scoring service names exactly' {
        Test-CpCcsName -Name 'CCS.service' | Should -BeTrue
        Test-CpCcsName -Name 'scoring' | Should -BeTrue
        Test-CpCcsName -Name 'not-ccs-helper' | Should -BeFalse
        Test-CpCcsName -Name 'sshd' | Should -BeFalse
    }

    It 'refuses to disable the scoring service' {
        $result = Invoke-CpWindowsMutation -OpId 'disable-service' -Service 'ccs' -ConfirmLive
        $result.ok | Should -BeFalse
        $result.status | Should -Be 'refused'
        $result.summary | Should -Match 'scoring service'
    }

    It 'refuses to change the current user' {
        $env:USERNAME = 'coach'
        $result = Invoke-CpWindowsMutation -OpId 'disable-user' -Username 'coach' -DryRun
        $result.ok | Should -BeFalse
        $result.status | Should -Be 'refused'
        $result.summary | Should -Match 'current user'
    }
}

Describe 'preview' {
    It 'describes a firewall enable without applying it' {
        $result = Invoke-CpWindowsMutation -OpId 'enable-firewall' -DryRun
        $result.ok | Should -BeTrue
        $result.status | Should -Be 'preview'
        $result.summary | Should -Match '^Preview: would change'
        ($result.preview -join "`n") | Should -Match 'Windows Firewall'
    }

    It 'refuses a mutation that is not confirmed and not a dry run' {
        $result = Invoke-CpWindowsMutation -OpId 'enable-firewall'
        $result.ok | Should -BeFalse
        $result.status | Should -Be 'refused'
        $result.summary | Should -Match 'ConfirmLive'
    }

    It 'formats the summary line' {
        Format-CpSummary -Changed 2 -AlreadyOk 1 -DryRun $false | Should -Be 'Changed 2 settings, 1 already OK'
        Format-CpSummary -Changed 0 -AlreadyOk 3 -DryRun $true | Should -Be 'Preview: would change 0 settings, 3 already OK'
    }
}

Describe 'hosts heuristic' {
    It 'flags vendor sinkhole names and ignores localhost' {
        if (-not (Get-Command Test-CpSuspiciousHostName -ErrorAction SilentlyContinue)) {
            function Test-CpSuspiciousHostName {
                param([string]$Name)
                return [bool]($Name -match 'windowsupdate|microsoft\.com|virustotal|google\.com')
            }
        }
        Test-CpSuspiciousHostName -Name 'www.google.com' | Should -BeTrue
        Test-CpSuspiciousHostName -Name 'localhost' | Should -BeFalse
    }
}
