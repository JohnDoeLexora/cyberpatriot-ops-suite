#!/usr/bin/env bash
# Local preflight. Does not contact the CCS scoring server.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" agg
  exit 0
fi
echo '{"ok":true,"extra":{"note":"Local preflight only. CCS is never queried."}}'
