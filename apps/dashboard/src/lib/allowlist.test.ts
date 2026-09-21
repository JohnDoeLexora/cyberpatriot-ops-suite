import { describe, expect, it } from 'vitest'
import { DEFAULT_ADMINS_TEXT, DEFAULT_USERS_TEXT, formatNameList, parseNameList, readTextFile } from './allowlist'

describe('allowlist text format', () => {
  it('parses config/*.txt style lists and ignores comments', () => {
    expect(parseNameList(DEFAULT_USERS_TEXT)).toEqual(['root', 'alice', 'bob', 'coach', 'Administrator'])
    expect(parseNameList(DEFAULT_ADMINS_TEXT)).toEqual(['root', 'alice', 'Administrator'])
  })

  it('skips blanks, duplicates, and password-looking suffixes', () => {
    const text = `# comment\n\nalice\nalice\nbob:Secret123\n  coach  \n`
    expect(parseNameList(text)).toEqual(['alice', 'bob', 'coach'])
  })

  it('round-trips names into a downloadable txt with comments', () => {
    const formatted = formatNameList('users', ['root', 'alice'])
    expect(formatted).toMatch(/^#/)
    expect(parseNameList(formatted)).toEqual(['root', 'alice'])
    expect(formatted).toContain('root\n')
  })

  it('reads an uploaded txt file', async () => {
    const file = new File(['# x\ndave\n'], 'allowed-users.txt', { type: 'text/plain' })
    await expect(readTextFile(file)).resolves.toBe('# x\ndave\n')
  })
})
