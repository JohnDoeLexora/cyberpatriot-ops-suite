#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
mkdir -p /etc/ssh/sshd_config.d
printf '%s\n' 'PermitRootLogin no' > /etc/ssh/sshd_config.d/99-cp-noroot.conf
systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true
echo '{"ok":true,"detail":"PermitRootLogin no"}'
