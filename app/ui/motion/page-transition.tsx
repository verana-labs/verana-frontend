'use client'

import { motion } from 'framer-motion'
import type { ComponentType, ReactNode } from 'react'
import * as React from 'react'
import { DURATION, EASE } from '@/ui/motion/tokens'

type ViewTransitionProps = { children: ReactNode; default?: string; enter?: string; exit?: string }

// @types/react 19.0 lacks the stable ViewTransition export that React 19.3 ships
const ViewTransition = (React as unknown as { ViewTransition?: ComponentType<ViewTransitionProps> }).ViewTransition

export function PageTransition({ children }: { children: ReactNode }) {
  if (ViewTransition) return <ViewTransition>{children}</ViewTransition>
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DURATION.base, ease: EASE.standard }}
    >
      {children}
    </motion.div>
  )
}
