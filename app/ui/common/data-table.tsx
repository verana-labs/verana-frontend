'use client';

import React, { useState, useMemo } from 'react';
import { DataTableProps } from '@/app/types/dataTableTypes';

// Returns Tailwind classes for hiding by breakpoint
function getColumnClasses(priority?: number) {
  if (priority === undefined) return ''; // Always visible
  if (priority === 1) return 'hidden sm:table-cell';
  if (priority === 2) return 'hidden md:table-cell';
  if (priority === 3) return 'hidden lg:table-cell';
  if (priority === 4) return 'hidden xl:table-cell';
  if (priority === 5) return 'hidden 2xl:table-cell';
  return '';
}

export function DataTable<T extends object>({
  columns,
  data,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onRowClick,
  description,
  defaultSortColumn,
  defaultSortDirection = 'desc'

}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState<Record<string, string | boolean>>({});

  const [sortColumn, setSortColumn] = useState<keyof T | null>(defaultSortColumn ?? null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);

  // Filtering
  const filteredData = useMemo(() => {
    let list = Array.isArray(data) ? data : [];
    columns.forEach(col => {
      const key = col.accessor as string;
      const value = filters[key];
      if (col.filterType === 'checkbox') {
        if (value === true) {
          if (col.filterFn) {
            list = list.filter(row => col.filterFn!(row[col.accessor]));
          } else {
            list = list.filter(row => Boolean(row[col.accessor]));
          }
        }
      } else {
        if (typeof value === 'string' && value) {
          list = list.filter(row =>
            String(row[col.accessor] ?? '').toLowerCase().includes(value.toLowerCase())
          );
        }
      }
    });
    return list;
  }, [data, filters, columns]);

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
    <div className="data-table-container">
      {/* Help Section (if present) */}
      {description && Array.isArray(description) && (
        <div className="form-copy">
          {description.map((d, idx) => (
            <p key={idx} className="pb-2">
              {d}
            </p>
          ))}
        </div>
      )}
      <div className="data-table-scroll">
        <table className="data-table-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.accessor)}
                  onClick={() => handleSort(col.accessor)}
                  className={`data-table-th ${getColumnClasses(col.priority)}`}
                >
                  <div className="data-table-sort-header">
                    {col.header}
                    {sortColumn === col.accessor && (
                      <span className="data-table-sort-icon">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {columns.map((col) => (
                <th key={String(col.accessor)} className={`data-table-filter-th ${getColumnClasses(col.priority)}`}>
                  {col.filterType === 'checkbox' ? (
                    <label className="data-table-filter-label">
                      <input
                        type="checkbox"
                        checked={Boolean(filters[col.accessor as string])}
                        onChange={e => handleFilterChange(col.accessor, e.target.checked)}
                        className="data-table-filter-checkbox"
                      />
                      <span className='ml-2'>
                        {col.filterLabel ?? col.header}
                      </span>
                    </label>
                  ) : (
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={(filters[col.accessor as string] as string) || ''}
                        onChange={e => handleFilterChange(col.accessor, e.target.value)}
                        placeholder="Filter..."
                        className="input"
                        style={{ minWidth: 0 }}
                      />
                      {filters[col.accessor as string] && (
                        <button
                          type="button"
                          onClick={() => handleFilterChange(col.accessor, '')}
                          className="data-table-filter-x"
                          aria-label="Clear filter"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
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
                onClick={() => onRowClick?.(row)}
                className={` 
                  ${onRowClick ? 'data-table-row-click' : ''}
                  ${rowIdx % 2 === 0 ? 'data-table-row-even' : 'data-table-row-uneven'}
                `}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.accessor)}
                    className={`data-table-body-text ${getColumnClasses(col.priority)}`}
                  >
                    {col.format ? col.format(row[col.accessor]) : String(row[col.accessor] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 font-medium leading-none">
        <div className="flex items-center">
          <label htmlFor="pageSizeSelect" className='pr-2'>
            Rows per page:
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
            Previous
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
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
