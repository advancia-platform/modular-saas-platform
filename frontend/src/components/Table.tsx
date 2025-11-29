'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  FilterIcon,
  Loader2Icon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface TableColumn<T> {
  /** Unique key for the column */
  key: keyof T | string;
  /** Column header label */
  label: string;
  /** Column width (CSS value) */
  width?: string;
  /** Minimum width */
  minWidth?: string;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Enable filtering for this column */
  filterable?: boolean;
  /** Custom cell renderer */
  render?: (value: unknown, row: T, index: number) => ReactNode;
  /** Cell alignment */
  align?: 'left' | 'center' | 'right';
  /** Header alignment */
  headerAlign?: 'left' | 'center' | 'right';
  /** Hide on mobile */
  hideOnMobile?: boolean;
  /** Sticky column */
  sticky?: 'left' | 'right';
}

export interface TableProps<T extends Record<string, unknown>> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Data to display */
  data: T[];
  /** Loading state */
  loading?: boolean;
  /** Unique key for each row */
  rowKey?: keyof T | ((row: T) => string);
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: Set<string>;
  /** Selection change handler */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Enable pagination */
  pagination?:
    | boolean
    | {
        pageSize?: number;
        pageSizeOptions?: number[];
        showTotal?: boolean;
        showPageSizeSelector?: boolean;
      };
  /** Enable search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** External search value */
  search?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: ReactNode;
  /** Table variant */
  variant?: 'default' | 'striped' | 'bordered' | 'minimal';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Sticky header */
  stickyHeader?: boolean;
  /** Max height for scrollable table */
  maxHeight?: string;
  /** Additional class names */
  className?: string;
  /** Header actions */
  headerActions?: ReactNode;
  /** Row actions renderer */
  rowActions?: (row: T, index: number) => ReactNode;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

// ============================================================================
// Utility Functions
// ============================================================================

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function defaultSort<T>(a: T, b: T, column: string, direction: SortDirection): number {
  if (!direction) return 0;

  const aVal = getNestedValue(a, column);
  const bVal = getNestedValue(b, column);

  if (aVal === bVal) return 0;
  if (aVal === null || aVal === undefined) return 1;
  if (bVal === null || bVal === undefined) return -1;

  let comparison = 0;
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    comparison = aVal.localeCompare(bVal);
  } else if (typeof aVal === 'number' && typeof bVal === 'number') {
    comparison = aVal - bVal;
  } else if (aVal instanceof Date && bVal instanceof Date) {
    comparison = aVal.getTime() - bVal.getTime();
  } else {
    comparison = String(aVal).localeCompare(String(bVal));
  }

  return direction === 'asc' ? comparison : -comparison;
}

// ============================================================================
// Size & Variant Styles
// ============================================================================

const sizeStyles = {
  sm: {
    cell: 'px-3 py-2 text-xs',
    header: 'px-3 py-2 text-xs',
  },
  md: {
    cell: 'px-4 py-3 text-sm',
    header: 'px-4 py-3 text-xs',
  },
  lg: {
    cell: 'px-6 py-4 text-base',
    header: 'px-6 py-3 text-sm',
  },
};

const variantStyles = {
  default: {
    wrapper: 'border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden',
    header: 'bg-gray-50 dark:bg-gray-800/50',
    row: 'border-b border-gray-200 dark:border-gray-700 last:border-0',
    rowHover: 'hover:bg-gray-50 dark:hover:bg-gray-800/30',
  },
  striped: {
    wrapper: 'border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden',
    header: 'bg-gray-100 dark:bg-gray-800',
    row: 'even:bg-gray-50 dark:even:bg-gray-800/30',
    rowHover: 'hover:bg-gray-100 dark:hover:bg-gray-800/50',
  },
  bordered: {
    wrapper: 'border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden',
    header: 'bg-gray-50 dark:bg-gray-800/50 border-b-2 border-gray-200 dark:border-gray-600',
    row: 'border-b border-gray-200 dark:border-gray-700',
    rowHover: 'hover:bg-gray-50 dark:hover:bg-gray-800/30',
  },
  minimal: {
    wrapper: '',
    header: 'border-b border-gray-200 dark:border-gray-700',
    row: 'border-b border-gray-100 dark:border-gray-800 last:border-0',
    rowHover: 'hover:bg-gray-50 dark:hover:bg-gray-800/20',
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  rowKey = 'id' as keyof T,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  onRowClick,
  pagination = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  search: externalSearch,
  onSearchChange,
  emptyMessage = 'No data available',
  emptyIcon,
  variant = 'default',
  size = 'md',
  stickyHeader = false,
  maxHeight,
  className,
  headerActions,
  rowActions,
}: TableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    typeof pagination === 'object' ? pagination.pageSize || 10 : 10
  );

  const search = externalSearch ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;

  const styles = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  // Get row key
  const getRowKey = useCallback(
    (row: T, index: number): string => {
      if (typeof rowKey === 'function') {
        return rowKey(row);
      }
      const key = row[rowKey];
      return key !== undefined ? String(key) : String(index);
    },
    [rowKey]
  );

  // Filter data
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;

    const searchLower = search.toLowerCase();
    const searchableColumns = columns.filter((col) => col.filterable !== false);

    return data.filter((row) =>
      searchableColumns.some((col) => {
        const value = getNestedValue(row, String(col.key));
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [data, search, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredData;

    return [...filteredData].sort((a, b) => defaultSort(a, b, sort.column!, sort.direction));
  }, [filteredData, sort]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Reset page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortedData.length]);

  // Handle sort
  const handleSort = (columnKey: string) => {
    setSort((prev) => {
      if (prev.column !== columnKey) {
        return { column: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column: columnKey, direction: 'desc' };
      }
      return { column: null, direction: null };
    });
  };

  // Handle selection
  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    const allKeys = new Set(paginatedData.map((row, i) => getRowKey(row, i)));
    const allSelected = [...allKeys].every((key) => selectedKeys.has(key));

    if (allSelected) {
      const newKeys = new Set(selectedKeys);
      allKeys.forEach((key) => newKeys.delete(key));
      onSelectionChange(newKeys);
    } else {
      onSelectionChange(new Set([...selectedKeys, ...allKeys]));
    }
  };

  const handleSelectRow = (key: string) => {
    if (!onSelectionChange) return;

    const newKeys = new Set(selectedKeys);
    if (newKeys.has(key)) {
      newKeys.delete(key);
    } else {
      newKeys.add(key);
    }
    onSelectionChange(newKeys);
  };

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row, i) => selectedKeys.has(getRowKey(row, i)));
  const someSelected = paginatedData.some((row, i) => selectedKeys.has(getRowKey(row, i)));

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sort.column !== columnKey) {
      return <ArrowUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    return sort.direction === 'asc' ? (
      <ArrowUpIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with search and actions */}
      {(searchable || headerActions) && (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}

      {/* Table container */}
      <div
        className={cn(styles.wrapper, 'bg-white dark:bg-gray-900')}
        style={{ maxHeight: maxHeight }}
      >
        <div className={cn('overflow-auto', maxHeight && 'h-full')}>
          <table className="w-full">
            {/* Header */}
            <thead className={cn(stickyHeader && 'sticky top-0 z-10', styles.header)}>
              <tr>
                {selectable && (
                  <th className={cn(sizeStyle.header, 'w-10')}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn(
                      sizeStyle.header,
                      'font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap',
                      column.headerAlign === 'center' && 'text-center',
                      column.headerAlign === 'right' && 'text-right',
                      column.hideOnMobile && 'hidden sm:table-cell',
                      column.sortable &&
                        'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    )}
                    style={{ width: column.width, minWidth: column.minWidth }}
                    onClick={column.sortable ? () => handleSort(String(column.key)) : undefined}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-2',
                        column.headerAlign === 'right' && 'justify-end'
                      )}
                    >
                      <span>{column.label}</span>
                      {column.sortable && renderSortIcon(String(column.key))}
                    </div>
                  </th>
                ))}
                {rowActions && <th className={cn(sizeStyle.header, 'w-20')} />}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                    className="py-16 text-center"
                  >
                    <Loader2Icon className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading...</p>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                    className="py-16 text-center"
                  >
                    {emptyIcon || (
                      <FilterIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto" />
                    )}
                    <p className="mt-2 text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginatedData.map((row, index) => {
                    const key = getRowKey(row, index);
                    const isSelected = selectedKeys.has(key);

                    return (
                      <motion.tr
                        key={key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.02 }}
                        className={cn(
                          styles.row,
                          styles.rowHover,
                          'transition-colors',
                          isSelected && 'bg-blue-50 dark:bg-blue-900/20',
                          onRowClick && 'cursor-pointer'
                        )}
                        onClick={() => onRowClick?.(row, index)}
                      >
                        {selectable && (
                          <td className={sizeStyle.cell} onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(key)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                        )}
                        {columns.map((column) => {
                          const value = getNestedValue(row, String(column.key));

                          return (
                            <td
                              key={String(column.key)}
                              className={cn(
                                sizeStyle.cell,
                                'text-gray-900 dark:text-gray-100',
                                column.align === 'center' && 'text-center',
                                column.align === 'right' && 'text-right',
                                column.hideOnMobile && 'hidden sm:table-cell'
                              )}
                            >
                              {column.render
                                ? column.render(value, row, index)
                                : String(value ?? '-')}
                            </td>
                          );
                        })}
                        {rowActions && (
                          <td
                            className={cn(sizeStyle.cell, 'text-right')}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {rowActions(row, index)}
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>

          <div className="flex items-center gap-2">
            {typeof pagination === 'object' && pagination.showPageSizeSelector && (
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                {(pagination.pageSizeOptions || [10, 25, 50, 100]).map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <span className="px-3 py-1 text-sm">
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
