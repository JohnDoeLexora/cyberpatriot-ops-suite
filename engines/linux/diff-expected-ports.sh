#!/usr/bin/env bash
# Local listener vs expected-ports.txt diff. Never scans other hosts.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" ports
  exit 0
fi
"$HERE/audit-listening-ports.sh"
