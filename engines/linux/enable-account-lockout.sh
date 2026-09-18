#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
mkdir -p /etc/security
cat > /etc/security/faillock.conf <<'EOF'
# CyberPatriot authorized-image lockout
deny = 5
fail_interval = 900
unlock_time = 600
even_deny_root
EOF
echo '{"ok":true,"detail":"wrote /etc/security/faillock.conf — enable pam_faillock.so in common-auth if not already present"}'
