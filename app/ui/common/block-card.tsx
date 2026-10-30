import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { type ReactNode, useId } from 'react'
import { cn } from '@/lib/utils'
import { DotPattern } from '@/ui/dashboard/dot-pattern'

export type BlockLink = { href: string; label: string; replace?: boolean }

export type BlockHeaderProps = {
  title: ReactNode
  caption?: ReactNode
  icon?: ReactNode
  leading?: ReactNode
  tag?: ReactNode
  link?: BlockLink
  actions?: ReactNode
  as?: 'h2' | 'h3'
  id?: string
  className?: string
}

export function BlockLinkButton({ href, label, replace, className }: BlockLink & { className?: string }) {
  return (
    <Link
      href={href}
      replace={replace}
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-[13px] font-medium text-muted-foreground transition-colors duration-(--duration-fast) outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className
      )}
    >
      {label}
      <ChevronRightIcon aria-hidden="true" className="size-3.5 rtl:rotate-180" />
    </Link>
  )
}

export function BlockHeader({
  title,
  caption,
  icon,
  leading,
  tag,
  link,
  actions,
  as: Heading = 'h2',
  id,
  className,
}: BlockHeaderProps) {
  return (
    <header className={cn('flex min-w-0 items-start gap-3', className)}>
      {leading}
      {icon ? (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-tint-accent text-primary [&_svg]:size-4"
        >
          {icon}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <Heading id={id} className="truncate text-base leading-6 font-semibold tracking-[-0.01em] text-foreground">
            {title}
          </Heading>
          {tag}
        </div>
        {caption ? <p className="line-clamp-2 text-xs leading-4 text-muted-foreground">{caption}</p> : null}
      </div>
      {actions || link ? (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {link ? <BlockLinkButton {...link} /> : null}
        </div>
      ) : null}
    </header>
  )
}

export type BlockCardProps = Omit<BlockHeaderProps, 'id' | 'className'> & {
  pattern?: boolean
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function BlockCard({ pattern = false, children, className, contentClassName, ...header }: BlockCardProps) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className={cn('relative isolate flex min-w-0 flex-col overflow-hidden rounded-xl bg-card shadow-card', className)}
    >
      {pattern ? (
        <DotPattern
          width={14}
          height={14}
          className="-z-10 text-primary/20 [mask-image:radial-gradient(200px_circle_at_top_right,white,transparent)]"
        />
      ) : null}
      <BlockHeader {...header} id={id} className="px-4 pt-4 sm:px-5 sm:pt-5" />
      <div className={cn('flex min-w-0 flex-1 flex-col px-4 pt-3 pb-4 sm:px-5 sm:pb-5', contentClassName)}>
        {children}
      </div>
    </section>
  )
}
