import { describe, expect, it } from 'vitest'
import { explainRunError, summarizeOpResult } from './adapt-result'
import type { OpResult } from '../catalog/types'

function result(partial: Partial<OpResult>): OpResult {
  return {
    summary: partial.summary ?? '',
    findings: partial.findings ?? [],
    tables: partial.tables,
    checklist: partial.checklist,
  }
}

describe('summarizeOpResult', () => {
  it('says when every checklist item passed', () => {
    const checklist = Array.from({ length: 14 }, (_, i) => ({
      id: `c${i}`,
      label: `Check ${i}`,
      status: 'pass' as const,
    }))
    const summary = summarizeOpResult(result({ checklist }))
    expect(summary.headline).toBe('All 14 checks passed')
    expect(summary.tone).toBe('clear')
    expect(summary.chips[0]).toMatchObject({ severity: 'ok', count: 14 })
  })

  it('counts checklist items that need attention', () => {
    const summary = summarizeOpResult(
      result({
        checklist: [
          { id: 'a', label: 'Firewall', status: 'fail' },
          { id: 'b', label: 'SSH', status: 'warn' },
          { id: 'c', label: 'Users', status: 'pass' },
        ],
        findings: [{ id: 'f', severity: 'crit', title: 'Firewall off', detail: '' }],
      }),
    )
    expect(summary.headline).toBe('2 of 3 checks need attention')
    expect(summary.tone).toBe('urgent')
    expect(summary.chips.find((chip) => chip.severity === 'crit')?.count).toBe(1)
  })

  it('leads with suspicious users when an accounts table has findings', () => {
    const summary = summarizeOpResult(
      result({
        summary: 'Heuristic pack flagged 3 accounts.',
        findings: [
          { id: '1', severity: 'crit', title: 'Suspicious account toor', detail: 'uid 0' },
          { id: '2', severity: 'warn', title: 'Suspicious account zygote', detail: 'shell' },
          { id: '3', severity: 'warn', title: 'Suspicious account guest', detail: 'guest' },
        ],
        tables: [
          {
            title: 'Accounts',
            columns: [{ key: 'name', label: 'User' }],
            rows: [{ name: 'toor' }, { name: 'zygote' }, { name: 'guest' }],
          },
        ],
      }),
    )
    expect(summary.headline).toBe('3 suspicious users found')
    expect(summary.tone).toBe('urgent')
    expect(summary.chips.map((chip) => chip.severity)).toEqual(['crit', 'warn'])
  })

  it('says how many services should be disabled', () => {
    const summary = summarizeOpResult(
      result({
        tables: [
          {
            title: 'Services',
            columns: [{ key: 'name', label: 'Service' }, { key: 'note', label: 'Note' }],
            rows: [
              { name: 'sshd', note: 'required' },
              { name: 'telnet', note: 'risky' },
              { name: 'vsftpd', note: 'risky' },
            ],
          },
        ],
      }),
    )
    expect(summary.headline).toBe('2 services should be disabled')
    expect(summary.tone).toBe('watch')
  })

  it('uses the singular when one service is risky', () => {
    const summary = summarizeOpResult(
      result({
        tables: [
          {
            title: 'Services',
            columns: [{ key: 'note', label: 'Note' }],
            rows: [{ note: 'risky' }],
          },
        ],
      }),
    )
    expect(summary.headline).toBe('1 service should be disabled')
  })

  it('lists accounts with a clear chip when nothing is suspicious', () => {
    const summary = summarizeOpResult(
      result({
        summary: 'Demo inventory of 4 local accounts (hashes omitted).',
        tables: [
          {
            title: 'Accounts',
            columns: [{ key: 'name', label: 'User' }],
            rows: [{ name: 'root' }, { name: 'alice' }, { name: 'bob' }, { name: 'coach' }],
          },
        ],
      }),
    )
    expect(summary.headline).toBe('4 accounts listed')
    expect(summary.tone).toBe('info')
    expect(summary.chips[0]).toMatchObject({ severity: 'ok', label: 'clear', count: 4 })
  })

  it('distinguishes an empty result from a passed checklist', () => {
    const summary = summarizeOpResult(result({ summary: 'No rows.', tables: [], findings: [] }))
    expect(summary.headline).toBe('Nothing found')
    expect(summary.tone).toBe('empty')
    expect(summary.chips).toEqual([])
  })

  it('counts unexpected ports, flagged files, and banned packages', () => {
    expect(
      summarizeOpResult(
        result({
          tables: [
            {
              title: 'Listening ports',
              columns: [{ key: 'note', label: 'Note' }],
              rows: [{ note: 'expected' }, { note: 'unexpected' }, { note: 'Telnet in the clear' }],
            },
          ],
        }),
      ).headline,
    ).toBe('2 unexpected ports found')

    expect(
      summarizeOpResult(
        result({
          tables: [
            {
              title: 'Files',
              columns: [{ key: 'note', label: 'Note' }],
              rows: [{ note: 'SUID' }],
            },
          ],
        }),
      ).headline,
    ).toBe('1 file needs a closer look')

    expect(
      summarizeOpResult(
        result({
          tables: [
            {
              title: 'Software',
              columns: [{ key: 'note', label: 'Note' }],
              rows: [{ note: 'banned' }, { note: '' }],
            },
          ],
        }),
      ).headline,
    ).toBe('1 banned package found')
  })

  it('falls back to the finding count', () => {
    const summary = summarizeOpResult(
      result({
        findings: [
          { id: 'a', severity: 'info', title: 'Note', detail: 'detail' },
          { id: 'b', severity: 'info', title: 'Other', detail: 'detail' },
        ],
      }),
    )
    expect(summary.headline).toBe('2 findings to review')
    expect(summary.chips[0]).toMatchObject({ severity: 'info', label: 'notes', count: 2 })
  })
})

describe('explainRunError', () => {
  it('maps a dead engine to a next step', () => {
    const copy = explainRunError('TypeError: Failed to fetch')
    expect(copy.what).toMatch(/local engine/i)
    expect(copy.tryNext).toMatch(/Practice data/i)
  })

  it('keeps a generic failure calm', () => {
    const copy = explainRunError('usermod failed')
    expect(copy.what).toMatch(/did not finish/i)
    expect(copy.tryNext).toMatch(/Practice data/i)
  })
})
