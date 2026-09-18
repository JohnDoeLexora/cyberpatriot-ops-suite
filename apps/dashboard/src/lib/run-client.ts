import { getOp } from '@cyberpatriot/ops-catalog'
import { demoNow, runDemo, type RunMode, type RunResult } from '@cyberpatriot/ops-engine/demo'

export type EngineSource = 'api' | 'demo-fallback' | 'offline'

export function apiBase(): string {
  const env = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (env) return env.replace(/\/$/, '')
  return ''
}

export async function fetchHealth(): Promise<{ ok: boolean; ops?: number; catalogVersion?: string } | null> {
  try {
    const res = await fetch(`${apiBase()}/health`, { signal: AbortSignal.timeout(2500) })
    if (!res.ok) return null
    return (await res.json()) as { ok: boolean; ops?: number; catalogVersion?: string }
  } catch {
    return null
  }
}

function demoResult(opId: string, params: Record<string, unknown>, confirm: boolean): RunResult {
  const op = getOp(opId)
  if (!op) {
    return {
      opId,
      title: opId,
      category: 'evidence',
      platforms: 'both',
      risk: 'read',
      mode: 'demo',
      ok: false,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      summary: `Unknown operation '${opId}'`,
      findings: [],
      data: {},
      warnings: [`Op not in catalog: ${opId}`],
      engine: 'none',
    }
  }
  return runDemo({
    repoRoot: '',
    now: demoNow(),
    params,
    confirm,
    op,
    mode: 'demo',
  })
}

export async function executeOp(input: {
  opId: string
  mode: RunMode
  params?: Record<string, unknown>
  confirm?: boolean
}): Promise<{ result: RunResult; source: EngineSource }> {
  const params = input.params ?? {}
  const confirm = input.confirm === true
  const mode: RunMode = input.mode === 'live' ? 'live' : 'demo'
  const skipApi = import.meta.env.MODE === 'test' && !import.meta.env.VITE_API_URL

  if (skipApi && mode === 'demo') {
    return { result: demoResult(input.opId, params, confirm), source: 'demo-fallback' }
  }

  try {
    const res = await fetch(`${apiBase()}/ops/${encodeURIComponent(input.opId)}/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode, params, confirm }),
      signal: AbortSignal.timeout(mode === 'live' ? 120_000 : 20_000),
    })
    const body = (await res.json().catch(() => null)) as RunResult | { ok?: boolean; error?: string } | null
    if (body && typeof body === 'object' && 'opId' in body && 'summary' in body) {
      return { result: body as RunResult, source: 'api' }
    }
    if (mode === 'live') {
      const message =
        body && typeof body === 'object' && 'error' in body && body.error
          ? String(body.error)
          : `API ${res.status}. Start it with npm run dev (the dashboard mounts it) or npm run dev:api.`
      throw new Error(message)
    }
  } catch (err) {
    if (mode === 'live') throw err
  }

  return { result: demoResult(input.opId, params, confirm), source: 'demo-fallback' }
}
