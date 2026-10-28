import { cn } from '@/lib/utils'

export function DotGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-size-[16px_16px] text-primary/25 [mask-image:radial-gradient(280px_circle_at_top_right,white,transparent)] rtl:[mask-image:radial-gradient(280px_circle_at_top_left,white,transparent)]',
        className
      )}
    />
  )
}
