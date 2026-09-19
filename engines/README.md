# Engines

Runners live in `@cyberpatriot/ops-engine`. These directories are the
**operator-visible** scripts the dashboard lane can also surface as “open in editor”.

| Dir | When it runs |
| --- | --- |
| `bend/*.bend` | Live Linux parallel scoring when `bend` 2.x is on PATH (file hunts, user/port heuristics, check aggregation). Python fallback if Bend is missing. |
| `linux/*.sh` | Live mode on Linux/macOS (read-heavy; mutations need `--confirm`). File hunts prefer `bend/` then `find`. |
| `windows/*.ps1` | Live mode on a Windows CP image (documented here; not executed on Linux). Bend is not used. |

Demo mode never calls these scripts. It uses in-process fixtures so macOS UI
work does not touch the host.

Linux live reads (`list-users`, ports, services, find, sticky `/tmp`, vsftpd,
Apache/nginx, SNMP, AppArmor/SELinux, README keyword skim, …) are implemented in
TypeScript collectors *and* mirrored here as standalone shell for teams that
want to run them without the API.

Windows live always goes through `windows/<op-id>.ps1` or
`windows/Invoke-CpOp.ps1 -OpId <id>`.
