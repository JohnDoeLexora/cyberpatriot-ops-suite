#!/usr/bin/env bash
# Mutate: disable anonymous FTP in vsftpd.conf; disable vsftpd if not required.
set -euo pipefail
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
python3 - <<'PY'
import os, re
candidates = ["/etc/vsftpd.conf", "/etc/vsftpd/vsftpd.conf"]
path = next((p for p in candidates if os.path.isfile(p)), None)
if not path:
    raise SystemExit(0)
text = open(path, encoding="utf-8", errors="replace").read()
def setk(blob, key, val):
    pat = re.compile(rf"(?im)^\s*{key}\s*=\s*\S+")
    if pat.search(blob):
        return pat.sub(f"{key}={val}", blob, count=1)
    return blob + f"\n{key}={val}\n"
for k in ("anonymous_enable", "write_enable", "anon_upload_enable", "anon_mkdir_write_enable"):
    text = setk(text, k, "NO")
open(path, "w", encoding="utf-8").write(text)
print(path)
PY
systemctl reload vsftpd 2>/dev/null || systemctl restart vsftpd 2>/dev/null || true
REQ="$(cd "$(dirname "$0")" && pwd)/../../config/required-services.txt"
if ! grep -qiE '^vsftpd$' "$REQ" 2>/dev/null; then
  systemctl disable --now vsftpd 2>/dev/null || true
fi
echo '{"ok":true,"detail":"anonymous FTP disabled in vsftpd.conf"}'
