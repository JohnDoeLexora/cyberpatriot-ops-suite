import { render, screen, waitFor, within } from '@testing-library/react'
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
})
