#!/usr/bin/env python3
"""Thin host-fact collector for Bend 2 parallel scorers.

Walks the local authorized image (find/stat/passwd/ss) and emits '|' TSV
that engines/bend/score-*.bend can score. Never prints password hashes.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import stat
import subprocess
import sys
from pathlib import Path

MAX_LINES = 2500
MEDIA_EXT = {".mp3", ".mp4", ".avi", ".mkv", ".mov", ".flac", ".wav", ".ogg"}
RAT_NEEDLES = (
    "teamviewer",
    "anydesk",
    "rustdesk",
    "tightvnc",
    "realvnc",
    "ultravnc",
    "logmein",
    "splashtop",
    "chromoting",
    "ultrasurf",
    "vncserver",
    "x11vnc",
)
SENSITIVE = [
    "/etc/passwd",
    "/etc/shadow",
    "/etc/gshadow",
    "/etc/group",
    "/etc/sudoers",
    "/etc/ssh/sshd_config",
    "/etc/crontab",
    "/etc/ssh/ssh_host_rsa_key",
    "/etc/ssh/ssh_host_ed25519_key",
]
WW_ROOTS = ["/home", "/etc", "/opt", "/tmp", "/var", "/usr/local"]
HIDDEN_ROOTS = ["/home", "/tmp", "/var/tmp", "/opt"]
MEDIA_ROOTS = ["/home", "/tmp", "/var/tmp", "/opt", "/usr/local/share"]


def sanitize(value: str) -> str:
    return value.replace("|", "?").replace("\n", " ").replace("\r", " ").strip()


def read_list(path: Path) -> list[str]:
    if not path.is_file():
        return []
    out = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            out.append(line)
    return out


def run_find(args: list[str], timeout: int = 20) -> list[str]:
    if not shutil.which("find"):
        return []
    try:
        proc = subprocess.run(
            ["find", *args],
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return []
    lines = [ln for ln in proc.stdout.splitlines() if ln]
    return lines[:MAX_LINES]


def mode_of(path: str) -> str:
    try:
        st = os.lstat(path)
        return format(st.st_mode & 0o7777, "o")
    except OSError:
        return "0000"


def kind_of(path: str) -> str:
    try:
        st = os.lstat(path)
        if stat.S_ISDIR(st.st_mode):
            return "d"
        if stat.S_ISLNK(st.st_mode):
            return "l"
        return "f"
    except OSError:
        return "f"


def file_rows(paths: list[str], forced_kind: str | None = None) -> list[str]:
    rows = []
    seen: set[str] = set()
    for raw in paths:
        path = sanitize(raw)
        if not path or path in seen:
            continue
        seen.add(path)
        rows.append(f"{path}|{mode_of(path)}|{forced_kind or kind_of(path)}")
        if len(rows) >= MAX_LINES:
            break
    return rows


def collect_files_ww() -> list[str]:
    found = run_find([*WW_ROOTS, "-xdev", "-perm", "-0002", "(", "-type", "f", "-o", "-type", "d", ")"])
    return file_rows(found)


def collect_files_suid() -> list[str]:
    found = run_find(["/", "-xdev", "(", "-perm", "-4000", "-o", "-perm", "-2000", ")", "-type", "f"])
    return file_rows(found)


def collect_files_media() -> list[str]:
    names = []
    for ext in ("*.mp3", "*.mp4", "*.avi", "*.mkv", "*.mov", "*.flac", "*.wav", "*.ogg"):
        names.extend(["-o", "-iname", ext] if names else ["-iname", ext])
    found = run_find([*MEDIA_ROOTS, "-type", "f", "(", *names, ")"])
    return file_rows(found)


def collect_files_hidden() -> list[str]:
    found = run_find([*HIDDEN_ROOTS, "-type", "f", "-name", ".*", "-perm", "-0111"])
    extra = run_find(["/tmp", "/home", "/opt", "/usr/local", "-type", "f", "(", "-name", "nc", "-o", "-name", "ncat", "-o", "-name", "netcat", "-o", "-name", "socat", ")"])
    return file_rows(found + extra)


def collect_files_rats(repo: Path) -> list[str]:
    needles = [n.lower() for n in read_list(repo / "config" / "remote-access-tools.txt")] or list(RAT_NEEDLES)
    rows: list[str] = []
    dpkg = subprocess.run(
        ["dpkg-query", "-W", "-f=${Package}\t${Version}\n"],
        capture_output=True,
        text=True,
        timeout=15,
        check=False,
    ) if shutil.which("dpkg-query") else None
    if dpkg and dpkg.returncode == 0:
        for line in dpkg.stdout.splitlines():
            name = line.split("\t", 1)[0].lower()
            if any(n in name for n in needles):
                rows.append(f"{sanitize(name)}|0755|rat")
    roots = ["/opt", "/usr/local", "/home", "/tmp", str(Path.home() / ".config")]
    for root in roots:
        if not os.path.isdir(root):
            continue
        found = run_find([root, "-xdev", "-maxdepth", "4", "(", "-iname", "*vnc*", "-o", "-iname", "*teamviewer*", "-o", "-iname", "*anydesk*", "-o", "-iname", "*rustdesk*", ")"], timeout=12)
        rows.extend(file_rows(found, "rat"))
    # Browser extension dirs (inventory of paths only — no profile secrets).
    for ext_root in [
        Path.home() / ".config/google-chrome/Default/Extensions",
        Path.home() / ".config/chromium/Default/Extensions",
        Path.home() / ".mozilla/firefox",
    ]:
        if ext_root.is_dir():
            rows.append(f"{sanitize(str(ext_root))}|0755|ext")
            for child in list(ext_root.iterdir())[:40]:
                rows.append(f"{sanitize(str(child))}|0755|ext")
    return rows[:MAX_LINES]


def collect_files_perms() -> list[str]:
    existing = [p for p in SENSITIVE if os.path.exists(p)]
    return file_rows(existing)


def collect_files_sticky() -> list[str]:
    mounts = [p for p in ("/tmp", "/var/tmp", "/dev/shm") if os.path.exists(p)]
    found = run_find([*mounts, "-xdev", "-perm", "-0002", "(", "-type", "d", "-o", "-type", "f", ")"]) if mounts else []
    return file_rows(mounts + found)


def collect_files_sysprep() -> list[str]:
    found = run_find(
        [
            "/home",
            "/root",
            "/tmp",
            "/opt",
            "/var/tmp",
            "-xdev",
            "-maxdepth",
            "4",
            "(",
            "-iname",
            "*unattend*",
            "-o",
            "-iname",
            "*sysprep.xml",
            "-o",
            "-iname",
            "ks.cfg",
            ")",
        ],
        timeout=12,
    )
    extra = [p for p in ("/unattend.xml", "/autounattend.xml", "/root/unattend.xml") if os.path.exists(p)]
    return file_rows(extra + found)


SHELL_BACKDOOR_RE = re.compile(
    r"alias\s+(sudo|su|ls|cd|passwd|chmod|chown|ssh|login)\s*=|"
    r"nc\s+-e\s+/bin/(ba)?sh|"
    r"python3?\s+-c.{0,80}socket|"
    r"wget.{0,80}\|\s*(ba)?sh|"
    r"curl.{0,80}\|\s*(ba)?sh|"
    r"LD_PRELOAD=|"
    r"PROMPT_COMMAND=.+(wget|curl|nc|python)|"
    r"unset\s+HISTFILE|"
    r"iptables\s+-F|"
    r"base64\s+-d.{0,40}\|\s*(ba)?sh|"
    r"/tmp/\.[A-Za-z0-9]",
    re.I,
)


def collect_files_shell() -> list[str]:
    """Inventory rc/profile files; tag content hits as shell-backdoor (no command execution)."""
    candidates: list[str] = [
        "/etc/profile",
        "/etc/bash.bashrc",
        "/etc/bashrc",
        "/root/.bashrc",
        "/root/.profile",
        "/root/.bash_aliases",
        "/root/.bash_profile",
    ]
    profile_d = Path("/etc/profile.d")
    if profile_d.is_dir():
        for child in list(profile_d.iterdir())[:80]:
            if child.is_file():
                candidates.append(str(child))
    home = Path("/home")
    if home.is_dir():
        for userdir in list(home.iterdir())[:80]:
            if not userdir.is_dir():
                continue
            for rc in (".bashrc", ".profile", ".bash_aliases", ".bash_profile", ".zshrc"):
                candidates.append(str(userdir / rc))
    rows: list[str] = []
    seen: set[str] = set()
    for raw in candidates:
        if raw in seen or not os.path.isfile(raw):
            continue
        seen.add(raw)
        kind = "shell"
        try:
            text = Path(raw).read_text(encoding="utf-8", errors="replace")[:8000]
            if SHELL_BACKDOOR_RE.search(text):
                kind = "shell-backdoor"
        except OSError:
            pass
        rows.append(f"{sanitize(raw)}|{mode_of(raw)}|{kind}")
        if len(rows) >= MAX_LINES:
            break
    return rows


def collect_files_readme() -> list[str]:
    found = run_find(
        [
            "/home",
            "/root",
            "/opt",
            "/tmp",
            "/usr/local/share",
            "-xdev",
            "-maxdepth",
            "3",
            "(",
            "-iname",
            "README*",
            "-o",
            "-iname",
            "*forensic*",
            "-o",
            "-iname",
            "*QUESTION*",
            ")",
        ],
        timeout=12,
    )
    return file_rows(found, "readme")


def classify_shadow(field: str) -> tuple[bool, bool]:
    if field == "":
        return True, False
    if field.startswith("!") or field.startswith("*"):
        return field in {"!", "!!", "*"}, True
    return False, False


def collect_users(repo: Path) -> list[str]:
    allow = {n.lower() for n in read_list(repo / "config" / "allowed-users.txt")}
    groups: dict[str, list[str]] = {}
    try:
        for line in Path("/etc/group").read_text(encoding="utf-8", errors="replace").splitlines():
            if not line or line.startswith("#"):
                continue
            parts = line.split(":")
            if len(parts) < 4:
                continue
            gname, _, _, members = parts[0], parts[1], parts[2], parts[3]
            for member in members.split(","):
                member = member.strip()
                if member:
                    groups.setdefault(member, []).append(gname)
    except OSError:
        pass
    shadow: dict[str, tuple[bool, bool]] = {}
    try:
        for line in Path("/etc/shadow").read_text(encoding="utf-8", errors="replace").splitlines():
            if not line or line.startswith("#"):
                continue
            parts = line.split(":")
            if len(parts) >= 2:
                shadow[parts[0]] = classify_shadow(parts[1])
    except OSError:
        pass
    lastlog: set[str] = set()
    try:
        proc = subprocess.run(["lastlog", "-t", "3650"], capture_output=True, text=True, timeout=8, check=False)
        for line in proc.stdout.splitlines()[1:]:
            name = line.split()[0] if line.split() else ""
            if name and "never logged in" not in line.lower():
                lastlog.add(name)
    except (OSError, subprocess.TimeoutExpired):
        pass
    rows = []
    try:
        passwd = Path("/etc/passwd").read_text(encoding="utf-8", errors="replace")
    except OSError:
        return rows
    priv = {"sudo", "wheel", "admin", "root", "administrators", "docker"}
    interactive_shells = {"/bin/bash", "/usr/bin/bash", "/bin/sh", "/usr/bin/sh", "/bin/dash", "/bin/zsh"}
    for line in passwd.splitlines():
        if not line or line.startswith("#"):
            continue
        parts = line.split(":")
        if len(parts) < 7:
            continue
        name, _, uid, _, _, home, shell = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6]
        g = [x.lower() for x in groups.get(name, [])]
        empty, locked = shadow.get(name, (False, False))
        try:
            uid_n = int(uid)
        except ValueError:
            uid_n = -1
        interactive = (
            name.lower() in {"root", "guest", "administrator"}
            or (1000 <= uid_n < 65534)
            or uid_n in {0, 666, 1337}
        )
        admin = uid_n == 0 or bool(priv.intersection(g))
        never = name not in lastlog
        allow_hit = name.lower() in allow or name in {"root", "Administrator"}
        rows.append(
            "|".join(
                [
                    sanitize(name),
                    sanitize(uid),
                    sanitize(home),
                    sanitize(shell),
                    "1" if empty else "0",
                    "1" if locked else "0",
                    "1" if never else "0",
                    "1" if admin else "0",
                    "1" if allow_hit else "0",
                    "1" if interactive else "0",
                ]
            )
        )
    return rows[:MAX_LINES]


def parse_expected_port(raw: str) -> tuple[str, str] | None:
    token = raw.strip().lower()
    if "/" in token:
        proto, port = token.split("/", 1)
        if proto in {"tcp", "udp"} and port.isdigit():
            return proto, port
    if token.isdigit():
        return "tcp", token
    bits = token.split()
    if len(bits) >= 2 and bits[1].isdigit():
        proto = bits[0] if bits[0] in {"tcp", "udp"} else "tcp"
        return proto, bits[1]
    return None


def collect_ports(repo: Path) -> list[str]:
    expected: set[tuple[str, str]] = set()
    for raw in read_list(repo / "config" / "expected-ports.txt"):
        parsed = parse_expected_port(raw)
        if parsed:
            expected.add(parsed)
    cmd = ["ss", "-lntup"] if shutil.which("ss") else ["netstat", "-lntup"] if shutil.which("netstat") else None
    text = ""
    if cmd:
        try:
            text = subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT, timeout=8)
        except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
            text = ""
    rows = []
    seen: set[str] = set()
    for line in text.splitlines():
        proto = "udp" if line.lower().startswith("udp") else "tcp" if line.lower().startswith("tcp") else None
        if not proto:
            continue
        match = re.search(r"(\d{1,3}(?:\.\d{1,3}){3}|\*|\[?[0-9a-fA-F:]+\])[:](\d+)", line)
        if not match:
            continue
        addr, port = match.group(1), match.group(2)
        if addr == "*":
            addr = "0.0.0.0"
        proc = ""
        pm = re.search(r'users:\(\("([^"]+)', line) or re.search(r"(\w+)/\d+\s*$", line)
        if pm:
            proc = pm.group(1)
        key = f"{proto}|{port}|{addr}"
        if key in seen:
            continue
        seen.add(key)
        exp = "1" if (proto, port) in expected or ("tcp", port) in expected else "0"
        rows.append(f"{proto}|{port}|{sanitize(addr)}|{sanitize(proc)}|{exp}")
    return rows[:MAX_LINES]


def collect_agg(repo: Path) -> list[str]:
    """Cheap local facts as checklist rows for Bend remaining-work aggregation."""
    rows: list[str] = []

    def add(cid: str, status: str, weight: int) -> None:
        rows.append(f"{sanitize(cid)}|{status}|{weight}")

    guest_enabled = False
    try:
        for line in Path("/etc/passwd").read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("guest:") or line.startswith("Guest:"):
                guest_enabled = "/nologin" not in line and "/false" not in line
    except OSError:
        pass
    add("guest", "fail" if guest_enabled else "pass", 8)

    ufw = subprocess.run(["ufw", "status"], capture_output=True, text=True, timeout=5, check=False) if shutil.which("ufw") else None
    fw_on = bool(ufw and "Status: active" in (ufw.stdout or ""))
    add("firewall", "pass" if fw_on else "fail", 8)

    ports = collect_ports(repo)
    telnet = any(r.startswith("tcp|23|") for r in ports)
    add("telnet", "fail" if telnet else "pass", 10)
    add("ports", "fail" if any("|0" in r.split("|")[-1] and r.split("|")[1] in {"23", "31337", "4444"} for r in ports) else "pass", 8)

    sshd = Path("/etc/ssh/sshd_config")
    root_yes = False
    if sshd.is_file():
        root_yes = bool(re.search(r"(?im)^\s*PermitRootLogin\s+yes", sshd.read_text(encoding="utf-8", errors="replace")))
    add("ssh", "fail" if root_yes else "pass", 8)

    media = collect_files_media()
    add("media", "fail" if media else "pass", 5)
    return rows


COLLECTORS = {
    "files-ww": lambda repo: collect_files_ww(),
    "files-suid": lambda repo: collect_files_suid(),
    "files-media": lambda repo: collect_files_media(),
    "files-hidden": lambda repo: collect_files_hidden(),
    "files-rats": collect_files_rats,
    "files-perms": lambda repo: collect_files_perms(),
    "files-sticky": lambda repo: collect_files_sticky(),
    "files-sysprep": lambda repo: collect_files_sysprep(),
    "files-readme": lambda repo: collect_files_readme(),
    "files-shell": lambda repo: collect_files_shell(),
    "users": collect_users,
    "ports": collect_ports,
    "agg": collect_agg,
}

KIND_TO_BEND = {
    "files-ww": "score-files.bend",
    "files-suid": "score-files.bend",
    "files-media": "score-files.bend",
    "files-hidden": "score-files.bend",
    "files-rats": "score-files.bend",
    "files-perms": "score-files.bend",
    "files-sticky": "score-files.bend",
    "files-sysprep": "score-files.bend",
    "files-readme": "score-files.bend",
    "files-shell": "score-files.bend",
    "users": "score-users.bend",
    "ports": "score-ports.bend",
    "agg": "agg-checks.bend",
}


def fallback_score(kind: str, tsv: str) -> dict:
    """Python stand-in used only when `bend` is missing. Same JSON shape."""
    findings = []
    total = 0
    for line in tsv.splitlines():
        if not line.strip():
            continue
        cols = line.split("|")
        score = 0
        tags: list[str] = []
        path = cols[0] if cols else ""
        if kind.startswith("files"):
            mode = cols[1] if len(cols) > 1 else "0000"
            last = mode[-1:] if mode else "0"
            if last in "2367":
                score += 12
                tags.append("world-writable")
            if len(mode) == 4 and mode[0] in "46":
                score += 20
                tags.append("suid")
            if any(path.lower().endswith(ext) for ext in MEDIA_EXT):
                score += 10
                tags.append("media")
            if "/." in path:
                score += 8
                tags.append("hidden")
            low = path.lower()
            if any(n in low for n in RAT_NEEDLES):
                score += 28
                tags.append("remote-access")
            if "shadow" in low:
                score += 35
                tags.append("shadow")
            if path.startswith(("/tmp", "/home", "/var", "/opt")):
                tags.append("plant-path")
                if "suid" in tags:
                    score += 30
            low = path.lower()
            if "unattend" in low or "sysprep" in low:
                score += 30
                tags.append("sysprep")
            if (kind.startswith("files-sticky") or path in {"/tmp", "/var/tmp", "/dev/shm"} or path.startswith("/tmp/")) and last in "2367":
                padded = mode.zfill(4)
                if not padded.startswith("1"):
                    score += 35
                    tags.append("missing-sticky")
            if kind == "files-readme" or (len(cols) > 2 and cols[2] == "readme"):
                score += 8
                tags.append("readme")
            kind_col = cols[2] if len(cols) > 2 else ""
            if kind == "files-shell" or kind_col in {"shell", "shell-backdoor"}:
                tags.append("shell-rc")
                if kind_col == "shell-backdoor":
                    score += 32
                    tags.append("shell-backdoor")
                elif kind == "files-shell":
                    score += 4
        elif kind == "users":
            uid = cols[1] if len(cols) > 1 else ""
            empty = len(cols) > 4 and cols[4] == "1"
            never = len(cols) > 6 and cols[6] == "1"
            admin = len(cols) > 7 and cols[7] == "1"
            allow = len(cols) > 8 and cols[8] == "1"
            interactive = len(cols) > 9 and cols[9] == "1"
            if uid == "0" and path != "root":
                score += 40
                tags.append("uid-weirdness")
            if empty:
                score += 35
                tags.append("empty-password")
            if interactive and not allow:
                score += 25
                tags.append("not-in-allowlist")
            if re.search(r"hacker|toor|flag|pwn|guest", path, re.I):
                score += 20
                tags.append("name-pattern")
            if admin and not allow:
                score += 20
                tags.append("extra-admin")
            if never and interactive:
                score += 10
                tags.append("never-logged-in")
        elif kind == "ports":
            port = cols[1] if len(cols) > 1 else ""
            expected = len(cols) > 4 and cols[4] == "1"
            weights = {"31337": 40, "4444": 40, "23": 35, "21": 30, "445": 22, "139": 22, "3389": 20}
            score = 0 if expected else 12 + weights.get(port, 0)
            if not expected:
                tags.append("unexpected")
            if port in weights:
                tags.append("suspicious-port")
            path = f"{cols[0] if cols else 'tcp'}/{port}"
        elif kind == "agg":
            status = cols[1] if len(cols) > 1 else "info"
            try:
                weight = int(cols[2]) if len(cols) > 2 else 8
            except ValueError:
                weight = 8
            score = weight if status == "fail" else (weight // 3 if status == "warn" else 0)
            tags.append(status)
        if score <= 0 and kind != "agg":
            continue
        sev = "critical" if score >= 40 else "high" if score >= 25 else "medium" if score >= 10 else "low"
        findings.append({"path": path, "severity": sev, "tags": ",".join(tags), "score": score})
        total += score
    engine_kind = "files" if kind.startswith("files") else kind
    return {
        "ok": True,
        "engine": "fallback",
        "kind": engine_kind,
        "count": len(findings),
        "totalScore": total,
        "findings": findings,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect host facts for Bend CP scorers")
    parser.add_argument("kind", choices=sorted(COLLECTORS))
    parser.add_argument("--repo", default="", help="Repo root (config/ lives here)")
    parser.add_argument("--score-fallback", action="store_true", help="Score in Python instead of printing TSV")
    args = parser.parse_args()
    here = Path(__file__).resolve().parent
    repo = Path(args.repo).resolve() if args.repo else here.parents[1]
    rows = COLLECTORS[args.kind](repo)
    tsv = "\n".join(rows) + ("\n" if rows else "")
    if args.score_fallback:
        json.dump(fallback_score(args.kind, tsv), sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0
    sys.stdout.write(tsv)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
