# Engines

Runners live in `@cyberpatriot/ops-engine`. These directories are the
**operator-visible** scripts the dashboard lane can also surface as “open in editor”.

| Dir | When it runs |
| --- | --- |
| `bend/*.bend` | Live Linux parallel scoring when `bend` 2.x is on PATH (file hunts, user/port heuristics, check aggregation). Python fallback if Bend is missing. |
| `linux/*.sh` | Live mode on Linux. Mutating ops run the script: `--dry-run` previews, `--confirm` applies. Reads stay on the TypeScript collectors and these scripts can also be run by hand. |
| `windows/*.ps1` | Live mode on a Windows CP image (`-DryRun` previews, `-ConfirmLive` applies). Not executed on this Linux builder. Bend is not used. |

Reliability contract (preflight, dry-run, backups, exit codes): [docs/QUALITY.md](../docs/QUALITY.md). `npm run lint:engines` runs shellcheck, the PowerShell parser, and a Bend load check.

Demo mode never calls these scripts. It uses in-process fixtures so macOS UI
work does not touch the host.

Linux live reads (`list-users`, ports, services, find, sticky `/tmp`, vsftpd,
Apache/nginx, SNMP, AppArmor/SELinux, README keyword skim, …) are implemented in
TypeScript collectors *and* mirrored here as standalone shell for teams that
want to run them without the API.

Windows live always goes through `windows/<op-id>.ps1` or
`windows/Invoke-CpOp.ps1 -OpId <id>`.
