# Bend 2 engine

Embarrassingly parallel **defensive** scoring for CyberPatriot. Bend 2
(`bend` 2.0.5) classifies file/user/port/checklist records. A thin Python
collector gathers host facts (find, passwd flags, `ss`). Windows PowerShell
is unchanged — Bend does not talk to the Win32 APIs.

| File | Role |
| --- | --- |
| `score-files.bend` | Parallel SUID / world-writable / media / RAT / plant-path scoring |
| `score-users.bend` | Parallel account heuristics (no hashes) |
| `score-ports.bend` | Parallel expected-port baseline + suspicious listeners |
| `agg-checks.bend` | Parallel remaining-work aggregation |
| `cp_lib.bend` | Shared JSON/severity helpers |
| `collect.py` | Host-fact TSV (shell/Python glue) |
| `run.sh` | Prefer `bend`, else Python fallback |
| `scan-files.bend` / `scan-ports.bend` / `score-heuristics.bend` | Extra KIND\|PATH inventory scorers (`runner.sh` + `CP_BEND_INVENTORY`) |

`ops-engine` live Linux path calls `run.sh` when `bend` exists, then falls
back to the existing TypeScript `find` collectors. Demo mode never invokes
Bend (Mac-safe fixtures). Mutations never go through Bend.

```bash
export PATH="$HOME/.bend/bin:$PATH"
./engines/bend/run.sh files-ww
./engines/bend/run.sh users
```
