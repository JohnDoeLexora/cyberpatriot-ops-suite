#!/usr/bin/env bash
# Write faillock.conf. Does not print passwords.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
cp_install_file /etc/security/faillock.conf <<'EOF'
# CyberPatriot authorized-image lockout
deny = 5
fail_interval = 900
unlock_time = 600
even_deny_root
EOF
cp_detail "If /etc/pam.d/common-auth does not reference pam_faillock.so yet, add it after this file is in place."
cp_finish
