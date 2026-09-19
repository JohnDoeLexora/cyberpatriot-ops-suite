#!/usr/bin/env bash
# Lock the root password (passwd -l). Does not delete root.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
passwd -l root
echo '{"ok":true,"detail":"locked root password"}'
