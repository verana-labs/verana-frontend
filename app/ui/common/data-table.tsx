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
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState<Record<string, string | boolean>>({});
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
  let endBtn = Math.min(startBtn + maxButtons - 1, totalPages - 1);
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
    <div className="
      w-full
      mx-auto p-4 rounded-2xl shadow bg-light-bg dark:bg-dark-bg
    ">
      <div className="overflow-x-auto w-full">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.accessor)}
                  onClick={() => handleSort(col.accessor)}
                  className={
                    getColumnClasses(col.priority) +
                    " text-left text-base font-semibold leading-none text-gray-700 dark:text-gray-200 bg-white dark:bg-black px-4 py-3 cursor-pointer select-none"
                  }
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {sortColumn === col.accessor && (
                      <span className="ml-1 text-base">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {columns.map((col) => (
                <th key={String(col.accessor)} className={getColumnClasses(col.priority) + " px-4 py-2 bg-light-bg dark:bg-dark-bg"}>
                  {col.filterType === 'checkbox' ? (
                    <label className="w-full flex items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(filters[col.accessor as string])}
                        onChange={e => handleFilterChange(col.accessor, e.target.checked)}
                        className="form-checkbox h-4 w-4 text-blue-500 accent-blue-500"
                      />
                      <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-200">
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
                        className="w-full py-1 px-2 pr-6 border border-gray-200 dark:border-gray-600 rounded-md text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 font-medium"
                        style={{ minWidth: 0 }}
                      />
                      {filters[col.accessor as string] && (
                        <button
                          type="button"
                          onClick={() => handleFilterChange(col.accessor, '')}
                          className="absolute right-1 text-gray-400 hover:text-red-500 focus:outline-none"
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
                <td colSpan={columns.length} className="text-center text-gray-500 py-10">
                  No results found
                </td>
              </tr>
            )}
            {currentData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                className={`transition-all duration-150 
                  ${onRowClick ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950' : ''}
                  ${rowIdx % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-gray-50 dark:bg-gray-900'}
                `}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.accessor)}
                    className={getColumnClasses(col.priority) + " text-sm font-normal leading-none text-gray-700 dark:text-gray-200 px-4 py-4 whitespace-nowrap"}
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
          <label htmlFor="pageSizeSelect" className="mr-2 text-gray-700 dark:text-gray-200">
            Rows per page:
          </label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0); // Go to first page when changing page size
            }}
            className="block w-20 py-1 px-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-40"
          >
            Previous
          </button>
          {pageButtons.map(pageIndex => (
            <button
              key={pageIndex}
              onClick={() => goToPage(pageIndex)}
              className={`px-3 py-1 rounded-md transition-colors 
                ${pageIndex === currentPage
                  ? 'bg-blue-500 text-white font-bold shadow'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900'}
              `}
            >{pageIndex + 1}</button>
          ))}
          {showEllipsis && (
            <>
              <span className="px-2 text-gray-500 dark:text-gray-300">…</span>
              <button
                onClick={() => goToPage(totalPages - 1)}
                className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900"
              >{totalPages}</button>
            </>
          )}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage + 1 >= totalPages}
            className="px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
