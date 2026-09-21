import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './state/persist'

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('cp-ops.workspace.v1')
})

describe('dashboard shell', () => {
  it('filters the operations catalog', async () => {
    const user = userEvent.setup()
    render(<App />)
    const search = screen.getByTestId('catalog-search')
    await user.clear(search)
    await user.type(search, 'ssh')
    expect(screen.getByTestId('catalog-item-ssh-hardening-audit')).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-item-list-users')).not.toBeInTheDocument()
    const count = screen.getByTestId('catalog-count').textContent ?? ''
    expect(count).toMatch(/^\d+\/\d+$/)
    const [shown, total] = count.split('/')
    expect(Number(total)).toBeGreaterThanOrEqual(73)
    expect(shown).not.toBe(total)
  })

  it('opens three panes from the catalog', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getAllByTestId('pane')).toHaveLength(1)
    await user.click(screen.getByTestId('catalog-item-list-users'))
    await user.click(screen.getByTestId('catalog-item-flag-suspicious-users'))
    await user.click(screen.getByTestId('catalog-item-ssh-hardening-audit'))
    await waitFor(() => {
      expect(screen.getAllByTestId('pane')).toHaveLength(3)
    })
    expect(screen.getByTestId('pane-count')).toHaveTextContent('3 panes')
  })

  it('runs a wired demo op and updates pane status', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('catalog-item-list-users'))
    const pane = screen.getAllByTestId('pane')[0]
    const run = within(pane).getByTestId('run-op')
    await user.click(run)
    await waitFor(() => {
      expect(within(pane).getByTestId('run-status')).toHaveAttribute('data-status', 'done')
    })
    expect(within(pane).getByTestId('op-output')).toHaveTextContent(/accounts/i)
  })

  it('opens how-to from an op panel and searches titles plus body', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('catalog-item-list-users'))
    const pane = screen.getAllByTestId('pane')[0]
    await user.click(within(pane).getByTestId('howto-button'))
    const drawer = screen.getByTestId('howto-drawer')
    expect(drawer).toHaveTextContent(/List local users/i)
    expect(drawer).toHaveTextContent(/password hashes are never listed/i)
    const search = screen.getByTestId('howto-search')
    await user.clear(search)
    await user.type(search, 'PermitRootLogin')
    expect(screen.getByTestId('howto-result-ssh-hardening-audit')).toBeInTheDocument()
    expect(screen.getByTestId('howto-result-disable-root-ssh')).toBeInTheDocument()
    expect(screen.queryByTestId('howto-result-list-users')).not.toBeInTheDocument()
  })

  it('how-to follows the pane that opened it in a multi-pane layout', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('catalog-item-list-users'))
    await user.click(screen.getByTestId('catalog-item-ssh-hardening-audit'))
    const panes = screen.getAllByTestId('pane')
    expect(panes).toHaveLength(2)
    await user.click(within(panes[1]!).getByTestId('howto-button'))
    expect(screen.getByTestId('howto-article')).toHaveAttribute('data-op-id', 'ssh-hardening-audit')
    expect(screen.getByTestId('howto-drawer')).toHaveTextContent(/PermitRootLogin/)
    await user.click(screen.getByTestId('howto-close'))
    expect(screen.queryByTestId('howto-drawer')).not.toBeInTheDocument()
    await user.click(within(panes[0]!).getByTestId('howto-button'))
    expect(screen.getByTestId('howto-article')).toHaveAttribute('data-op-id', 'list-users')
    expect(screen.getByTestId('howto-drawer')).toHaveTextContent(/password hashes are never listed/i)
  })

  it('flags a user from the hover action and shows a toast', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('catalog-item-list-users'))
    const row = screen.getByTestId('user-row-coach')
    await user.hover(row)
    await user.click(screen.getByTestId('action-flag-coach'))
    expect(await screen.findByTestId('toasts')).toHaveTextContent(/Flagged coach/i)
    expect(row).toHaveTextContent('flag')
  })

  it('asks for confirmation before a live mutation', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('demo-toggle'))
    expect(screen.getByTestId('mode-label')).toHaveTextContent('this computer')
    await user.click(screen.getByTestId('catalog-item-enable-firewall'))
    const pane = screen.getAllByTestId('pane')[0]
    await user.click(within(pane).getByTestId('run-op'))
    expect(await screen.findByTestId('confirm-dialog')).toHaveTextContent(/Change this computer/i)
  })

  it('uses a paper-white shell', () => {
    render(<App />)
    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-theme', 'paper')
  })

  it('opens four panes as a 2×2 grid, not tabs', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('catalog-item-list-users'))
    await user.click(screen.getByTestId('catalog-item-flag-suspicious-users'))
    expect(screen.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'mosaic')
    await user.click(screen.getByTestId('catalog-item-ssh-hardening-audit'))
    await waitFor(() => {
      expect(screen.getAllByTestId('pane')).toHaveLength(3)
    })
    expect(screen.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'mosaic')
    expect(screen.queryByTestId('pane-tabs')).not.toBeInTheDocument()
    await user.click(screen.getByTestId('catalog-item-apply-default-deny-inbound'))
    await waitFor(() => {
      expect(screen.getAllByTestId('pane')).toHaveLength(4)
    })
    expect(screen.getByTestId('mosaic')).toHaveAttribute('data-mosaic-grid', '2x2')
    expect(screen.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'mosaic')
    expect(screen.queryByTestId('pane-tabs')).not.toBeInTheDocument()
    expect(screen.getByTestId('pane-count')).toHaveTextContent('4 panes')
  })

  it('hides advanced checks in beginner mode until Show advanced', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-beginner', 'true')
    expect(screen.getByTestId('catalog-item-list-users')).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-item-audit-iis')).not.toBeInTheDocument()
    await user.click(screen.getByTestId('show-advanced'))
    expect(screen.getByTestId('catalog-item-audit-iis')).toBeInTheDocument()
    await user.click(screen.getByTestId('beginner-toggle'))
    expect(screen.getByTestId('app-shell')).toHaveAttribute('data-beginner', 'false')
    expect(screen.getByTestId('catalog-item-audit-iis')).toBeInTheDocument()
  })

  it('runs the next playlist step through the engine', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByTestId('playlist-panel')).toHaveAttribute('data-playlist-id', 'linux-starter')
    expect(screen.getByTestId('empty-playlist-linux-starter')).toBeInTheDocument()
    await user.click(screen.getByTestId('playlist-run-next'))
    const pane = await screen.findByTestId('pane')
    await waitFor(() => {
      expect(within(pane).getByTestId('run-status')).toHaveAttribute('data-status', 'done')
    })
    expect(pane).toHaveAttribute('data-op-id', 'skim-forensics-readme')
    expect(screen.getByTestId('playlist-progress')).toHaveTextContent('1/')
    expect(screen.getByTestId('playlist-step-skim-forensics-readme')).toHaveAttribute('data-status', 'done')
    expect(screen.getByTestId('coach-tip')).toHaveTextContent(/forensics/i)
    await user.click(screen.getByTestId('playlist-howto-list-users'))
    expect(screen.getByTestId('howto-article')).toHaveAttribute('data-op-id', 'list-users')
  })

  it('playlist run-all runs existing demo ops', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.selectOptions(screen.getByTestId('playlist-select'), 'forensics-first')
    expect(screen.getByTestId('playlist-panel')).toHaveAttribute('data-playlist-id', 'forensics-first')
    await user.click(screen.getByTestId('playlist-run-all'))
    await waitFor(
      () => {
        expect(screen.getByTestId('playlist-progress')).toHaveTextContent('11/11')
      },
      { timeout: 15_000 },
    )
    expect(screen.getByTestId('playlist-step-export-evidence-bundle')).toHaveAttribute('data-status', 'done')
    expect(screen.getByTestId('pane')).toHaveAttribute('data-op-id', 'export-evidence-bundle')
  })

  it('playlist run next confirms live mutations', async () => {
    const user = userEvent.setup()
    render(<App />)
    for (let i = 0; i < 5; i++) {
      const next = screen.getByTestId('playlist-run-next')
      await waitFor(() => expect(next).not.toBeDisabled())
      await user.click(next)
    }
    await waitFor(() => expect(screen.getByTestId('playlist-run-next')).not.toBeDisabled())
    expect(screen.getByTestId('playlist-step-list-admin-users')).toHaveAttribute('data-status', 'done')
    expect(screen.getByTestId('playlist-step-disable-guest-account')).toHaveAttribute('data-status', 'idle')
    await user.click(screen.getByTestId('demo-toggle'))
    expect(screen.getByTestId('mode-label')).toHaveTextContent('this computer')
    await user.click(screen.getByTestId('playlist-run-next'))
    expect(await screen.findByTestId('confirm-dialog')).toHaveTextContent(/Change this computer/i)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('playlist-step-disable-guest-account')).toHaveAttribute('data-status', 'idle')
  })

  it('edits allowlists in localStorage and accepts uploaded txt', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.click(screen.getByTestId('allowlist-open'))
    const editor = screen.getByTestId('allowlist-editor')
    expect(editor).toHaveTextContent(/allowed-users\.txt/)
    fireEvent.change(screen.getByTestId('allowlist-users'), {
      target: { value: '# README\nalice\nbob\ndave\n' },
    })
    await user.click(screen.getByTestId('allowlist-close'))
    expect(screen.queryByTestId('allowlist-editor')).not.toBeInTheDocument()
    unmount()
    render(<App />)
    await user.click(screen.getByTestId('allowlist-open'))
    expect(screen.getByTestId('allowlist-users')).toHaveValue('# README\nalice\nbob\ndave\n')
    const file = new File(['# uploaded\nroot\ncoach\n'], 'allowed-users.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByTestId('allowlist-users-file'), { target: { files: [file] } })
    await waitFor(() => {
      expect(screen.getByTestId('allowlist-users')).toHaveValue('# uploaded\nroot\ncoach\n')
    })
  })

  it('tabs from the fifth pane', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('catalog-item-list-users'))
    await user.click(screen.getByTestId('catalog-item-flag-suspicious-users'))
    await user.click(screen.getByTestId('catalog-item-ssh-hardening-audit'))
    await user.click(screen.getByTestId('catalog-item-apply-default-deny-inbound'))
    await user.click(screen.getByTestId('catalog-item-enable-firewall'))
    await waitFor(() => {
      expect(screen.getAllByTestId('pane')).toHaveLength(5)
    })
    expect(screen.getByTestId('mosaic')).toHaveAttribute('data-mosaic-mode', 'tabs')
    expect(screen.getByTestId('pane-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('pane-tabs').querySelectorAll('[role="tab"]')).toHaveLength(5)
  })
})
