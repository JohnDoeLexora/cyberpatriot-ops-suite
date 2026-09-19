import { X } from 'lucide-react'
import { cn } from '../lib/cn'
import { useWorkspace } from '../state/workspace'

const toneClass = {
  ok: 'border-ok/30 bg-ok-dim text-ok',
  info: 'border-info/30 bg-info-dim text-info',
  warn: 'border-warn/30 bg-warn-dim text-warn',
  crit: 'border-crit/30 bg-crit-dim text-crit',
}

export function Toasts() {
  const { toasts, dismissToast } = useWorkspace()
  if (!toasts.length) return null
  return (
    <div
      className="pointer-events-none fixed right-4 bottom-12 z-30 flex w-80 max-w-[calc(100vw-2rem)] flex-col-reverse gap-2.5"
      data-testid="toasts"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto rounded-xl border px-3.5 py-2.5 shadow-[0_10px_28px_rgba(28,27,25,0.08)]',
            toneClass[t.tone],
          )}
        >
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-ink">{t.title}</div>
              {t.detail && <div className="mt-0.5 text-[13.5px] leading-5 text-mute">{t.detail}</div>}
            </div>
            <button type="button" className="text-mute hover:text-ink" onClick={() => dismissToast(t.id)}>
              <X size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
