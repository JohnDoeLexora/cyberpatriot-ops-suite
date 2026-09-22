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
import { getPlaylist } from '@cyberpatriot/ops-catalog'
import { resolveHowtoOpId } from '@cyberpatriot/ops-docs'
import { getEngineOp, OPS_BY_ID } from '../catalog/ops'
import { adaptRunResult } from '../lib/adapt-result'
import { loadAllowlist, parseNameList, saveAllowlist } from '../lib/allowlist'
import { uid } from '../lib/id'
import { executeOp, fetchHealth, type EngineSource } from '../lib/run-client'
import { liveUsers, upsertUsers, type UiUser } from '../lib/users'
import {
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
  onCancel?: () => void
}

export type RunOutcome = 'ok' | 'error' | 'cancelled' | 'empty'

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
  cancelConfirm: () => void
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
  setBeginnerMode: (on: boolean) => void
  setShowAdvanced: (on: boolean) => void
  setPlaylistId: (id: string) => void
  resetPlaylistProgress: () => void
  runPlaylistNext: (opts?: { all?: boolean }) => Promise<void>
  playlistBusy: boolean
  allowlistUsers: string
  allowlistAdmins: string
  setAllowlistUsers: (text: string) => void
  setAllowlistAdmins: (text: string) => void
  allowlistOpen: boolean
  setAllowlistOpen: (open: boolean) => void
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
  runPane: (paneId: string, opts?: { confirm?: boolean; opId?: string }) => Promise<RunOutcome>
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
  const [playlistBusy, setPlaylistBusy] = useState(false)
  const [allowlistOpen, setAllowlistOpen] = useState(false)
  const [allowlistUsers, setAllowlistUsersState] = useState(() =>
    typeof window === 'undefined' ? '' : loadAllowlist('users'),
  )
  const [allowlistAdmins, setAllowlistAdminsState] = useState(() =>
    typeof window === 'undefined' ? '' : loadAllowlist('admins'),
  )
  const searchRef = useRef<HTMLInputElement | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const confirmRef = useRef<ConfirmState | null>(null)
  confirmRef.current = confirm
  const playlistBusyRef = useRef(false)
  const allowlistUsersRef = useRef(allowlistUsers)
  allowlistUsersRef.current = allowlistUsers
  const allowlistAdminsRef = useRef(allowlistAdmins)
  allowlistAdminsRef.current = allowlistAdmins
  const runPaneRef = useRef<(
    paneId: string,
    opts?: { confirm?: boolean; opId?: string },
  ) => Promise<RunOutcome>>(async () => 'empty')

  useEffect(() => {
    const t = window.setTimeout(() => saveWorkspace(state), 120)
    return () => window.clearTimeout(t)
  }, [state])

  useEffect(() => {
    saveAllowlist('users', allowlistUsers)
  }, [allowlistUsers])

  useEffect(() => {
    saveAllowlist('admins', allowlistAdmins)
  }, [allowlistAdmins])

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
      setState((s) => {
        const same = s.panes[paneId]?.opId === opId
        return {
          ...s,
          focusedId: paneId,
          panes: {
            ...s.panes,
            [paneId]: {
              ...s.panes[paneId],
              opId,
              status: 'idle',
              output: same ? s.panes[paneId]?.output ?? null : null,
              error: null,
              selectedUserIds: same ? (s.panes[paneId]?.selectedUserIds ?? []) : [],
              params: same ? (s.panes[paneId]?.params ?? {}) : {},
            },
          },
        }
      })
      log('layout', `Opened ${op?.title ?? opId}`)
    },
    [log],
  )

  const openOp = useCallback(
    (opId: string, targetPaneId?: string) => {
      const s = stateRef.current
      const requested = targetPaneId && s.panes[targetPaneId] ? targetPaneId : s.focusedId
      const paneId = s.panes[requested] ? requested : walkLeaves(s.tree)[0]
      if (!paneId) return
      assignOp(paneId, opId)
    },
    [assignOp],
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

  const markPlaylistStep = useCallback((opId: string, status: 'done' | 'error') => {
    setState((s) => {
      const pl = getPlaylist(s.playlistId)
      if (!pl?.steps.some((step) => step.opId === opId)) return s
      return {
        ...s,
        playlistProgress: {
          ...s.playlistProgress,
          [s.playlistId]: {
            ...(s.playlistProgress[s.playlistId] ?? {}),
            [opId]: status,
          },
        },
      }
    })
  }, [])

  const runPane = useCallback(
    async (paneId: string, opts?: { confirm?: boolean; opId?: string }): Promise<RunOutcome> => {
      const snapshot = stateRef.current
      const pane = snapshot.panes[paneId]
      const opId = opts?.opId ?? pane?.opId
      if (!pane || !opId) return 'empty'
      const uiOp = OPS_BY_ID[opId]
      const mode = snapshot.demoMode ? 'demo' : 'live'
      const catalogOp = getEngineOp(opId)

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
              opId,
              status: 'done',
              output: { summary, findings: [] },
              error: null,
            },
          },
          journal: [journalEntry('run', summary), ...s.journal].slice(0, 400),
        }))
        toast({ tone: 'ok', title: uiOp.title, detail: summary })
        markPlaylistStep(opId, 'done')
        return 'ok'
      }

      if (mode === 'live' && catalogOp?.risk === 'mutate' && opts?.confirm !== true) {
        return await new Promise<RunOutcome>((resolve) => {
          setConfirm({
            title: `Change this computer?`,
            body: `${uiOp?.title ?? opId} will change the authorized CyberPatriot image. Practice data is off. Continue only on a competition image you are allowed to harden.`,
            confirmLabel: 'Yes, apply',
            danger: true,
            onConfirm: () => {
              void runPaneRef.current(paneId, { confirm: true, opId }).then(resolve)
            },
            onCancel: () => resolve('cancelled'),
          })
        })
      }

      setState((s) => ({
        ...s,
        panes: {
          ...s.panes,
          [paneId]: { ...s.panes[paneId], opId, status: 'running', error: null },
        },
      }))

      const params: Record<string, unknown> = pane.opId === opId ? { ...pane.params } : {}
      if (params.dryRun === 'true') params.dryRun = true
      if (opId === 'find-media-files' && snapshot.mediaExtensions) {
        params.extensions = snapshot.mediaExtensions
      }
      const allowProps = catalogOp?.paramsSchema.properties ?? {}
      if (allowProps.allowlistPath) {
        const names = parseNameList(allowlistUsersRef.current)
        if (names.length) params.allowlistNames = names
      }
      if (allowProps.adminsPath) {
        const names = parseNameList(allowlistAdminsRef.current)
        if (names.length) params.adminNames = names
      }

      try {
        const { result, source } = await executeOp({
          opId,
          mode,
          params,
          confirm: opts?.confirm === true,
        })
        setEngineSource(source)
        const output = adaptRunResult(result)
        const replaceUsers = opId === 'list-users'
        const incoming = result.data.users
        setState((s) => {
          let users = s.users
          if (incoming?.length) users = upsertUsers(s.users, incoming, replaceUsers)
          let firewall = s.firewall
          if (result.ok && (opId === 'enable-firewall' || opId === 'apply-default-deny-inbound')) {
            firewall = {
              enabled: true,
              profile: opId === 'apply-default-deny-inbound' ? 'default-deny' : 'on',
            }
          }
          if (result.ok && opId === 'audit-firewall' && result.data.policy) {
            const on = result.data.policy.firewallEnabled === true
            firewall = { enabled: on, profile: on ? 'on' : 'off' }
          }
          const progressPatch =
            result.ok && getPlaylist(s.playlistId)?.steps.some((step) => step.opId === opId)
              ? {
                  playlistProgress: {
                    ...s.playlistProgress,
                    [s.playlistId]: {
                      ...(s.playlistProgress[s.playlistId] ?? {}),
                      [opId]: 'done' as const,
                    },
                  },
                }
              : result.ok
                ? {}
                : getPlaylist(s.playlistId)?.steps.some((step) => step.opId === opId)
                  ? {
                      playlistProgress: {
                        ...s.playlistProgress,
                        [s.playlistId]: {
                          ...(s.playlistProgress[s.playlistId] ?? {}),
                          [opId]: 'error' as const,
                        },
                      },
                    }
                  : {}
          return {
            ...s,
            ...progressPatch,
            users,
            firewall,
            panes: {
              ...s.panes,
              [paneId]: {
                ...s.panes[paneId],
                opId,
                status: result.ok ? 'done' : 'error',
                output,
                error: result.ok ? null : result.summary,
              },
            },
            journal: [
              journalEntry(
                'run',
                `Ran ${uiOp?.title ?? opId} (${result.mode}/${result.engine}): ${result.summary}`,
              ),
              ...s.journal,
            ].slice(0, 400),
          }
        })
        if (result.blocked) {
          toast({ tone: 'warn', title: 'Confirm required', detail: result.blocked.reason })
          return 'error'
        }
        if (result.ok) {
          toast({
            tone: 'ok',
            title: uiOp?.title ?? 'Run complete',
            detail: result.summary,
          })
          return 'ok'
        }
        toast({ tone: 'crit', title: 'Run failed', detail: result.summary })
        return 'error'
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Run failed'
        setState((s) => ({
          ...s,
          panes: {
            ...s.panes,
            [paneId]: { ...s.panes[paneId], opId, status: 'error', error: message },
          },
        }))
        toast({ tone: 'crit', title: 'Run failed', detail: message })
        markPlaylistStep(opId, 'error')
        return 'error'
      }
    },
    [markPlaylistStep, toast],
  )
  runPaneRef.current = runPane

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

  const cancelConfirm = useCallback(() => {
    const current = confirmRef.current
    setConfirm(null)
    current?.onCancel?.()
  }, [])

  const setBeginnerMode = useCallback((on: boolean) => {
    setState((s) => ({ ...s, beginnerMode: on, showAdvanced: on ? s.showAdvanced : true }))
    log('system', on ? 'Beginner mode on' : 'Beginner mode off — all checks visible')
  }, [log])

  const setShowAdvanced = useCallback((on: boolean) => {
    setState((s) => ({ ...s, showAdvanced: on }))
  }, [])

  const setPlaylistId = useCallback((id: string) => {
    const pl = getPlaylist(id)
    if (!pl) return
    setState((s) => ({ ...s, playlistId: id }))
    log('layout', `Playlist ${pl.title}`)
  }, [log])

  const resetPlaylistProgress = useCallback(() => {
    setState((s) => ({
      ...s,
      playlistProgress: { ...s.playlistProgress, [s.playlistId]: {} },
    }))
  }, [])

  const setAllowlistUsers = useCallback((text: string) => {
    setAllowlistUsersState(text)
  }, [])

  const setAllowlistAdmins = useCallback((text: string) => {
    setAllowlistAdminsState(text)
  }, [])

  const runPlaylistNext = useCallback(
    async (opts?: { all?: boolean }) => {
      if (playlistBusyRef.current) return
      playlistBusyRef.current = true
      setPlaylistBusy(true)
      try {
        do {
          const s = stateRef.current
          const pl = getPlaylist(s.playlistId)
          if (!pl) return
          const progress = s.playlistProgress[s.playlistId] ?? {}
          const idx = pl.steps.findIndex((step) => progress[step.opId] !== 'done')
          if (idx < 0) {
            toast({
              tone: 'ok',
              title: `${pl.title} complete`,
              detail: 'Every step has been run in this session.',
            })
            return
          }
          const step = pl.steps[idx]
          const paneId = s.focusedId
          assignOp(paneId, step.opId)
          const outcome = await runPane(paneId, { opId: step.opId })
          const status = outcome === 'ok' ? 'done' : 'error'
          const latest = stateRef.current
          const nextProgress = {
            ...latest.playlistProgress,
            [latest.playlistId]: {
              ...(latest.playlistProgress[latest.playlistId] ?? {}),
              [step.opId]: status as 'done' | 'error',
            },
          }
          if (outcome === 'ok' || outcome === 'error') {
            stateRef.current = { ...latest, playlistProgress: nextProgress }
          }
          if (outcome === 'cancelled') {
            toast({
              tone: 'info',
              title: 'Playlist paused',
              detail: 'Live changes still need a confirm. Run next when you are ready.',
            })
            return
          }
          if (outcome !== 'ok') {
            if (opts?.all) {
              toast({
                tone: 'warn',
                title: 'Playlist stopped',
                detail: `${pl.steps[idx]?.opId ?? 'step'} did not finish.`,
              })
            }
            return
          }
        } while (opts?.all)
      } finally {
        playlistBusyRef.current = false
        setPlaylistBusy(false)
      }
    },
    [assignOp, runPane, toast],
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
      beginnerMode: stateRef.current.beginnerMode,
      showAdvanced: stateRef.current.showAdvanced,
      playlistId: stateRef.current.playlistId,
      playlistProgress: stateRef.current.playlistProgress,
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
      cancelConfirm,
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
      setBeginnerMode,
      setShowAdvanced,
      setPlaylistId,
      resetPlaylistProgress,
      runPlaylistNext,
      playlistBusy,
      allowlistUsers,
      allowlistAdmins,
      setAllowlistUsers,
      setAllowlistAdmins,
      allowlistOpen,
      setAllowlistOpen,
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
      cancelConfirm,
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
      setBeginnerMode,
      setShowAdvanced,
      setPlaylistId,
      resetPlaylistProgress,
      runPlaylistNext,
      playlistBusy,
      allowlistUsers,
      allowlistAdmins,
      setAllowlistUsers,
      setAllowlistAdmins,
      allowlistOpen,
      setAllowlistOpen,
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
