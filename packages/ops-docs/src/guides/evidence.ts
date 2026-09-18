import type { HowToBody } from "../types.js";

export const EVIDENCE: Record<string, HowToBody> = {
  "export-evidence-bundle": {
    summary: "One-click redacted evidence pack for notes and forensics write-ups.",
    what: "Assembles a redacted local pack: user inventory (no hashes), listeners, services, firewall state, checksums of sshd_config/sudoers/hosts, plus a notes.md snippet. Never copies shadow hashes, private keys, or off-image data.",
    whyItScores:
      "Forensics questions and team handoff need artifacts. A redacted bundle is faster than screenshots and stays inside the rules.",
    whenToRun: "After major passes (users, firewall, files) and before you submit forensics answers. Also at the end of the round.",
    steps: [
      "Run the op in demo or live read mode — it does not mutate.",
      "Skim the bundle: counts, top findings, checksums.",
      "Copy only what you need into the forensics notepad. Do not add shadow or id_rsa files by hand.",
    ],
    goodLooksLike: [
      "Bundle contains inventories and checksums, not secrets.",
      "notes.md snippet is something you could show a coach.",
    ],
    risks: [
      "Read-only. Still: do not zip private keys into the pack.",
      "Not off-image exfiltration and not a scoring-server upload.",
    ],
    related: [
      "one-click-hardening-checklist",
      "score-image-heuristics",
      "list-users",
      "audit-listening-ports",
    ],
    keywords: ["evidence", "checksums", "notes.md", "redacted"],
  },
  "one-click-hardening-checklist": {
    summary: "Read-only dashboard of pass/fail/warn rows pointing at the fix ops.",
    what: "Covers users, admins, guest, password policy, firewall, telnet/ftp, listening ports, prohibited software, media, SSH/UAC. Each row points at the mutate op to fix it. Does not change the image.",
    whyItScores:
      "This is the ‘what is left’ view so the team does not forget Guest or the firewall while hunting SUID. It is not a CCS cheat.",
    whenToRun: "Start of the round (baseline), whenever you need a huddle, and near the end.",
    steps: [
      "Run the op. Sort fail/warn first.",
      "Open the linked mutate/read op from each failing row and follow that how-to.",
      "Re-run the checklist; remaining fails should shrink.",
    ],
    goodLooksLike: [
      "Required services still pass.",
      "Guest, firewall, telnet, extra admins go green after their mutate ops.",
    ],
    risks: [
      "Read-only. Fixes still need confirm:true on the mutate ops.",
      "Not the official scoreboard. Do not query scoring endpoints.",
    ],
    related: [
      "score-image-heuristics",
      "flag-suspicious-users",
      "audit-firewall",
      "disable-guest-account",
    ],
    keywords: ["checklist", "pass/fail", "preflight", "remaining work"],
  },
  "score-image-heuristics": {
    summary: "A 0–100 remaining-work index with drill-down — not the official CCS score.",
    what: "Aggregates suspicion across users, services, ports, and files. Higher means more left to harden. Dashboard headline with drill-down findings. Heuristic only — not the official CCS score.",
    whyItScores:
      "It does not score you on CCS. It helps the team pick the next fire. Treating it as the scoreboard is a mistake.",
    whenToRun: "Anytime you need a single number for huddle, plus at the end to sanity-check leftovers.",
    steps: [
      "Run the op. Read top drivers (UID 0, port 31337, telnet, empty Guest) not just the integer.",
      "Work those drivers with the matching ops.",
      "Re-run; the remaining-work index should fall. If it does not, you fixed the wrong thing.",
    ],
    goodLooksLike: [
      "Top drivers match what you already found in specialized ops.",
      "Number trending down after real fixes.",
    ],
    risks: [
      "Read-only heuristic. Not CCS. Not a scoring-server client.",
      "Do not optimize the number by hiding logs or deleting evidence.",
    ],
    related: [
      "one-click-hardening-checklist",
      "flag-suspicious-users",
      "audit-listening-ports",
      "export-evidence-bundle",
    ],
    keywords: ["remaining-work index", "not the official CCS score", "heuristic", "top drivers"],
  },
  "find-backdoor-binaries": {
    summary: "Heuristic filenames/locations: nc in /tmp, SUID bash copies, 31337 process binaries.",
    what: "Looks for nc/netcat/ncat/socat in /tmp /home /opt, suid copies of bash, meterpreter-like names, and binaries bound to 31337. Does not include exploit payloads or attack other hosts.",
    whyItScores:
      "Loose reverse-admin tools in /tmp are plants. This is filename/location hygiene, not malware development.",
    whenToRun: "With find-hidden-executables, find-suid-sgid, and audit-listening-ports.",
    steps: [
      "Run the op. Snapshot paths into notes.",
      "Do not execute the binary. Remove it after you know no forensics question needs the name.",
      "Disable the user/cron/startup that dropped it.",
      "Re-run plus audit-listening-ports.",
    ],
    goodLooksLike: [
      "No nc/ncat in /tmp or homes.",
      "No process on :31337.",
      "Expected system binaries in /usr only.",
    ],
    risks: [
      "Read-only. Never run the found binary ‘to confirm.’",
      "Name matches can false-positive — check the path.",
      "No exploit payloads, no off-image attacks.",
    ],
    related: [
      "find-hidden-executables",
      "find-suid-sgid",
      "audit-listening-ports",
      "find-prohibited-software",
    ],
    keywords: ["/tmp/nc", "ncat", "31337", "hidden_shell", "socat"],
  },
};
