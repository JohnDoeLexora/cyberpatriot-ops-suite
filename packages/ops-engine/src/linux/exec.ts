import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CmdResult {
  stdout: string;
  stderr: string;
  code: number;
  missing: boolean;
}

export async function runCmd(
  cmd: string,
  args: string[] = [],
  timeout = 15000,
  extraEnv?: Record<string, string | undefined>,
): Promise<CmdResult> {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      timeout,
      maxBuffer: 2_000_000,
      env: { ...process.env, ...extraEnv },
    });
    return { stdout: String(stdout), stderr: String(stderr), code: 0, missing: false };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; code?: string | number; message?: string };
    const missing = err.code === "ENOENT";
    const code = typeof err.code === "number" ? err.code : missing ? 127 : 1;
    return {
      stdout: String(err.stdout ?? ""),
      stderr: String(err.stderr ?? err.message ?? ""),
      code,
      missing,
    };
  }
}
