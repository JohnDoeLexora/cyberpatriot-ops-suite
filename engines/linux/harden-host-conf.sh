#!/usr/bin/env bash
# Write /etc/host.conf with nospoof on.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_install_file /etc/host.conf <<'EOF'
order hosts,bind
multi on
nospoof on
EOF
cp_finish
