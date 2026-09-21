#!/usr/bin/env bash
# aa-enforce common daemon profiles. Authorized-image only.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
if ! command -v aa-enforce >/dev/null 2>&1; then
  echo '{"ok":true,"detail":"aa-enforce not installed; skipped"}'
  exit 0
fi
for p in apache2 httpd mysqld ntpd named dhcpd ping tcpdump; do
  aa-enforce "$p" >/dev/null 2>&1 || true
done
echo '{"ok":true,"detail":"aa-enforce attempted on common profiles"}'
