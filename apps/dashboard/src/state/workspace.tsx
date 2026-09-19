import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { resolveHowtoOpId } from '@cyberpatriot/ops-docs'
import { getEngineOp, OPS_BY_ID } from '../catalog/ops'
import { adaptRunResult } from '../lib/adapt-result'
import { uid } from '../lib/id'
import { executeOp, fetchHealth, type EngineSource } from '../lib/run-client'
import { liveUsers, upsertUsers, type UiUser } from '../lib/users'
import {
  addLeafPreferGrid,
  insertLeafAtEdge,
  leafCount,
  moveLeaf,
  removeLeaf,
  setSplitRatio,
  splitLeaf,
  walkLeaves,
  type DropEdge,
  type SplitDirection,
} from '../layout/tree'
import {
  emptyPane,
  initialWorkspace,
  journalEntry,
  loadWorkspace,
  saveWorkspace,
  type FirewallState,
  type JournalEntry,
  type PaneState,
  type PersistedWorkspace,
} from './persist'

const MAX_PANES = 8

export type Toast = {
  id: string
  tone: 'ok' | 'info' | 'warn' | 'crit'
  title: string
  detail?: string
}

export type ContextMenuState = {
  x: number
  y: number
  userId: string
}

export type ConfirmState = {
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  extraHome?: boolean
  onConfirm: (opts: { removeHome: boolean }) => void
}

export type PasswordModalState = {
  userId: string
  name: string
}

type WorkspaceApi = PersistedWorkspace & {
  query: string
  setQuery: (q: string) => void
  toasts: Toast[]
  dismissToast: (id: string) => void
  contextMenu: ContextMenuState | null
  setContextMenu: (m: ContextMenuState | null) => void
  confirm: ConfirmState | null
  setConfirm: (c: ConfirmState | null) => void
  passwordModal: PasswordModalState | null
  setPasswordModal: (m: PasswordModalState | null) => void
  detailsUserId: string | null
  setDetailsUserId: (id: string | null) => void
  howtoOpen: boolean
  howtoOpId: string | null
  howtoQuery: string
  openHowto: (opId?: string) => void
  closeHowto: () => void
  setHowtoOpId: (id: string | null) => void
  setHowtoQuery: (q: string) => void
  searchRef: RefObject<HTMLInputElement | null>
  focusSearch: () => void
  toast: (t: Omit<Toast, 'id'>) => void
  journal: JournalEntry[]
  log: (kind: JournalEntry['kind'], text: string) => void
  setDemoMode: (on: boolean) => void
  setNotes: (notes: string) => void
  setMediaExtensions: (v: string) => void
  toggleFavorite: (opId: string) => void
  togglePreflight: (id: string) => void
  focusPane: (id: string) => void
  openOp: (opId: string, targetPaneId?: string) => void
  assignOp: (paneId: string, opId: string) => void
  splitPane: (paneId: string, direction: SplitDirection) => string | null
  closePane: (paneId: string) => void
  dropOnPane: (targetPaneId: string, edge: DropEdge, payload: DragPayload) => void
  setRatio: (splitId: string, ratio: number) => void
  runPane: (paneId: string, opts?: { confirm?: boolean }) => Promise<void>
  resetDemo: () => void
  resetLayout: () => void
  mutateUser: (userId: string, patch: Partial<UiUser>, label: string) => void
  bulkDisable: (userIds: string[]) => void
  toggleUserSelected: (paneId: string, userId: string) => void
  setUserSelected: (paneId: string, userIds: string[]) => void
  applyFirewall: (fw: FirewallState) => void
  setPaneParam: (paneId: string, key: string, value: string) => void
  engineSource: EngineSource | 'unknown'
  apiOk: boolean | null
}

export type DragPayload =
  | { kind: 'op'; opId: string }
  | { kind: 'pane'; paneId: string }

const WorkspaceContext = createContext<WorkspaceApi | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedWorkspace>(() =>
    typeof window === 'undefined' ? initialWorkspace() : loadWorkspace(),
  )
  const [query, setQuery] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [passwordModal, setPasswordModal] = useState<PasswordModalState | null>(null)
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null)
  const [engineSource, setEngineSource] = useState<EngineSource | 'unknown'>('unknown')
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [howtoOpen, setHowtoOpen] = useState(false)
  const [howtoOpId, setHowtoOpId] = useState<string | null>(null)
  const [howtoQuery, setHowtoQuery] = useState('')
  const searchRef = useRef<HTMLInputElement | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    const t = window.setTimeout(() => saveWorkspace(state), 120)
    return () => window.clearTimeout(t)
  }, [state])

  useEffect(() => {
    let cancelled = false
    const ping = () => {
      void fetchHealth().then((h) => {
        if (cancelled) return
        setApiOk(Boolean(h?.ok))
      })
    }
    ping()
    const id = window.setInterval(ping, 15_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid('toast')
    setToasts((prev) => [...prev.slice(-4), { ...t, id }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 4200)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const log = useCallback((kind: JournalEntry['kind'], text: string) => {
    setState((s) => ({
      ...s,
      journal: [journalEntry(kind, text), ...s.journal].slice(0, 400),
    }))
  }, [])

  const focusSearch = useCallback(() => {
    searchRef.current?.focus()
    searchRef.current?.select()
  }, [])

  const openHowto = useCallback((opId?: string) => {
    const catalogId = opId ? resolveHowtoOpId(opId) : undefined
    setHowtoOpen(true)
    setHowtoOpId(catalogId ?? null)
    if (opId && !catalogId) {
      const dash = OPS_BY_ID[opId]
      setHowtoQuery(dash?.title ?? opId)
    } else {
      setHowtoQuery('')
    }
  }, [])

  const closeHowto = useCallback(() => {
    setHowtoOpen(false)
  }, [])

  const focusPane = useCallback((id: string) => {
    setState((s) => ({ ...s, focusedId: id }))
  }, [])

  const assignOp = useCallback(
    (paneId: string, opId: string) => {
      const op = OPS_BY_ID[opId]
      setState((s) => ({
        ...s,
        focusedId: paneId,
        panes: {
          ...s.panes,
          [paneId]: {
            ...s.panes[paneId],
            opId,
            status: 'idle',
            output: null,
            error: null,
            selectedUserIds: [],
            params: s.panes[paneId]?.params ?? {},
          },
        },
      }))
      log('layout', `Opened ${op?.title ?? opId}`)
    },
    [log],
  )

  const openOp = useCallback(
    (opId: string, targetPaneId?: string) => {
      const s = stateRef.current
      const target = targetPaneId ?? s.focusedId
      const targetPane = s.panes[target]
      if (targetPane && !targetPane.opId) {
        assignOp(target, opId)
        return
      }
      const emptyId = walkLeaves(s.tree).find((id) => !s.panes[id]?.opId)
      if (emptyId) {
        assignOp(emptyId, opId)
        return
      }
      if (leafCount(s.tree) >= MAX_PANES) {
        assignOp(target, opId)
        toast({ tone: 'warn', title: 'Pane cap', detail: `Replaced the focused pane (max ${MAX_PANES}).` })
        return
      }
      const newId = uid('pane')
      setState((cur) => {
        const splitFrom = cur.panes[target] ? target : walkLeaves(cur.tree)[0]
        return {
          ...cur,
          tree: addLeafPreferGrid(cur.tree, splitFrom, newId),
          focusedId: newId,
          panes: {
            ...cur.panes,
            [newId]: { ...emptyPane(newId), opId },
          },
        }
      })
      const op = OPS_BY_ID[opId]
      log('layout', `Split and opened ${op?.title ?? opId}`)
    },
    [assignOp, log, toast],
  )

  const splitPane = useCallback(
    (paneId: string, direction: SplitDirection) => {
      const s = stateRef.current
      if (leafCount(s.tree) >= MAX_PANES) {
        toast({ tone: 'warn', title: 'Pane cap', detail: `Max ${MAX_PANES} panes.` })
        return null
      }
      const newId = uid('pane')
      setState((cur) => ({
        ...cur,
        tree: splitLeaf(cur.tree, paneId, direction, newId, 'after'),
        focusedId: newId,
        panes: { ...cur.panes, [newId]: emptyPane(newId) },
      }))
      log('layout', `Split ${direction}`)
      return newId
    },
    [log, toast],
  )

  const closePane = useCallback(
    (paneId: string) => {
      const s = stateRef.current
      if (leafCount(s.tree) <= 1) {
        setState((cur) => ({
          ...cur,
          panes: { ...cur.panes, [paneId]: emptyPane(paneId) },
          focusedId: paneId,
        }))
        log('layout', 'Cleared last pane')
        return
      }
      const nextTree = removeLeaf(s.tree, paneId)
      const remaining = walkLeaves(nextTree)
      setState((cur) => {
        const panes = { ...cur.panes }
        delete panes[paneId]
        return {
          ...cur,
          tree: nextTree,
          panes,
          focusedId: remaining.includes(cur.focusedId) ? cur.focusedId : remaining[0],
        }
      })
      log('layout', 'Closed pane')
    },
    [log],
  )

  const dropOnPane = useCallback(
    (targetPaneId: string, edge: DropEdge, payload: DragPayload) => {
      if (payload.kind === 'op') {
        if (edge === 'center') {
          assignOp(targetPaneId, payload.opId)
          return
        }
        const s = stateRef.current
        if (leafCount(s.tree) >= MAX_PANES) {
          assignOp(targetPaneId, payload.opId)
          return
        }
        const newId = uid('pane')
        setState((cur) => ({
          ...cur,
          tree: insertLeafAtEdge(cur.tree, targetPaneId, newId, edge),
          focusedId: newId,
          panes: {
            ...cur.panes,
            [newId]: { ...emptyPane(newId), opId: payload.opId },
          },
        }))
        log('layout', `Dropped ${payload.opId} on ${edge}`)
        return
      }
      if (payload.paneId === targetPaneId) return
      setState((cur) => ({
        ...cur,
        tree: moveLeaf(cur.tree, payload.paneId, targetPaneId, edge),
        focusedId: payload.paneId,
      }))
      log('layout', `Moved pane (${edge})`)
    },
    [assignOp, log],
  )

  const setRatio = useCallback((splitId: string, ratio: number) => {
    setState((s) => ({ ...s, tree: setSplitRatio(s.tree, splitId, ratio) }))
  }, [])

  const setPaneParam = useCallback((paneId: string, key: string, value: string) => {
    setState((s) => {
      const pane = s.panes[paneId]
      if (!pane) return s
      return {
        ...s,
        panes: {
          ...s.panes,
          [paneId]: { ...pane, params: { ...pane.params, [key]: value } },
        },
      }
    })
  }, [])

  const runPane = useCallback(
    async (paneId: string, opts?: { confirm?: boolean }) => {
      const snapshot = stateRef.current
      const pane = snapshot.panes[paneId]
      if (!pane?.opId) return
      const uiOp = OPS_BY_ID[pane.opId]
      const mode = snapshot.demoMode ? 'demo' : 'live'
      const catalogOp = getEngineOp(pane.opId)

      if (uiOp && !uiOp.engine) {
        const summary =
          uiOp.view === 'notes'
            ? `Notes snapshot (${snapshot.notes.length} characters).`
            : uiOp.view === 'journal'
              ? `Change log has ${snapshot.journal.length} entries.`
              : `${snapshot.favorites.length} pinned checks.`
        setState((s) => ({
          ...s,
          panes: {
            ...s.panes,
            [paneId]: {
              ...s.panes[paneId],
              status: 'done',
              output: { summary, findings: [] },
              error: null,
            },
          },
          journal: [journalEntry('run', summary), ...s.journal].slice(0, 400),
        }))
        toast({ tone: 'ok', title: uiOp.title, detail: summary })
        return
      }

      if (mode === 'live' && catalogOp?.risk === 'mutate' && opts?.confirm !== true) {
        setConfirm({
          title: `Change this computer?`,
          body: `${uiOp?.title ?? pane.opId} will change the authorized CyberPatriot image. Practice data is off. Continue only on a competition image you are allowed to harden.`,
          confirmLabel: 'Yes, apply',
          danger: true,
          onConfirm: () => {
            void runPane(paneId, { confirm: true })
          },
        })
        return
      }

      setState((s) => ({
        ...s,
        panes: {
          ...s.panes,
          [paneId]: { ...s.panes[paneId], status: 'running', error: null },
        },
      }))

      const params: Record<string, unknown> = { ...pane.params }
      if (pane.params.dryRun === 'true') params.dryRun = true
      if (uiOp?.id === 'find-media-files' && snapshot.mediaExtensions) {
        params.extensions = snapshot.mediaExtensions
      }

      try {
        const { result, source } = await executeOp({
          opId: pane.opId,
          mode,
          params,
          confirm: opts?.confirm === true,
        })
        setEngineSource(source)
        const output = adaptRunResult(result)
        const replaceUsers = pane.opId === 'list-users'
        const incoming = result.data.users
        setState((s) => {
          let users = s.users
          if (incoming?.length) users = upsertUsers(s.users, incoming, replaceUsers)
          let firewall = s.firewall
          if (result.ok && (pane.opId === 'enable-firewall' || pane.opId === 'apply-default-deny-inbound')) {
            firewall = {
              enabled: true,
              profile: pane.opId === 'apply-default-deny-inbound' ? 'default-deny' : 'on',
            }
          }
          if (result.ok && pane.opId === 'audit-firewall' && result.data.policy) {
            const on = result.data.policy.firewallEnabled === true
            firewall = { enabled: on, profile: on ? 'on' : 'off' }
          }
          return {
            ...s,
            users,
            firewall,
            panes: {
              ...s.panes,
              [paneId]: {
                ...s.panes[paneId],
                status: result.ok ? 'done' : 'error',
                output,
                error: result.ok ? null : result.summary,
              },
            },
            journal: [
              journalEntry(
                'run',
                `Ran ${uiOp?.title ?? pane.opId} (${result.mode}/${result.engine}): ${result.summary}`,
              ),
              ...s.journal,
            ].slice(0, 400),
          }
        })
        if (result.blocked) {
          toast({ tone: 'warn', title: 'Confirm required', detail: result.blocked.reason })
        } else if (result.ok) {
          toast({
            tone: 'ok',
            title: uiOp?.title ?? 'Run complete',
            detail: result.summary,
          })
        } else {
          toast({ tone: 'crit', title: 'Run failed', detail: result.summary })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Run failed'
        setState((s) => ({
          ...s,
          panes: {
            ...s.panes,
            [paneId]: { ...s.panes[paneId], status: 'error', error: message },
          },
        }))
        toast({ tone: 'crit', title: 'Run failed', detail: message })
      }
    },
    [toast],
  )

  const setDemoMode = useCallback(
    (on: boolean) => {
      setState((s) => ({ ...s, demoMode: on }))
      log('system', on ? 'Practice data on' : 'This computer (live) — changes need confirmation')
      toast({
        tone: on ? 'ok' : 'warn',
        title: on ? 'Practice data on' : 'This computer',
        detail: on
          ? 'Mac-safe fixtures. Nothing on this computer is changed.'
          : 'Reads this machine. Changes ask for confirmation first.',
      })
    },
    [log, toast],
  )

  const setNotes = useCallback((notes: string) => {
    setState((s) => ({ ...s, notes }))
  }, [])

  const setMediaExtensions = useCallback((v: string) => {
    setState((s) => ({ ...s, mediaExtensions: v }))
  }, [])

  const toggleFavorite = useCallback((opId: string) => {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(opId)
        ? s.favorites.filter((id) => id !== opId)
        : [...s.favorites, opId],
    }))
  }, [])

  const togglePreflight = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      preflight: { ...s.preflight, [id]: !s.preflight[id] },
    }))
  }, [])

  const resetDemo = useCallback(() => {
    const keepTree = stateRef.current.tree
    const keepPanes = stateRef.current.panes
    const fresh = initialWorkspace()
    setState({
      ...fresh,
      tree: keepTree,
      panes: Object.fromEntries(
        Object.entries(keepPanes).map(([id, p]) => [
          id,
          { ...p, status: 'idle' as const, output: null, error: null, selectedUserIds: [] },
        ]),
      ),
      focusedId: stateRef.current.focusedId,
    })
    toast({ tone: 'info', title: 'Practice data reset', detail: 'Accounts and the change log were restored. Layout kept.' })
  }, [toast])

  const resetLayout = useCallback(() => {
    const pane = emptyPane()
    setState((s) => ({
      ...s,
      tree: { type: 'leaf', id: pane.id },
      panes: { [pane.id]: pane },
      focusedId: pane.id,
    }))
    log('layout', 'Layout reset')
  }, [log])

  const mutateUser = useCallback(
    (userId: string, patch: Partial<UiUser>, label: string) => {
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
        journal: [journalEntry('user', label), ...s.journal].slice(0, 400),
      }))
      toast({ tone: 'ok', title: label })
    },
    [toast],
  )

  const bulkDisable = useCallback(
    (userIds: string[]) => {
      if (!userIds.length) return
      setState((s) => ({
        ...s,
        users: s.users.map((u) =>
          userIds.includes(u.id) && u.name !== 'root' ? { ...u, status: 'disabled' } : u,
        ),
        journal: [
          journalEntry('user', `Turned off ${userIds.length} account(s)`),
          ...s.journal,
        ].slice(0, 400),
      }))
      toast({ tone: 'ok', title: `Turned off ${userIds.length} account(s)` })
    },
    [toast],
  )

  const toggleUserSelected = useCallback((paneId: string, userId: string) => {
    setState((s) => {
      const pane = s.panes[paneId]
      if (!pane) return s
      const has = pane.selectedUserIds.includes(userId)
      return {
        ...s,
        panes: {
          ...s.panes,
          [paneId]: {
            ...pane,
            selectedUserIds: has
              ? pane.selectedUserIds.filter((id) => id !== userId)
              : [...pane.selectedUserIds, userId],
          },
        },
      }
    })
  }, [])

  const setUserSelected = useCallback((paneId: string, userIds: string[]) => {
    setState((s) => ({
      ...s,
      panes: {
        ...s.panes,
        [paneId]: { ...s.panes[paneId], selectedUserIds: userIds },
      },
    }))
  }, [])

  const applyFirewall = useCallback(
    (fw: FirewallState) => {
      setState((s) => ({ ...s, firewall: fw }))
      log('system', `Firewall → ${fw.profile}`)
    },
    [log],
  )

  const api = useMemo<WorkspaceApi>(
    () => ({
      ...state,
      query,
      setQuery,
      toasts,
      dismissToast,
      contextMenu,
      setContextMenu,
      confirm,
      setConfirm,
      passwordModal,
      setPasswordModal,
      detailsUserId,
      setDetailsUserId,
      howtoOpen,
      howtoOpId,
      howtoQuery,
      openHowto,
      closeHowto,
      setHowtoOpId,
      setHowtoQuery,
      searchRef,
      focusSearch,
      toast,
      log,
      setDemoMode,
      setNotes,
      setMediaExtensions,
      toggleFavorite,
      togglePreflight,
      focusPane,
      openOp,
      assignOp,
      splitPane,
      closePane,
      dropOnPane,
      setRatio,
      runPane,
      resetDemo,
      resetLayout,
      mutateUser,
      bulkDisable,
      toggleUserSelected,
      setUserSelected,
      applyFirewall,
      setPaneParam,
      engineSource,
      apiOk,
    }),
    [
      state,
      query,
      toasts,
      dismissToast,
      contextMenu,
      confirm,
      passwordModal,
      detailsUserId,
      howtoOpen,
      howtoOpId,
      howtoQuery,
      openHowto,
      closeHowto,
      setHowtoOpId,
      focusSearch,
      toast,
      log,
      setDemoMode,
      setNotes,
      setMediaExtensions,
      toggleFavorite,
      togglePreflight,
      focusPane,
      openOp,
      assignOp,
      splitPane,
      closePane,
      dropOnPane,
      setRatio,
      runPane,
      resetDemo,
      resetLayout,
      mutateUser,
      bulkDisable,
      toggleUserSelected,
      setUserSelected,
      applyFirewall,
      setPaneParam,
      engineSource,
      apiOk,
    ],
  )

  return <WorkspaceContext.Provider value={api}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}

export function collectFindings(panes: Record<string, PaneState>) {
  return Object.values(panes).flatMap((p) => p.output?.findings ?? [])
}

export { liveUsers }
