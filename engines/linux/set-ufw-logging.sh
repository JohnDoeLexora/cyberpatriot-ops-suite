#!/usr/bin/env bash
# ufw logging high + default deny incoming / allow outgoing.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
ufw logging high
ufw default deny incoming
ufw default allow outgoing
echo '{"ok":true,"detail":"ufw logging high; default deny incoming / allow outgoing"}'
