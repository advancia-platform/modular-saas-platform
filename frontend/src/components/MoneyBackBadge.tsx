'use client';

import { cn } from '@/lib/utils';
import { ShieldCheckIcon } from 'lucide-react';

export interface MoneyBackBadgeProps {
  days?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'gradient';
  className?: string;
}

export function MoneyBackBadge({
  days = 30,
  size = 'md',
  variant = 'default',
  className,
}: MoneyBackBadgeProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const variantClasses = {
    default:
      'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700',
    outline:
      'bg-transparent border-2 border-green-600 dark:border-green-400 text-green-700 dark:text-green-300',
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none shadow-md',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <ShieldCheckIcon className={iconSizes[size]} />
      <span>{days}-Day Money-Back Guarantee</span>
    </div>
  );
}

/**
 * A more detailed money-back guarantee card for use on pricing/checkout pages
 */
export interface MoneyBackCardProps {
  days?: number;
  title?: string;
  description?: string;
  className?: string;
}

export function MoneyBackCard({ days = 30, title, description, className }: MoneyBackCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6',
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-green-200/50 dark:bg-green-800/30 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-emerald-200/50 dark:bg-emerald-800/30 blur-2xl" />

      <div className="relative flex items-start gap-4">
        {/* Shield Icon */}
        <div className="shrink-0 p-3 rounded-full bg-green-100 dark:bg-green-800/50">
          <ShieldCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-green-800 dark:text-green-200">
            {title || `${days}-Day Money-Back Guarantee`}
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            {description ||
              `Not satisfied? Get a full refund within ${days} days, no questions asked. Your satisfaction is our priority.`}
          </p>
        </div>
      </div>

      {/* Badge */}
      <div className="mt-4 flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white font-bold text-lg">
            {days}
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              Days
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Risk-Free</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact footer badge for product pages
 */
export interface MoneyBackFooterProps {
  days?: number;
  className?: string;
}

export function MoneyBackFooter({ days = 30, className }: MoneyBackFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400',
        className
      )}
    >
      <ShieldCheckIcon className="h-4 w-4 text-green-500" />
      <span>
        <span className="font-medium text-gray-900 dark:text-white">{days}-Day</span> Money-Back
        Guarantee
      </span>
    </div>
  );
}

export default MoneyBackBadge;
