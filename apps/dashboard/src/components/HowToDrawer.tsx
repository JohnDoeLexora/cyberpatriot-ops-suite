import { CircleHelp, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { GUIDES, getGuide, searchHowto, type HowToGuide } from '@cyberpatriot/ops-docs'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

export function HowToDrawer() {
  const ws = useWorkspace()
  const searchRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!ws.howtoOpen) return
    const t = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [ws.howtoOpen])

  const hits = useMemo(() => searchHowto(ws.howtoQuery, GUIDES), [ws.howtoQuery])
  const selected =
    (ws.howtoOpId && hits.some((h) => h.opId === ws.howtoOpId) ? getGuide(ws.howtoOpId) : undefined) ??
    hits[0]

  useEffect(() => {
    if (!ws.howtoOpen || !ws.howtoOpId) return
    const el = document.querySelector(`[data-howto-result="${ws.howtoOpId}"]`)
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [ws.howtoOpen, ws.howtoOpId, hits])

  if (!ws.howtoOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end" data-testid="howto-drawer">
      <button
        type="button"
        aria-label="Close how-to"
        className="absolute inset-0 bg-app/70"
        data-testid="howto-backdrop"
        onClick={ws.closeHowto}
      />
      <aside
        role="dialog"
        aria-label="How-to guides"
        className="relative flex h-full w-full max-w-3xl flex-col border-l border-line bg-panel shadow-2xl shadow-black/40"
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
          <CircleHelp size={16} className="text-accent" />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="text-[13px] font-semibold text-ink">How-to guides</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-faint">
              {GUIDES.length} defensive explainers · authorized image only
            </div>
          </div>
          <button
            type="button"
            data-testid="howto-close"
            title="Close"
            onClick={ws.closeHowto}
            className="rounded p-1 text-mute hover:bg-hover hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>

        <label className="flex shrink-0 items-center gap-1.5 border-b border-line px-3 py-2">
          <Search size={14} className="text-faint" />
          <input
            ref={searchRef}
            data-testid="howto-search"
            value={ws.howtoQuery}
            onChange={(e) => ws.setHowtoQuery(e.target.value)}
            placeholder="Search titles and body…"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
          />
          <span className="font-mono text-[10px] text-faint">
            {hits.length}/{GUIDES.length}
          </span>
        </label>

        <div className="flex min-h-0 flex-1">
          <nav className="flex w-[min(18rem,42%)] shrink-0 flex-col border-r border-line">
            <div className="min-h-0 flex-1 overflow-y-auto py-1">
              {hits.length === 0 && (
                <p className="px-3 py-6 text-center text-[12px] text-mute">
                  No guides match “{ws.howtoQuery}”
                </p>
              )}
              {hits.map((guide) => (
                <ResultRow
                  key={guide.opId}
                  guide={guide}
                  active={selected?.opId === guide.opId}
                  onSelect={() => ws.setHowtoOpId(guide.opId)}
                />
              ))}
            </div>
          </nav>
          <article
            className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-3"
            data-testid="howto-article"
            data-op-id={selected?.opId ?? ''}
          >
            {selected ? (
              <GuideBody
                guide={selected}
                onRelated={(id) => {
                  ws.setHowtoQuery('')
                  ws.setHowtoOpId(id)
                }}
              />
            ) : null}
          </article>
        </div>
      </aside>
    </div>
  )
}

function ResultRow({
  guide,
  active,
  onSelect,
}: {
  guide: HowToGuide
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      data-testid={`howto-result-${guide.opId}`}
      data-howto-result={guide.opId}
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col items-start gap-0.5 px-3 py-1.5 text-left hover:bg-hover',
        active && 'bg-accent-dim/50',
      )}
    >
      <span className="flex w-full items-center gap-1.5">
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">{guide.title}</span>
        <RiskBadge risk={guide.risk} />
      </span>
      <span className="w-full truncate font-mono text-[10px] text-faint">{guide.opId}</span>
    </button>
  )
}

function GuideBody({
  guide,
  onRelated,
}: {
  guide: HowToGuide
  onRelated: (id: string) => void
}) {
  return (
    <div className="mx-auto max-w-xl space-y-4 text-[12.5px] leading-5 text-ink">
      <header>
        <div className="flex flex-wrap items-center gap-1.5">
          <h2 className="text-[16px] font-semibold tracking-tight">{guide.title}</h2>
          <RiskBadge risk={guide.risk} />
          <span className="rounded bg-elev px-1.5 py-px font-mono text-[10px] uppercase text-mute">
            {guide.platforms}
          </span>
          <span className="rounded bg-elev px-1.5 py-px font-mono text-[10px] uppercase text-mute">
            {guide.category}
          </span>
        </div>
        <p className="mt-1 font-mono text-[11px] text-faint">{guide.opId}</p>
        <p className="mt-2 text-mute">{guide.summary}</p>
      </header>

      <Section title="What it is">{guide.what}</Section>
      <Section title="Why it scores in CyberPatriot">{guide.whyItScores}</Section>
      <Section title="When to run it">{guide.whenToRun}</Section>

      <section>
        <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          Step-by-step
        </h3>
        <ol className="list-decimal space-y-1 pl-4">
          {guide.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          What “good” looks like
        </h3>
        <ul className="list-disc space-y-1 pl-4">
          {guide.goodLooksLike.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-warn">
          Risks / confirm notes
        </h3>
        <ul className="list-disc space-y-1 pl-4">
          {guide.risks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          Related ops
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {guide.related.map((id) => {
            const rel = getGuide(id)
            return (
              <button
                key={id}
                type="button"
                data-testid={`howto-related-${id}`}
                onClick={() => onRelated(id)}
                className="rounded-full border border-line-strong bg-elev px-2.5 py-0.5 text-[11px] text-ink hover:border-accent hover:text-accent"
              >
                {rel?.title ?? id}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <section>
      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">{title}</h3>
      <p>{children}</p>
    </section>
  )
}

function RiskBadge({ risk }: { risk: HowToGuide['risk'] }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-px font-mono text-[9px] uppercase',
        risk === 'mutate' ? 'bg-warn-dim text-warn' : 'bg-ok-dim text-ok',
      )}
    >
      {risk}
    </span>
  )
}
