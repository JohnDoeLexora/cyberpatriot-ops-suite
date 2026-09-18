#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
ufw --force enable
echo '{"ok":true,"detail":"ufw enabled"}'
