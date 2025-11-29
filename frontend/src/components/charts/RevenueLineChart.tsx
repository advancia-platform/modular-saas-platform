'use client';

import { cn } from '@/lib/utils';
import type { ChartData, ChartOptions } from 'chart.js';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useRef } from 'react';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface RevenueLineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    tension?: number;
    fill?: boolean;
  }[];
  title?: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  currency?: string;
  className?: string;
}

const defaultColors = [
  { border: 'rgb(147, 51, 234)', bg: 'rgba(147, 51, 234, 0.1)' }, // Purple
  { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' }, // Blue
  { border: 'rgb(16, 185, 129)', bg: 'rgba(16, 185, 129, 0.1)' }, // Green
  { border: 'rgb(249, 115, 22)', bg: 'rgba(249, 115, 22, 0.1)' }, // Orange
  { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.1)' }, // Pink
];

export default function RevenueLineChart({
  labels,
  datasets,
  title,
  subtitle,
  height = 300,
  showLegend = true,
  showGrid = true,
  currency = 'USD',
  className,
}: RevenueLineChartProps) {
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  // Format currency for tooltips
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const chartData: ChartData<'line'> = {
    labels,
    datasets: datasets.map((ds, index) => {
      const colorSet = defaultColors[index % defaultColors.length] || defaultColors[0];
      const borderColor = ds.borderColor ?? colorSet!.border;
      const backgroundColor = ds.backgroundColor ?? colorSet!.bg;
      return {
        label: ds.label,
        data: ds.data,
        borderColor,
        backgroundColor,
        tension: ds.tension ?? 0.4,
        fill: ds.fill ?? true,
        pointBackgroundColor: borderColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    }),
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        align: 'end',
        labels: {
          color: 'rgb(156, 163, 175)',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            weight: 500,
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
          label: (context: { dataset: { label?: string }; parsed: { y: number } }) => {
            const label = context.dataset.label ?? '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: showGrid,
          color: 'rgba(71, 85, 105, 0.3)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          display: showGrid,
          color: 'rgba(71, 85, 105, 0.3)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 11,
          },
          callback: function (tickValue: string | number) {
            return formatCurrency(Number(tickValue));
          },
        },
        border: {
          display: false,
        },
        beginAtZero: true,
      },
    },
  };

  // Calculate totals for summary
  const totals = datasets.map((ds, index) => {
    const colorSet = defaultColors[index % defaultColors.length] || defaultColors[0];
    return {
      label: ds.label,
      total: ds.data.reduce((sum, val) => sum + val, 0),
      color: ds.borderColor ?? colorSet!.border,
    };
  });

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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {totals.map((item, idx) => (
          <div key={idx} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-400 truncate">{item.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{formatCurrency(item.total)}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}
