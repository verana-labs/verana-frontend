import React, { useState, useEffect, useMemo, ReactNode } from 'react';

// Generic column definition
export type Column<T> = {
  header: string;
  accessor: keyof T;
  filterType?: 'text' | 'checkbox';
  filterLabel?: string;
  filterFn?: (value: T[keyof T]) => boolean;
  format?: (value: T[keyof T]) => ReactNode;
};

export interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
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
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    setCurrentPage(0);
  }, [pageSize, data, sortColumn, sortDirection, filters]);

  // apply filters
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

  // apply sorting
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

  // pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = currentPage * pageSize;
  const currentData = sortedData.slice(startIndex, startIndex + pageSize);

  const goToPage = (page: number) => setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  const handleSort = (col: keyof T) => {
    if (sortColumn === col) setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'));
    else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };
  const handleFilterChange = (accessor: keyof T, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [accessor as string]: value }));
  };

  // page buttons
  const maxButtons = 5;
  let startBtn = Math.max(0, currentPage - Math.floor(maxButtons / 2));
  const endBtn = Math.min(startBtn + maxButtons - 1, totalPages - 1);
  if (endBtn - startBtn + 1 < maxButtons) startBtn = Math.max(0, endBtn - (maxButtons - 1));
  const pageButtons = Array.from({ length: endBtn - startBtn + 1 }, (_, i) => startBtn + i);
  const showEllipsis = endBtn < totalPages - 1;

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.accessor)}
                  onClick={() => handleSort(col.accessor)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer select-none"
                >
                  <div className="flex items-center">
                    {col.header}
                    {sortColumn === col.accessor && <span className="ml-1 text-sm">{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                  </div>
                </th>
              ))}
            </tr>
            <tr className="bg-gray-100 dark:bg-gray-800 ">
              {columns.map(col => (
                <th key={String(col.accessor)} className="px-6 py-2">
                  {col.filterType === 'checkbox' ? (
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(filters[col.accessor as string])}
                        onChange={e => handleFilterChange(col.accessor, e.target.checked)}
                        className="form-checkbox h-4 w-4 text-blue-200"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">{col.filterLabel ?? col.header}</span>
                    </label>
                  ) : (
                    <input
                      type="text"
                      value={(filters[col.accessor as string] as string) || ''}
                      onChange={e => handleFilterChange(col.accessor, e.target.value)}
                      placeholder="Filter..."
                      className="w-full py-1 px-2 border dark:bg-gray-900 dark:bg-gray-900 border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 font-medium"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className=" divide-y divide-gray-200 dark:divide-gray-700">
            {currentData.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={`odd:bg-white dark:odd:bg-black even:bg-gray-100 dark:even:bg-gray-800 ${onRowClick ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' : ''}`}
              >
                {columns.map(col => (
                  <td key={String(col.accessor)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                    {col.format ? col.format(row[col.accessor]) : String(row[col.accessor])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      <div className="flex items-center justify-end space-x-6 py-3">
        <div className="flex items-center">
          <label htmlFor="pageSizeSelect" className="mr-2 text-sm text-gray-700 dark:text-gray-200" >Rows per page:</label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="block w-20 py-1 px-2 border border-gray-300 bg-white dark:bg-black rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 text-sm"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          {pageButtons.map(pageIndex => (
            <button
              key={pageIndex}
              onClick={() => goToPage(pageIndex)}
              className={`px-3 py-1 rounded-md text-sm ${
                pageIndex === currentPage ? 'bg-blue-400 text-white drk:text-black' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >{pageIndex + 1}</button>
          ))}
          {showEllipsis && (
            <>
              <span className="px-2 text-gray-500 dark:text-gray-300">…</span>
              <button
                onClick={() => goToPage(totalPages - 1)}
                className="px-3 py-1 bg-gray-100 text-gray-700 dark:text-gray-200 rounded-md text-sm hover:bg-gray-200"
              >{totalPages}</button>
            </>
          )}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage + 1 >= totalPages}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}