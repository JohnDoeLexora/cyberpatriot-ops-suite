# Windows engine

PowerShell 5.1+ scripts for a **Windows CyberPatriot image**.

They are **not executed** on the Linux builder. The Node API returns a skip
result that points at these files when `mode=live` and `platforms=windows`.

## Run on Windows

```powershell
Set-Location C:\path\to\cyberpatriot-ops-suite
Import-Module .\engines\windows\lib\CpOps.psm1
Invoke-CpOp -OpId list-users | ConvertTo-Json -Depth 6

# or
.\engines\windows\Invoke-CpOp.ps1 -OpId flag-suspicious-users
.\engines\windows\disable-guest-account.ps1 -ConfirmLive
```

Every catalog op has a `engines/windows/<op-id>.ps1` wrapper.

Mutations refuse to run unless `-ConfirmLive` is passed (or `CP_CONFIRM=1`).
`-DryRun` prints the plan without changing the image.

No password hashes, no private keys, no off-image targeting.
