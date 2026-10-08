#requires -Version 5.1
<#
.SYNOPSIS
  CyberPatriot defensive op: disable-optional-windows-features
.DESCRIPTION
  Authorized-image hardening only. See docs/SAFETY.md.
  Mutations require -ConfirmLive. Demo/UI work should use the Node demo engine.
#>
[CmdletBinding()]
param(
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
$ErrorActionPreference = 'Stop'
Import-Module "$PSScriptRoot\lib\CpOps.psm1" -Force
try {
    $result = Invoke-CpOp -OpId 'disable-optional-windows-features' -Username $Username -Service $Service -Package $Package `
        -AllowlistPath $AllowlistPath -AdminsPath $AdminsPath -TemplatePath $TemplatePath `
        -ProfilePath $ProfilePath -FeaturesPath $FeaturesPath -DryRun:$DryRun -ConfirmLive:$ConfirmLive
    if ($null -ne $result -and -not ($result.PSObject.Properties.Name -contains 'summary')) {
        $result | Add-Member -NotePropertyName summary -NotePropertyValue $(if ($result.ok -eq $false) { 'The check failed. Read the message, then re-run on the authorized image.' } else { 'Completed.' }) -Force
    }
    ConvertTo-CpJson $result
    $cpExit = 0
    if ($null -ne $result -and ($result.PSObject.Properties.Name -contains 'status')) {
        if ([string]$result.status -eq 'skipped') { $cpExit = 3 }
        elseif ([string]$result.status -eq 'refused') { $cpExit = 2 }
    }
    if ($cpExit -eq 0 -and $null -ne $result -and ($result.PSObject.Properties.Name -contains 'ok') -and $result.ok -eq $false) { $cpExit = 1 }
    exit $cpExit
} catch {
    $msg = $_.Exception.Message
    if (-not $msg) { $msg = "$_" }
    ConvertTo-CpJson ([pscustomobject]@{
        ok       = $false
        status   = 'error'
        summary  = "Failed: $msg"
        warnings = @($msg)
    })
    exit 1
}
