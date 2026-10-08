#!/usr/bin/env bash
# Turn off anonymous FTP. Disable vsftpd when it is not required.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
conf=""
for candidate in /etc/vsftpd.conf /etc/vsftpd/vsftpd.conf; do
  if [[ -f "$(cp_resolve "$candidate")" ]]; then
    conf="$candidate"
    break
  fi
done
if [[ -z "$conf" ]]; then
  if ! cp_is_dry; then
    cp_skip "Skipped: vsftpd config is not installed (/etc/vsftpd.conf missing)."
  fi
  cp_note_change "Will set anonymous_enable=NO, write_enable=NO, anon_upload_enable=NO when vsftpd.conf exists"
  cp_finish "Preview: vsftpd config is not on this host, so nothing would be written."
fi
for key in anonymous_enable write_enable anon_upload_enable anon_mkdir_write_enable; do
  cp_ensure_kv "$conf" "$key" NO assign
done
repo="$(cp_repo_root)"
req="${CP_REQUIRED_SERVICES:-${repo}/config/required-services.txt}"
if [[ -f "$req" ]] && grep -Fxi -- vsftpd "$req" >/dev/null 2>&1; then
  cp_detail "vsftpd is in required-services.txt, so the service was left running with anonymous FTP off."
elif command -v systemctl >/dev/null 2>&1; then
  enabled="$(systemctl is-enabled vsftpd 2>/dev/null || true)"
  if [[ -n "$enabled" && "$enabled" != "not-found" && "$enabled" != "disabled" && "$enabled" != "masked" ]]; then
    cp_note_change "Will disable service vsftpd (not in required-services.txt)"
    if ! cp_is_dry; then
      cp_need_root
      systemctl disable --now vsftpd || cp_warn "Could not disable vsftpd. The config was still hardened."
    fi
  else
    cp_note_ok "vsftpd service is already disabled or not installed"
  fi
fi
cp_finish
