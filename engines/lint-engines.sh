#!/usr/bin/env bash
# Lint engine scripts. Safe to run as a normal user. Does not mutate the host.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
shellcheck -S warning -x engines/linux/*.sh engines/bend/*.sh
node packages/ops-engine/scripts/parse-windows.mjs
if [[ -x "${BEND_BIN:-/home/box/.bend/bin/bend}" ]]; then
  bend_bin="${BEND_BIN:-/home/box/.bend/bin/bend}"
  for prog in engines/bend/*.bend; do
    # Typecheck only. Running main needs an inventory; an empty file is not a syntax failure.
    if ! "$bend_bin" "$prog" --check-only >/tmp/cp-bend-lint.out 2>/tmp/cp-bend-lint.err; then
      echo "bend failed to check $prog" >&2
      cat /tmp/cp-bend-lint.err >&2
      exit 1
    fi
  done
  echo "bend checked $(printf '%s\n' engines/bend/*.bend | wc -l) programs"
else
  echo "bend binary not found; bend load check skipped"
fi
