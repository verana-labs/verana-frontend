'use client'

import { Columns3Icon, ListFilterIcon, SearchIcon, XIcon } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/ui/shadcn/input-group'
import { Kbd } from '@/ui/shadcn/kbd'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/shadcn/select'

export type ToolbarOption = { value: string; label: ReactNode; count?: number | string }

export type ToolbarSearch = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export type ToolbarScopes = {
  value: string
  onChange: (value: string) => void
  items: ToolbarOption[]
  label?: string
}

export type ToolbarFilterGroup = {
  id: string
  label: string
  options: ToolbarOption[]
  selected: readonly string[]
  onChange: (selected: string[]) => void
}

export type ToolbarSort = {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  label?: string
}

export type ToolbarColumns = {
  items: { id: string; label: string }[]
  visibility: Record<string, boolean>
  onChange: (visibility: Record<string, boolean>) => void
}

export type DataTableToolbarProps = {
  search?: ToolbarSearch
  scopes?: ToolbarScopes
  filters?: ToolbarFilterGroup[]
  sort?: ToolbarSort
  columns?: ToolbarColumns
  summary?: ReactNode
  actions?: ReactNode
  className?: string
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

function ScopeTabs({ value, onChange, items, label }: ToolbarScopes) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex max-w-full min-w-0 gap-1 justify-self-start overflow-x-auto rounded-lg bg-muted p-1 [scrollbar-width:none] dark:bg-muted/60"
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            data-scope={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap text-muted-foreground outline-none transition-[color,background-color,box-shadow] duration-(--duration-fast) ease-standard hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
              active && 'bg-background text-foreground shadow-card dark:bg-card'
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] leading-4 tabular-nums',
                  active ? 'bg-primary/10 text-primary' : 'bg-foreground/5 text-muted-foreground'
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

function FilterMenu({ groups }: { groups: ToolbarFilterGroup[] }) {
  const active = groups.reduce((total, group) => total + group.selected.length, 0)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" data-toolbar="filters">
          <ListFilterIcon aria-hidden="true" />
          {translate('datatable.filters')}
          {active > 0 ? (
            <span className="rounded-full bg-primary/10 px-1.5 text-[11px] leading-4 font-semibold text-primary tabular-nums">
              {active}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {groups.map((group, index) => (
          <DropdownMenuGroup key={group.id}>
            {index > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-xs text-muted-foreground">{group.label}</DropdownMenuLabel>
            {group.options.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={group.selected.includes(option.value)}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(checked) =>
                  group.onChange(
                    checked
                      ? [...group.selected, option.value]
                      : group.selected.filter((value) => value !== option.value)
                  )
                }
              >
                <span className="flex-1">{option.label}</span>
                {option.count !== undefined ? (
                  <span className="ms-4 text-xs text-muted-foreground tabular-nums">{option.count}</span>
                ) : null}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ColumnsMenu({ items, visibility, onChange }: ToolbarColumns) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label={translate('datatable.columns')}>
          <Columns3Icon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {translate('datatable.columns')}
        </DropdownMenuLabel>
        {items.map((item) => (
          <DropdownMenuCheckboxItem
            key={item.id}
            checked={visibility[item.id] !== false}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => onChange({ ...visibility, [item.id]: checked })}
          >
            {item.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SearchBox({ value, onChange, placeholder, label }: ToolbarSearch) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      if (document.querySelector('[role="dialog"]')) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <InputGroup className="w-full bg-background sm:max-w-72">
      <InputGroupAddon>
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="search"
        value={value}
        aria-label={label ?? placeholder ?? translate('datatable.search')}
        placeholder={placeholder ?? translate('datatable.search')}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault()
            onChange('')
          }
        }}
      />
      <InputGroupAddon align="inline-end" className="max-sm:hidden">
        <Kbd aria-hidden="true">/</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}

export function DataTableToolbar({
  search,
  scopes,
  filters,
  sort,
  columns,
  summary,
  actions,
  className,
}: DataTableToolbarProps) {
  const chips = (filters ?? []).flatMap((group) =>
    group.selected.map((value) => ({
      group,
      value,
      label: group.options.find((option) => option.value === value)?.label ?? value,
    }))
  )

  return (
    <div data-slot="data-table-toolbar" className={cn('mb-3 grid min-w-0 gap-3', className)}>
      {scopes ? <ScopeTabs {...scopes} /> : null}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {search ? <SearchBox {...search} /> : null}
        {filters && filters.length > 0 ? <FilterMenu groups={filters} /> : null}
        {sort ? (
          <Select value={sort.value} onValueChange={sort.onChange}>
            <SelectTrigger aria-label={sort.label ?? translate('datatable.sort')} className="w-auto min-w-36">
              <span className="text-muted-foreground">{sort.label ?? translate('datatable.sort')}</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {sort.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        {columns ? <ColumnsMenu {...columns} /> : null}
        {summary || actions ? (
          <div className="ms-auto flex shrink-0 items-center gap-3">
            {summary ? <span className="text-[13px] text-muted-foreground tabular-nums">{summary}</span> : null}
            {actions}
          </div>
        ) : null}
      </div>
      {chips.length > 0 ? (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <Badge
              key={`${chip.group.id}:${chip.value}`}
              variant="outline"
              className="h-6 gap-1 border-primary/20 bg-primary/5 pe-0.5 font-normal dark:border-primary/30 dark:bg-primary/10"
            >
              <span className="text-muted-foreground">{chip.group.label}:</span>
              {chip.label}
              <button
                type="button"
                aria-label={translate('datatable.removeFilter', {
                  value: typeof chip.label === 'string' ? chip.label : chip.value,
                })}
                onClick={() => chip.group.onChange(chip.group.selected.filter((value) => value !== chip.value))}
                className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-primary/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <XIcon aria-hidden="true" className="size-3" />
              </button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              for (const group of filters ?? []) if (group.selected.length > 0) group.onChange([])
            }}
          >
            {translate('datatable.clearFilters')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
