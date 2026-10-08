#!/usr/bin/env bash
# Audit IPv6 privacy knobs. Disables IPv6 only with CP_DISABLE_IPV6=1 and --confirm.
# Read-only. Re-running is safe. CP_DRY_RUN=1 changes nothing. CP_ROOT redirects /etc paths in tests.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
python3 - <<'PY'
import json
def sysctl(key):
    path = "/proc/sys/" + key.replace(".", "/")
    try:
        return open(path, encoding="utf-8").read().strip()
    except OSError:
        return None
extra = {
    "use_tempaddr": sysctl("net.ipv6.conf.all.use_tempaddr"),
    "accept_ra": sysctl("net.ipv6.conf.all.accept_ra"),
    "forwarding": sysctl("net.ipv6.conf.all.forwarding"),
    "disable_ipv6": sysctl("net.ipv6.conf.all.disable_ipv6"),
}
findings = []
if extra["use_tempaddr"] == "0":
    findings.append({"id": "privacy", "severity": "low", "title": "IPv6 use_tempaddr=0"})
if extra["accept_ra"] == "1" and extra["forwarding"] == "1":
    findings.append({"id": "ra", "severity": "medium", "title": "accept_ra=1 and forwarding=1"})
print(json.dumps({"ok": True, "status": "ok", "summary": "IPv6 privacy snapshot.", "findings": findings, "extra": extra}))
PY
if [[ "${CP_DISABLE_IPV6:-0}" != "1" ]]; then
  exit 0
fi
cp_require_confirm "${1:-}"
cp_install_file /etc/sysctl.d/99-cp-ipv6-disable.conf <<'EOF'
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1
EOF
if ! cp_is_dry && [[ -z "${CP_ROOT:-}" ]] && command -v sysctl >/dev/null 2>&1; then
  sysctl --system >/dev/null 2>&1 || cp_warn "sysctl --system did not apply the IPv6 drop-in."
fi
cp_finish
