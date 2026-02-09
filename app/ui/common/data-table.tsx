'use client';

import React, { useState, useMemo } from 'react';
import { DataTableProps, translateColumns, translateFilter } from '@/ui/datatable/types';
import { translate } from '@/i18n/dataview';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faPlus, faSort, faXmark } from '@fortawesome/free-solid-svg-icons';
import { resolveTranslatable } from '@/ui/dataview/types';
import DIDView from '@/did/[id]/view';
import { DidData } from '@/ui//dataview/datasections/did';
import TitleAndButton from '@/ui/common/title-and-button';

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
  onRowClick,
  defaultSortColumn,
  defaultSortDirection = 'desc',
  filterI18n,
  showDetailModal = false,
  tableTitle,
  addTitle,
  onAdd,
  titleFilter,
  rowClassName,
  renderMobileCard,
  detailTitle,
  onRefresh
}: DataTableProps<T>) {
  const columns = translateColumns(columnsI18n);
  const filter = translateFilter(filterI18n);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = initialPageSize;
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
  const displayStartIndex = startIndex + 1;
  const totalItems = sortedData.length;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalItems);
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
              { entities && (
              <div className="flex items-center justify-between">
                <h3 className="data-table-title">{resolveTranslatable({key: 'datatable.your'}, translate)} {entities}</h3>
              </div>
              )}
              { tableTitle && (addTitle || titleFilter) && (
              <TitleAndButton
                title=  {tableTitle}
                buttonLabel={addTitle}
                icon={addTitle ? faPlus : undefined}
                isTable={true}
                onClick={onAdd}
                titleFilter={titleFilter}
              />
              )}
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
                        if (showDetailModal) setSelectedRow(row);
                        else onRowClick?.(row);
                      }}
                      className={`data-table-row ${rowClassName ? rowClassName(row) : ''}`}
                    >
                      {columns.map((col) => {
                        const formatted = col.format
                          ? col.format(row[col.accessor])
                          : row[col.accessor];

                        const valueStr = String(formatted ?? "");

                        return (
                          <td
                            key={String(col.accessor)}
                            className={`data-table-td ${getColumnClasses(col.priority)} ${
                              col.className ? col.className(row[col.accessor]) : ""
                            }`}
                          >
                            {col.isHtml ? 
                            (<p dangerouslySetInnerHTML={{ __html: valueStr }}/>) : 
                            (valueStr)
                            }
                          </td>
                        );
                      })}
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
              {currentData.map((row, rowIdx) => {
                const cardClick = () => {
                  if (showDetailModal) setSelectedRow(row);
                  else onRowClick?.(row);
                };
                return renderMobileCard ? (
                  <div
                    key={rowIdx}
                    onClick={cardClick}
                    className={`data-table-card ${rowClassName ? rowClassName(row) : ''}`}
                  >
                    {renderMobileCard(row)}
                  </div>
                ) : (
                <div
                  key={rowIdx}
                  onClick={cardClick}
                  className={`data-table-card ${rowClassName ? rowClassName(row) : ''}`}
                >
                    <div className="flex justify-between">
                      <div className="flex flex-col space-y-2">
                      {columns.filter((col) => col.priority === undefined &&  !col.viewMobileRight)
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
                      {columns.filter((col) => col.viewMobileRight)
                      .map((col) => {
                        const formatted = col.format
                        ? col.format(row[col.accessor])
                        : row[col.accessor];
                        const valueStr = String(formatted ?? "");
                        return (
                          <div key={String(col.accessor)}>
                            {col.isHtml ?
                            (<p dangerouslySetInnerHTML={{ __html: valueStr }} />) :
                            (<label  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${col.className ? col.className(row[col.accessor]) : ''}`}>{ valueStr }</label>)
                            }
                          </div>)
                      })}
                      </div>
                    </div>
                </div>
                );
              })}
            </div>
            {/* Pagination controls */}
            <div className="px-6 py-4 border-t border-neutral-20 dark:border-neutral-70">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-70 dark:text-neutral-70">
                  Showing <span>{displayStartIndex}</span> to <span>{endIndex}</span> of <span>{totalItems}</span> results
                </div>

                <div className="flex items-center space-x-2">

                  {/* prev */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolveTranslatable({ key: 'datatable.previous' }, translate)}
                  </button>

                  {/* pages */}
                  <div className="flex space-x-1">
                    {pageButtons.map(pageIndex => (
                      <button
                        key={pageIndex}
                        onClick={() => goToPage(pageIndex)}
                        className={
                          pageIndex === currentPage
                            ? 'px-3 py-1 text-sm rounded-lg bg-primary-600 text-white'
                            : 'px-3 py-1 text-sm rounded-lg border border-neutral-20 dark:border-neutral-70 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      >
                        {pageIndex + 1}
                      </button>
                    ))}

                    {showEllipsis && (
                      <>
                        <span className="px-1 text-sm text-gray-500">…</span>
                        <button
                          onClick={() => goToPage(totalPages - 1)}
                          className="px-3 py-1 text-sm rounded-lg border border-neutral-20 dark:border-neutral-70 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  {/* next */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage + 1 >= totalPages}
                    className="px-3 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolveTranslatable({ key: 'datatable.next' }, translate)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* render modal */}
        {showDetailModal && selectedRow && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-xl bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{detailTitle}</h3>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="absolute top-4 right-4 text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <DIDView
                selectDidData={selectedRow as DidData }
                onBack={() => setSelectedRow(null)}
                showHeader={false}
                onRefreshTable={onRefresh}
              />
            </div>
          </div>
        )}
    </> 
  );
}
