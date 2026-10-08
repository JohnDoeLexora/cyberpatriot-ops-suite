import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useEffect } from 'react'
import { Catalog } from './components/Catalog'
import { Header } from './components/Header'
import { PlaylistPanel } from './components/PlaylistPanel'
import { HowToDrawer } from './components/HowToDrawer'
import { Mosaic } from './components/Mosaic'
import { OverlayLayer } from './components/Modals'
import { StatusBar } from './components/StatusBar'
import { Toasts } from './components/Toasts'
import { walkLeaves } from './layout/tree'
import { WorkspaceProvider, useWorkspace } from './state/workspace'

export default function App() {
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  )
}

function Shell() {
  const ws = useWorkspace()
  useGlobalKeys()
  return (
    <div
      className="flex h-full min-h-0 flex-col bg-app text-ink"
      data-testid="app-shell"
      data-theme="paper"
      data-beginner={ws.beginnerMode ? 'true' : 'false'}
    >
      <Header />
      <div className="min-h-0 flex-1">
        <PanelGroup direction="horizontal" autoSaveId="cp-ops-sidebar">
          <Panel defaultSize={22} minSize={18} maxSize={34} className="min-h-0 min-w-[17rem]">
            <div className="flex h-full min-h-0 flex-col">
              <PlaylistPanel />
              <div className="min-h-0 flex-1">
                <Catalog />
              </div>
            </div>
          </Panel>
          <PanelResizeHandle className="resize-handle" />
          <Panel defaultSize={78} className="min-h-0 min-w-[24rem]">
            <Mosaic />
          </Panel>
        </PanelGroup>
      </div>
      <StatusBar />
      <Toasts />
      <OverlayLayer />
      <HowToDrawer />
    </div>
  )
}

function useGlobalKeys() {
  const ws = useWorkspace()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (ws.shortcutsOpen) {
          ws.setShortcutsOpen(false)
          return
        }
        if (ws.howtoOpen) {
          ws.closeHowto()
          return
        }
        if (ws.allowlistOpen) {
          ws.setAllowlistOpen(false)
          return
        }
        if (ws.confirm) {
          ws.cancelConfirm()
          return
        }
        if (ws.passwordModal) {
          ws.setPasswordModal(null)
          return
        }
        if (ws.detailsUserId) {
          ws.setDetailsUserId(null)
          return
        }
        ws.setContextMenu(null)
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        return
      }

      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !isTyping(e)) {
          e.preventDefault()
          ws.focusSearch()
        }
        if (e.altKey && !isTyping(e) && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          e.preventDefault()
          movePane(ws, e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1)
        }
        return
      }

      const dialogOpen = Boolean(
        ws.shortcutsOpen || ws.howtoOpen || ws.allowlistOpen || ws.confirm || ws.passwordModal || ws.detailsUserId,
      )

      if (e.key === '?') {
        e.preventDefault()
        ws.setShortcutsOpen(ws.shortcutsOpen ? false : !dialogOpen)
        return
      }
      if (dialogOpen) return
      if (e.key === '/') {
        e.preventDefault()
        ws.focusSearch()
        return
      }
      if (e.key === 'h') {
        e.preventDefault()
        const pane = ws.panes[ws.focusedId]
        ws.openHowto(pane?.opId ?? undefined)
        return
      }
      if (e.key === 'Enter' && !isActivator(e)) {
        const pane = ws.panes[ws.focusedId]
        if (pane?.opId && pane.status !== 'running') {
          e.preventDefault()
          void ws.runPane(ws.focusedId)
        }
        return
      }
      if (e.key >= '1' && e.key <= '4') {
        const leaves = walkLeaves(ws.tree)
        const id = leaves[Number(e.key) - 1]
        if (!id) return
        e.preventDefault()
        ws.focusPane(id)
        focusPaneDom(id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ws])
}

function movePane(ws: ReturnType<typeof useWorkspace>, delta: number) {
  const leaves = walkLeaves(ws.tree)
  if (!leaves.length) return
  const index = Math.max(0, leaves.indexOf(ws.focusedId))
  const next = leaves[(index + delta + leaves.length) % leaves.length]
  if (!next) return
  ws.focusPane(next)
  focusPaneDom(next)
}

function focusPaneDom(id: string) {
  const selector = `[data-testid="pane"][data-pane-id="${CSS.escape(id)}"]`
  document.querySelector<HTMLElement>(selector)?.focus()
}

function isTyping(e: KeyboardEvent) {
  const t = e.target
  if (!(t instanceof HTMLElement)) return false
  if (t.isContentEditable) return true
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function isActivator(e: KeyboardEvent) {
  const t = e.target
  if (!(t instanceof HTMLElement)) return false
  const tag = t.tagName
  return tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY'
}
