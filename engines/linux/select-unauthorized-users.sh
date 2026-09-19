#!/usr/bin/env bash
# Read-only: interactive users missing from config/allowed-users.txt. No hashes.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
echo '{"note":"Run via the API for scored allowlist-miss selection. Raw inventory follows."}' >&2
cp_json_users
