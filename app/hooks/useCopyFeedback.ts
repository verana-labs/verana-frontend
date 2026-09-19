'use client'

import { useCallback, useEffect, useState } from 'react'

export function useCopyFeedback(value: string | undefined) {
  const [copiedAt, setCopiedAt] = useState(0)

  useEffect(() => {
    if (!copiedAt) return
    const timeout = window.setTimeout(() => setCopiedAt(0), 2000)
    return () => window.clearTimeout(timeout)
  }, [copiedAt])

  const copy = useCallback(async () => {
    if (!value || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedAt(Date.now())
    } catch {
      setCopiedAt(0)
    }
  }, [value])

  return { copied: copiedAt > 0, copy }
}
