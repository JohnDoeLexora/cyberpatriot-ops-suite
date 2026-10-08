#!/usr/bin/env node
/**
 * Parse every engines/windows/*.ps1 when pwsh is installed.
 * Runs PSScriptAnalyzer (Error and Warning) and the Pester helper tests when those modules exist.
 * If pwsh is absent, prints the gap and exits 0 so a machine without PowerShell can still run the rest of the suite.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");
const windowsDir = path.join(repo, "engines/windows");

function findPwsh() {
  const candidates = [
    process.env.PWSH,
    path.join(os.homedir(), ".local/bin/pwsh"),
    "/tmp/pwsh/pwsh",
    "pwsh",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      execFileSync(candidate, ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      return candidate;
    } catch {
      // try the next candidate
    }
  }
  return undefined;
}

const pwsh = findPwsh();
if (!pwsh) {
  console.log(
    "pwsh is not installed. Windows script parse, PSScriptAnalyzer, and Pester were skipped. Install PowerShell 7 and re-run npm run lint:engines.",
  );
  process.exit(0);
}

const files = readdirSync(windowsDir)
  .filter((name) => name.endsWith(".ps1"))
  .map((name) => path.join(windowsDir, name));
files.push(path.join(windowsDir, "lib/CpOps.psm1"));
files.push(path.join(windowsDir, "lib/CpReliability.ps1"));
files.push(path.join(windowsDir, "test/CpReliability.Tests.ps1"));

const parseScript = `
$ErrorActionPreference = 'Stop'
$files = @(
${files.map((file) => `  '${file.replaceAll("'", "''")}'`).join(",\n")}
)
$bad = @()
foreach ($file in $files) {
  $tokens = $null
  $errors = $null
  [void][System.Management.Automation.Language.Parser]::ParseFile($file, [ref]$tokens, [ref]$errors)
  if ($errors -and $errors.Count -gt 0) {
    foreach ($err in $errors) {
      $bad += ("{0}:{1}:{2}: {3}" -f $file, $err.Extent.StartLineNumber, $err.Extent.StartColumnNumber, $err.Message)
    }
  }
}
if ($bad.Count -gt 0) {
  $bad | ForEach-Object { Write-Output $_ }
  exit 1
}
Write-Output ("Parsed {0} PowerShell files." -f $files.Count)
if (Get-Module -ListAvailable -Name PSScriptAnalyzer) {
  Import-Module PSScriptAnalyzer
  $issues = @(Invoke-ScriptAnalyzer -Path '${windowsDir.replaceAll("'", "''")}' -Recurse -Severity Error,Warning)
  if ($issues.Count -gt 0) {
    $issues | ForEach-Object { Write-Output ("{0}:{1}: {2} {3}" -f $_.ScriptPath, $_.Line, $_.Severity, $_.Message) }
    exit 1
  }
  Write-Output 'PSScriptAnalyzer: no Error or Warning findings.'
} else {
  Write-Output 'PSScriptAnalyzer is not installed. Parse succeeded; analyzer was skipped.'
}
if (Get-Module -ListAvailable -Name Pester) {
  Import-Module Pester
  $cfg = New-PesterConfiguration
  $cfg.Run.Path = '${path.join(windowsDir, "test/CpReliability.Tests.ps1").replaceAll("'", "''")}'
  $cfg.Run.PassThru = $true
  $cfg.Output.Verbosity = 'Normal'
  $result = Invoke-Pester -Configuration $cfg
  if ($result.FailedCount -gt 0) { exit 1 }
} else {
  Write-Output 'Pester is not installed. Helper tests were skipped.'
}
`;

execFileSync(pwsh, ["-NoProfile", "-Command", parseScript], { stdio: "inherit" });
if (!existsSync(pwsh) && pwsh !== "pwsh") {
  console.error("pwsh path disappeared");
  process.exit(1);
}
