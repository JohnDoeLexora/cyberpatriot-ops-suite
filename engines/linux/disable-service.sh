#!/usr/bin/env bash
# Stop and disable one systemd unit. Refuses the scoring service.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
svc="${2:-${CP_SERVICE:-}}"
if [[ -z "$svc" ]]; then
  cp_fail "service is required. Example: bash disable-service.sh --confirm telnet.socket"
fi
cp_refuse_required_service "$svc"
cp_disable_unit "$svc"
cp_finish
