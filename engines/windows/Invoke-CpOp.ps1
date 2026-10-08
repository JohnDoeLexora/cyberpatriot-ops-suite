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

$ErrorActionPreference = 'Stop'
Import-Module "$PSScriptRoot\lib\CpOps.psm1" -Force
try {
    $result = Invoke-CpOp -OpId $OpId -Username $Username -Service $Service -Package $Package `
        -AllowlistPath $AllowlistPath -DryRun:$DryRun -ConfirmLive:$ConfirmLive
    if ($null -ne $result -and -not ($result.PSObject.Properties.Name -contains 'summary')) {
        $result | Add-Member -NotePropertyName summary -NotePropertyValue $(if ($result.ok -eq $false) { 'The check failed. Read the message, then re-run on the authorized image.' } else { 'Completed.' }) -Force
    }
    ConvertTo-CpJson $result
    if ($null -ne $result -and ($result.PSObject.Properties.Name -contains 'ok') -and $result.ok -eq $false) { exit 1 }
    exit 0
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
