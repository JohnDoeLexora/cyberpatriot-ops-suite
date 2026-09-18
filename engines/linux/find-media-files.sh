#!/usr/bin/env bash
set -euo pipefail
find /home /tmp /var/tmp /opt -type f \( -iname '*.mp3' -o -iname '*.mp4' -o -iname '*.avi' -o -iname '*.mkv' -o -iname '*.mov' -o -iname '*.flac' -o -iname '*.wav' -o -iname '*.ogg' \) 2>/dev/null | head -n 200 | python3 -c 'import json,sys; print(json.dumps({"ok":True,"files":[{"path":l.strip(),"note":"media"} for l in sys.stdin if l.strip()]}))'
