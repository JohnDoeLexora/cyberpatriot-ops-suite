import { describe, expect, it } from 'vitest'
import { OPS } from '../catalog/ops'
import { SEED_GROUPS, seedUsers } from './users'
import { DEFAULT_FIREWALL, runMockOp } from './engine'

describe('mock engine', () => {
  it('has a runner for every catalog op', async () => {
    const users = seedUsers()
    for (const op of OPS) {
      const result = await runMockOp(op.id, {
        demoMode: true,
        users,
        groups: SEED_GROUPS,
        firewall: DEFAULT_FIREWALL,
        notes: '',
        favorites: [],
        journalCount: 0,
        preflightDone: 0,
        preflightTotal: 12,
        applyUsers: () => {},
        applyFirewall: () => {},
      })
      expect(result.summary, op.id).toBeTruthy()
      expect(result.summary, op.id).not.toMatch(/No mock runner/)
      expect(result.findings.length, op.id).toBeGreaterThan(0)
    }
  })
})
