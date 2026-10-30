export const hoverLift =
  'transition-[translate,box-shadow] duration-(--duration-slow) ease-emphasized hover:-translate-y-0.5 hover:shadow-raised motion-reduce:hover:translate-y-0'

export const pressable = 'transition-[scale] duration-(--duration-fast) ease-standard active:scale-[0.98]'

export const interactiveCard = `${hoverLift} ${pressable} focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50`
