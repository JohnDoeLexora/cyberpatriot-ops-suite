#!/usr/bin/env bash
# IPv6 privacy/forwarding audit. Default audit-only. Disable only with --confirm and CP_DISABLE_IPV6=1.
set -euo pipefail
python3 - <<'PY'
import json, os
def sysctl(key):
    p = "/proc/sys/" + key.replace(".", "/")
    try: return open(p).read().strip()
    except OSError: return None
extra = {
    "use_tempaddr": sysctl("net.ipv6.conf.all.use_tempaddr"),
    "accept_ra": sysctl("net.ipv6.conf.all.accept_ra"),
    "forwarding": sysctl("net.ipv6.conf.all.forwarding"),
    "disable_ipv6": sysctl("net.ipv6.conf.all.disable_ipv6"),
}
findings = []
if extra["use_tempaddr"] == "0":
    findings.append({"id":"privacy","severity":"low","title":"IPv6 use_tempaddr=0"})
if extra["accept_ra"] == "1" and extra["forwarding"] == "1":
    findings.append({"id":"ra","severity":"medium","title":"accept_ra=1 and forwarding=1"})
print(json.dumps({"ok": True, "findings": findings, "extra": extra}))
PY
if [[ "${CP_DISABLE_IPV6:-0}" == "1" ]]; then
  . "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
  cp_require_confirm "${1:-}"
  mkdir -p /etc/sysctl.d
  cat > /etc/sysctl.d/99-cp-ipv6-disable.conf <<'EOF'
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1
EOF
  sysctl --system >/dev/null 2>&1 || true
fi
