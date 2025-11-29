'use client';

import { cn } from '@/lib/utils';
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    period: string;
  };
  icon?: React.ReactNode;
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
  className?: string;
}

const colorVariants = {
  default: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    icon: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    change: {
      positive: 'text-green-600 dark:text-green-400',
      negative: 'text-red-600 dark:text-red-400',
      neutral: 'text-gray-600 dark:text-gray-400',
    },
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
    change: {
      positive: 'text-green-600 dark:text-green-400',
      negative: 'text-red-600 dark:text-red-400',
      neutral: 'text-gray-600 dark:text-gray-400',
    },
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    change: {
      positive: 'text-green-600 dark:text-green-400',
      negative: 'text-red-600 dark:text-red-400',
      neutral: 'text-gray-600 dark:text-gray-400',
    },
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    change: {
      positive: 'text-green-600 dark:text-green-400',
      negative: 'text-red-600 dark:text-red-400',
      neutral: 'text-gray-600 dark:text-gray-400',
    },
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    change: {
      positive: 'text-green-600 dark:text-green-400',
      negative: 'text-red-600 dark:text-red-400',
      neutral: 'text-gray-600 dark:text-gray-400',
    },
  },
};

export function MetricsCard({
  title,
  value,
  subtitle,
  change,
  icon,
  color = 'default',
  loading = false,
  className,
}: MetricsCardProps) {
  const variant = colorVariants[color];
  const changeDirection =
    change?.value === 0 ? 'neutral' : change?.value && change.value > 0 ? 'positive' : 'negative';

  const TrendIcon =
    changeDirection === 'positive'
      ? TrendingUpIcon
      : changeDirection === 'negative'
        ? TrendingDownIcon
        : MinusIcon;

  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl border border-gray-200 dark:border-gray-700 p-6',
          variant.bg,
          className
        )}
      >
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-lg" />
          </div>
          <div className="h-8 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-shadow hover:shadow-md',
        variant.bg,
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        {icon && <div className={cn('p-2.5 rounded-lg', variant.icon)}>{icon}</div>}
      </div>

      <div className="space-y-1">
        <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>

        {(subtitle || change) && (
          <div className="flex items-center gap-2 text-sm">
            {change && (
              <span
                className={cn(
                  'flex items-center gap-1 font-medium',
                  variant.change[changeDirection]
                )}
              >
                <TrendIcon className="h-4 w-4" />
                {change.value > 0 ? '+' : ''}
                {change.value}%
                <span className="text-gray-500 dark:text-gray-400 font-normal">
                  {change.period}
                </span>
              </span>
            )}
            {subtitle && !change && (
              <span className="text-gray-500 dark:text-gray-400">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsCard;
