'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  LucideIcon,
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

export interface MetricCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Change indicator */
  change?: {
    value: number;
    period: string;
    /** Show as absolute value instead of percentage */
    absolute?: boolean;
  };
  /** Icon to display (Lucide icon component or ReactNode) */
  icon?: LucideIcon | ReactNode;
  /** Color theme */
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan';
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Sparkline data points for mini chart */
  sparkline?: number[];
  /** Format value as currency */
  currency?: string;
  /** Animate value on mount */
  animate?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const colorVariants = {
  default: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    icon: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    iconRing: 'ring-gray-200 dark:ring-gray-600',
    glow: '',
  },
  success: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-green-200 dark:border-green-800',
    icon: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
    iconRing: 'ring-green-300 dark:ring-green-700',
    glow: 'hover:shadow-green-100 dark:hover:shadow-green-900/20',
  },
  warning: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    iconRing: 'ring-amber-300 dark:ring-amber-700',
    glow: 'hover:shadow-amber-100 dark:hover:shadow-amber-900/20',
  },
  danger: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-red-200 dark:border-red-800',
    icon: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400',
    iconRing: 'ring-red-300 dark:ring-red-700',
    glow: 'hover:shadow-red-100 dark:hover:shadow-red-900/20',
  },
  info: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    iconRing: 'ring-blue-300 dark:ring-blue-700',
    glow: 'hover:shadow-blue-100 dark:hover:shadow-blue-900/20',
  },
  purple: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
    iconRing: 'ring-purple-300 dark:ring-purple-700',
    glow: 'hover:shadow-purple-100 dark:hover:shadow-purple-900/20',
  },
  cyan: {
    bg: 'bg-white dark:bg-gray-800',
    border: 'border-cyan-200 dark:border-cyan-800',
    icon: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400',
    iconRing: 'ring-cyan-300 dark:ring-cyan-700',
    glow: 'hover:shadow-cyan-100 dark:hover:shadow-cyan-900/20',
  },
};

const sizeVariants = {
  sm: {
    padding: 'p-4',
    title: 'text-xs',
    value: 'text-xl',
    icon: 'p-2 h-8 w-8',
    iconSize: 'h-4 w-4',
  },
  md: {
    padding: 'p-5',
    title: 'text-sm',
    value: 'text-2xl md:text-3xl',
    icon: 'p-2.5 h-10 w-10',
    iconSize: 'h-5 w-5',
  },
  lg: {
    padding: 'p-6',
    title: 'text-base',
    value: 'text-3xl md:text-4xl',
    icon: 'p-3 h-12 w-12',
    iconSize: 'h-6 w-6',
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  icon,
  color = 'default',
  loading = false,
  className,
  onClick,
  sparkline,
  currency,
  animate = true,
  size = 'md',
}: MetricCardProps) {
  const variant = colorVariants[color];
  const sizeVariant = sizeVariants[size];
  const [displayValue, setDisplayValue] = useState<string | number>(animate ? 0 : value);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Animate value on mount
  useEffect(() => {
    if (!animate || hasAnimated || loading) return;

    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    if (isNaN(numValue)) {
      setDisplayValue(value);
      setHasAnimated(true);
      return;
    }

    const duration = 1000;
    const steps = 30;
    const increment = numValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, numValue);

      if (currency) {
        setDisplayValue(
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(current)
        );
      } else if (typeof value === 'string' && value.includes('%')) {
        setDisplayValue(`${current.toFixed(1)}%`);
      } else if (Number.isInteger(numValue)) {
        setDisplayValue(Math.round(current).toLocaleString());
      } else {
        setDisplayValue(current.toFixed(2));
      }

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
        setHasAnimated(true);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animate, hasAnimated, loading, currency]);

  const changeDirection =
    !change || change.value === 0 ? 'neutral' : change.value > 0 ? 'positive' : 'negative';

  const TrendIcon =
    changeDirection === 'positive'
      ? TrendingUpIcon
      : changeDirection === 'negative'
        ? TrendingDownIcon
        : MinusIcon;

  const ArrowIcon = changeDirection === 'positive' ? ArrowUpIcon : ArrowDownIcon;

  // Render icon
  const renderIcon = () => {
    if (!icon) return null;

    // Check if it's a Lucide icon component
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={sizeVariant.iconSize} />;
    }

    // It's a ReactNode
    return icon;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl border',
          sizeVariant.padding,
          variant.bg,
          variant.border,
          className
        )}
      >
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={onClick ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-xl border transition-all duration-300',
        sizeVariant.padding,
        variant.bg,
        variant.border,
        variant.glow,
        onClick && 'cursor-pointer',
        'hover:shadow-lg',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('font-medium text-gray-600 dark:text-gray-400', sizeVariant.title)}>
          {title}
        </h3>
        {icon && (
          <motion.div
            initial={animate ? { rotate: -180, opacity: 0 } : false}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'rounded-lg ring-2 flex items-center justify-center',
              sizeVariant.icon,
              variant.icon,
              variant.iconRing
            )}
          >
            {renderIcon()}
          </motion.div>
        )}
      </div>

      {/* Value */}
      <div className="space-y-2">
        <motion.p
          key={String(displayValue)}
          initial={animate ? { opacity: 0.5 } : false}
          animate={{ opacity: 1 }}
          className={cn('font-bold text-gray-900 dark:text-white tabular-nums', sizeVariant.value)}
        >
          {displayValue}
        </motion.p>

        {/* Change indicator or subtitle */}
        {(subtitle || change) && (
          <div className="flex items-center gap-2 text-sm">
            {change && (
              <motion.span
                initial={animate ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  'flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-xs',
                  changeDirection === 'positive' &&
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                  changeDirection === 'negative' &&
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
                  changeDirection === 'neutral' &&
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                )}
              >
                <ArrowIcon className="h-3 w-3" />
                {change.value > 0 ? '+' : ''}
                {change.value}
                {!change.absolute && '%'}
              </motion.span>
            )}
            {change?.period && (
              <span className="text-gray-500 dark:text-gray-400 text-xs">{change.period}</span>
            )}
            {subtitle && !change && (
              <span className="text-gray-500 dark:text-gray-400">{subtitle}</span>
            )}
          </div>
        )}

        {/* Sparkline */}
        {sparkline && sparkline.length > 0 && (
          <motion.div
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3"
          >
            <Sparkline data={sparkline} color={color} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Mini sparkline chart
function Sparkline({ data, color }: { data: number[]; color: MetricCardProps['color'] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 100;

  const strokeColor =
    color === 'success'
      ? '#22c55e'
      : color === 'danger'
        ? '#ef4444'
        : color === 'warning'
          ? '#f59e0b'
          : color === 'info'
            ? '#3b82f6'
            : color === 'purple'
              ? '#a855f7'
              : color === 'cyan'
                ? '#06b6d4'
                : '#6b7280';

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8" preserveAspectRatio="none">
      <motion.polyline
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />
      {/* Gradient fill under the line */}
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#gradient-${color})`}
      />
    </svg>
  );
}

// Grid container for MetricCards
export function MetricCardGrid({
  children,
  columns = 4,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  return <div className={cn('grid gap-4 md:gap-6', gridCols[columns], className)}>{children}</div>;
}

export default MetricCard;
