#requires -Version 5.1
<#
.SYNOPSIS
  Dispatcher for CyberPatriot defensive Windows ops.
.DESCRIPTION
  Authorized competition-image hardening only. See docs/SAFETY.md.
  Mutations require -ConfirmLive. Demo/UI work should use the Node demo engine instead.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$OpId,
    [string]$Username,
    [string]$Service,
    [string]$Package,
    [string]$AllowlistPath = "config/allowed-users.txt",
    [switch]$DryRun,
    [switch]$ConfirmLive
)

Import-Module "$PSScriptRoot\lib\CpOps.psm1" -Force
$result = Invoke-CpOp -OpId $OpId -Username $Username -Service $Service -Package $Package `
    -AllowlistPath $AllowlistPath -DryRun:$DryRun -ConfirmLive:$ConfirmLive
ConvertTo-CpJson $result
