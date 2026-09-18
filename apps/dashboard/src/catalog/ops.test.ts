import { describe, expect, it } from 'vitest'
import { CATEGORIES, filterOps, OPS } from './ops'

describe('ops catalog', () => {
  it('has at least 40 operations across every category', () => {
    expect(OPS.length).toBeGreaterThanOrEqual(40)
    for (const cat of CATEGORIES) {
      expect(OPS.some((op) => op.category === cat.id), cat.id).toBe(true)
    }
  })

  it('filters by title, keyword, and id', () => {
    const ssh = filterOps('ssh')
    expect(ssh.some((op) => op.id === 'auth.ssh-harden')).toBe(true)
    expect(ssh.length).toBeLessThan(OPS.length)

    const uid = filterOps('uid 0')
    expect(uid.some((op) => op.id === 'users.uid0')).toBe(true)

    expect(filterOps('no-such-op-xyz')).toEqual([])
  })
})
