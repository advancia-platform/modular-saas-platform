'use client';

import { cn } from '@/lib/utils';
import type { ChartData, ChartOptions } from 'chart.js';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export interface PlanDistributionChartProps {
  /** API endpoint to fetch data from */
  apiEndpoint?: string;
  /** Static data */
  staticData?: {
    starter: number;
    growth: number;
    scale: number;
  };
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
}

const defaultData = {
  starter: 120,
  growth: 80,
  scale: 30,
};

const planColors = {
  starter: { bg: 'rgb(99, 102, 241)', label: 'Starter' }, // Indigo
  growth: { bg: 'rgb(245, 158, 11)', label: 'Growth' }, // Amber
  scale: { bg: 'rgb(239, 68, 68)', label: 'Scale' }, // Red
};

export default function PlanDistributionChart({
  apiEndpoint,
  staticData,
  title = 'Plan Distribution',
  subtitle,
  height = 250,
  className,
}: PlanDistributionChartProps) {
  const [chartData, setChartData] = useState<typeof defaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (staticData) {
        setChartData(staticData);
        setLoading(false);
        return;
      }

      if (apiEndpoint) {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(apiEndpoint, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) throw new Error('Failed to fetch data');
          const data = await res.json();
          setChartData(data);
        } catch (err) {
          console.error('Error fetching plan distribution:', err);
          setError('Failed to load data');
          setChartData(defaultData);
        }
      } else {
        setChartData(defaultData);
      }
      setLoading(false);
    };

    fetchData();
  }, [apiEndpoint, staticData]);

  if (loading) {
    return (
      <div
        className={cn(
          'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 flex items-center justify-center',
          className
        )}
        style={{ height: height + 100 }}
      >
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const total = (chartData?.starter || 0) + (chartData?.growth || 0) + (chartData?.scale || 0);

  const data: ChartData<'doughnut'> = {
    labels: ['Starter', 'Growth', 'Scale'],
    datasets: [
      {
        data: [chartData?.starter || 0, chartData?.growth || 0, chartData?.scale || 0],
        backgroundColor: [planColors.starter.bg, planColors.growth.bg, planColors.scale.bg],
        borderColor: 'rgb(30, 41, 59)',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: false, // We'll use custom legend
      },
      tooltip: {
        backgroundColor: 'rgb(30, 41, 59)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgb(71, 85, 105)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: { parsed: number; label: string }) => {
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const planData = [
    {
      key: 'starter',
      value: chartData?.starter || 0,
      color: planColors.starter.bg,
      label: 'Starter',
    },
    { key: 'growth', value: chartData?.growth || 0, color: planColors.growth.bg, label: 'Growth' },
    { key: 'scale', value: chartData?.scale || 0, color: planColors.scale.bg, label: 'Scale' },
  ];

  return (
    <div
      className={cn(
        'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6',
        className
      )}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>

      {error && <p className="text-yellow-400 text-xs mb-2">⚠️ Using sample data</p>}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chart */}
        <div className="flex-1 relative" style={{ height }}>
          <Doughnut data={data} options={options} />
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{total}</p>
              <p className="text-xs text-gray-400">Total Subscriptions</p>
            </div>
          </div>
        </div>

        {/* Custom Legend */}
        <div className="lg:w-40 space-y-3">
          {planData.map((plan) => {
            const percentage = total > 0 ? ((plan.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={plan.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="text-sm text-gray-300">{plan.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{plan.value}</p>
                  <p className="text-xs text-gray-400">{percentage}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
