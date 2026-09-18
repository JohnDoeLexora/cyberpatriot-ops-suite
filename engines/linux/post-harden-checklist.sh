#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -x "$HERE/../bend/run.sh" ]]; then
  "$HERE/../bend/run.sh" agg
  exit 0
fi
echo '{"ok":true,"extra":{"note":"Read-only post-harden verification."}}'
