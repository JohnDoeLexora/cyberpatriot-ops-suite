#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
systemctl mask ctrl-alt-del.target >/dev/null 2>&1 || true
systemctl disable --now serial-getty@ttyS0 >/dev/null 2>&1 || true
echo '{"ok":true,"detail":"masked ctrl-alt-del.target; extra serial getty disabled"}'
