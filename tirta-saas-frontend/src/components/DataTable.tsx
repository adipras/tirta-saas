import React, { useId, useMemo, useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
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
    if (!onRowClick) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick(item);
    }
  };

  const getNestedValue = (obj: unknown, path: string): unknown => {
    return path.split('.').reduce<unknown>((current, key) => {
      if (!current || typeof current !== 'object') {
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, obj);
  };

  const normalizeSortValue = (value: unknown): string | number => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const numericValue = Number(value);
      if (!Number.isNaN(numericValue) && value.trim() !== '') {
        return numericValue;
      }

      return value.toLowerCase();
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

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
      return '-';
    }

    if (
      typeof renderedValue === 'string' ||
      typeof renderedValue === 'number' ||
      typeof renderedValue === 'boolean'
    ) {
      return renderedValue;
    }

    if (Array.isArray(renderedValue)) {
      return renderedValue as React.ReactNode;
    }

    if (React.isValidElement(renderedValue)) {
      return renderedValue;
    }

    return String(renderedValue);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="sr-only">Sedang memuat data tabel</span>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-sm rounded-lg ${className}`}>
      {searchable && searchKeys.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <label htmlFor={searchInputId} className="sr-only">
              Cari data tabel
            </label>
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      <div className="sm:hidden">
        {paginatedData.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">{emptyMessage}</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <div
                key={index}
                className={`space-y-3 p-4 ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(event) => handleRowKeyDown(event, item)}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {visibleColumns.map((column) => (
                  <div key={column.key as string} className="flex items-start justify-between gap-3">
                    <dt className="max-w-[45%] text-xs font-medium uppercase tracking-wide text-gray-500">
                      {column.label}
                    </dt>
                    <dd className="min-w-0 flex-1 text-right text-sm text-gray-900 break-words">
                      {renderCellValue(item, column)}
                    </dd>
                  </div>
                ))}
                {actions && (
                  <div
                    className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3"
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

      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full divide-y divide-gray-200" aria-describedby={tableCaptionId}>
          <caption id={tableCaptionId} className="sr-only">
            Tabel data dengan {filteredData.length} baris hasil.
          </caption>
          <thead className="bg-gray-50">
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
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'hover:bg-gray-100' : ''
                  } ${column.className || ''}`}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm"
                      aria-label={`Urutkan kolom ${column.label}`}
                    >
                      <span>{column.label}</span>
                      <span className="ml-1" aria-hidden="true">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : sortDirection === 'desc' ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <div className="h-4 w-4" />
                          )
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center">{column.label}</div>
                  )}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-6 py-4 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={index}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                  onClick={() => onRowClick?.(item)}
                  onKeyDown={(event) => handleRowKeyDown(event, item)}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                        column.align === 'right' ? 'text-right' : 
                        column.align === 'center' ? 'text-center' : 
                        'text-left'
                      } ${column.className || ''}`}
                    >
                      {renderCellValue(item, column)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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

      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Menampilkan{' '}
                <span className="font-medium">
                  {visibleStart}
                </span>{' '}
                sampai{' '}
                <span className="font-medium">
                  {visibleEnd}
                </span>{' '}
                dari <span className="font-medium">{filteredData.length}</span>{' '}
                hasil
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Navigasi halaman tabel"
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Ke halaman sebelumnya"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
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
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                        aria-current={page === currentPage ? 'page' : undefined}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span
                        key={page}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Ke halaman berikutnya"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
