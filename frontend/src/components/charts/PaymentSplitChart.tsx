'use client';

import { cn } from '@/lib/utils';
import type { ChartData, ChartOptions } from 'chart.js';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { useRef } from 'react';
import { Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export interface PaymentSplitData {
  label: string;
  value: number;
  color?: string;
}

export interface PaymentSplitChartProps {
  data: PaymentSplitData[];
  title?: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  variant?: 'pie' | 'doughnut';
  currency?: string;
  className?: string;
}

const defaultColors = [
  'rgb(147, 51, 234)', // Purple - Stripe
  'rgb(34, 197, 94)', // Green - Cryptomus
  'rgb(59, 130, 246)', // Blue - NOWPayments
  'rgb(249, 115, 22)', // Orange - AlchemyPay
  'rgb(236, 72, 153)', // Pink
  'rgb(20, 184, 166)', // Teal
  'rgb(239, 68, 68)', // Red
  'rgb(168, 85, 247)', // Violet
];

export default function PaymentSplitChart({
  data,
  title,
  subtitle,
  height = 300,
  showLegend = true,
  showLabels = true,
  variant = 'doughnut',
  currency = 'USD',
  className,
}: PaymentSplitChartProps) {
  const chartRef = useRef<ChartJS<'pie' | 'doughnut'> | null>(null);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0',
  }));

  const chartData: ChartData<'pie' | 'doughnut'> = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((d, i) => d.color || defaultColors[i % defaultColors.length]),
        borderColor: 'rgb(30, 41, 59)',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: variant === 'doughnut' ? '60%' : undefined,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right',
        labels: {
          color: 'rgb(156, 163, 175)',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: {
            size: 12,
            weight: 500,
          },
          generateLabels: (chart: ChartJS<'pie' | 'doughnut'>) => {
            const datasets = chart.data.datasets;
            return (
              chart.data.labels?.map((label: unknown, i: number) => ({
                text: `${label}`,
                fillStyle: (datasets[0].backgroundColor as string[])[i],
                strokeStyle: datasets[0].borderColor as string,
                lineWidth: 2,
                hidden: false,
                index: i,
                fontColor: 'rgb(156, 163, 175)',
                pointStyle: 'circle' as const,
              })) || []
            );
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgb(30, 41, 59)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgb(71, 85, 105)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: (context: { parsed: number }) => {
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${formatCurrency(value)} (${percentage}%)`;
          },
        },
      },
    },
  };

  const ChartComponent = variant === 'doughnut' ? Doughnut : Pie;

  return (
    <div
      className={cn(
        'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6',
        className
      )}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chart */}
        <div className="flex-1" style={{ height }}>
          <ChartComponent ref={chartRef as any} data={chartData} options={options} />
        </div>

        {/* Legend with values */}
        {showLabels && (
          <div className="lg:w-48 space-y-3">
            <div className="text-center lg:text-left mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(total)}</p>
            </div>
            {dataWithPercentage.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: item.color || defaultColors[idx % defaultColors.length],
                    }}
                  />
                  <span className="text-sm text-gray-300 truncate">{item.label}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-medium text-white">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
