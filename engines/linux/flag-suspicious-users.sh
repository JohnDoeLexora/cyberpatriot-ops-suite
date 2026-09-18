#!/usr/bin/env bash
# Read-only collector for the heuristic pack. Scoring is applied by
# @cyberpatriot/ops-engine; this script emits the raw user inventory plus
# lastlog so operators can run it standalone.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
echo '{"note":"Run via the API for scored findings. Raw inventory follows."}' >&2
cp_json_users
echo "--- lastlog ---" >&2
lastlog 2>/dev/null | head -n 80 >&2 || true
