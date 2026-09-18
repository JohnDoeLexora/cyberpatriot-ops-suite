#!/usr/bin/env bash
# Redacted local evidence. No hashes, no private keys.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
. "$HERE/_lib.sh"
echo '{"note":"Redacted forensics pack follows. Hashes and private keys omitted."}' >&2
cp_json_users
