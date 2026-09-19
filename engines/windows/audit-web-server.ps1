#requires -Version 5.1
<#
.SYNOPSIS
  CyberPatriot defensive op: audit-web-server
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
Import-Module "$PSScriptRoot\lib\CpOps.psm1" -Force
$result = Invoke-CpOp -OpId 'audit-web-server' -Username $Username -Service $Service -Package $Package `
    -AllowlistPath $AllowlistPath -AdminsPath $AdminsPath -TemplatePath $TemplatePath `
    -ProfilePath $ProfilePath -FeaturesPath $FeaturesPath -DryRun:$DryRun -ConfirmLive:$ConfirmLive
ConvertTo-CpJson $result
