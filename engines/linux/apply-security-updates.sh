#!/usr/bin/env bash
# Apply the image's own apt/dnf updates. Does not add third-party repos.
set -Eeuo pipefail
# shellcheck source=_lib.sh
. "$(cd "$(dirname "$0")" && pwd)/_lib.sh"
cp_require_confirm "${1:-}"
# Unit tests set CP_FAST=1 so they do not simulate a full apt upgrade.
if [[ "${CP_FAST:-0}" == "1" ]]; then
  cp_note_change "Will run the image package manager upgrade (package count skipped because CP_FAST=1)"
  cp_finish
fi
if command -v apt-get >/dev/null 2>&1; then
  sim="$(apt-get -s upgrade 2>/dev/null || true)"
  pending="$(printf '%s\n' "$sim" | grep -c '^Inst ' || true)"
  if [[ "${pending:-0}" -eq 0 ]]; then
    cp_note_ok "apt reports no packages to upgrade"
    cp_finish
  fi
  cp_note_change "Will run apt-get update and apt-get upgrade (${pending} package(s) pending on this image)"
  if ! cp_is_dry; then
    cp_need_root
    DEBIAN_FRONTEND=noninteractive apt-get update -y || cp_fail "apt-get update failed. Check this image's apt sources and network, then re-run."
    DEBIAN_FRONTEND=noninteractive apt-get upgrade -y || cp_fail "apt-get upgrade failed. Fix the package error apt printed, then re-run."
  fi
  cp_finish
fi
if command -v dnf >/dev/null 2>&1; then
  cp_note_change "Will run dnf update --security on this image's configured repositories"
  if ! cp_is_dry; then
    cp_need_root
    dnf update -y --security || dnf update -y || cp_fail "dnf update failed."
  fi
  cp_finish
fi
cp_skip "Skipped: neither apt-get nor dnf is installed. Install the distro package manager and re-run."
