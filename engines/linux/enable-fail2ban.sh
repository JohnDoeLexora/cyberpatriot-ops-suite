#!/usr/bin/env bash
# Install (distro package only) and enable fail2ban. No random GitHub installers.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
if command -v apt-get >/dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y fail2ban
elif command -v dnf >/dev/null; then
  dnf install -y fail2ban
else
  echo '{"ok":false,"error":"fail2ban package source unavailable (no apt-get/dnf)"}' >&2
  exit 1
fi
systemctl enable --now fail2ban
echo '{"ok":true,"detail":"fail2ban enabled"}'
