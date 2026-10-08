#!/usr/bin/env bash
# CyberPatriot ops reliability library.
# Source from engines/linux/*.sh — do not execute this file directly.
#
# Contract (see docs/QUALITY.md and docs/SAFETY.md):
#   --dry-run or CP_DRY_RUN=1   preview only; nothing is written
#   --confirm or CP_CONFIRM=1   apply a mutating op
#   exit 0  success or preview
#   exit 1  error (what failed + what to try)
#   exit 2  mutation refused (no confirm)
#   exit 3  skipped (missing tool, not root, service absent)
#   CP_ROOT prefixes absolute paths so tests never touch the real host
#   backups land in /var/backups/cyberpatriot-ops/<timestamp>/
#               or $CP_ROOT/var/backups/cyberpatriot-ops/<timestamp>/
#
# shellcheck shell=bash disable=SC2329

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "Source engines/linux/_lib.sh; do not execute it." >&2
  exit 1
fi

set -Eeuo pipefail

CP_CHANGED=0
CP_ALREADY=0
CP_SKIPPED=0
CP_PREVIEWS=()
CP_DETAILS=()
CP_WARNINGS=()
CP_BACKED_UP=()
CP_BACKUP_DIR=""
CP_FINDINGS_JSON="[]"
CP_EXTRA_JSON="{}"
CP_ALLOW_NAMES=()
CP_DRY_RUN="${CP_DRY_RUN:-0}"
CP_CONFIRM="${CP_CONFIRM:-0}"
CP_OP_ID=""

cp_init() {
  local arg
  CP_OP_ID="${CP_OP_ID:-$(basename "$0" .sh)}"
  for arg in "$@"; do
    case "$arg" in
      --dry-run) CP_DRY_RUN=1 ;;
      --confirm) CP_CONFIRM=1 ;;
    esac
  done
  export CP_DRY_RUN CP_CONFIRM CP_OP_ID
}

cp_init "$@"

cp_is_dry() {
  [[ "${CP_DRY_RUN:-0}" == "1" ]]
}

cp_repo_root() {
  if [[ -n "${CP_REPO_ROOT:-}" ]]; then
    printf '%s\n' "$CP_REPO_ROOT"
    return 0
  fi
  local libdir
  libdir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  (cd "${libdir}/../.." && pwd)
}

cp_resolve() {
  local path="$1"
  if [[ -n "${CP_ROOT:-}" && "$path" == /* && "$path" != "${CP_ROOT}"/* ]]; then
    printf '%s\n' "${CP_ROOT}${path}"
    return 0
  fi
  printf '%s\n' "$path"
}

cp_backup_root() {
  if [[ -n "${CP_BACKUP_ROOT:-}" ]]; then
    printf '%s\n' "$CP_BACKUP_ROOT"
  elif [[ -n "${CP_ROOT:-}" ]]; then
    printf '%s\n' "${CP_ROOT}/var/backups/cyberpatriot-ops"
  else
    printf '%s\n' "/var/backups/cyberpatriot-ops"
  fi
}

cp_detail() { CP_DETAILS+=("$1"); }
cp_preview() { CP_PREVIEWS+=("$1"); }
cp_warn() { CP_WARNINGS+=("$1"); }

# Add a status card to a scan JSON object on stdin.
# Args: zero-hit sentence, plural noun, paths that were checked, optional tag filter.
# When findings carry a tags field, the filter counts only matches (sticky, drift).
# Findings without tags are all counted. A skipped or failed payload is passed through.
cp_annotate_scan() {
  # The program is an argument so the JSON on stdin stays available to Python.
  python3 -c "$(cat <<'PY'
import json, sys
zero, noun, scope = sys.argv[1:4]
need = sys.argv[4] if len(sys.argv) > 4 else ""
raw = sys.stdin.read()
start, end = raw.find("{"), raw.rfind("}")
if start < 0 or end <= start:
    sys.stderr.write(raw.strip() or "Scan returned no JSON.\n")
    sys.exit(1)
try:
    obj = json.loads(raw[start:end + 1])
except json.JSONDecodeError as exc:
    sys.stderr.write(f"Scan JSON failed: {exc}\n")
    sys.exit(1)
if not isinstance(obj, dict):
    sys.stderr.write("Scan JSON was not an object.\n")
    sys.exit(1)
status = obj.get("status")
if obj.get("ok") is False or status in ("skipped", "error", "refused"):
    json.dump(obj, sys.stdout, indent=2)
    sys.stdout.write("\n")
    code = obj.get("exitCode")
    sys.exit(code if isinstance(code, int) else 1)

def counted(items):
    if not isinstance(items, list):
        return None
    if not need:
        return len(items)
    tagged = [item for item in items if isinstance(item, dict) and "tags" in item]
    if not tagged:
        return len(items)
    return sum(1 for item in tagged if need in str(item.get("tags", "")))

if isinstance(obj.get("findings"), list):
    count = counted(obj["findings"])
elif isinstance(obj.get("files"), list):
    count = counted(obj["files"])
else:
    extra = obj.get("extra") if isinstance(obj.get("extra"), dict) else {}
    hits = extra.get("hits") if isinstance(extra.get("hits"), list) else None
    count = len(hits) if hits is not None else 0
if count == 1 and noun.endswith("s"):
    summary = f"1 {noun[:-1]}."
elif count == 1:
    summary = f"1 {noun}."
elif count == 0:
    summary = zero
else:
    summary = f"{count} {noun}."
tone = "empty" if count == 0 else "watch"
obj["ok"] = True
obj["status"] = obj.get("status") or "ok"
obj["summary"] = summary
obj["report"] = {
    "tone": tone,
    "facts": [
        {"label": "Checked", "value": scope},
        {"label": "Found", "value": str(count)},
    ],
}
json.dump(obj, sys.stdout, indent=2)
sys.stdout.write("\n")
PY
)" "$@"
}

cp_note_ok() {
  CP_ALREADY=$((CP_ALREADY + 1))
  cp_detail "$1"
}

cp_note_change() {
  CP_CHANGED=$((CP_CHANGED + 1))
  cp_preview "$1"
}

cp_summary() {
  if cp_is_dry; then
    printf 'Preview: would change %s settings, %s already OK\n' "$CP_CHANGED" "$CP_ALREADY"
  else
    printf 'Changed %s settings, %s already OK\n' "$CP_CHANGED" "$CP_ALREADY"
  fi
}

cp_emit() {
  local status="$1"
  local summary="$2"
  local code="$3"
  local ok="false"
  local preview_payload detail_payload warn_payload
  if [[ "$status" == "ok" || "$status" == "preview" ]]; then
    ok="true"
  fi
  preview_payload="$(cp__json_array "${CP_PREVIEWS[@]+"${CP_PREVIEWS[@]}"}")"
  detail_payload="$(cp__json_array "${CP_DETAILS[@]+"${CP_DETAILS[@]}"}")"
  warn_payload="$(cp__json_array "${CP_WARNINGS[@]+"${CP_WARNINGS[@]}"}")"
  python3 - "$ok" "$status" "$summary" "$CP_CHANGED" "$CP_ALREADY" "$CP_SKIPPED" \
    "${CP_BACKUP_DIR}" "${CP_OP_ID}" "$code" "$preview_payload" "$detail_payload" "$warn_payload" \
    "$CP_FINDINGS_JSON" "$CP_EXTRA_JSON" <<'PY'
import json, sys
(ok, status, summary, changed, already, skipped, backup, op_id, code,
 previews, details, warnings, findings, extra) = sys.argv[1:15]
def load(raw, fallback):
    try:
        return json.loads(raw)
    except Exception:
        return fallback
obj = {
    "ok": ok == "true",
    "status": status,
    "summary": summary,
    "changed": int(changed or 0),
    "alreadyOk": int(already or 0),
    "skipped": int(skipped or 0),
    "preview": load(previews, []),
    "details": load(details, []),
    "warnings": load(warnings, []),
    "backupDir": backup or None,
    "opId": op_id,
    "exitCode": int(code),
    "findings": load(findings, []),
    "extra": load(extra, {}),
}
sys.stdout.write(json.dumps(obj, indent=2) + "\n")
PY
  exit "$code"
}

cp__json_array() {
  python3 - "$@" <<'PY'
import json, sys
json.dump(list(sys.argv[1:]), sys.stdout)
PY
}

cp_finish() {
  local summary="${1:-}"
  if [[ -z "$summary" ]]; then
    summary="$(cp_summary)"
  fi
  if cp_is_dry; then
    cp_emit preview "$summary" 0
  fi
  cp_emit ok "$summary" 0
}

cp_fail() {
  local msg="$1"
  printf '%s\n' "$msg" >&2
  cp_emit error "$msg" 1
}

cp_skip() {
  local msg="$1"
  CP_SKIPPED=$((CP_SKIPPED + 1))
  printf '%s\n' "$msg" >&2
  cp_emit skipped "$msg" 3
}

cp_require_confirm() {
  local arg="${1:-}"
  if [[ "$arg" == "--dry-run" || "${CP_DRY_RUN:-0}" == "1" ]]; then
    CP_DRY_RUN=1
    export CP_DRY_RUN
    return 0
  fi
  if [[ "$arg" == "--confirm" || "${CP_CONFIRM:-0}" == "1" ]]; then
    CP_CONFIRM=1
    export CP_CONFIRM
    return 0
  fi
  local msg="Mutation refused without --confirm (or CP_CONFIRM=1). See docs/SAFETY.md."
  printf '%s\n' "$msg" >&2
  cp_emit refused "$msg" 2
}

cp_need_root() {
  if cp_is_dry; then
    return 0
  fi
  if [[ -n "${CP_ROOT:-}" ]]; then
    return 0
  fi
  if [[ "$(id -u)" -eq 0 ]]; then
    return 0
  fi
  cp_skip "Skipped: this change must run as root. Re-run with sudo on the authorized image."
}

cp_need_cmd() {
  local cmd="$1"
  local hint="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    return 0
  fi
  cp_skip "Skipped: ${cmd} is not installed. ${hint}"
}

cp_refuse_self() {
  local user="$1"
  local me="${SUDO_USER:-${USER:-}}"
  if [[ -n "$me" && "$user" == "$me" ]]; then
    cp_fail "Refusing to change the current user '${user}'. That could lock you out of this session."
  fi
}

cp_refuse_ccs() {
  local name="$1"
  local low
  low="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"
  case "$low" in
    ccs|ccs.service|ccsclient|ccsclient.service|scoring|scoring.service|cyberpatriot|cyberpatriot.service|cpsscoring|cpsscoring.service|scoringengine|scoringengine.service)
      cp_fail "Refusing to change '${name}'. The scoring service must stay untouched."
      ;;
  esac
}

cp_safe_user() {
  local user="$1"
  [[ "$user" =~ ^[A-Za-z0-9._-]+$ ]]
}

cp_safe_unit() {
  local unit="$1"
  [[ "$unit" =~ ^[A-Za-z0-9:_.@+-]+$ ]]
}

cp_load_allowlist() {
  local file="$1"
  local strict="${2:-0}"
  local line name
  CP_ALLOW_NAMES=()
  if [[ ! -f "$file" ]]; then
    if [[ "$strict" == "1" ]]; then
      cp_fail "Allowlist ${file} is missing. Refusing to act on an empty list."
    fi
    return 0
  fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    name="${line%%#*}"
    name="${name//[[:space:]]/}"
    [[ -z "$name" ]] && continue
    if [[ ! "$name" =~ ^[A-Za-z0-9._-]+$ ]]; then
      cp_warn "Ignored an unsafe name in ${file}"
      continue
    fi
    CP_ALLOW_NAMES+=("$name")
  done <"$file"
  if [[ "$strict" == "1" && ${#CP_ALLOW_NAMES[@]} -eq 0 ]]; then
    cp_fail "Allowlist ${file} is empty. Refusing to act. Add the README usernames first."
  fi
}

cp_service_is_required() {
  local svc="$1"
  local file="${CP_REQUIRED_SERVICES:-$(cp_repo_root)/config/required-services.txt}"
  [[ -f "$file" ]] || return 1
  grep -Fxi -- "$svc" "$file" >/dev/null 2>&1
}

cp_refuse_required_service() {
  local svc="$1"
  if [[ "${CP_FORCE:-0}" == "1" ]]; then
    return 0
  fi
  if cp_service_is_required "$svc"; then
    cp_fail "Refusing to disable ${svc}: it is listed in required-services.txt. Pass force=true only when the image README says that service is not scored."
  fi
}

cp_backup_file() {
  local src="$1"
  local root dest rel
  if cp_is_dry; then
    cp_detail "Would back up ${src}"
    return 0
  fi
  root="$(cp_backup_root)"
  if [[ -z "${CP_BACKUP_DIR}" ]]; then
    CP_BACKUP_DIR="${root}/$(date -u +%Y%m%dT%H%M%SZ)"
    mkdir -p "$CP_BACKUP_DIR" || cp_fail "Could not create backup directory ${CP_BACKUP_DIR}. Set CP_BACKUP_ROOT to a writable directory and re-run."
  fi
  if [[ ! -e "$src" ]]; then
    CP_BACKED_UP+=("${src}"$'\x1f'"__absent__")
    cp_detail "No existing file to back up at ${src}"
    return 0
  fi
  rel="${src#/}"
  dest="${CP_BACKUP_DIR}/${rel}"
  mkdir -p "$(dirname "$dest")"
  cp -a "$src" "$dest"
  CP_BACKED_UP+=("${src}"$'\x1f'"${dest}")
  cp_detail "Backed up ${src} -> ${dest}"
}

cp_rollback_last() {
  local pair src dest
  [[ ${#CP_BACKED_UP[@]} -eq 0 ]] && return 0
  for pair in "${CP_BACKED_UP[@]}"; do
    src="${pair%%$'\x1f'*}"
    dest="${pair#*$'\x1f'}"
    if [[ "$dest" == "__absent__" ]]; then
      rm -f "$src"
    elif [[ -e "$dest" ]]; then
      mkdir -p "$(dirname "$src")"
      cp -a "$dest" "$src"
    fi
  done
  cp_warn "Restored the previous files from ${CP_BACKUP_DIR:-the backup}."
}

cp_install_file() {
  local logical="$1"
  local mode="${2:-}"
  local dest tmp
  dest="$(cp_resolve "$logical")"
  tmp="$(mktemp)"
  cat >"$tmp"
  if [[ -f "$dest" ]] && cmp -s "$tmp" "$dest"; then
    rm -f "$tmp"
    cp_note_ok "Already compliant: ${logical}"
    return 0
  fi
  cp_note_change "Will write ${logical}"
  if cp_is_dry; then
    rm -f "$tmp"
    return 0
  fi
  cp_need_root
  cp_backup_file "$dest"
  mkdir -p "$(dirname "$dest")"
  cp "$tmp" "$dest"
  rm -f "$tmp"
  if [[ -n "$mode" ]]; then
    chmod "$mode" "$dest"
  fi
}

# cp_ensure_kv FILE KEY VALUE STYLE
# STYLE is defs (KEY<tab>VALUE), space (KEY VALUE), or assign (key=value).
cp_ensure_kv() {
  local logical="$1"
  local key="$2"
  local value="$3"
  local style="${4:-space}"
  local dest outcome same from
  dest="$(cp_resolve "$logical")"
  outcome="$(python3 - "$dest" "$key" "$value" "$style" <<'PY'
import json, pathlib, re, sys
path, key, value, style = sys.argv[1:5]
file = pathlib.Path(path)
text = file.read_text(encoding="utf-8", errors="replace") if file.is_file() else ""
lines = text.splitlines()
idx = None
cur = None
pat_assign = re.compile(r"^(\s*)" + re.escape(key) + r"\s*=\s*(.*?)\s*$")
pat_word = re.compile(r"^(\s*)" + re.escape(key) + r"(?:\s+)(\S+)")
for i, line in enumerate(lines):
    stripped = line.strip()
    if not stripped or stripped.startswith("#"):
        continue
    if style == "assign":
        m = pat_assign.match(line)
        if m:
            idx = i
            cur = m.group(2).strip().strip('"').strip("'")
    else:
        m = pat_word.match(line)
        if m:
            idx = i
            cur = m.group(2)
if style == "defs":
    rendered = f"{key}\t{value}"
elif style == "assign":
    rendered = f"{key} = {value}"
else:
    rendered = f"{key} {value}"
same = cur == value
if not same:
    if idx is None:
        if lines and lines[-1] != "":
            lines.append(rendered)
        else:
            if lines and lines[-1] == "":
                lines[-1] = rendered
            else:
                lines.append(rendered)
    else:
        lines[idx] = rendered
new_text = "\n".join(lines)
if not new_text.endswith("\n"):
    new_text += "\n"
print(json.dumps({"same": same, "from": cur if cur is not None else "unset", "text": new_text}))
PY
)"
  same="$(python3 -c 'import json,sys; print("1" if json.loads(sys.argv[1])["same"] else "0")' "$outcome")"
  from="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["from"])' "$outcome")"
  if [[ "$same" == "1" ]]; then
    cp_note_ok "${key} already ${value} in ${logical}"
    return 0
  fi
  cp_note_change "Will set ${key} ${from} -> ${value} in ${logical}"
  if cp_is_dry; then
    return 0
  fi
  cp_need_root
  cp_backup_file "$dest"
  mkdir -p "$(dirname "$dest")"
  python3 -c 'import json,sys,pathlib; pathlib.Path(sys.argv[1]).write_text(json.loads(sys.argv[2])["text"], encoding="utf-8")' "$dest" "$outcome"
}

cp_validate_sshd() {
  local err
  if cp_is_dry || [[ -n "${CP_ROOT:-}" ]]; then
    return 0
  fi
  if ! command -v sshd >/dev/null 2>&1; then
    cp_warn "sshd is not installed, so sshd -t was not run. Install openssh-server and re-run if this image uses SSH."
    return 0
  fi
  if sshd -t >/dev/null 2>&1; then
    cp_detail "sshd -t passed"
    return 0
  fi
  err="$(sshd -t 2>&1 || true)"
  cp_rollback_last
  cp_fail "sshd -t failed, so the previous ssh config was restored. ${err}"
}

cp_validate_sudoers() {
  local logical="$1"
  local dest err
  dest="$(cp_resolve "$logical")"
  if cp_is_dry || [[ -n "${CP_ROOT:-}" ]]; then
    return 0
  fi
  if ! command -v visudo >/dev/null 2>&1; then
    cp_warn "visudo is not installed, so the sudoers file was not validated."
    return 0
  fi
  if visudo -c -f "$dest" >/dev/null 2>&1; then
    cp_detail "visudo -c passed for ${logical}"
    return 0
  fi
  err="$(visudo -c -f "$dest" 2>&1 || true)"
  cp_rollback_last
  cp_fail "visudo -c failed, so the previous sudoers file was restored. ${err}"
}

cp_user_exists() {
  getent passwd "$1" >/dev/null 2>&1
}

cp_user_shell() {
  getent passwd "$1" | awk -F: '{print $7}'
}

cp_password_status() {
  local user="$1" line st
  if ! line="$(passwd -S "$user" 2>/dev/null)"; then
    printf 'unknown\n'
    return 0
  fi
  st="$(printf '%s\n' "$line" | awk '{print $2}')"
  case "$st" in
    L|LK) printf 'locked\n' ;;
    NP|P) printf 'open\n' ;;
    *) printf 'unknown\n' ;;
  esac
}

cp_apply() {
  local desc="$1"
  shift
  cp_note_change "$desc"
  if cp_is_dry; then
    return 0
  fi
  cp_need_root
  "$@"
}

cp_disable_unit() {
  local svc="$1"
  local enabled="" active=""
  cp_refuse_ccs "$svc"
  if ! cp_safe_unit "$svc"; then
    cp_fail "Service name '${svc}' is not a safe unit name. Nothing was changed."
  fi
  cp_need_cmd systemctl "This op needs systemd. On Debian/Ubuntu: the system is already systemd; check PATH."
  enabled="$(systemctl is-enabled "$svc" 2>/dev/null || true)"
  active="$(systemctl is-active "$svc" 2>/dev/null || true)"
  if [[ "$enabled" == "not-found" || -z "$enabled" ]]; then
    cp_skip "Skipped: service ${svc} is not installed. Nothing to disable."
  fi
  if [[ "$enabled" == "masked" || ( "$enabled" == "disabled" && "$active" != "active" ) ]]; then
    cp_note_ok "Service ${svc} is already disabled (enabled=${enabled}, active=${active:-unknown})"
    return 0
  fi
  cp_apply "Will disable service ${svc} (enabled=${enabled}, active=${active:-unknown})" -- systemctl disable --now "$svc"
}

cp_json_users() {
  python3 - <<'PY'
import json, os, pwd, grp
try:
    import spwd
except Exception:
    spwd = None
users = []
shadow = {}
try:
    if spwd is not None:
        for s in spwd.getspall():
            field = s.sp_pwd or ""
            shadow[s.sp_nam] = {
                "passwordEmpty": field == "",
                "passwordSet": bool(field) and not field.startswith("!") and not field.startswith("*"),
                "locked": field.startswith("!") or field.startswith("*"),
            }
except Exception:
    pass
for p in pwd.getpwall():
    groups = []
    try:
        groups = [g.gr_name for g in grp.getgrall() if p.pw_name in g.gr_mem]
    except Exception:
        groups = []
    flags = shadow.get(p.pw_name, {})
    users.append({
        "name": p.pw_name,
        "uid": p.pw_uid,
        "gid": p.pw_gid,
        "home": p.pw_dir,
        "shell": p.pw_shell,
        "groups": groups,
        "passwordHidden": True,
        "passwordEmpty": flags.get("passwordEmpty"),
        "passwordSet": flags.get("passwordSet"),
        "locked": flags.get("locked"),
        "platform": "linux",
    })
print(json.dumps({
    "ok": True,
    "status": "ok",
    "summary": f"Listed {len(users)} local accounts (hashes omitted).",
    "users": users,
}, indent=2))
PY
}
