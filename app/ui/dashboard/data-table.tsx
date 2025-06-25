import React, { useState, useEffect, useMemo } from 'react';

// Generic column definition
export type Column<T> = {
  header: string;
  accessor: keyof T;
};

// Props for the DataTable with pagination, sorting, and optional row click handler
export interface DataTableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (row: T) => void;
}

// Reusable DataTable component with Tailwind CSS, pagination, sorting, and pageSize selector
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

  useEffect(() => {
    setCurrentPage(0);
  }, [pageSize, data, sortColumn, sortDirection]);

  // Safe data and sorting
  const sortedData = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    if (!sortColumn) return list;
    return [...list].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = currentPage * pageSize;
  const currentData = sortedData.slice(startIndex, startIndex + pageSize);

  const goToPage = (page: number) => setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  const handleSort = (col: keyof T) => {
    if (sortColumn === col) {
      setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  // Page button range
  const maxButtons = 5;
  let startBtn = Math.max(0, currentPage - Math.floor(maxButtons / 2));
  let endBtn = Math.min(startBtn + maxButtons - 1, totalPages - 1);
  if (endBtn - startBtn + 1 < maxButtons) {
    startBtn = Math.max(0, endBtn - (maxButtons - 1));
  }
  const pageButtons = Array.from({ length: endBtn - startBtn + 1 }, (_, i) => startBtn + i);
  const showEllipsis = endBtn < totalPages - 1;

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-200">
            <tr>
              {columns.map(col => (
                <th
                  key={String(col.accessor)}
                  onClick={() => handleSort(col.accessor)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none"
                >
                  <div className="flex items-center">
                    {col.header}
                    {sortColumn === col.accessor && (
                      <span className="ml-1 text-sm">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={
                  `odd:bg-white even:bg-gray-50 ${
                    onRowClick ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`
                }
              >
                {columns.map(col => (
                  <td
                    key={String(col.accessor)}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                  >
                    {String(row[col.accessor])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination controls aligned right */}
      <div className="flex items-center justify-end space-x-6 py-3">
        <div className="flex items-center">
          <label htmlFor="pageSizeSelect" className="mr-2 text-sm text-gray-700">Rows per page:</label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="block w-20 py-1 px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 text-sm"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0} className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50">Previous</button>
          {pageButtons.map(pageIndex => (
            <button
              key={pageIndex}
              onClick={() => goToPage(pageIndex)}
              className={
                `px-3 py-1 rounded-md text-sm ${
                  pageIndex === currentPage
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`
              }
            >{pageIndex + 1}</button>
          ))}
          {showEllipsis && (
            <>
              <span className="px-2 text-gray-500">…</span>
              <button onClick={() => goToPage(totalPages - 1)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">{totalPages}</button>
            </>
          )}
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage + 1 >= totalPages} className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}