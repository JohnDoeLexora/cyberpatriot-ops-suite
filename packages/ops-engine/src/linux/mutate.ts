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
