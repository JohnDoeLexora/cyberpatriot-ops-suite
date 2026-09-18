#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
if [[ -f /etc/login.defs ]]; then
  sed -i 's/^PASS_MAX_DAYS.*/PASS_MAX_DAYS\t90/' /etc/login.defs
  sed -i 's/^PASS_MIN_DAYS.*/PASS_MIN_DAYS\t1/' /etc/login.defs
  sed -i 's/^PASS_MIN_LEN.*/PASS_MIN_LEN\t14/' /etc/login.defs
  sed -i 's/^PASS_WARN_AGE.*/PASS_WARN_AGE\t7/' /etc/login.defs
  grep -q '^PASS_MIN_LEN' /etc/login.defs || echo 'PASS_MIN_LEN	14' >> /etc/login.defs
fi
mkdir -p /etc/security
cat > /etc/security/pwquality.conf.d/99-cp.conf 2>/dev/null || true
mkdir -p /etc/security/pwquality.conf.d
cat > /etc/security/pwquality.conf.d/99-cp.conf <<'EOF'
minlen = 14
dcredit = -1
ucredit = -1
lcredit = -1
ocredit = -1
minclass = 3
remember = 5
EOF
echo '{"ok":true,"detail":"updated login.defs and pwquality drop-in"}'
