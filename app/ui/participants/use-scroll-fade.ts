import { useCallback, useEffect, useRef, useState } from 'react'

export function useScrollFade<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T | null>(null)
  const [faded, setFaded] = useState(false)

  const update = useCallback(() => {
    const element = ref.current
    if (!element || !enabled) {
      setFaded(false)
      return
    }
    setFaded(element.scrollTop + element.clientHeight < element.scrollHeight - 1)
  }, [enabled])

  useEffect(() => {
    const element = ref.current
    update()
    if (!element || !enabled) return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    for (const child of Array.from(element.children)) observer.observe(child)
    const mutations = new MutationObserver(() => {
      for (const child of Array.from(element.children)) observer.observe(child)
      update()
    })
    mutations.observe(element, { childList: true })
    element.addEventListener('scroll', update, { passive: true })
    return () => {
      observer.disconnect()
      mutations.disconnect()
      element.removeEventListener('scroll', update)
    }
  }, [enabled, update])

  return { ref, faded }
}
