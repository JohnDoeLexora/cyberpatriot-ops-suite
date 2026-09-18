#!/usr/bin/env bash
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
if command -v apt-get >/dev/null; then
  DEBIAN_FRONTEND=noninteractive apt-get update -y
  DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
  echo '{"ok":true,"detail":"apt-get upgrade completed"}'
elif command -v dnf >/dev/null; then
  dnf update -y --security || dnf update -y
  echo '{"ok":true,"detail":"dnf update completed"}'
else
  echo '{"ok":false,"error":"no apt-get/dnf"}' >&2
  exit 1
fi
