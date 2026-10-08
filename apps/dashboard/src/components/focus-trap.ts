import { useEffect, useRef } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function shown(el: HTMLElement) {
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false
  const style = getComputedStyle(el)
  return style.display !== 'none' && style.visibility !== 'hidden'
}

function focusable(root: HTMLElement) {
  const nodes = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => !el.hasAttribute('disabled') && shown(el),
  )
  return nodes.length ? nodes : [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute('disabled'))
}

/**
 * Keep Tab inside an open dialog and restore focus to whatever opened it.
 * Prefers [data-dialog-initial] so how-to search and Cancel stay predictable.
 */
export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = ref.current
    const focusInitial = () => {
      if (!root) return
      const initial = root.querySelector<HTMLElement>('[data-dialog-initial]')
      if (initial) {
        initial.focus()
        return
      }
      focusable(root)[0]?.focus()
    }
    const frame = window.requestAnimationFrame(focusInitial)
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !root) return
      const nodes = focusable(root)
      if (!nodes.length) {
        event.preventDefault()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      const current = document.activeElement
      if (event.shiftKey && (current === first || !root.contains(current))) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && (current === last || !root.contains(current))) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKey)
      if (previous && document.contains(previous)) previous.focus()
    }
  }, [active])
  return ref
}
