#!/usr/bin/env bash
# Read-only: local account inventory. Never prints password hashes.
set -Eeuo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_json_users
