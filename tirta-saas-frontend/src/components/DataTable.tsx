import React, { useId, useMemo, useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  pageSize?: number;
  className?: string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends object>({
  data,
  columns,
  searchable = true,
  searchKeys = [],
  pageSize = 10,
  className = '',
  onRowClick,
  actions,
  emptyMessage = 'Tidak ada data tersedia',
  loading = false,
}: DataTableProps<T>) {
  const searchInputId = useId();
  const tableCaptionId = useId();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (searchTerm && searchKeys.length > 0) {
      filtered = filtered.filter((item) =>
        searchKeys.some((key) => {
          const value = item[key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        const sortKey = sortColumn.toString();
        const aValue = sortKey.includes('.')
          ? getNestedValue(a, sortKey)
          : (a as Record<string, unknown>)[sortColumn as string];
        const bValue = sortKey.includes('.')
          ? getNestedValue(b, sortKey)
          : (b as Record<string, unknown>)[sortColumn as string];

        if (aValue === bValue) return 0;

        const normalizedA = normalizeSortValue(aValue);
        const normalizedB = normalizeSortValue(bValue);

        if (typeof normalizedA === 'number' && typeof normalizedB === 'number') {
          const comparison = normalizedA > normalizedB ? 1 : -1;
          return sortDirection === 'asc' ? comparison : -comparison;
        }

        const comparison = String(normalizedA).localeCompare(String(normalizedB), 'id');
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, searchKeys, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const visibleStart = filteredData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const visibleEnd = filteredData.length === 0 ? 0 : Math.min(currentPage * pageSize, filteredData.length);
  const visibleColumns = columns.filter((column) => !column.hideOnMobile);

  const handleSort = (column: keyof T | string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') setSortColumn(null);
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLElement>, item: T) => {
    if (!onRowClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick(item);
    }
  };

  const getNestedValue = (obj: unknown, path: string): unknown => {
    return path.split('.').reduce<unknown>((current, key) => {
      if (!current || typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[key];
    }, obj);
  };

  const normalizeSortValue = (value: unknown): string | number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numericValue = Number(value);
      if (!Number.isNaN(numericValue) && value.trim() !== '') return numericValue;
      return value.toLowerCase();
    }
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (value instanceof Date) return value.getTime();
    return '';
  };

  const getColumnValue = (item: T, column: Column<T>) => {
    if (column.key.toString().includes('.')) {
      return getNestedValue(item, column.key as string);
    }
    return (item as Record<string, unknown>)[column.key as string];
  };

  const renderCellValue = (item: T, column: Column<T>): React.ReactNode => {
    const value = getColumnValue(item, column);
    const renderedValue = column.render ? column.render(value, item) : value;

    if (renderedValue === null || renderedValue === undefined || renderedValue === '') {
      return <span className="text-surface-300">—</span>;
    }

    if (typeof renderedValue === 'string' || typeof renderedValue === 'number' || typeof renderedValue === 'boolean') {
      return renderedValue;
    }

    if (Array.isArray(renderedValue)) return renderedValue as React.ReactNode;
    if (React.isValidElement(renderedValue)) return renderedValue;
    return String(renderedValue);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={`card overflow-hidden ${className}`}>
        <div className="p-4 border-b border-surface-100">
          <div className="h-10 w-full max-w-xs animate-pulse rounded-lg bg-surface-100" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-4 flex-1 animate-pulse rounded bg-surface-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-surface-100" />
              <div className="h-4 w-16 animate-pulse rounded bg-surface-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Search */}
      {searchable && searchKeys.length > 0 && (
        <div className="border-b border-surface-100 px-4 py-3">
          <div className="relative">
            <label htmlFor={searchInputId} className="sr-only">
              Cari data tabel
            </label>
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              id={searchInputId}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari..."
              aria-describedby={tableCaptionId}
              className="input-base pl-9 py-2"
            />
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div className="sm:hidden">
        {paginatedData.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <InboxIcon className="mx-auto h-10 w-10 text-surface-300" />
            <p className="mt-3 text-sm font-medium text-surface-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {paginatedData.map((item, index) => (
              <div
                key={index}
                className={`space-y-2.5 p-4 ${onRowClick ? 'cursor-pointer active:bg-surface-50 transition-colors' : ''}`}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(event) => handleRowKeyDown(event, item)}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {visibleColumns.map((column) => (
                  <div key={column.key as string} className="flex items-start justify-between gap-3">
                    <dt className="max-w-[45%] text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                      {column.label}
                    </dt>
                    <dd className="min-w-0 flex-1 text-right text-[13px] text-surface-700 break-words">
                      {renderCellValue(item, column)}
                    </dd>
                  </div>
                ))}
                {actions && (
                  <div
                    className="flex flex-wrap justify-end gap-2 border-t border-surface-100 pt-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {actions(item)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full divide-y divide-surface-100" aria-describedby={tableCaptionId}>
          <caption id={tableCaptionId} className="sr-only">
            Tabel data dengan {filteredData.length} baris hasil.
          </caption>
          <thead className="bg-surface-50/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  scope="col"
                  aria-sort={
                    column.sortable && sortColumn === column.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : sortDirection === 'desc'
                          ? 'descending'
                          : 'none'
                      : undefined
                  }
                  className={`px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-surface-500 ${
                    column.sortable ? 'cursor-pointer select-none hover:text-surface-700' : ''
                  } ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 rounded"
                      aria-label={`Urutkan kolom ${column.label}`}
                    >
                      <span>{column.label}</span>
                      <span className="flex-shrink-0" aria-hidden="true">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-3.5 w-3.5 text-brand-600" />
                          ) : sortDirection === 'desc' ? (
                            <ChevronDownIcon className="h-3.5 w-3.5 text-brand-600" />
                          ) : (
                            <div className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ChevronUpIcon className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />
                        )}
                      </span>
                    </button>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </th>
              ))}
              {actions && (
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-surface-500">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-12 text-center">
                  <InboxIcon className="mx-auto h-10 w-10 text-surface-300" />
                  <p className="mt-3 text-sm font-medium text-surface-500">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={index}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-surface-50/50' : ''
                  }`}
                  onClick={() => onRowClick?.(item)}
                  onKeyDown={(event) => handleRowKeyDown(event, item)}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className={`px-5 py-3.5 whitespace-nowrap text-[13px] text-surface-700 ${
                        column.align === 'right'
                          ? 'text-right'
                          : column.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                      } ${column.className || ''}`}
                    >
                      {renderCellValue(item, column)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-3.5 whitespace-nowrap text-right text-[13px] font-medium">
                      <div onClick={(e) => e.stopPropagation()}>
                        {actions(item)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-surface-100 px-4 py-3 sm:px-5">
          <div className="flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-secondary text-[13px]"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-secondary text-[13px] ml-3"
            >
              Berikutnya
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <p className="text-[13px] text-surface-500">
              Menampilkan <span className="font-medium text-surface-700">{visibleStart}</span>–<span className="font-medium text-surface-700">{visibleEnd}</span> dari <span className="font-medium text-surface-700">{filteredData.length}</span> hasil
            </p>
            <nav className="flex items-center gap-1" aria-label="Navigasi halaman">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Sebelumnya"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[32px] rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                        page === currentPage
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
                      }`}
                      aria-current={page === currentPage ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-1 text-surface-300">
                      …
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Berikutnya"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
