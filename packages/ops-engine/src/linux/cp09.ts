import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { hitsToFiles, hitsToFindings, tryRunBend } from "../bend/runner.js";
import { isHumanAccount, WELL_KNOWN_SYSTEM } from "../heuristics/suspicious-users.js";
import { readNameList, resolveConfigFile } from "../paths.js";
import { asBoolean, asString, isSafeUsername } from "../safety.js";
import type { EngineContext, FileRecord, Finding, RunResult, UserRecord } from "../types.js";
import { collectLocalUsers, existsSync, readText } from "./collect.js";
import { runCmd } from "./exec.js";
import {
  addToSudo,
  createUserNoPassword,
  expirePassword,
  installPackages,
  lockUser,
} from "./mutate.js";

type Finish = (
  ctx: EngineContext,
  startedAt: string,
  summary: string,
  data: RunResult["data"],
  findings?: Finding[],
  warnings?: string[],
  ok?: boolean,
  engine?: RunResult["engine"],
) => RunResult;

const SHELL_BACKDOOR_RE =
  /alias\s+(sudo|su|ls|cd|passwd|chmod|chown|ssh|login)\s*=|nc\s+-e\s+\/bin\/(ba)?sh|python3?\s+-c.{0,80}socket|wget.{0,80}\|\s*(ba)?sh|curl.{0,80}\|\s*(ba)?sh|LD_PRELOAD=|PROMPT_COMMAND=.+(wget|curl|nc|python)|unset\s+HISTFILE|iptables\s+-F|base64\s+-d.{0,40}\|\s*(ba)?sh|\/tmp\/\.[A-Za-z0-9]|Invoke-Expression|DownloadString/i;

const SUSPICIOUS_HOST_NAME_RE =
  /windowsupdate|microsoft\.com|virustotal|avast|avg|defender|google\.com|facebook|youtube|twitter|bing\.com|adobe\.com|symantec|mcafee|kaspersky|ubuntu\.com|canonical\.com/i;

export function parseHostsLines(text: string): Array<{
  line: string;
  ip: string;
  names: string[];
  keep: boolean;
  reason?: string;
}> {
  return text.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return { line, ip: "", names: [] as string[], keep: true };
    }
    const parts = trimmed.split(/\s+/);
    const ip = parts[0] ?? "";
    const names = parts.slice(1);
    const sinkhole = /^(127\.0\.0\.1|0\.0\.0\.0|::1)$/.test(ip);
    const dotted = names.filter((n) => n.includes("."));
    const localOnly = names.every(
      (n) =>
        /^(localhost|ip6-localhost|ip6-loopback|broadcasthost|localhost\.localdomain)$/i.test(n) ||
        (!n.includes(".") && !SUSPICIOUS_HOST_NAME_RE.test(n)),
    );
    if (sinkhole && dotted.some((n) => SUSPICIOUS_HOST_NAME_RE.test(n))) {
      return { line, ip, names, keep: false, reason: "sinkhole of vendor/update name" };
    }
    if (sinkhole && dotted.length && !localOnly) {
      return { line, ip, names, keep: false, reason: "loopback mapping for a public name" };
    }
    return { line, ip, names, keep: true };
  });
}

function listRcFiles(): string[] {
  const files = [
    "/etc/profile",
    "/etc/bash.bashrc",
    "/etc/bashrc",
    "/root/.bashrc",
    "/root/.profile",
    "/root/.bash_aliases",
    "/root/.bash_profile",
  ];
  const profileD = "/etc/profile.d";
  if (existsSync(profileD)) {
    try {
      for (const name of readdirSync(profileD)) {
        if (name.endsWith(".sh") || name.endsWith(".bashrc")) files.push(path.join(profileD, name));
      }
    } catch {
      /* ignore */
    }
  }
  const homeRoot = "/home";
  if (existsSync(homeRoot)) {
    try {
      for (const user of readdirSync(homeRoot)) {
        const home = path.join(homeRoot, user);
        for (const rc of [".bashrc", ".profile", ".bash_aliases", ".bash_profile", ".zshrc"]) {
          files.push(path.join(home, rc));
        }
      }
    } catch {
      /* ignore */
    }
  }
  return files.filter((f) => existsSync(f));
}

export function collectShellBackdoors(): { files: FileRecord[]; findings: Finding[] } {
  const files: FileRecord[] = [];
  const findings: Finding[] = [];
  for (const filePath of listRcFiles()) {
    const text = readText(filePath) ?? "";
    if (!SHELL_BACKDOOR_RE.test(text)) continue;
    const match = text.match(SHELL_BACKDOOR_RE);
    const note = (match?.[0] ?? "suspicious rc pattern").slice(0, 160);
    files.push({ path: filePath, kind: "file", note });
    findings.push({
      id: `shell:${filePath}`,
      severity: /sudo|wget|curl|nc\s+-e|DownloadString/i.test(note) ? "critical" : "high",
      title: `Shell backdoor ${filePath}`,
      detail: note,
      resource: filePath,
    });
  }
  return { files, findings };
}

function collectDisplayManager(): Record<string, string | boolean | null> {
  const lightdm =
    readText("/etc/lightdm/lightdm.conf") ??
    (existsSync("/etc/lightdm/lightdm.conf.d")
      ? ""
      : "");
  let dropins = "";
  if (existsSync("/etc/lightdm/lightdm.conf.d")) {
    try {
      for (const name of readdirSync("/etc/lightdm/lightdm.conf.d")) {
        dropins += readText(path.join("/etc/lightdm/lightdm.conf.d", name)) ?? "";
      }
    } catch {
      /* ignore */
    }
  }
  const lightdmBlob = `${lightdm}\n${dropins}`;
  const gdm =
    readText("/etc/gdm3/custom.conf") ??
    readText("/etc/gdm/custom.conf") ??
    readText("/etc/gdm3/daemon.conf") ??
    "";
  const pick = (blob: string, key: string) => {
    const matches = [...blob.matchAll(new RegExp(`^\\s*${key}\\s*=\\s*(\\S+)`, "gim"))];
    return matches.at(-1)?.[1] ?? null;
  };
  return {
    lightdmAllowGuest: /allow-guest\s*=\s*true/i.test(lightdmBlob),
    lightdmAutologin: pick(lightdmBlob, "autologin-user"),
    gdmAutomaticLoginEnable: /AutomaticLoginEnable\s*=\s*true/i.test(gdm),
    gdmAutomaticLogin: pick(gdm, "AutomaticLogin"),
    hasLightdm: existsSync("/etc/lightdm") || existsSync("/usr/sbin/lightdm"),
    hasGdm: existsSync("/etc/gdm3") || existsSync("/etc/gdm"),
  };
}

function writeDropIn(filePath: string, content: string): { ok: boolean; detail: string } {
  try {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, { encoding: "utf8", mode: 0o644 });
    return { ok: true, detail: `wrote ${filePath}` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

export async function runCp09Linux(
  ctx: EngineContext,
  startedAt: string,
  finish: Finish,
): Promise<RunResult | undefined> {
  const id = ctx.op.id;
  const dryRun = asBoolean(ctx.params.dryRun, false);
  const username = asString(ctx.params.username);

  const failParam = (msg: string): RunResult => finish(ctx, startedAt, msg, {}, [], [msg], false);

  switch (id) {
    case "force-password-change": {
      const allow = new Set(
        readNameList(resolveConfigFile(ctx.repoRoot, ctx.params.allowlistPath, "config/allowed-users.txt")),
      );
      const { users, warnings } = collectLocalUsers();
      const targets = username
        ? [username]
        : users
            .filter((u) => allow.has(u.name) && u.name !== "root" && isHumanAccount(u))
            .map((u) => u.name);
      if (username && !isSafeUsername(username)) return failParam("username failed safety check");
      if (!targets.length) {
        return finish(ctx, startedAt, "No matching accounts to expire.", { extra: { targets } }, [], warnings);
      }
      if (dryRun) {
        return finish(ctx, startedAt, `dry-run: would expire passwords for ${targets.join(", ")}`, {
          extra: { targets, dryRun: true },
        });
      }
      const results = [];
      for (const name of targets) {
        results.push({ name, ...(await expirePassword(name)) });
      }
      const ok = results.every((r) => r.ok);
      return finish(
        ctx,
        startedAt,
        `Expired ${results.filter((r) => r.ok).length}/${targets.length} passwords (change at next logon).`,
        { extra: { results } },
        [],
        ok ? warnings : results.filter((r) => !r.ok).map((r) => r.detail),
        ok,
      );
    }
    case "sync-authorized-users": {
      const allow = readNameList(
        resolveConfigFile(ctx.repoRoot, ctx.params.allowlistPath, "config/allowed-users.txt"),
      );
      const admins = readNameList(
        resolveConfigFile(ctx.repoRoot, ctx.params.adminsPath, "config/allowed-admins.txt"),
      );
      const allowSet = new Set(allow);
      const adminSet = new Set(admins);
      const { users, warnings } = collectLocalUsers();
      const present = new Set(users.map((u) => u.name));
      const missing = allow.filter((n) => n && !present.has(n) && isSafeUsername(n));
      const extras = users.filter((u) => {
        if (WELL_KNOWN_SYSTEM.has(u.name) && u.name !== "root" && u.name.toLowerCase() !== "guest") {
          if (!isHumanAccount(u)) return false;
        }
        if (u.name === "root") return false;
        if (!isHumanAccount(u) && u.name.toLowerCase() !== "guest") return false;
        return !allowSet.has(u.name);
      });
      const extraAdmins = users.filter((u) => {
        const privileged =
          u.uid === 0 || u.groups.some((g) => ["sudo", "wheel", "admin", "administrators"].includes(g.toLowerCase()));
        return privileged && u.name !== "root" && !adminSet.has(u.name);
      });
      const missingAdmins = admins.filter((n) => n && n !== "root" && present.has(n) && !users.some((u) => u.name === n && u.groups.some((g) => ["sudo", "wheel", "admin"].includes(g.toLowerCase()))));
      const findings: Finding[] = [
        ...missing.map((name) => ({
          id: `missing:${name}`,
          severity: "medium" as const,
          title: `Allowlist user missing: ${name}`,
          detail: "Would create without a password. Set password manually.",
          resource: name,
        })),
        ...extras.map((u) => ({
          id: `extra:${u.name}`,
          severity: "high" as const,
          title: `Extra account not in allowlist: ${u.name}`,
          detail: "Flagged only — not auto-disabled.",
          resource: u.name,
          remediationOpId: "disable-user",
        })),
        ...extraAdmins.map((u) => ({
          id: `extraadmin:${u.name}`,
          severity: "high" as const,
          title: `Extra admin: ${u.name}`,
          detail: "Not in allowed-admins.txt.",
          resource: u.name,
          remediationOpId: "remove-user-from-admins",
        })),
      ];
      const bend = await tryRunBend(ctx, "users");
      if (dryRun) {
        return finish(
          ctx,
          startedAt,
          `dry-run: would create ${missing.length} users; ${extras.length} extras flagged; never invents passwords.`,
          {
            users: extras,
            extra: {
              missingToCreate: missing,
              setPasswordManually: missing.map((name) => ({ name, detail: `passwd ${name}` })),
              extras: extras.map((u) => u.name),
              extraAdmins: extraAdmins.map((u) => u.name),
              missingAdmins,
              scorer: bend?.engine,
              dryRun: true,
            },
          },
          [...(bend ? hitsToFindings(bend.findings, "disable-user") : []), ...findings],
          warnings,
          true,
          bend?.engine === "bend" ? "bend" : "linux",
        );
      }
      const created: Array<{ name: string; ok: boolean; detail: string; setPasswordManually?: boolean }> = [];
      for (const name of missing) {
        created.push({ name, ...(await createUserNoPassword(name)) });
      }
      const promoted: Array<{ name: string; ok: boolean; detail: string }> = [];
      for (const name of admins.filter((n) => n && n !== "root" && isSafeUsername(n))) {
        const existsNow = present.has(name) || created.some((c) => c.name === name && c.ok);
        if (!existsNow) continue;
        promoted.push({ name, ...(await addToSudo(name)) });
      }
      return finish(
        ctx,
        startedAt,
        `Created ${created.filter((c) => c.ok).length} users (set passwords manually); flagged ${extras.length} extras.`,
        {
          users: extras,
          extra: {
            created,
            promoted,
            setPasswordManually: created.filter((c) => c.setPasswordManually).map((c) => c.detail),
            extras: extras.map((u) => u.name),
            extraAdmins: extraAdmins.map((u) => u.name),
            scorer: bend?.engine,
          },
        },
        findings,
        warnings,
        created.every((c) => c.ok) || missing.length === 0,
        bend?.engine === "bend" ? "bend" : "linux",
      );
    }
    case "clear-suspicious-hosts": {
      const text = readText("/etc/hosts") ?? "";
      const parsed = parseHostsLines(text);
      const drop = parsed.filter((p) => !p.keep);
      const keep = parsed.filter((p) => p.keep);
      if (dryRun) {
        return finish(ctx, startedAt, `dry-run: would drop ${drop.length} suspicious hosts lines.`, {
          extra: { wouldDrop: drop.map((d) => d.line), keep: keep.map((k) => k.line), dryRun: true },
        }, drop.map((d) => ({
          id: `hosts:${d.names.join(",")}`,
          severity: "high" as const,
          title: `Sinkhole ${d.names.join(" ")} → ${d.ip}`,
          detail: d.reason,
          resource: d.names[0],
        })));
      }
      const next = keep.map((k) => k.line).join("\n").replace(/\n*$/, "\n");
      const written = writeDropIn("/etc/hosts", next);
      return finish(
        ctx,
        startedAt,
        written.ok ? `Removed ${drop.length} suspicious hosts-file lines.` : written.detail,
        { extra: { dropped: drop.map((d) => d.line), ...written } },
        [],
        written.ok ? [] : [written.detail],
        written.ok,
      );
    }
    case "disable-display-manager-guest": {
      const before = collectDisplayManager();
      if (dryRun) {
        return finish(ctx, startedAt, "dry-run: would disable LightDM/GDM guest and autologin.", {
          extra: { before, dryRun: true },
        });
      }
      const results = [
        writeDropIn(
          "/etc/lightdm/lightdm.conf.d/99-cp-hardening.conf",
          "[Seat:*]\nallow-guest=false\ngreeter-allow-guest=false\nautologin-guest=false\nautologin-user=\n",
        ),
      ];
      const gdmPath = existsSync("/etc/gdm3") ? "/etc/gdm3/custom.conf" : existsSync("/etc/gdm") ? "/etc/gdm/custom.conf" : "/etc/gdm3/custom.conf";
      const existing = readText(gdmPath) ?? "[daemon]\n";
      let next = existing;
      if (!/\[daemon\]/i.test(next)) next = `[daemon]\n${next}`;
      next = next.replace(/^\s*AutomaticLoginEnable\s*=.*$/gim, "AutomaticLoginEnable=false");
      next = next.replace(/^\s*TimedLoginEnable\s*=.*$/gim, "TimedLoginEnable=false");
      if (!/AutomaticLoginEnable=/i.test(next)) {
        next = next.replace(/\[daemon\]/i, "[daemon]\nAutomaticLoginEnable=false");
      }
      if (!/TimedLoginEnable=/i.test(next)) {
        next = next.replace(/\[daemon\]/i, "[daemon]\nTimedLoginEnable=false");
      }
      results.push(writeDropIn(gdmPath, next));
      const ok = results.some((r) => r.ok);
      return finish(
        ctx,
        startedAt,
        "Disabled display-manager guest sessions and autologin (LightDM drop-in + GDM knobs).",
        { extra: { before, after: collectDisplayManager(), results } },
        [],
        ok ? [] : results.map((r) => r.detail),
        ok,
      );
    }
    case "lock-root-account": {
      if (dryRun) return finish(ctx, startedAt, "dry-run: would passwd -l root", { extra: { target: "root", dryRun: true } });
      const action = await lockUser("root");
      return finish(ctx, startedAt, action.detail, { extra: { target: "root", ...action } }, [], action.ok ? [] : [action.detail], action.ok);
    }
    case "enable-fail2ban": {
      const active = await runCmd("systemctl", ["is-active", "fail2ban"]);
      const installed = !active.missing && active.stdout.trim() !== "" && active.code !== 4;
      if (dryRun) {
        return finish(ctx, startedAt, `dry-run: fail2ban active=${active.stdout.trim() || "unknown"}; would install+enable if missing.`, {
          extra: { active: active.stdout.trim(), installed, dryRun: true },
        });
      }
      const inst = await installPackages(["fail2ban"]);
      const enable = await runCmd("systemctl", ["enable", "--now", "fail2ban"]);
      const ok = enable.code === 0 || inst.ok;
      return finish(
        ctx,
        startedAt,
        ok ? "fail2ban installed/enabled." : "fail2ban unavailable (distro package missing?).",
        { extra: { install: inst, enable: enable.stdout || enable.stderr } },
        [],
        ok ? [] : [inst.detail, enable.stderr].filter(Boolean),
        ok,
      );
    }
    case "harden-host-conf": {
      const before = readText("/etc/host.conf") ?? "";
      const next = "order hosts,bind\nmulti on\nnospoof on\n";
      if (dryRun) {
        return finish(ctx, startedAt, "dry-run: would write /etc/host.conf nospoof on.", {
          extra: { before, after: next, dryRun: true },
        });
      }
      const written = writeDropIn("/etc/host.conf", next);
      return finish(ctx, startedAt, written.detail, { extra: { before, after: next, ...written } }, [], written.ok ? [] : [written.detail], written.ok);
    }
    case "set-ufw-logging": {
      if (dryRun) {
        const status = await runCmd("ufw", ["status", "verbose"], 5000);
        return finish(ctx, startedAt, "dry-run: would ufw logging high and default deny incoming / allow outgoing.", {
          extra: { current: status.stdout.slice(0, 2000), dryRun: true },
        });
      }
      const logging = await runCmd("ufw", ["logging", "high"]);
      const incoming = await runCmd("ufw", ["default", "deny", "incoming"]);
      const outgoing = await runCmd("ufw", ["default", "allow", "outgoing"]);
      const status = await runCmd("ufw", ["status", "verbose"], 5000);
      const ok = logging.code === 0 || incoming.code === 0;
      return finish(
        ctx,
        startedAt,
        ok ? "UFW logging high; defaults deny incoming / allow outgoing." : "ufw commands failed (need root / ufw installed?).",
        { extra: { logging: logging.stdout || logging.stderr, incoming: incoming.stdout, outgoing: outgoing.stdout, status: status.stdout.slice(0, 3000) } },
        [],
        ok ? [] : [logging.stderr, incoming.stderr].filter(Boolean),
        ok,
      );
    }
    case "restrict-cron-at": {
      const { users: localUsers } = collectLocalUsers();
      const presentNames = new Set(localUsers.map((u) => u.name));
      const admins = readNameList(resolveConfigFile(ctx.repoRoot, ctx.params.adminsPath, "config/allowed-admins.txt"));
      const allow = [
        "root",
        ...admins.filter((n) => n && n !== "root" && isSafeUsername(n) && presentNames.has(n)),
      ];
      const unique = [...new Set(allow)];
      const body = `${unique.join("\n")}\n`;
      if (dryRun) {
        return finish(ctx, startedAt, `dry-run: would write cron.allow/at.allow for ${unique.join(", ")} and remove *.deny.`, {
          extra: { cronAllow: unique, atAllow: unique, dryRun: true },
        });
      }
      const a = writeDropIn("/etc/cron.allow", body);
      const b = writeDropIn("/etc/at.allow", body);
      const removed: string[] = [];
      for (const p of ["/etc/cron.deny", "/etc/at.deny"]) {
        if (existsSync(p)) {
          try {
            unlinkSync(p);
            removed.push(p);
          } catch {
            /* need root */
          }
        }
      }
      const ok = a.ok || b.ok;
      return finish(
        ctx,
        startedAt,
        `Restricted cron/at to ${unique.join(", ")}.`,
        { extra: { cronAllow: unique, atAllow: unique, removed, writes: [a, b] } },
        [],
        ok ? [] : [a.detail, b.detail],
        ok,
      );
    }
    case "hunt-shell-backdoors": {
      const bend = await tryRunBend(ctx, "files-shell");
      if (bend && bend.findings.length) {
        const files = hitsToFiles(bend.findings);
        return finish(
          ctx,
          startedAt,
          `${files.length} shell/profile backdoor hits (${bend.engine} scorer).`,
          { files, extra: { scorer: bend.engine } },
          hitsToFindings(bend.findings),
          [],
          true,
          bend.engine === "bend" ? "bend" : "linux",
        );
      }
      const { files, findings } = collectShellBackdoors();
      return finish(
        ctx,
        startedAt,
        files.length ? `${files.length} suspicious shell/profile backdoors.` : "No alias/wget|sh/nc plants in rc files.",
        { files, extra: { scorer: bend?.engine ?? "linux" } },
        findings,
        [],
        true,
        bend?.engine === "bend" ? "bend" : "linux",
      );
    }
    case "scan-malware-tools": {
      const clam = await runCmd("which", ["clamscan"]);
      const chk = await runCmd("which", ["chkrootkit"]);
      const present = {
        clamav: clam.code === 0 && !clam.missing,
        chkrootkit: chk.code === 0 && !chk.missing,
      };
      if (dryRun) {
        return finish(ctx, startedAt, `dry-run: clamav=${present.clamav} chkrootkit=${present.chkrootkit}; confirm would install missing then scan /home /tmp /opt.`, {
          extra: { ...present, scanRoots: ["/home", "/tmp", "/opt"], dryRun: true },
        });
      }
      const needed = [
        ...(present.clamav ? [] : ["clamav"]),
        ...(present.chkrootkit ? [] : ["chkrootkit"]),
      ];
      const inst = needed.length ? await installPackages(needed) : { ok: true, detail: "already present", installed: [] as string[] };
      const clamScan = await runCmd(
        "clamscan",
        ["-r", "--infected", "--no-summary", "--exclude-dir=^/sys", "--exclude-dir=^/proc", "--exclude-dir=^/dev", "/home", "/tmp", "/opt"],
        120000,
      );
      const chkScan = await runCmd("chkrootkit", [], 60000);
      const clamHits = clamScan.stdout
        .split(/\r?\n/)
        .filter((l) => /FOUND$/i.test(l))
        .slice(0, 40);
      const chkHits = chkScan.stdout
        .split(/\r?\n/)
        .filter((l) => /INFECTED|Warning/i.test(l))
        .slice(0, 40);
      return finish(
        ctx,
        startedAt,
        `Malware-tool scan: clam hits=${clamHits.length} chkrootkit flags=${chkHits.length}. ${inst.detail}`,
        {
          extra: {
            install: inst,
            clamHits,
            chkHits: chkHits.map((l) => l.slice(0, 200)),
            note: "Local scan only. Unofficial installers were not used.",
          },
        },
        [
          ...clamHits.map((l) => ({
            id: `clam:${l.slice(0, 80)}`,
            severity: "high" as const,
            title: l.slice(0, 120),
            detail: "clamscan FOUND (path only)",
          })),
          ...chkHits.slice(0, 15).map((l) => ({
            id: `chk:${l.slice(0, 80)}`,
            severity: "medium" as const,
            title: l.slice(0, 120),
          })),
        ],
        inst.ok ? [] : [inst.detail],
        true,
      );
    }
    case "round-start-wizard": {
      const { users } = collectLocalUsers();
      const allow = new Set(
        readNameList(resolveConfigFile(ctx.repoRoot, ctx.params.allowlistPath, "config/allowed-users.txt")),
      );
      const extras = users.filter((u) => isHumanAccount(u) && !allow.has(u.name) && u.name !== "root");
      const ufw = await runCmd("ufw", ["status"], 5000);
      const fwOn = /Status:\s+active/i.test(ufw.stdout);
      const items = [
        {
          id: "forensics",
          title: "1. Skim local README / forensics keywords",
          status: "info" as const,
          detail: "Open skim-forensics-readme. CCS is never contacted.",
          relatedOpId: "skim-forensics-readme",
        },
        {
          id: "users",
          title: "2. Sync authorized users from allowlists",
          status: extras.length ? ("fail" as const) : ("pass" as const),
          detail: extras.length
            ? `${extras.length} extra humans vs allowed-users.txt`
            : "Interactive users match the allowlist (still create any missing README names).",
          relatedOpId: "sync-authorized-users",
        },
        {
          id: "passwords",
          title: "3. Password policy + force change at next logon",
          status: "info" as const,
          detail: "enforce-password-policy then force-password-change for README humans.",
          relatedOpId: "enforce-password-policy",
        },
        {
          id: "firewall",
          title: "4. Firewall on, default-deny inbound, logging high",
          status: fwOn ? ("pass" as const) : ("fail" as const),
          detail: fwOn ? "ufw active" : "ufw inactive — enable-firewall, then set-ufw-logging.",
          relatedOpId: "enable-firewall",
        },
        {
          id: "updates",
          title: "5. Security updates",
          status: "info" as const,
          detail: "check-pending-updates then apply-security-updates (confirm).",
          relatedOpId: "apply-security-updates",
        },
        {
          id: "prohibited",
          title: "6. Prohibited software",
          status: "info" as const,
          detail: "find-prohibited-software then remove-package (confirm).",
          relatedOpId: "find-prohibited-software",
        },
      ];
      return finish(
        ctx,
        startedAt,
        `Round-start wizard: ${items.length} sequenced steps. Read-only — open the related op to act. CCS not contacted.`,
        { checklist: items, extra: { ccsContacted: false, sequence: items.map((i) => i.relatedOpId) } },
        items
          .filter((i) => i.status === "fail")
          .map((i) => ({
            id: i.id,
            severity: "high" as const,
            title: i.title,
            detail: i.detail,
            remediationOpId: i.relatedOpId,
          })),
      );
    }
    default:
      return undefined;
  }
}

export type { UserRecord };
