'use client'

import {
  type Cell,
  type Column,
  type ColumnHelper,
  type ColumnVisibilityState,
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  filterFn_includesString,
  globalFilteringFeature,
  type Header,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  type SortingState,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type Updater,
  useTable,
} from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { type DataTableError, DataTableMessage } from '@/ui/common/data-table/data-table-empty'
import { DataTablePagination } from '@/ui/common/data-table/data-table-pagination'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'

export type DataTableColumnMeta = {
  align?: 'start' | 'end'
  label?: string
  mobile?: 'primary' | 'end' | 'field' | 'hidden'
  className?: string
  headerClassName?: string
}

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, datetime: sortFn_datetime, text: sortFn_text },
  filterFns: { includesString: filterFn_includesString },
  columnMeta: {} as DataTableColumnMeta,
})

export type DataTableFeatures = typeof dataTableFeatures

export type DataTableColumn<TData extends RowData> = ReturnType<
  ColumnHelper<DataTableFeatures, TData>['columns']
>[number]

export function dataTableColumns<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>()
}

export type { ColumnVisibilityState, PaginationState, RowSelectionState, SortingState }

type RowDomProps = HTMLAttributes<HTMLElement> & { [key: `data-${string}`]: string | number | undefined }

export type DataTableProps<TData extends RowData> = {
  columns: DataTableColumn<TData>[]
  data: TData[] | null | undefined
  label: string
  getRowId?: (row: TData) => string
  loading?: boolean
  error?: DataTableError | null
  empty?: ReactNode
  skeletonRows?: number
  search?: string
  sorting?: SortingState
  defaultSorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  pageSize?: number
  pageSizes?: number[]
  columnVisibility?: ColumnVisibilityState
  onColumnVisibilityChange?: (visibility: ColumnVisibilityState) => void
  selectable?: boolean | ((row: TData) => boolean)
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
  onRowClick?: (row: TData) => void
  rowHref?: (row: TData) => string | undefined
  activeRowId?: string | null
  rowAttributes?: (row: TData) => Record<`data-${string}`, string | undefined>
  maxHeight?: string
  footer?: ReactNode
  variant?: 'card' | 'plain'
  className?: string
}

function useControlled<T>(value: T | undefined, initial: T, onChange?: (next: T) => void) {
  const [local, setLocal] = useState<T>(initial)
  const current = value ?? local
  const set = useCallback(
    (updater: Updater<T>) => {
      const next = typeof updater === 'function' ? (updater as (old: T) => T)(current) : updater
      setLocal(next)
      onChange?.(next)
    },
    [current, onChange]
  )
  return [current, set] as const
}

function metaOf<TData extends RowData>(column: Column<DataTableFeatures, TData, unknown>): DataTableColumnMeta {
  return column.columnDef.meta ?? {}
}

export function headerLabel<TData extends RowData>(column: Column<DataTableFeatures, TData, unknown>): string {
  const meta = metaOf(column)
  if (meta.label) return meta.label
  const header = column.columnDef.header
  return typeof header === 'string' ? header : column.id
}

const SELECT_COLUMN = '__select'
const INTERACTIVE = 'a, button, input, select, textarea, label, [role="checkbox"], [role="menuitem"], [data-row-ignore]'
const ROW_INTERACTIVE =
  'cursor-pointer outline-none focus-visible:bg-primary/[0.06] focus-visible:shadow-[inset_2px_0_0_var(--ring)]'

function selectionColumn<TData extends RowData>(): DataTableColumn<TData> {
  return {
    id: SELECT_COLUMN,
    enableSorting: false,
    enableHiding: false,
    enableGlobalFilter: false,
    meta: { mobile: 'hidden', className: 'w-10', headerClassName: 'w-10' },
    header: ({ table }) => (
      <Checkbox
        aria-label={translate('datatable.selectAll')}
        checked={table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? 'indeterminate' : false}
        onCheckedChange={(checked) => table.toggleAllRowsSelected(checked === true)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={translate('datatable.selectRow')}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
      />
    ),
  }
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUpIcon aria-hidden="true" className="size-3.5 text-primary" />
  if (direction === 'desc') return <ArrowDownIcon aria-hidden="true" className="size-3.5 text-primary" />
  return (
    <ArrowUpDownIcon
      aria-hidden="true"
      className="size-3.5 opacity-0 transition-opacity duration-(--duration-fast) group-hover/sort:opacity-60 group-focus-visible/sort:opacity-60"
    />
  )
}

function HeaderCell<TData extends RowData>({
  header,
  render,
}: {
  header: Header<DataTableFeatures, TData, unknown>
  render: ReactNode
}) {
  const meta = metaOf(header.column)
  const direction = header.column.getIsSorted()
  const sortable = header.column.getCanSort()
  return (
    <TableHead
      aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined}
      className={cn(
        'sticky top-0 z-10 h-10 bg-muted/60 px-3 text-xs font-medium tracking-tight text-muted-foreground backdrop-blur-sm first:ps-4 last:pe-4 dark:bg-muted/40',
        meta.align === 'end' && 'text-right',
        meta.headerClassName
      )}
    >
      {header.isPlaceholder ? null : sortable ? (
        <button
          type="button"
          onClick={header.column.getToggleSortingHandler()}
          className={cn(
            'group/sort -mx-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 outline-none transition-colors duration-(--duration-fast) ease-standard hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
            direction && 'text-foreground',
            meta.align === 'end' && 'flex-row-reverse'
          )}
        >
          {render}
          <SortIcon direction={direction} />
        </button>
      ) : (
        render
      )}
    </TableHead>
  )
}

function bodyCellClass<TData extends RowData>(cell: Cell<DataTableFeatures, TData, unknown>) {
  const meta = metaOf(cell.column)
  return cn('px-3 py-3 text-sm first:ps-4 last:pe-4', meta.align === 'end' && 'text-right tabular-nums', meta.className)
}

function StatusRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="p-0 whitespace-normal">
        {children}
      </TableCell>
    </TableRow>
  )
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  label,
  getRowId,
  loading,
  error,
  empty,
  skeletonRows = 5,
  search,
  sorting: sortingProp,
  defaultSorting = [],
  onSortingChange,
  pageSize,
  pageSizes,
  columnVisibility: visibilityProp,
  onColumnVisibilityChange,
  selectable,
  rowSelection: selectionProp,
  onRowSelectionChange,
  onRowClick,
  rowHref,
  activeRowId,
  rowAttributes,
  maxHeight,
  footer,
  variant = 'card',
  className,
}: DataTableProps<TData>) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const bodyRef = useRef<HTMLElement>(null)
  const [focusIndex, setFocusIndex] = useState(0)
  const [sorting, setSorting] = useControlled(sortingProp, defaultSorting, onSortingChange)
  const [columnVisibility, setColumnVisibility] = useControlled(visibilityProp, {}, onColumnVisibilityChange)
  const [rowSelection, setRowSelection] = useControlled(selectionProp, {}, onRowSelectionChange)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: pageSize ?? 0 })

  const allColumns = useMemo(
    () => (selectable ? [selectionColumn<TData>(), ...columns] : columns),
    [columns, selectable]
  )
  const rows = useMemo(() => data ?? [], [data])
  const paginated = pageSize !== undefined

  const table = useTable({
    features: dataTableFeatures,
    columns: allColumns,
    data: rows,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    enableRowSelection:
      typeof selectable === 'function'
        ? (row: Row<DataTableFeatures, TData>) => selectable(row.original)
        : Boolean(selectable),
    globalFilterFn: 'includesString',
    manualPagination: !paginated,
    autoResetPageIndex: true,
    state: { sorting, columnVisibility, rowSelection, pagination, globalFilter: search ?? '' },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
  })

  const tableRows = table.getRowModel().rows
  const totalRows = table.getPrePaginatedRowModel().rows.length
  const visibleColumns = table.getVisibleLeafColumns()
  const interactive = Boolean(onRowClick || rowHref)
  const showSkeleton = !error && (loading || data === null || data === undefined)
  const status = error ? 'error' : showSkeleton ? 'loading' : tableRows.length === 0 ? 'empty' : 'ready'
  const filtered = Boolean(search) && rows.length > 0

  function activate(row: TData, event?: MouseEvent | KeyboardEvent) {
    const href = rowHref?.(row)
    if (href) {
      if (event && (event.metaKey || event.ctrlKey)) window.open(href, '_blank', 'noopener')
      else router.push(href)
      return
    }
    onRowClick?.(row)
  }

  function onRowMouse(event: MouseEvent<HTMLElement>, row: TData) {
    if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return
    if (window.getSelection()?.toString()) return
    activate(row, event)
  }

  function focusRow(index: number) {
    const next = Math.max(0, Math.min(tableRows.length - 1, index))
    setFocusIndex(next)
    bodyRef.current?.querySelector<HTMLElement>(`[data-row-index="${next}"]`)?.focus()
  }

  function onRowKey(event: KeyboardEvent<HTMLElement>, row: TData, index: number) {
    if (event.target !== event.currentTarget) return
    const moves: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: tableRows.length - 1,
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate(row, event)
    } else if (event.key in moves) {
      event.preventDefault()
      focusRow(moves[event.key])
    }
  }

  function rowProps(row: Row<DataTableFeatures, TData>, index: number): RowDomProps {
    const active = activeRowId !== undefined && activeRowId !== null && row.id === activeRowId
    return {
      'data-row-index': index,
      'data-row-id': row.id,
      'data-state': row.getIsSelected() || active ? 'selected' : undefined,
      'aria-selected': selectable ? row.getIsSelected() : undefined,
      'aria-current': active ? ('true' as const) : undefined,
      ...rowAttributes?.(row.original),
      ...(interactive
        ? {
            tabIndex: index === Math.min(focusIndex, tableRows.length - 1) ? 0 : -1,
            onClick: (event: MouseEvent<HTMLElement>) => onRowMouse(event, row.original),
            onKeyDown: (event: KeyboardEvent<HTMLElement>) => onRowKey(event, row.original, index),
            onFocus: () => setFocusIndex(index),
          }
        : {}),
    }
  }

  const frame = cn(
    'min-w-0 animate-in fade-in-0 duration-200 ease-standard motion-reduce:animate-none',
    variant === 'card' && 'overflow-hidden rounded-xl bg-card shadow-card',
    className
  )

  const message = (
    <DataTableMessage error={error} empty={empty} filtered={filtered} columns={Math.min(visibleColumns.length, 4)} />
  )

  const pager =
    paginated && status === 'ready' && totalRows > (pageSize ?? 0) ? (
      <DataTablePagination
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        total={totalRows}
        pageSizes={pageSizes}
        onPageChange={(pageIndex) => table.setPageIndex(pageIndex)}
        onPageSizeChange={(size) => table.setPageSize(size)}
      />
    ) : null

  const tail =
    pager || footer ? (
      <div className="border-t border-border/70">
        {pager}
        {footer ? <div className="px-4 py-2.5">{footer}</div> : null}
      </div>
    ) : null

  if (isMobile)
    return (
      <div data-slot="data-table" data-status={status} aria-label={label} role="region" className={frame}>
        {status === 'ready' ? (
          <ul ref={bodyRef as RefObject<HTMLUListElement>} aria-label={label} className="divide-y divide-border/70">
            {tableRows.map((row, index) => (
              <MobileRow key={row.id} row={row} interactive={interactive} {...rowProps(row, index)} />
            ))}
          </ul>
        ) : status === 'loading' ? (
          <ul aria-busy="true" className="divide-y divide-border/70">
            {Array.from({ length: Math.min(skeletonRows, 4) }, (_, index) => (
              <li key={index} className="grid gap-2 px-4 py-3.5">
                <Skeleton className="h-4 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </li>
            ))}
          </ul>
        ) : (
          message
        )}
        {tail}
      </div>
    )

  return (
    <div data-slot="data-table" data-status={status} className={frame}>
      <div
        data-slot="table-container"
        className={cn('relative w-full overflow-x-auto', maxHeight && 'overflow-y-auto')}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table
          aria-label={label}
          aria-busy={status === 'loading' || undefined}
          className="w-full caption-bottom text-sm"
        >
          <TableHeader className="[&_tr]:border-b [&_tr]:border-border/70">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => (
                  <HeaderCell key={header.id} header={header} render={<table.FlexRender header={header} />} />
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody ref={bodyRef as RefObject<HTMLTableSectionElement>} className="[&_tr]:border-border/70">
            {status === 'ready' ? (
              tableRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  {...rowProps(row, index)}
                  className={cn(
                    'transition-colors duration-(--duration-fast) ease-standard hover:bg-primary/[0.035] data-[state=selected]:bg-primary/[0.07] data-[state=selected]:shadow-[inset_2px_0_0_var(--primary)]',
                    interactive && ROW_INTERACTIVE
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={bodyCellClass(cell)}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : status === 'loading' ? (
              Array.from({ length: skeletonRows }, (_, index) => (
                <TableRow key={index} className="hover:bg-transparent">
                  {visibleColumns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn('px-3 py-3.5 first:ps-4 last:pe-4', metaOf(column).align === 'end' && 'text-right')}
                    >
                      <Skeleton
                        className={cn('h-4', metaOf(column).align === 'end' ? 'ms-auto w-12' : 'w-3/4 max-w-40')}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <StatusRow colSpan={visibleColumns.length}>{message}</StatusRow>
            )}
          </TableBody>
        </table>
      </div>
      {tail}
    </div>
  )
}

function MobileRow<TData extends RowData>({
  row,
  interactive,
  ...props
}: {
  row: Row<DataTableFeatures, TData>
  interactive: boolean
} & RowDomProps) {
  const cells = row.getVisibleCells()
  const flagged = cells.find((cell) => metaOf(cell.column).mobile === 'primary')
  const primary =
    flagged ?? cells.find((cell) => cell.column.id !== SELECT_COLUMN && metaOf(cell.column).mobile !== 'hidden')
  const end = cells.filter((cell) => metaOf(cell.column).mobile === 'end')
  const select = cells.find((cell) => cell.column.id === SELECT_COLUMN)
  const fields = cells.filter(
    (cell) =>
      cell !== primary && cell !== select && !end.includes(cell) && (metaOf(cell.column).mobile ?? 'field') === 'field'
  )
  return (
    <li
      {...props}
      className={cn(
        'grid gap-2.5 px-4 py-3.5 data-[state=selected]:bg-primary/[0.07]',
        interactive && 'cursor-pointer outline-none focus-visible:bg-primary/[0.06] active:bg-primary/[0.05]'
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {select ? <FlexRender cell={select} /> : null}
        <div className="min-w-0 flex-1">{primary ? <FlexRender cell={primary} /> : null}</div>
        {end.length > 0 ? (
          <div className="flex shrink-0 items-center gap-1">
            {end.map((cell) => (
              <FlexRender key={cell.id} cell={cell} />
            ))}
          </div>
        ) : null}
      </div>
      {fields.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
          {fields.map((cell) => (
            <div key={cell.id} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{headerLabel(cell.column)}</dt>
              <dd className="min-w-0 truncate text-foreground tabular-nums">
                <FlexRender cell={cell} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </li>
  )
}
