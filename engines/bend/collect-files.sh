#!/usr/bin/env bash
# Emit KIND|PATH|MODE inventory for Bend file scans (GNU find -printf when available).
# Usage: collect-files.sh world-writable|suid|media|hidden|backdoor
set -euo pipefail

KIND="${1:-world-writable}"
limit="${CP_FIND_LIMIT:-400}"

emit() {
  local code="$1"
  shift
  if find "$@" -printf "${code}|%p|%m\n" 2>/dev/null | head -n "${limit}"; then
    return 0
  fi
  find "$@" -print 2>/dev/null | head -n "${limit}" | awk -v c="${code}" '{print c "|" $0 "|"}'
}

case "${KIND}" in
  world-writable|W)
    emit W /home /etc /opt /tmp /var /usr/local -xdev -perm -0002 \( -type f -o -type d \)
    ;;
  suid|S)
    emit S / -xdev \( -perm -4000 -o -perm -2000 \) -type f
    ;;
  media|M)
    emit M /home /tmp /var/tmp /opt /usr/local -type f \( \
      -iname '*.mp3' -o -iname '*.mp4' -o -iname '*.avi' -o -iname '*.mkv' \
      -o -iname '*.mov' -o -iname '*.flac' -o -iname '*.wav' -o -iname '*.ogg' \)
    ;;
  hidden|H)
    emit H /home /tmp /var/tmp -type f -name '.*' -perm -0111
    ;;
  backdoor|B)
    emit B /tmp /home /opt /usr/local -type f \( \
      -name nc -o -name ncat -o -name netcat -o -name socat -o -name '*.hidden_shell' \)
    ;;
  *)
    echo "unknown kind ${KIND}" >&2
    exit 2
    ;;
esac
