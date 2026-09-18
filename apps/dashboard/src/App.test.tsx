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
    expect(count).toMatch(/^\d+\/73$/)
    expect(count).not.toBe('73/73')
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
