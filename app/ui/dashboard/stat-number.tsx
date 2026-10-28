'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatCount } from '@/ui/dashboard/format'
import { NumberTicker } from '@/ui/motion/number-ticker'

let tickersPlayed = false

export function StatNumber({
  value,
  format = formatCount,
  className,
}: {
  value: number
  format?: (value: number) => string
  className?: string
}) {
  const [animate] = useState(() => !tickersPlayed)

  useEffect(() => {
    if (value > 0) tickersPlayed = true
  }, [value])

  if (!animate) return <span className={cn('tabular-nums', className)}>{format(value)}</span>
  return <NumberTicker value={value} format={format} className={className} />
}
