'use client';

import React, { useState, useMemo } from 'react';
import { DataTableProps, translateColumns, translateFilter } from '@/ui/datatable/types';
import { translate } from '@/i18n/dataview';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faSort } from '@fortawesome/free-solid-svg-icons';
import { resolveTranslatable } from '@/ui/dataview/types';

// Returns Tailwind classes for hiding by breakpoint
function getColumnClasses(priority?: number) {
  if (priority === undefined) return ''; // Always visible
  if (priority === 1) return 'hidden sm:table-cell';
  if (priority === 2) return 'hidden md:table-cell';
  if (priority === 3) return 'hidden lg:table-cell';
  if (priority === 4) return 'hidden xl:table-cell';
  if (priority === 5) return 'hidden 2xl:table-cell';
  return 'hidden';
}

export function DataTable<T extends object>({
  entities,
  columnsI18n,
  data,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onRowClick,
  defaultSortColumn,
  defaultSortDirection = 'desc',
  filterI18n,
  showDetailModal = false
}: DataTableProps<T>) {
  const columns = translateColumns(columnsI18n);
  const filter = translateFilter(filterI18n);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState<Record<string, string | boolean>>({});

  const [sortColumn, setSortColumn] = useState<keyof T | null>(defaultSortColumn ?? null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);

  const [selectedRow, setSelectedRow] = useState<T | null>(null);

  // Filtering
  const filteredData = useMemo(() => {
    let list = Array.isArray(data) ? data : [];
    // apply external filters (the ones rendered above the table)
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'string' && value !== '') {
        list = list.filter((row) =>
          String(row[key as keyof T] ?? '').toLowerCase().includes(value.toLowerCase())
        );
      } else if (typeof value === 'boolean' && value) {
        list = list.filter((row) => Boolean(row[key as keyof T]));
      }
    });
    return list;
  }, [data, filters]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const startIndex = currentPage * pageSize;
  const currentData = sortedData.slice(startIndex, startIndex + pageSize);

  // Pagination controls
  const maxButtons = 5;
  let startBtn = Math.max(0, currentPage - Math.floor(maxButtons / 2));
  const endBtn = Math.min(startBtn + maxButtons - 1, totalPages - 1);
  if (endBtn - startBtn + 1 < maxButtons) startBtn = Math.max(0, endBtn - (maxButtons - 1));
  const pageButtons = Array.from({ length: endBtn - startBtn + 1 }, (_, i) => startBtn + i);
  const showEllipsis = endBtn < totalPages - 1;

  const goToPage = (page: number) =>
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));

  const handleSort = (col: keyof T) => {
    if (sortColumn === col) setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (accessor: keyof T, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [accessor as string]: value }));
    setCurrentPage(0);
  };

  return (
    <>
      {/* NEW: render external filters section (if provided) */}
      {filter && filter.length > 0 && (
        <section id="search-filters" className="mb-6">
          <div className="data-table-section-div p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {filter.map((f) => {
                // NEW: use the first column of the filter as the bound field
                const col = f.columns[0];
                const label = f.label;
                const placeholder = f.placeholder;
                const currentValue = filters[col as string] ?? '';

                // NEW: select filter
                if (f.inputType === 'select') {
                  return (
                    <div key={label} className="sm:w-48">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-surface text-gray-900 dark:text-white"
                        value={currentValue as string}
                        onChange={(e) => handleFilterChange(col, e.target.value)}
                      >
                        {(f.options ?? []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                // NEW: text filter
                return (
                  <div key={label} className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={placeholder}
                        className="w-full px-4 py-2 pr-10 border border-neutral-20 dark:border-neutral-70 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-surface text-gray-900 dark:text-white"
                        value={currentValue as string}
                        onChange={(e) => handleFilterChange(col, e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {/* NEW: simple icon placeholder */}
                        <FontAwesomeIcon icon={faMagnifyingGlass}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

        <section id="data-table-section" className="mb-8">
          <div className="data-table-section-div overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-20 dark:border-neutral-70">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{resolveTranslatable({key: 'datatable.did.your'}, translate)} {entities}</h3>
                <div className="text-sm text-neutral-70 dark:text-neutral-70">
                  <span id="results-count" className="">{currentData.length} {entities}</span>
                </div>
              </div>
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className='data-table-thead'>
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={String(col.accessor)}
                        onClick={() => handleSort(col.accessor)}
                        className={`data-table-th ${getColumnClasses(col.priority)}`}
                      >
                          {col.header}
                          <FontAwesomeIcon icon={faSort}/>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-10">
                        No results found
                      </td>
                    </tr>
                  )}
                  {currentData.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      onClick={() => {
                        if (showDetailModal) setSelectedRow(row);   // ← NEW
                        else onRowClick?.(row);
                      }}
                      className={'data-table-row'}
                    >
                      {columns.map((col) => (
                        <td
                          key={String(col.accessor)}
                          className={`data-table-td ${getColumnClasses(col.priority)} ${
                            col.className ? col.className(row[col.accessor]) : ''}` }
                          >                          
                          {col.format ? col.format(row[col.accessor]) : String(row[col.accessor] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden data-table-list" id="mobile-dids-list">
              {currentData.length === 0 && (
                <div className="text-center py-10">
                    No results found
                </div>
              )}
              {currentData.map((row, rowIdx) => (
                <div
                  key={rowIdx}
                  onClick={() => {
                    if (showDetailModal) setSelectedRow(row);   // ← NEW
                    else onRowClick?.(row);
                  }}
                  className={'data-table-card'}
                >
                  {/* <div className="flex flex-col space-y-2"> */}
                    <div className="flex justify-between">
                      <div className="flex flex-col space-y-2">
                      {columns.filter((col) => col.priority === undefined)
                      .map((col) => (
                        <div key={String(col.accessor)} >
                          <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">{col.header}</label>
                          <p 
                            className={`text-sm font-mono text-gray-900 dark:text-white ${
                                col.className ? col.className(row[col.accessor]) : ''
                              }`}
                          >
                            {col.format ? col.format(row[col.accessor]) : String(row[col.accessor] ?? '')}
                          </p>
                        </div>
                      ))}
                      </div>
                      <div className="text-right">
                      {columns.filter((col) => col.priority === 9999)
                      .map((col) => (
                        <div key={String(col.accessor)} >
                          <label 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                col.className ? col.className(row[col.accessor]) : ''
                              }`}
                          >
                            {col.format ? col.format(row[col.accessor]) : String(row[col.accessor] ?? '')}
                          </label>
                        </div>
                      ))}
                      </div>
                    </div>
                  {/* </div> */}
                </div>
              ))}
            </div>

          </div>
          {/* Pagination controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 font-medium leading-none">
            <div className="flex items-center">
              <label htmlFor="pageSizeSelect" className='pr-2'>
                {resolveTranslatable({key: 'datatable.rowspage'}, translate)}:
              </label>
              <select
                id="pageSizeSelect"
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0); // Go to first page when changing page size
                }}
                className="select block w-20"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <div className="actions-center">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="btn-action"
              >
                {resolveTranslatable({key: 'datatable.previous'}, translate)}
              </button>
              {pageButtons.map(pageIndex => (
                <button
                  key={pageIndex}
                  onClick={() => goToPage(pageIndex)}
                  className={`px-3 py-1 
                    ${pageIndex === currentPage
                      ? 'data-table-current-page'
                      : 'btn-action'}
                  `}
                >{pageIndex + 1}</button>
              ))}
              {showEllipsis && (
                <>
                  <span>…</span>
                  <button
                    onClick={() => goToPage(totalPages - 1)}
                    className="btn-action"
                  >{totalPages}</button>
                </>
              )}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage + 1 >= totalPages}
                className="btn-action"
              >
                {resolveTranslatable({key: 'datatable.next'}, translate)}
              </button>
            </div>
          </div>
        </section>

        {/* render modal */}
        {showDetailModal && selectedRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-surface rounded-lg p-6 max-w-lg w-full shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {entities}
                </h3>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {columns.map((col) => (
                  <div key={String(col.accessor)}>
                    <p className="text-xs text-neutral-70 dark:text-neutral-70">{col.header}</p>
                    <p className="text-sm text-gray-900 dark:text-white break-all">
                      {col.format
                        ? col.format(selectedRow[col.accessor])
                        : String(selectedRow[col.accessor] ?? '')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

    </>
  );
}
