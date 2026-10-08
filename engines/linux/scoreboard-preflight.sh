#!/usr/bin/env bash
# Local preflight. Does not contact the CCS scoring server.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -z "${CP_SKIP_BEND:-}" && -z "${CP_SCAN_ROOT:-}" && -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" agg
  exit 0
fi
echo '{"ok":true,"extra":{"note":"Local preflight only. CCS is never queried."}}'
