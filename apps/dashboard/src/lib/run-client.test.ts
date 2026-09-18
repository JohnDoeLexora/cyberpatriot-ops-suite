import { describe, expect, it } from 'vitest'
import { catalog } from '@cyberpatriot/ops-catalog'
import { executeOp } from './run-client'

describe('wired run client', () => {
  it('runs list-users through the demo engine', async () => {
    const { result, source } = await executeOp({ opId: 'list-users', mode: 'demo' })
    expect(source).toBe('demo-fallback')
    expect(result.ok).toBe(true)
    expect(result.mode).toBe('demo')
    expect(result.engine).toBe('demo')
    expect(result.data.users?.length).toBeGreaterThanOrEqual(8)
    expect(result.summary).toMatch(/accounts/i)
  })

  it('produces a demo result for every catalog op', async () => {
    for (const op of catalog) {
      const { result } = await executeOp({
        opId: op.id,
        mode: 'demo',
        params: { username: 'hacker123', service: 'telnet', package: 'nmap' },
      })
      expect(result.opId, op.id).toBe(op.id)
      expect(result.ok, op.id).toBe(true)
      expect(result.engine, op.id).toBe('demo')
      expect(result.summary, op.id).toBeTruthy()
    }
  })
})
