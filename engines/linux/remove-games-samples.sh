#!/usr/bin/env bash
# Mutate: remove games/sample packages listed in config/games-samples.txt.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
LIST="$HERE/../../config/games-samples.txt"
pkgs=()
while IFS= read -r line; do
  line="${line%%#*}"
  line="$(echo "$line" | tr -d '[:space:]')"
  [[ -z "$line" ]] && continue
  pkgs+=("$line")
done < "$LIST"
installed=()
if command -v dpkg-query >/dev/null; then
  for p in "${pkgs[@]}"; do
    if dpkg-query -W -f='${Status}' "$p" 2>/dev/null | grep -q 'install ok installed'; then
      installed+=("$p")
    fi
  done
fi
if ((${#installed[@]})); then
  DEBIAN_FRONTEND=noninteractive apt-get remove -y "${installed[@]}" || true
fi
echo "{\"ok\":true,\"detail\":\"removed ${#installed[@]} games/sample packages\"}"
