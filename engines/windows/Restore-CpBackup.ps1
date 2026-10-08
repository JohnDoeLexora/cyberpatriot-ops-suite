#requires -Version 5.1
<#
.SYNOPSIS
  Restore the snapshot written before a confirmed Windows apply.
.DESCRIPTION
  Reads <BackupDir>\undo.json. Does not touch a scoring / CCS service.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupDir
)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\lib\CpReliability.ps1"
try {
    $restored = Restore-CpUndo -BackupDir $BackupDir
    $restored | ConvertTo-Json -Depth 4
    if (-not $restored.ok) { exit 1 }
    exit 0
} catch {
    $msg = $_.Exception.Message
    if (-not $msg) { $msg = "$_" }
    [pscustomobject]@{ ok = $false; summary = "Restore failed: $msg" } | ConvertTo-Json -Depth 4
    exit 1
}
