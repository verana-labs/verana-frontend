'use client'

import { type HTMLMotionProps, motion, useReducedMotion, type Variants } from 'framer-motion'
import { DURATION, EASE, STAGGER_STEP } from '@/ui/motion/tokens'

const TAGS = { div: motion.div, ul: motion.ul, ol: motion.ol, li: motion.li, section: motion.section }

type Tag = keyof typeof TAGS

type StaggerProps = HTMLMotionProps<'div'> & { as?: Tag; delay?: number; step?: number }

export function Stagger({ as = 'div', delay = 0, step = STAGGER_STEP, ...props }: StaggerProps) {
  const Comp = TAGS[as] as typeof motion.div
  const variants: Variants = {
    hidden: {},
    show: { transition: { delayChildren: delay, staggerChildren: step } },
  }
  return <Comp initial="hidden" animate="show" variants={variants} {...props} />
}

type StaggerItemProps = HTMLMotionProps<'div'> & { as?: Tag; offset?: number }

export function StaggerItem({ as = 'div', offset = 8, ...props }: StaggerItemProps) {
  const reduced = useReducedMotion()
  const Comp = TAGS[as] as typeof motion.div
  const variants: Variants = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: offset },
    show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE.emphasized } },
  }
  return <Comp variants={variants} {...props} />
}
