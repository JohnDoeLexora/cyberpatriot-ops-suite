import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './state/persist'

beforeEach(() => {
  localStorage.removeItem(STORAGE_KEY)
})

describe('dashboard shell', () => {
  it('filters the operations catalog', async () => {
    const user = userEvent.setup()
    render(<App />)
    const search = screen.getByTestId('catalog-search')
    await user.clear(search)
    await user.type(search, 'ssh')
    expect(screen.getByTestId('catalog-item-auth.ssh-harden')).toBeInTheDocument()
    expect(screen.queryByTestId('catalog-item-users.list')).not.toBeInTheDocument()
    expect(screen.getByTestId('ops-catalog').textContent).toMatch(/[1-9]\d*\/52/)
    expect(screen.getByTestId('ops-catalog').textContent).not.toMatch(/52\/52/)
  })

  it('opens three panes from the catalog', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getAllByTestId('pane')).toHaveLength(1)
    await user.click(screen.getByTestId('catalog-item-users.list'))
    await user.click(screen.getByTestId('catalog-item-users.flag-suspicious'))
    await user.click(screen.getByTestId('catalog-item-auth.ssh-harden'))
    await waitFor(() => {
      expect(screen.getAllByTestId('pane')).toHaveLength(3)
    })
    expect(screen.getByTestId('pane-count')).toHaveTextContent('3 panes')
  })

  it('runs a mock op and updates pane status', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('catalog-item-users.list'))
    const pane = screen.getAllByTestId('pane')[0]
    const run = within(pane).getByTestId('run-op')
    await user.click(run)
    await waitFor(() => {
      expect(within(pane).getByTestId('run-status')).toHaveAttribute('data-status', 'done')
    })
    expect(within(pane).getByTestId('op-output')).toHaveTextContent(/enumerated/i)
  })

  it('flags a user from the hover action and shows a toast', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByTestId('catalog-item-users.list'))
    const row = screen.getByTestId('user-row-guest')
    await user.hover(row)
    await user.click(screen.getByTestId('action-flag-guest'))
    expect(await screen.findByTestId('toasts')).toHaveTextContent('Flagged guest')
    expect(row).toHaveTextContent('flag')
  })
})
