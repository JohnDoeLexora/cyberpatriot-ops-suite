#!/usr/bin/env bash
# Write /etc/host.conf nospoof / order hosts,bind.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cat > /etc/host.conf <<'EOF'
order hosts,bind
multi on
nospoof on
EOF
echo '{"ok":true,"detail":"wrote /etc/host.conf nospoof on"}'
