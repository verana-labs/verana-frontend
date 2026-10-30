export const DURATION = { fast: 0.12, base: 0.18, slow: 0.24 } as const

export const EASE = {
  standard: [0.2, 0, 0, 1],
  emphasized: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

export const STAGGER_STEP = 0.05

export const STAGGER_CAP = 8

export function staggerDelay(index: number, step: number = STAGGER_STEP): number {
  return Math.min(Math.max(index, 0), STAGGER_CAP) * step
}

export const TRANSITION = {
  enter: { duration: DURATION.base, ease: EASE.standard },
  exit: { duration: DURATION.fast, ease: EASE.exit },
  slide: { duration: DURATION.slow, ease: EASE.emphasized },
} as const
