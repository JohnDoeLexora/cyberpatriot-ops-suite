#requires -Version 5.1
<#
.SYNOPSIS
  CyberPatriot defensive op: audit-sticky-tmp
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
    [switch]$DryRun,
    [switch]$ConfirmLive
)
Import-Module "$PSScriptRoot\lib\CpOps.psm1" -Force
$result = Invoke-CpOp -OpId 'audit-sticky-tmp' -Username $Username -Service $Service -Package $Package `
    -AllowlistPath $AllowlistPath -DryRun:$DryRun -ConfirmLive:$ConfirmLive
ConvertTo-CpJson $result
