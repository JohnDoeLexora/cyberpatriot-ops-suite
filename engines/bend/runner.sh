#!/usr/bin/env bash
# Run a Bend scan program against a TSV inventory.
# Usage: runner.sh <scan-files|score-heuristics|scan-ports> [inventory-file]
# Inventory may also be piped on stdin. Prints JSON on stdout.
# Exit 3 if Bend is missing or disabled — callers should fall back to shell.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PROG="${1:-scan-files}"
INV="${2:-}"

if [[ "${CP_BEND:-1}" == "0" ]]; then
  echo '{"ok":false,"error":"bend disabled (CP_BEND=0)"}' >&2
  exit 3
fi

resolve_bend() {
  if [[ -n "${BEND_BIN:-}" && -x "${BEND_BIN}" ]]; then
    printf '%s\n' "${BEND_BIN}"
    return 0
  fi
  if command -v bend >/dev/null 2>&1; then
    command -v bend
    return 0
  fi
  if [[ -x /home/box/.bend/bin/bend ]]; then
    printf '%s\n' /home/box/.bend/bin/bend
    return 0
  fi
  return 1
}

BEND="$(resolve_bend)" || {
  echo '{"ok":false,"error":"bend not found; using shell fallback"}' >&2
  exit 3
}

FILE="${HERE}/${PROG}.bend"
if [[ ! -f "${FILE}" ]]; then
  echo "{\"ok\":false,\"error\":\"unknown bend program ${PROG}\"}" >&2
  exit 3
fi

CLEANUP=""
if [[ -z "${INV}" ]]; then
  INV="$(mktemp)"
  CLEANUP="${INV}"
  cat > "${INV}"
fi
if [[ ! -s "${INV}" ]]; then
  printf '' > "${INV}"
fi

export CP_BEND_INVENTORY="${INV}"
export PATH="$(dirname "${BEND}"):${PATH}"
set +e
"${BEND}" "${FILE}"
code=$?
set -e
if [[ -n "${CLEANUP}" ]]; then
  rm -f "${CLEANUP}"
fi
exit "${code}"
