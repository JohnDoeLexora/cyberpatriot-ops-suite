#!/usr/bin/env python3
"""Read-only firewall status for audit-firewall and list-firewall-rules.

Prints one JSON object and exits 0, 1, or 3. Never changes rules.
Prefer ufw. Fall back to nftables, then iptables.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys

ACTION_RE = re.compile(
    r"^(?P<to>.+?)\s+(?P<action>ALLOW IN|ALLOW OUT|ALLOW FWD|DENY IN|DENY OUT|DENY FWD|"
    r"REJECT IN|REJECT OUT|REJECT FWD|LIMIT IN|LIMIT OUT|LIMIT FWD|ALLOW|DENY|REJECT|LIMIT|DROP)\s+"
    r"(?P<frm>.+)$",
    re.I,
)


def run(cmd: list[str], timeout: int = 15) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)


def emit(payload: dict, code: int) -> None:
    payload.setdefault("exitCode", code)
    json.dump(payload, sys.stdout, indent=2)
    sys.stdout.write("\n")
    raise SystemExit(code)


def fail(tool: str, detail: str) -> None:
    text = " ".join(detail.split())
    emit(
        {
            "ok": False,
            "status": "error",
            "summary": f"Firewall status could not be read from {tool}: {text[:240]}",
            "report": {
                "tone": "watch",
                "facts": [
                    {"label": "Backend", "value": tool},
                    {"label": "Status", "value": "unreadable"},
                    {"label": "Detail", "value": text[:240]},
                ],
            },
        },
        1,
    )


def family_of(to: str, frm: str) -> str:
    blob = f"{to} {frm}".lower()
    if "(v6)" in blob or "ipv6" in blob or blob.startswith("ip6"):
        return "v6"
    return "v4"


def policy_word(value: str) -> str:
    word = (value or "unknown").strip().lower()
    if word in {"drop", "deny"}:
        return "deny"
    if word in {"reject"}:
        return "reject"
    if word in {"accept", "allow"}:
        return "allow"
    if word in {"disabled", "disable"}:
        return "disabled"
    return word or "unknown"


def tone_for(status: str, incoming: str) -> str:
    if status != "active":
        return "urgent"
    if incoming in {"allow", "accept"}:
        return "urgent"
    return "clear"


def summary_for(status: str, incoming: str, outgoing: str, rules: list[dict]) -> str:
    if status == "inactive":
        return "Firewall is off"
    rule_word = "1 rule" if len(rules) == 1 else f"{len(rules)} rules"
    if status != "active":
        return f"Firewall status is {status}"
    inc = policy_word(incoming)
    out = policy_word(outgoing)
    if inc == "unknown":
        return f"Firewall is on: {rule_word}"
    return f"Firewall is on: default {inc} incoming, {out} outgoing, {rule_word}"


def card(backend: str, status: str, incoming: str, outgoing: str, routed: str, rules: list[dict]) -> dict:
    tone = tone_for(status, policy_word(incoming))
    summary = summary_for(status, incoming, outgoing, rules)
    facts = [
        {"label": "Backend", "value": backend},
        {"label": "Status", "value": status},
        {"label": "Incoming", "value": policy_word(incoming)},
        {"label": "Outgoing", "value": policy_word(outgoing)},
        {"label": "Routed", "value": policy_word(routed)},
    ]
    report: dict = {"tone": tone, "facts": facts}
    if rules:
        report["table"] = {
            "title": "Rules",
            "columns": [
                {"key": "to", "label": "To", "mono": True},
                {"key": "action", "label": "Action"},
                {"key": "from", "label": "From", "mono": True},
                {"key": "family", "label": "Family"},
            ],
            "rows": rules,
        }
    enabled = status == "active"
    return {
        "ok": True,
        "status": "ok",
        "summary": summary,
        "policy": {
            "firewallEnabled": enabled,
            "backend": backend,
            "incoming": policy_word(incoming),
            "outgoing": policy_word(outgoing),
            "routed": policy_word(routed),
        },
        "report": report,
        "extra": {"backend": backend, "ruleCount": len(rules)},
    }


def parse_ufw(text: str) -> tuple[str, str, str, str, list[dict]]:
    status_m = re.search(r"(?im)^Status:\s*(\S+)", text)
    status = status_m.group(1).lower() if status_m else "unknown"
    incoming = outgoing = routed = "unknown"
    default_m = re.search(r"(?im)^Default:\s*(.+)$", text)
    if default_m:
        blob = default_m.group(1)

        def pol(name: str) -> str:
            match = re.search(rf"([A-Za-z]+)\s*\({name}\)", blob)
            return match.group(1).lower() if match else "unknown"

        incoming, outgoing, routed = pol("incoming"), pol("outgoing"), pol("routed")
    rules: list[dict] = []
    in_table = False
    for line in text.splitlines():
        if re.match(r"^To\s+Action\s+From", line):
            in_table = True
            continue
        if not in_table:
            continue
        stripped = re.sub(r"^\[\s*\d+\]\s*", "", line).strip()
        if not stripped or set(stripped) <= set("- "):
            continue
        match = ACTION_RE.match(stripped)
        if not match:
            continue
        to, action, frm = match.group("to").strip(), match.group("action").strip(), match.group("frm").strip()
        rules.append({"to": to, "action": action.upper(), "from": frm, "family": family_of(to, frm)})
    if status == "active":
        return status, incoming, outgoing, routed, rules
    if status == "inactive":
        return "inactive", incoming, outgoing, routed, rules
    return status, incoming, outgoing, routed, rules


def parse_nft(text: str) -> tuple[str, str, str, str, list[dict]]:
    policies = {"incoming": "unknown", "outgoing": "unknown", "routed": "unknown"}
    hook_map = {"input": "incoming", "output": "outgoing", "forward": "routed"}
    for match in re.finditer(r"hook\s+(input|output|forward)\b[^}]*?\bpolicy\s+(\w+)", text, re.I | re.S):
        policies[hook_map[match.group(1).lower()]] = match.group(2).lower()
    rules: list[dict] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.endswith("{") or stripped == "}":
            continue
        if stripped.startswith("table ") or stripped.startswith("chain ") or stripped.startswith("type "):
            continue
        action_m = re.search(r"\b(accept|drop|reject)\b", stripped, re.I)
        if not action_m:
            continue
        if "policy " in stripped and "hook " in stripped:
            continue
        rules.append(
            {
                "to": stripped[:120],
                "action": action_m.group(1).upper(),
                "from": "",
                "family": "v6" if re.search(r"\bip6\b|ipv6", stripped, re.I) else "v4",
            }
        )
        if len(rules) >= 80:
            break
    hooked = any(value != "unknown" for value in policies.values())
    status = "active" if hooked or rules else "inactive"
    return status, policies["incoming"], policies["outgoing"], policies["routed"], rules


def parse_iptables(text: str, family: str) -> tuple[dict[str, str], list[dict]]:
    policies: dict[str, str] = {}
    rules: list[dict] = []
    chain_key = {"INPUT": "incoming", "OUTPUT": "outgoing", "FORWARD": "routed"}
    for line in text.splitlines():
        parts = line.split()
        if len(parts) >= 3 and parts[0] == "-P":
            key = chain_key.get(parts[1].upper())
            if key:
                policies[key] = parts[2].lower()
            continue
        if len(parts) < 2 or parts[0] != "-A":
            continue
        action = parts[parts.index("-j") + 1] if "-j" in parts else "RULE"
        dest = parts[1]
        if "--dport" in parts:
            port = parts[parts.index("--dport") + 1]
            proto = parts[parts.index("-p") + 1] if "-p" in parts else ""
            dest = f"{port}/{proto}" if proto else port
        src = parts[parts.index("-s") + 1] if "-s" in parts else "Anywhere"
        rules.append({"to": dest, "action": action, "from": src, "family": family})
        if len(rules) >= 80:
            break
    return policies, rules


def from_ufw() -> None:
    proc = run(["ufw", "status", "verbose"])
    text = "\n".join(part for part in (proc.stdout, proc.stderr) if part)
    if "Status:" not in text:
        detail = text.strip() or f"ufw exited {proc.returncode}"
        fail("ufw", detail)
    status, incoming, outgoing, routed, rules = parse_ufw(text)
    if status not in {"active", "inactive"}:
        fail("ufw", text.strip() or "ufw did not report active or inactive")
    emit(card("ufw", status, incoming, outgoing, routed, rules), 0)


def from_nft() -> None:
    proc = run(["nft", "list", "ruleset"])
    text = "\n".join(part for part in (proc.stdout, proc.stderr) if part)
    if proc.returncode != 0 and "hook " not in text:
        fail("nftables", text.strip() or f"nft exited {proc.returncode}")
    status, incoming, outgoing, routed, rules = parse_nft(text)
    emit(card("nftables", status, incoming, outgoing, routed, rules), 0)


def from_iptables() -> None:
    policies: dict[str, str] = {}
    rules: list[dict] = []
    saw_output = False
    errors = []
    for tool, family in (("iptables", "v4"), ("ip6tables", "v6")):
        if not shutil.which(tool):
            continue
        proc = run([tool, "-S"])
        text = "\n".join(part for part in (proc.stdout, proc.stderr) if part)
        if proc.returncode != 0 and "-P " not in text and "-A " not in text:
            errors.append(text.strip() or f"{tool} exited {proc.returncode}")
            continue
        saw_output = True
        parsed_policies, parsed_rules = parse_iptables(text, family)
        for key, value in parsed_policies.items():
            policies.setdefault(key, value)
        rules.extend(parsed_rules)
    if not saw_output:
        fail("iptables", errors[0] if errors else "iptables produced no ruleset")
    incoming = policies.get("incoming", "unknown")
    outgoing = policies.get("outgoing", "unknown")
    routed = policies.get("routed", "unknown")
    # A loaded filter table is on. "Off" is reserved for an inactive ufw or an empty nftables ruleset.
    emit(card("iptables", "active", incoming, outgoing, routed, rules), 0)


def main() -> None:
    if shutil.which("ufw"):
        from_ufw()
    if shutil.which("nft"):
        from_nft()
    if shutil.which("iptables") or shutil.which("ip6tables"):
        from_iptables()
    emit(
        {
            "ok": False,
            "status": "skipped",
            "summary": "Skipped: ufw is not installed. Install it with: sudo apt-get install ufw. iptables is also missing, so there is no ruleset to list.",
        },
        3,
    )


if __name__ == "__main__":
    try:
        main()
    except subprocess.TimeoutExpired as exc:
        fail(exc.cmd[0] if isinstance(exc.cmd, list) and exc.cmd else "firewall", "the read timed out")
