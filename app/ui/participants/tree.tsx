'use client'

import type { ItemInstance, TreeInstance } from '@headless-tree/core'
import type { CSSProperties, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type TreeProps<T> = HTMLAttributes<HTMLDivElement> & {
  tree: TreeInstance<T>
  indent: number
  label: string
}

export function Tree<T>({ tree, indent, label, className, style, ...props }: TreeProps<T>) {
  return (
    <div
      data-slot="tree"
      className={cn('flex flex-col', className)}
      {...props}
      {...tree.getContainerProps(label)}
      style={{ ...style, '--tree-indent': `${indent}px` } as CSSProperties}
    />
  )
}

type TreeItemProps<T> = HTMLAttributes<HTMLDivElement> & {
  item: ItemInstance<T>
  indent: number
  selected?: boolean
}

const GUIDE_LINES =
  'before:pointer-events-none before:absolute before:inset-y-0 before:start-0 before:w-(--tree-padding) before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)/2_-_0.5px),var(--border)_calc(var(--tree-indent)/2_-_0.5px),var(--border)_calc(var(--tree-indent)/2_+_0.5px),transparent_calc(var(--tree-indent)/2_+_0.5px),transparent_var(--tree-indent))] rtl:before:-scale-x-100'

export function TreeItem<T>({ item, indent, selected = false, className, style, ...props }: TreeItemProps<T>) {
  const { onClick: _onClick, ...itemProps } = item.getProps()
  return (
    <div
      {...itemProps}
      aria-selected={selected}
      data-slot="tree-row"
      data-folder={item.isFolder() || undefined}
      data-selected={selected || undefined}
      className={cn('relative ps-(--tree-padding) outline-hidden', GUIDE_LINES, className)}
      style={{ ...style, '--tree-padding': `${item.getItemMeta().level * indent}px` } as CSSProperties}
      {...props}
    />
  )
}
