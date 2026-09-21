import { describe, expect, it } from 'vitest'
import { PLAYLISTS, catalog, isBeginnerOp } from '@cyberpatriot/ops-catalog'
import { CATEGORIES, ENGINE_OPS, filterOps, LEGACY_OP_IDS, migrateOpId, OPS } from './ops'

describe('ops catalog', () => {
  it('surfaces every typed catalog op plus team panes', () => {
    expect(ENGINE_OPS.length).toBe(catalog.length)
    expect(catalog.length).toBeGreaterThanOrEqual(70)
    expect(OPS.length).toBe(catalog.length + 3)
    for (const cat of CATEGORIES) {
      expect(OPS.some((op) => op.category === cat.id), cat.id).toBe(true)
    }
  })

  it('filters by title, keyword, and id', () => {
    const ssh = filterOps('ssh')
    expect(ssh.some((op) => op.id === 'ssh-hardening-audit')).toBe(true)
    expect(ssh.length).toBeLessThan(OPS.length)

    const uid = filterOps('uid 0')
    expect(uid.some((op) => op.id === 'audit-uid-zero')).toBe(true)

    expect(filterOps('no-such-op-xyz')).toEqual([])
  })

  it('playlists only name catalog engine ops', () => {
    expect(PLAYLISTS.map((p) => p.id)).toEqual([
      'linux-starter',
      'windows-starter',
      'linux-deep',
      'windows-deep',
      'forensics-first',
    ])
    for (const pl of PLAYLISTS) {
      for (const step of pl.steps) {
        expect(ENGINE_OPS.some((op) => op.id === step.opId), `${pl.id}:${step.opId}`).toBe(true)
      }
    }
    expect(isBeginnerOp('list-users')).toBe(true)
    expect(isBeginnerOp('audit-iis')).toBe(false)
  })

  it('maps the old dotted ids onto the typed catalog', () => {
    expect(migrateOpId('users.list')).toBe('list-users')
    expect(migrateOpId('users.flag-suspicious')).toBe('flag-suspicious-users')
    expect(migrateOpId('auth.ssh-harden')).toBe('ssh-hardening-audit')
    expect(migrateOpId('net.firewall-apply')).toBe('apply-default-deny-inbound')
    expect(Object.keys(LEGACY_OP_IDS).length).toBeGreaterThanOrEqual(40)
  })
})
