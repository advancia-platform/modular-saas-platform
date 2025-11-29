'use client';

import { cn } from '@/lib/utils';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useMemo } from 'react';

export interface CashFlowData {
  period: string;
  inflow: number;
  outflow: number;
}

export interface CashFlowChartProps {
  data: CashFlowData[];
  title?: string;
  subtitle?: string;
  currency?: string;
  height?: number;
  showNetFlow?: boolean;
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

export function CashFlowChart({
  data,
  title = 'Cash Flow',
  subtitle,
  currency = 'USD',
  height = 240,
  showNetFlow = true,
  className,
}: CashFlowChartProps) {
  const { maxValue, totals } = useMemo(() => {
    const allValues = data.flatMap((d) => [d.inflow, d.outflow]);
    const max = Math.max(...allValues, 1);
    const totalInflow = data.reduce((sum, d) => sum + d.inflow, 0);
    const totalOutflow = data.reduce((sum, d) => sum + d.outflow, 0);
    return {
      maxValue: max,
      totals: {
        inflow: totalInflow,
        outflow: totalOutflow,
        net: totalInflow - totalOutflow,
      },
    };
  }, [data]);

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>

        {/* Summary Cards */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20">
            <ArrowUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Inflow</p>
              <p className="text-sm font-bold text-green-700 dark:text-green-300">
                {formatCurrency(totals.inflow, currency)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">Outflow</p>
              <p className="text-sm font-bold text-red-700 dark:text-red-300">
                {formatCurrency(totals.outflow, currency)}
              </p>
            </div>
          </div>
          {showNetFlow && (
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg',
                totals.net >= 0
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-amber-50 dark:bg-amber-900/20'
              )}
            >
              <div>
                <p
                  className={cn(
                    'text-xs font-medium',
                    totals.net >= 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  Net Flow
                </p>
                <p
                  className={cn(
                    'text-sm font-bold',
                    totals.net >= 0
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-amber-700 dark:text-amber-300'
                  )}
                >
                  {totals.net >= 0 ? '+' : ''}
                  {formatCurrency(totals.net, currency)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height }}>
        {/* Y-axis */}
        <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 text-right pr-2">
          <span>{formatCurrency(maxValue, currency)}</span>
          <span>{formatCurrency(maxValue * 0.5, currency)}</span>
          <span>0</span>
        </div>

        {/* Grid lines */}
        <div className="absolute left-16 right-0 top-0 bottom-8">
          <div className="h-full flex flex-col justify-between">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="border-b border-dashed border-gray-200 dark:border-gray-700"
              />
            ))}
          </div>
        </div>

        {/* Bars */}
        <div className="absolute left-16 right-0 top-0 bottom-8 flex items-end gap-2 px-2">
          {data.map((item, index) => {
            const inflowHeight = (item.inflow / maxValue) * 100;
            const outflowHeight = (item.outflow / maxValue) * 100;
            const netFlow = item.inflow - item.outflow;

            return (
              <div key={index} className="flex-1 flex flex-col items-center group relative">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-20 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 pointer-events-none shadow-lg">
                  <p className="font-semibold border-b border-gray-700 dark:border-gray-600 pb-1 mb-1">
                    {item.period}
                  </p>
                  <p className="text-green-400">Inflow: {formatCurrency(item.inflow, currency)}</p>
                  <p className="text-red-400">Outflow: {formatCurrency(item.outflow, currency)}</p>
                  <p
                    className={cn(
                      'pt-1 border-t border-gray-700 dark:border-gray-600 mt-1',
                      netFlow >= 0 ? 'text-blue-400' : 'text-amber-400'
                    )}
                  >
                    Net: {netFlow >= 0 ? '+' : ''}
                    {formatCurrency(netFlow, currency)}
                  </p>
                </div>

                {/* Stacked bars */}
                <div className="relative w-full h-full flex items-end justify-center gap-1">
                  {/* Inflow bar */}
                  <div
                    className="w-2/5 bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all duration-300 hover:from-green-500 hover:to-green-300"
                    style={{ height: `${inflowHeight}%` }}
                  />
                  {/* Outflow bar */}
                  <div
                    className="w-2/5 bg-gradient-to-t from-red-600 to-red-400 rounded-t transition-all duration-300 hover:from-red-500 hover:to-red-300"
                    style={{ height: `${outflowHeight}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="absolute left-16 right-0 bottom-0 h-8 flex px-2">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400 truncate"
            >
              {item.period}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-green-600 to-green-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Inflow</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-red-600 to-red-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Outflow</span>
        </div>
      </div>
    </div>
  );
}

export default CashFlowChart;
