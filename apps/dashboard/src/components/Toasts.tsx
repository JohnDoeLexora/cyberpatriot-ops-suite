import { X } from 'lucide-react'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

const toneClass = {
  ok: 'border-ok/40 bg-ok-dim text-ok',
  info: 'border-info/40 bg-info-dim text-info',
  warn: 'border-warn/40 bg-warn-dim text-warn',
  crit: 'border-crit/40 bg-crit-dim text-crit',
}

export function Toasts() {
  const { toasts, dismissToast } = useWorkspace()
  if (!toasts.length) return null
  return (
    <div
      className="pointer-events-none fixed right-3 bottom-8 z-50 flex w-80 flex-col-reverse gap-2"
      data-testid="toasts"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto rounded-md border px-3 py-2 shadow-lg shadow-black/40',
            toneClass[t.tone],
          )}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-ink">{t.title}</div>
              {t.detail && <div className="text-[11px] text-mute">{t.detail}</div>}
            </div>
            <button type="button" className="text-mute hover:text-ink" onClick={() => dismissToast(t.id)}>
              <X size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
