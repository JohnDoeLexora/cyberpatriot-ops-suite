#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const catalogSrc = path.resolve(here, "../../packages/ops-catalog/src/catalog.ts");
const text = readFileSync(catalogSrc, "utf8");
const ids = [...text.matchAll(/\bop\(\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
if (ids.length < 50) {
  throw new Error(`Expected ≥50 ops, found ${ids.length}`);
}

for (const id of ids) {
  const dest = path.join(here, `${id}.ps1`);
  const body = `#requires -Version 5.1
<#
.SYNOPSIS
  CyberPatriot defensive op: ${id}
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
Import-Module "$PSScriptRoot\\lib\\CpOps.psm1" -Force
$result = Invoke-CpOp -OpId '${id}' -Username $Username -Service $Service -Package $Package \`
    -AllowlistPath $AllowlistPath -DryRun:$DryRun -ConfirmLive:$ConfirmLive
ConvertTo-CpJson $result
`;
  writeFileSync(dest, body);
}
console.log(`Wrote ${ids.length} wrappers under engines/windows`);
