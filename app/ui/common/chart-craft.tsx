export const CHART_STROKE_WIDTH = 2

export const CHART_GRID = { vertical: false, stroke: 'var(--border)', strokeDasharray: '0' } as const

export const CHART_LINE_CURSOR = { stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeOpacity: 0.4 } as const

export const CHART_BAR_CURSOR = { fill: 'var(--muted)', opacity: 0.6 } as const

export const CHART_EVENT_LINE = {
  stroke: 'var(--muted-foreground)',
  strokeDasharray: '3 3',
  strokeOpacity: 0.55,
  ifOverflow: 'extendDomain',
} as const

export const CHART_ACTIVE_DOT = { r: 4, strokeWidth: 2, stroke: 'var(--card)' } as const

export function chartGradientId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '')
}

export function AreaGradient({ id, color, from = 0.16 }: { id: string; color: string; from?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={from} />
      <stop offset="100%" stopColor={color} stopOpacity={0} />
    </linearGradient>
  )
}
