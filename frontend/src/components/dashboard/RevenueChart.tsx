'use client';

import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export interface RevenueChartProps {
  data: {
    label: string;
    value: number;
    previousValue?: number;
  }[];
  title?: string;
  subtitle?: string;
  currency?: string;
  showComparison?: boolean;
  height?: number;
  className?: string;
}

function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

export function RevenueChart({
  data,
  title = 'Revenue',
  subtitle,
  currency = 'USD',
  showComparison = true,
  height = 200,
  className,
}: RevenueChartProps) {
  const { maxValue, totalRevenue, totalPrevious, percentChange } = useMemo(() => {
    const allValues = data.flatMap((d) => [d.value, d.previousValue || 0]);
    const max = Math.max(...allValues, 1);
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const prevTotal = data.reduce((sum, d) => sum + (d.previousValue || 0), 0);
    const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
    return {
      maxValue: max,
      totalRevenue: total,
      totalPrevious: prevTotal,
      percentChange: change,
    };
  }, [data]);

  const barWidth = 100 / data.length;

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalRevenue, currency)}
          </p>
          {showComparison && totalPrevious > 0 && (
            <p
              className={cn(
                'text-sm font-medium',
                percentChange >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {percentChange >= 0 ? '+' : ''}
              {percentChange.toFixed(1)}% vs last period
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{formatCompact(maxValue)}</span>
          <span>{formatCompact(maxValue / 2)}</span>
          <span>0</span>
        </div>

        {/* Bars */}
        <div className="absolute left-14 right-0 top-0 bottom-6 flex items-end gap-1">
          {data.map((item, index) => {
            const currentHeight = (item.value / maxValue) * 100;
            const previousHeight = item.previousValue ? (item.previousValue / maxValue) * 100 : 0;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group"
                style={{ maxWidth: `${barWidth}%` }}
              >
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 pointer-events-none">
                  <p className="font-medium">{item.label}</p>
                  <p>Current: {formatCurrency(item.value, currency)}</p>
                  {item.previousValue !== undefined && (
                    <p>Previous: {formatCurrency(item.previousValue, currency)}</p>
                  )}
                </div>

                {/* Bars container */}
                <div className="relative w-full h-full flex items-end justify-center gap-0.5">
                  {/* Previous period bar */}
                  {showComparison && item.previousValue !== undefined && (
                    <div
                      className="w-2/5 bg-gray-300 dark:bg-gray-600 rounded-t transition-all duration-300"
                      style={{ height: `${previousHeight}%` }}
                    />
                  )}
                  {/* Current period bar */}
                  <div
                    className="w-2/5 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all duration-300 group-hover:from-indigo-500 group-hover:to-indigo-300"
                    style={{ height: `${currentHeight}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="absolute left-14 right-0 bottom-0 flex">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400 truncate px-1"
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      {showComparison && (
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-indigo-600 to-indigo-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Current period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Previous period</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default RevenueChart;
