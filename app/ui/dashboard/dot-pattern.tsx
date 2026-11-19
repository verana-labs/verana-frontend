import { useId } from 'react'
import { cn } from '@/lib/utils'

export function DotPattern({
  width = 16,
  height = 16,
  radius = 1,
  className,
}: {
  width?: number
  height?: number
  radius?: number
  className?: string
}) {
  const id = useId()
  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 size-full text-neutral-400/80', className)}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
          <circle cx={radius} cy={radius} r={radius} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
