'use client';

import { cn } from '@/lib/utils';
import type { ChartData, ChartOptions } from 'chart.js';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface NewUsersChartProps {
  /** API endpoint to fetch data from */
  apiEndpoint?: string;
  /** Static data (months and values) */
  staticData?: {
    months: string[];
    values: number[];
  };
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
}

const defaultData = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  values: [50, 75, 120, 90, 150, 200],
};

export default function NewUsersChart({
  apiEndpoint,
  staticData,
  title = 'Monthly New Users',
  subtitle,
  height = 300,
  className,
}: NewUsersChartProps) {
  const [chartData, setChartData] = useState<{ months: string[]; values: number[] } | null>(null);
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
          console.error('Error fetching new users data:', err);
          setError('Failed to load data');
          // Use default data as fallback
          setChartData(defaultData);
        }
      } else {
        // Use default mock data
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
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const data: ChartData<'bar'> = {
    labels: chartData?.months || [],
    datasets: [
      {
        label: 'New Users',
        data: chartData?.values || [],
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(34, 197, 94, 0.9)',
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgb(30, 41, 59)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(203, 213, 225)',
        borderColor: 'rgb(71, 85, 105)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: { parsed: { y: number } }) => {
            return `${context.parsed.y} users`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: { size: 11 },
        },
        border: { display: false },
      },
      y: {
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: { size: 11 },
        },
        border: { display: false },
        beginAtZero: true,
      },
    },
  };

  // Calculate total
  const total = chartData?.values.reduce((sum, val) => sum + val, 0) || 0;

  return (
    <div
      className={cn(
        'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-400">{total.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Total new users</p>
        </div>
      </div>

      {error && <p className="text-yellow-400 text-xs mb-2">⚠️ Using sample data</p>}

      {/* Chart */}
      <div style={{ height }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
