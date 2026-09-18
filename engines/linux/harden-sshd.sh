#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
mkdir -p /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/99-cp-hardening.conf <<'EOF'
# CyberPatriot authorized-image hardening (see docs/SAFETY.md)
PermitRootLogin no
PermitEmptyPasswords no
X11Forwarding no
MaxAuthTries 4
Protocol 2
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2
EOF
systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true
echo '{"ok":true,"detail":"wrote /etc/ssh/sshd_config.d/99-cp-hardening.conf"}'
