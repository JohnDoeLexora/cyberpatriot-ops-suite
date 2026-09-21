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
      if (e.key === '/' && !isTyping(e)) {
        e.preventDefault()
        ws.focusSearch()
        return
      }
      if (e.key === '?' && !isTyping(e)) {
        e.preventDefault()
        const pane = ws.panes[ws.focusedId]
        ws.openHowto(pane?.opId ?? undefined)
        return
      }
      if (e.key === 'Escape') {
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
        ws.setContextMenu(null)
        ws.setPasswordModal(null)
        ws.setDetailsUserId(null)
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ws])
}

function isTyping(e: KeyboardEvent) {
  const t = e.target
  if (!(t instanceof HTMLElement)) return false
  if (t.isContentEditable) return true
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}
