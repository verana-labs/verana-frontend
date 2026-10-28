'use client'

import { AnimatePresence, type MotionProps, motion } from 'framer-motion'
import React, { type ComponentPropsWithoutRef, useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations: MotionProps = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 350, damping: 40 },
  }

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  )
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<'div'> {
  children: React.ReactNode
  delay?: number
  visible?: number
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 1000, visible = 4, ...props }: AnimatedListProps) => {
    const [index, setIndex] = useState(0)
    const childrenArray = useMemo(() => React.Children.toArray(children), [children])

    useEffect(() => {
      if (childrenArray.length === 0) return
      const interval = setInterval(() => setIndex((prevIndex) => prevIndex + 1), delay)
      return () => clearInterval(interval)
    }, [delay, childrenArray.length])

    const itemsToShow = useMemo(() => {
      const total = childrenArray.length
      if (total === 0) return []
      return Array.from({ length: Math.min(index + 1, visible) }, (_, offset) => ({
        key: index - offset,
        item: childrenArray[(index - offset) % total],
      }))
    }, [index, childrenArray, visible])

    return (
      <div className={cn('flex flex-col items-center gap-4', className)} {...props}>
        <AnimatePresence>
          {itemsToShow.map(({ key, item }) => (
            <AnimatedListItem key={key}>{item}</AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    )
  }
)

AnimatedList.displayName = 'AnimatedList'
