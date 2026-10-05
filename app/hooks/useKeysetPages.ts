'use client'

import { useCallback, useRef, useState } from 'react'

export function useKeysetPages<T extends { id: string }>(pageKey: string, items: T[]) {
  const [pages, setPages] = useState<{ key: string; stack: (string | undefined)[] }>({
    key: pageKey,
    stack: [undefined],
  })
  const stack = pages.key === pageKey ? pages.stack : [undefined]

  const nextPage = useCallback(() => {
    const last = items[items.length - 1]
    if (last) setPages({ key: pageKey, stack: [...stack, last.id] })
  }, [items, pageKey, stack])

  const previousPage = useCallback(() => {
    if (stack.length > 1) setPages({ key: pageKey, stack: stack.slice(0, -1) })
  }, [pageKey, stack])

  return { after: stack[stack.length - 1], hasPrevious: stack.length > 1, nextPage, previousPage }
}

export function useLoadMore(run: () => Promise<void>): () => void {
  const running = useRef(false)
  const runRef = useRef(run)
  runRef.current = run

  return useCallback(() => {
    if (running.current) return
    running.current = true
    void runRef.current().finally(() => {
      running.current = false
    })
  }, [])
}
