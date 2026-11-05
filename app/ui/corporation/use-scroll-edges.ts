'use client'

import { type RefObject, useEffect, useState } from 'react'

const FADE_BOTH = '[mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]'
const FADE_END =
  '[mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] rtl:[mask-image:linear-gradient(to_left,black_calc(100%-1.5rem),transparent)]'
const FADE_START =
  '[mask-image:linear-gradient(to_left,black_calc(100%-1.5rem),transparent)] rtl:[mask-image:linear-gradient(to_right,black_calc(100%-1.5rem),transparent)]'

export function revealChild(container: HTMLElement, child: HTMLElement) {
  const bounds = container.getBoundingClientRect()
  const rect = child.getBoundingClientRect()
  if (rect.left < bounds.left) container.scrollBy({ left: rect.left - bounds.left - 24 })
  else if (rect.right > bounds.right) container.scrollBy({ left: rect.right - bounds.right + 24 })
}

export function useScrollEdges(ref: RefObject<HTMLElement | null>, onResize?: () => void) {
  const [edges, setEdges] = useState({ start: false, end: false })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const max = element.scrollWidth - element.clientWidth
      const position = Math.abs(element.scrollLeft)
      setEdges((current) => {
        const next = { start: position > 1, end: position < max - 1 }
        return current.start === next.start && current.end === next.end ? current : next
      })
    }
    const observer = new ResizeObserver(() => {
      onResize?.()
      update()
    })
    observer.observe(element)
    element.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      observer.disconnect()
      element.removeEventListener('scroll', update)
    }
  }, [ref, onResize])

  if (edges.start && edges.end) return FADE_BOTH
  if (edges.end) return FADE_END
  if (edges.start) return FADE_START
  return ''
}
