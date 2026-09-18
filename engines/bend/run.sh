#!/usr/bin/env bash
# Thin glue: collect local facts, score with Bend 2, fall back to Python.
# Usage: run.sh <kind>
# kinds: files-ww files-suid files-media files-hidden files-rats files-perms users ports agg
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
KIND="${1:-}"
export PATH="${HOME}/.bend/bin:/home/box/.bend/bin:${PATH}"

case "$KIND" in
  files-ww|files-suid|files-media|files-hidden|files-rats|files-perms|users|ports|agg) ;;
  *)
    echo '{"ok":false,"engine":"none","error":"unknown kind"}' >&2
    exit 2
    ;;
esac

BEND_PROG=""
case "$KIND" in
  users) BEND_PROG="$HERE/score-users.bend" ;;
  ports) BEND_PROG="$HERE/score-ports.bend" ;;
  agg) BEND_PROG="$HERE/agg-checks.bend" ;;
  *) BEND_PROG="$HERE/score-files.bend" ;;
esac

collect() {
  python3 "$HERE/collect.py" "$KIND" --repo "$REPO"
}

if command -v bend >/dev/null 2>&1; then
  tmp="$(mktemp "${TMPDIR:-/tmp}/cp-bend.XXXXXX.tsv")"
  trap 'rm -f "$tmp"' EXIT
  collect >"$tmp" || true
  export CP_BEND_INPUT="$tmp"
  # stdout is JSON; installer chatter stays on stderr
  if out="$(bend "$BEND_PROG" 2>/dev/null)" && [[ "$out" == *"\"ok\":true"* ]]; then
    printf '%s\n' "$out"
    exit 0
  fi
fi

python3 "$HERE/collect.py" "$KIND" --repo "$REPO" --score-fallback
