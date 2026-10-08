#!/usr/bin/env bash
# Audit IPv6 privacy knobs. Disables IPv6 only with CP_DISABLE_IPV6=1 and --confirm.
# Read-only unless that flag is set. CP_DRY_RUN=1 changes nothing.
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
temp = extra["use_tempaddr"]
if temp is None and extra["disable_ipv6"] is None:
    summary = "IPv6 sysctl knobs are unreadable"
    tone = "watch"
elif extra["disable_ipv6"] == "1":
    summary = "IPv6 is disabled"
    tone = "info"
elif temp in {None, ""}:
    summary = "IPv6 temporary addresses are unset"
    tone = "watch"
elif temp == "0":
    summary = "IPv6 temporary addresses are off"
    tone = "watch"
else:
    summary = "IPv6 temporary addresses are on"
    tone = "clear"
if extra["accept_ra"] == "1" and extra["forwarding"] == "1":
    tone = "urgent"
def show(value):
    return "unreadable" if value is None else value
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": summary,
    "findings": findings,
    "extra": extra,
    "report": {
        "tone": tone,
        "facts": [
            {"label": "Temporary addresses", "value": show(extra["use_tempaddr"])},
            {"label": "Accept router ads", "value": show(extra["accept_ra"])},
            {"label": "Forwarding", "value": show(extra["forwarding"])},
            {"label": "Disabled", "value": show(extra["disable_ipv6"])},
        ],
    },
}))
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
