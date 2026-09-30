export interface RateLimiter {
  allow(key: string): boolean
}

const PRUNE_ABOVE = 1000

export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>()
  return {
    allow(key) {
      const at = now()
      if (windows.size > PRUNE_ABOVE) {
        for (const [entry, window] of windows) if (at - window.start >= windowMs) windows.delete(entry)
      }
      const current = windows.get(key)
      if (!current || at - current.start >= windowMs) {
        windows.set(key, { start: at, count: 1 })
        return true
      }
      if (current.count >= limit) return false
      current.count += 1
      return true
    },
  }
}

export function clientKey(headers: Headers): string {
  const forwarded = headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  return forwarded?.at(-1) || headers.get('x-real-ip')?.trim() || 'unknown'
}
