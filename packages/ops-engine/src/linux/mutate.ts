import { isSafeUsername } from "../safety.js";
import { runCmd } from "./exec.js";

export async function lockUser(username: string): Promise<{ ok: boolean; detail: string }> {
  if (!isSafeUsername(username)) return { ok: false, detail: "Unsafe username rejected" };
  const result = await runCmd("usermod", ["-L", username]);
  if (result.code !== 0) {
    const fallback = await runCmd("passwd", ["-l", username]);
    if (fallback.code !== 0) {
      return { ok: false, detail: result.stderr || fallback.stderr || "usermod/passwd failed (need root?)" };
    }
  }
  return { ok: true, detail: `Locked password for ${username}` };
}

export async function disableUser(username: string): Promise<{ ok: boolean; detail: string }> {
  if (!isSafeUsername(username)) return { ok: false, detail: "Unsafe username rejected" };
  const lock = await lockUser(username);
  const shell = await runCmd("usermod", ["-s", "/usr/sbin/nologin", username]);
  if (!lock.ok && shell.code !== 0) {
    return { ok: false, detail: `${lock.detail}; ${shell.stderr}` };
  }
  return { ok: true, detail: `Disabled ${username} (lock + nologin). Home left in place for forensics.` };
}

export async function removeFromSudo(username: string): Promise<{ ok: boolean; detail: string }> {
  if (!isSafeUsername(username)) return { ok: false, detail: "Unsafe username rejected" };
  const gpasswd = await runCmd("gpasswd", ["-d", username, "sudo"]);
  const wheel = await runCmd("gpasswd", ["-d", username, "wheel"]);
  if (gpasswd.code !== 0 && wheel.code !== 0) {
    return { ok: false, detail: gpasswd.stderr || wheel.stderr || "gpasswd failed" };
  }
  return { ok: true, detail: `Removed ${username} from sudo/wheel (whichever existed)` };
}

export async function expirePassword(username: string): Promise<{ ok: boolean; detail: string }> {
  if (!isSafeUsername(username)) return { ok: false, detail: "Unsafe username rejected" };
  const result = await runCmd("chage", ["-d", "0", username]);
  if (result.code !== 0) return { ok: false, detail: result.stderr || "chage failed" };
  return { ok: true, detail: `Expired password for ${username}` };
}

export async function disableService(service: string): Promise<{ ok: boolean; detail: string }> {
  if (!/^[A-Za-z0-9:_.@+-]+$/.test(service)) return { ok: false, detail: "Unsafe service name rejected" };
  const stop = await runCmd("systemctl", ["disable", "--now", service]);
  if (stop.code !== 0) return { ok: false, detail: stop.stderr || "systemctl disable failed (need root?)" };
  return { ok: true, detail: `Disabled ${service}` };
}

export async function enableUfw(): Promise<{ ok: boolean; detail: string }> {
  const result = await runCmd("ufw", ["--force", "enable"]);
  if (result.code !== 0) return { ok: false, detail: result.stderr || "ufw enable failed" };
  return { ok: true, detail: "ufw enabled" };
}

export async function ufwDefaultDeny(): Promise<{ ok: boolean; detail: string }> {
  const incoming = await runCmd("ufw", ["default", "deny", "incoming"]);
  const outgoing = await runCmd("ufw", ["default", "allow", "outgoing"]);
  if (incoming.code !== 0) return { ok: false, detail: incoming.stderr };
  return { ok: true, detail: `default deny incoming (${outgoing.code === 0 ? "allow outgoing" : "outgoing unchanged"})` };
}

export async function removePackage(name: string): Promise<{ ok: boolean; detail: string }> {
  if (!/^[A-Za-z0-9.+_-]+$/.test(name)) return { ok: false, detail: "Unsafe package name rejected" };
  const apt = await runCmd("apt-get", ["remove", "-y", name], 120000);
  if (apt.code === 0) return { ok: true, detail: `Removed ${name}` };
  const dnf = await runCmd("dnf", ["remove", "-y", name], 120000);
  if (dnf.code === 0) return { ok: true, detail: `Removed ${name}` };
  return { ok: false, detail: apt.stderr || dnf.stderr || "package remove failed" };
}

export async function createUserNoPassword(
  username: string,
): Promise<{ ok: boolean; detail: string; setPasswordManually: boolean }> {
  if (!isSafeUsername(username)) {
    return { ok: false, detail: "Unsafe username rejected", setPasswordManually: false };
  }
  const result = await runCmd("useradd", ["-m", "-s", "/bin/bash", username]);
  if (result.code !== 0 && !/already exists/i.test(result.stderr)) {
    return { ok: false, detail: result.stderr || "useradd failed (need root?)", setPasswordManually: false };
  }
  return {
    ok: true,
    detail: `Created ${username} without a password. Set one manually with: passwd ${username}`,
    setPasswordManually: true,
  };
}

export async function addToSudo(username: string): Promise<{ ok: boolean; detail: string }> {
  if (!isSafeUsername(username)) return { ok: false, detail: "Unsafe username rejected" };
  const sudo = await runCmd("usermod", ["-aG", "sudo", username]);
  if (sudo.code === 0) return { ok: true, detail: `Added ${username} to sudo` };
  const wheel = await runCmd("usermod", ["-aG", "wheel", username]);
  if (wheel.code === 0) return { ok: true, detail: `Added ${username} to wheel` };
  return { ok: false, detail: sudo.stderr || wheel.stderr || "usermod -aG sudo/wheel failed" };
}

export async function installPackages(names: string[]): Promise<{ ok: boolean; detail: string; installed: string[] }> {
  const safe = names.filter((n) => /^[A-Za-z0-9.+_-]+$/.test(n));
  if (!safe.length) return { ok: false, detail: "No safe package names", installed: [] };
  const apt = await runCmd("apt-get", ["install", "-y", ...safe], 180000, { DEBIAN_FRONTEND: "noninteractive" });
  if (apt.code === 0) return { ok: true, detail: `Installed ${safe.join(", ")}`, installed: safe };
  const dnf = await runCmd("dnf", ["install", "-y", ...safe], 180000);
  if (dnf.code === 0) return { ok: true, detail: `Installed ${safe.join(", ")}`, installed: safe };
  return {
    ok: false,
    detail: apt.stderr || dnf.stderr || "package install failed (repo unavailable?)",
    installed: [],
  };
}
