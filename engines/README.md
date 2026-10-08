# Engines

Runners live in `@cyberpatriot/ops-engine`. These directories are the
**operator-visible** scripts the dashboard lane can also surface as “open in editor”.

| Dir | When it runs |
| --- | --- |
| `bend/*.bend` | Live Linux parallel scoring when `bend` 2.x is on PATH (file hunts, user/port heuristics, check aggregation). Python fallback if Bend is missing. |
| `linux/*.sh` | Live mode on Linux. Every op runs the script: reads return structured JSON, `--dry-run` previews a change, `--confirm` applies it. |
| `windows/*.ps1` | Live mode on a Windows CP image (`-DryRun` previews, `-ConfirmLive` applies). Not executed on this Linux builder. Bend is not used. |

Reliability contract (preflight, dry-run, backups, exit codes): [docs/QUALITY.md](../docs/QUALITY.md). `npm run lint:engines` runs shellcheck, the PowerShell parser, and a Bend load check.

Demo mode never calls these scripts. It uses in-process fixtures so macOS UI
work does not touch the host.

Linux live reads and changes both run `engines/linux/<id>.sh`. The script's
JSON is what the dashboard renders (accounts, services, ports, files, groups,
checklist). The old TypeScript collectors are retired from the live path.

Windows live always goes through `windows/<op-id>.ps1` or
`windows/Invoke-CpOp.ps1 -OpId <id>`.
