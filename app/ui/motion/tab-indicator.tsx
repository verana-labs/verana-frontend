'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DURATION, EASE } from '@/ui/motion/tokens'

type TabIndicatorProps = { layoutId: string; variant?: 'pill' | 'underline'; className?: string }

export function TabIndicator({ layoutId, variant = 'pill', className }: TabIndicatorProps) {
  return (
    <motion.span
      layoutId={layoutId}
      aria-hidden="true"
      transition={{ duration: DURATION.slow, ease: EASE.emphasized }}
      className={cn(
        'pointer-events-none absolute -z-10',
        variant === 'pill'
          ? 'inset-0 rounded-md bg-background shadow-sm dark:bg-input/30'
          : 'inset-x-0 -bottom-[5px] h-0.5 bg-primary',
        className
      )}
    />
  )
}
