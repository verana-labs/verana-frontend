export const DURATION = { fast: 0.1, base: 0.2, slow: 0.3 } as const

export const EASE = {
  standard: [0.2, 0, 0, 1],
  emphasized: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

export const STAGGER_STEP = 0.05
