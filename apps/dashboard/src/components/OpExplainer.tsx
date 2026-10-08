import { getOp } from '@cyberpatriot/ops-catalog'

const FIELDS = [
  ['whatItDoes', 'What it does'],
  ['whyItScores', 'Why it scores'],
  ['whatItChanges', 'What it changes'],
  ['howToUndo', 'How to undo'],
] as const

/** Plain-language card for one catalog op. Renders nothing for local-only panes. */
export function OpExplainer({ opId }: { opId: string }) {
  const op = getOp(opId)
  if (!op) return null
  return (
    <dl
      data-testid="op-explainer"
      data-op-id={op.id}
      className="grid shrink-0 gap-2 border-b border-line bg-app px-4 py-3 text-[13.5px] leading-5"
    >
      {FIELDS.map(([key, label]) => (
        <div key={key} data-testid={`op-explain-${key}`}>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-faint">{label}</dt>
          <dd className="text-ink">{op[key]}</dd>
        </div>
      ))}
    </dl>
  )
}
