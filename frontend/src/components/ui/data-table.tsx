'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronsUpDownIcon,
  DownloadIcon,
  RefreshCwIcon,
  SearchIcon,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField?: keyof T;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  selectable?: boolean;
  selectedRows?: T[];
  onSelectRows?: (rows: T[]) => void;
  onRowClick?: (row: T) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  title?: string;
  actions?: React.ReactNode;
  className?: string;
  stickyHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj as unknown);
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField = 'id' as keyof T,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  searchable = true,
  searchPlaceholder = 'Search...',
  sortable = true,
  paginated = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  selectable = false,
  selectedRows = [],
  onSelectRows,
  onRowClick,
  onRefresh,
  onExport,
  title,
  actions,
  className,
  stickyHeader = false,
  striped = true,
  bordered = false,
  compact = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    const searchableColumns = columns.filter((col) => col.searchable !== false);

    return data.filter((row) =>
      searchableColumns.some((col) => {
        const value = getNestedValue(row, col.key as string);
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, columns]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortColumn);
      const bValue = getNestedValue(b, sortColumn);

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison =
        typeof aValue === 'string'
          ? aValue.localeCompare(String(bValue))
          : (aValue as number) - (bValue as number);

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;

    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = useCallback(
    (columnKey: string) => {
      if (!sortable) return;

      if (sortColumn === columnKey) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'));
        if (sortDirection === 'desc') setSortColumn(null);
      } else {
        setSortColumn(columnKey);
        setSortDirection('asc');
      }
    },
    [sortColumn, sortDirection, sortable]
  );

  const handleSelectAll = useCallback(() => {
    if (!onSelectRows) return;

    if (selectedRows.length === paginatedData.length) {
      onSelectRows([]);
    } else {
      onSelectRows([...paginatedData]);
    }
  }, [paginatedData, selectedRows, onSelectRows]);

  const handleSelectRow = useCallback(
    (row: T) => {
      if (!onSelectRows) return;

      const isSelected = selectedRows.some((r) => r[keyField] === row[keyField]);
      if (isSelected) {
        onSelectRows(selectedRows.filter((r) => r[keyField] !== row[keyField]));
      } else {
        onSelectRows([...selectedRows, row]);
      }
    },
    [selectedRows, onSelectRows, keyField]
  );

  const isRowSelected = useCallback(
    (row: T) => selectedRows.some((r) => r[keyField] === row[keyField]),
    [selectedRows, keyField]
  );

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="h-4 w-4 text-primary" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-primary" />
    );
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      {(title || searchable || actions || onRefresh || onExport) && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            )}
            {loading && <RefreshCwIcon className="h-4 w-4 animate-spin text-gray-400" />}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {searchable && (
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-48 sm:w-64"
                />
              </div>
            )}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCwIcon className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <DownloadIcon className="h-4 w-4" />
              </Button>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead
            className={cn('bg-gray-50 dark:bg-gray-900/50', stickyHeader && 'sticky top-0 z-10')}
          >
            <tr>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      paginatedData.length > 0 && selectedRows.length === paginatedData.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable !== false &&
                      sortable &&
                      'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none'
                  )}
                  style={{ width: column.width }}
                  onClick={() =>
                    column.sortable !== false && sortable && handleSort(String(column.key))
                  }
                >
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      column.align === 'center' && 'justify-center',
                      column.align === 'right' && 'justify-end'
                    )}
                  >
                    {column.header}
                    {column.sortable !== false && sortable && (
                      <SortIcon columnKey={String(column.key)} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading && data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCwIcon className="h-8 w-8 animate-spin text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={String(row[keyField]) || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'cursor-pointer',
                    striped && rowIndex % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-900/25',
                    isRowSelected(row) && 'bg-primary/5 dark:bg-primary/10',
                    'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  )}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isRowSelected(row)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(row);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        'px-4 text-sm text-gray-900 dark:text-gray-100',
                        compact ? 'py-2' : 'py-3',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        bordered && 'border border-gray-200 dark:border-gray-700'
                      )}
                    >
                      {column.render
                        ? column.render(getNestedValue(row, String(column.key)), row, rowIndex)
                        : String(getNestedValue(row, String(column.key)) ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </span>
            {selectedRows.length > 0 && (
              <span className="text-primary">({selectedRows.length} selected)</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-2 py-1"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm text-gray-700 dark:text-gray-300">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
