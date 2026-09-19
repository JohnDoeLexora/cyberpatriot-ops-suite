import type { Finding, UserRecord } from "../types.js";

export const STANDARD_SHELLS = new Set([
  "/bin/bash",
  "/usr/bin/bash",
  "/bin/sh",
  "/usr/bin/sh",
  "/bin/dash",
  "/usr/bin/dash",
  "/bin/zsh",
  "/usr/bin/zsh",
  "/bin/ksh",
  "/usr/bin/ksh",
  "/bin/csh",
  "/bin/tcsh",
  "/usr/bin/fish",
  "/usr/sbin/nologin",
  "/sbin/nologin",
  "/usr/bin/nologin",
  "/bin/nologin",
  "/bin/false",
  "/usr/bin/false",
  "/usr/sbin/false",
  "/sbin/false",
  "/usr/bin/git-shell",
  "/bin/sync",
]);

export const INTERACTIVE_SHELLS = new Set([
  "/bin/bash",
  "/usr/bin/bash",
  "/bin/sh",
  "/usr/bin/sh",
  "/bin/dash",
  "/usr/bin/dash",
  "/bin/zsh",
  "/usr/bin/zsh",
  "/bin/ksh",
  "/usr/bin/ksh",
  "/bin/csh",
  "/bin/tcsh",
  "/usr/bin/fish",
]);

export const WELL_KNOWN_SYSTEM = new Set([
  "root",
  "daemon",
  "bin",
  "sys",
  "sync",
  "games",
  "man",
  "lp",
  "mail",
  "news",
  "uucp",
  "proxy",
  "www-data",
  "backup",
  "list",
  "irc",
  "gnats",
  "nobody",
  "systemd-network",
  "systemd-resolve",
  "systemd-timesync",
  "messagebus",
  "syslog",
  "uuidd",
  "sshd",
  "_apt",
  "tss",
  "landscape",
  "pollinate",
  "tcpdump",
  "usbmux",
  "sssd",
  "fwupd-refresh",
  "dhcpcd",
  "polkitd",
  "avahi",
  "colord",
  "geoclue",
  "saned",
  "cups-pk-helper",
  "mysql",
  "postgres",
  "Debian-exim",
  "Administrator",
  "DefaultAccount",
  "WDAGUtilityAccount",
  "LOCAL SERVICE",
  "NETWORK SERVICE",
]);

/** Throwaway / backdoor-ish local names seen on CP images. Not an exploit list. */
export const NAME_PATTERN =
  /^(hacker\d*|toor|flag\d*|pwn(er)?|backdoor|n00b|1337|evil|guest|test\d*|admin\d+|nmap|hydra|rooty|r00t|sploit|shell|bot|unknown|tempadmin|newuser)$/i;

export const PRIVILEGED_GROUPS = new Set([
  "sudo",
  "wheel",
  "admin",
  "administrators",
  "docker",
  "lxd",
  "root",
  "hyper-v administrators",
  "remote desktop users",
  "backup operators",
]);

export interface HeuristicOptions {
  allowlist: Set<string>;
  now: Date;
  recentDays?: number;
}

export const SIGNAL = {
  neverLoggedIn: "never-logged-in",
  nonstandardShell: "nonstandard-shell",
  uidWeirdness: "uid-weirdness",
  homeOutsideHome: "home-outside-home",
  namePattern: "name-pattern",
  recentCreate: "recent-create",
  notInAllowlist: "not-in-allowlist",
  emptyPassword: "empty-password",
  extraAdmin: "extra-admin",
} as const;

export function isInteractiveShell(shell: string | undefined): boolean {
  if (!shell) return false;
  return INTERACTIVE_SHELLS.has(shell);
}

export function isHumanAccount(user: UserRecord): boolean {
  if (user.name === "root" || user.name === "Administrator" || user.name.toLowerCase() === "guest") {
    return true;
  }
  if (user.uid != null && user.uid >= 1000 && user.uid < 65534) return true;
  if (user.uid === 0 && user.name !== "root") return true;
  if (user.uid === 666 || user.uid === 1337) return true;
  if (user.shell && !STANDARD_SHELLS.has(user.shell)) return true;
  if (user.platform === "windows" && user.enabled !== false && !WELL_KNOWN_SYSTEM.has(user.name)) {
    return true;
  }
  if (WELL_KNOWN_SYSTEM.has(user.name) && !isInteractiveShell(user.shell)) return false;
  if (isInteractiveShell(user.shell)) return true;
  return false;
}

export function scoreUser(user: UserRecord, options: HeuristicOptions): UserRecord {
  const signals: string[] = [];
  let score = 0;
  const human = isHumanAccount(user);
  const allowlisted = options.allowlist.has(user.name);

  if (human && !user.lastLogin) {
    signals.push(SIGNAL.neverLoggedIn);
    score += 10;
  }

  if (user.shell && !STANDARD_SHELLS.has(user.shell)) {
    signals.push(SIGNAL.nonstandardShell);
    score += 15;
  } else if (human && user.shell && !isInteractiveShell(user.shell) && user.name !== "root") {
    // nologin on a human account is a bit odd but often intentional after hardening
  } else if (
    user.uid != null &&
    user.uid < 1000 &&
    user.name !== "root" &&
    isInteractiveShell(user.shell)
  ) {
    signals.push(SIGNAL.nonstandardShell);
    score += 12;
  }

  if (user.uid === 0 && user.name !== "root") {
    signals.push(SIGNAL.uidWeirdness);
    score += 40;
  } else if (
    user.uid != null &&
    user.uid > 0 &&
    user.uid < 1000 &&
    isInteractiveShell(user.shell) &&
    !WELL_KNOWN_SYSTEM.has(user.name)
  ) {
    signals.push(SIGNAL.uidWeirdness);
    score += 18;
  } else if (user.uid === 666 || user.uid === 1337) {
    signals.push(SIGNAL.uidWeirdness);
    score += 16;
  }

  if (human && user.home) {
    const expected =
      user.name === "root"
        ? user.home === "/root"
        : user.home === `/home/${user.name}` || user.home.toLowerCase().includes("\\users\\");
    const inHomeTree =
      user.home.startsWith("/home/") ||
      user.home === "/root" ||
      /\\users\\/i.test(user.home);
    if (!expected && !inHomeTree) {
      signals.push(SIGNAL.homeOutsideHome);
      score += 15;
    } else if (human && user.name !== "root" && !inHomeTree) {
      signals.push(SIGNAL.homeOutsideHome);
      score += 15;
    }
  }

  if (NAME_PATTERN.test(user.name) || /[0-9]{3,}/.test(user.name) && /hack|pwn|flag/i.test(user.name)) {
    signals.push(SIGNAL.namePattern);
    score += 20;
  }

  if (user.createdAt) {
    const created = Date.parse(user.createdAt);
    const days = options.recentDays ?? 7;
    if (!Number.isNaN(created)) {
      const ageMs = options.now.getTime() - created;
      if (ageMs >= 0 && ageMs <= days * 86400000 && human) {
        signals.push(SIGNAL.recentCreate);
        score += 10;
      }
    }
  }

  if (human && !allowlisted && user.name !== "root" && user.name !== "Administrator") {
    signals.push(SIGNAL.notInAllowlist);
    score += 25;
  }

  if (user.passwordEmpty) {
    signals.push(SIGNAL.emptyPassword);
    score += 35;
  }

  const privileged = user.groups.some((g) => PRIVILEGED_GROUPS.has(g.toLowerCase()));
  if (privileged && !allowlisted && user.name !== "root" && user.name !== "Administrator") {
    signals.push(SIGNAL.extraAdmin);
    score += 20;
  }

  return {
    ...user,
    interactive: human,
    suspicionScore: Math.min(100, score),
    signals,
  };
}

export function scoreUsers(users: UserRecord[], options: HeuristicOptions): UserRecord[] {
  const uidCounts = new Map<number, number>();
  for (const user of users) {
    if (user.uid == null) continue;
    uidCounts.set(user.uid, (uidCounts.get(user.uid) ?? 0) + 1);
  }
  return users.map((user) => {
    const scored = scoreUser(user, options);
    if (user.uid != null && (uidCounts.get(user.uid) ?? 0) > 1 && user.name !== "root") {
      const signals = new Set(scored.signals ?? []);
      signals.add(SIGNAL.uidWeirdness);
      const bonus = user.uid === 0 ? 0 : 18;
      return {
        ...scored,
        signals: [...signals],
        suspicionScore: Math.min(100, (scored.suspicionScore ?? 0) + bonus),
      };
    }
    return scored;
  });
}

export interface UnauthorizedSelection {
  unauthorized: UserRecord[];
  extraAdmins: UserRecord[];
  missingAllowlist: string[];
  names: string[];
}

/** Bulk-select interactive allowlist misses + extra admins. Service nologin accounts stay out. */
export function selectUnauthorizedUsers(
  users: UserRecord[],
  allowlist: Set<string> = new Set(),
): UnauthorizedSelection {
  const unauthorized = users.filter(
    (u) =>
      (u.signals ?? []).includes(SIGNAL.notInAllowlist) &&
      (u.interactive || u.name.toLowerCase() === "guest"),
  );
  const extraAdmins = users.filter((u) => (u.signals ?? []).includes(SIGNAL.extraAdmin));
  const present = new Set(users.map((u) => u.name));
  const missingAllowlist = [...allowlist].filter((n) => n && !present.has(n));
  const names = [...new Set([...unauthorized.map((u) => u.name), ...extraAdmins.map((u) => u.name)])];
  return { unauthorized, extraAdmins, missingAllowlist, names };
}

export function selectUnauthorizedUsersWithAllowlist(
  users: UserRecord[],
  allowlist: Set<string>,
): UnauthorizedSelection {
  return selectUnauthorizedUsers(users, allowlist);
}

export function findingsFromUnauthorized(sel: UnauthorizedSelection): Finding[] {
  const findings: Finding[] = [];
  for (const user of sel.unauthorized) {
    const extra = (user.signals ?? []).includes(SIGNAL.extraAdmin);
    findings.push({
      id: `unauth:${user.name}`,
      severity: extra || user.uid === 0 ? "critical" : "high",
      title: `Allowlist miss: ${user.name}`,
      detail: `${user.name} is interactive and not in allowed-users.txt (${(user.signals ?? []).join(", ") || "not-in-allowlist"}).`,
      resource: user.name,
      score: user.suspicionScore,
      signals: user.signals,
      remediationOpId: extra ? "remove-user-from-admins" : "disable-user",
    });
  }
  for (const user of sel.extraAdmins) {
    if (sel.unauthorized.some((u) => u.name === user.name)) continue;
    findings.push({
      id: `admin:${user.name}`,
      severity: "high",
      title: `Extra admin: ${user.name}`,
      detail: "Privileged group member not justified by the allowlist.",
      resource: user.name,
      score: user.suspicionScore,
      signals: user.signals,
      remediationOpId: "remove-user-from-admins",
    });
  }
  for (const name of sel.missingAllowlist) {
    findings.push({
      id: `missing:${name}`,
      severity: "medium",
      title: `Allowlist user missing from image: ${name}`,
      detail: "README-promised account is not present. Do not invent it unless the README requires creating it.",
      resource: name,
    });
  }
  findings.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return findings;
}

export function findingsFromUsers(users: UserRecord[]): Finding[] {
  const findings: Finding[] = [];
  for (const user of users) {
    const score = user.suspicionScore ?? 0;
    if (score < 10) continue;
    const severity =
      score >= 50 ? "critical" : score >= 35 ? "high" : score >= 20 ? "medium" : "low";
    findings.push({
      id: `user:${user.name}`,
      severity,
      title: `Suspicious account ${user.name}`,
      detail: `${user.name} scored ${score}/100 (${(user.signals ?? []).join(", ") || "mixed signals"}).`,
      resource: user.name,
      score,
      signals: user.signals,
      remediationOpId: user.groups.some((g) => PRIVILEGED_GROUPS.has(g.toLowerCase()))
        ? "remove-user-from-admins"
        : "disable-user",
    });
  }
  findings.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return findings;
}
