'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  XCircleIcon,
} from 'lucide-react';

export type ComplianceStatus = 'compliant' | 'non-compliant' | 'pending' | 'warning';

export interface RegulatoryItem {
  id: string;
  name: string;
  description?: string;
  status: ComplianceStatus;
  lastChecked?: string;
  expiresAt?: string;
  documentUrl?: string;
  actionRequired?: string;
}

export interface RegulatoryStatusPanelProps {
  items: RegulatoryItem[];
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  onViewDocument?: (item: RegulatoryItem) => void;
  isLoading?: boolean;
  className?: string;
}

const statusConfig: Record<
  ComplianceStatus,
  {
    label: string;
    icon: typeof CheckCircleIcon;
    colors: string;
    badgeBg: string;
  }
> = {
  compliant: {
    label: 'Compliant',
    icon: CheckCircleIcon,
    colors: 'text-green-600 dark:text-green-400',
    badgeBg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  },
  'non-compliant': {
    label: 'Non-Compliant',
    icon: XCircleIcon,
    colors: 'text-red-600 dark:text-red-400',
    badgeBg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  },
  pending: {
    label: 'Pending',
    icon: ClockIcon,
    colors: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangleIcon,
    colors: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  },
};

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function RegulatoryStatusPanel({
  items,
  title = 'Regulatory Compliance',
  subtitle,
  onRefresh,
  onViewDocument,
  isLoading = false,
  className,
}: RegulatoryStatusPanelProps) {
  const summary = items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<ComplianceStatus, number>
  );

  const overallStatus: ComplianceStatus =
    summary['non-compliant'] > 0
      ? 'non-compliant'
      : summary.warning > 0
        ? 'warning'
        : summary.pending > 0
          ? 'pending'
          : 'compliant';

  const OverallIcon = statusConfig[overallStatus].icon;

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'p-3 rounded-xl',
                overallStatus === 'compliant' && 'bg-green-100 dark:bg-green-900/30',
                overallStatus === 'non-compliant' && 'bg-red-100 dark:bg-red-900/30',
                overallStatus === 'warning' && 'bg-amber-100 dark:bg-amber-900/30',
                overallStatus === 'pending' && 'bg-blue-100 dark:bg-blue-900/30'
              )}
            >
              <OverallIcon className={cn('h-6 w-6', statusConfig[overallStatus].colors)} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {(['compliant', 'warning', 'pending', 'non-compliant'] as ComplianceStatus[]).map(
                  (status) =>
                    (summary[status] || 0) > 0 && (
                      <span
                        key={status}
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                          statusConfig[status].badgeBg
                        )}
                      >
                        {summary[status]} {statusConfig[status].label}
                      </span>
                    )
                )}
              </div>
            </div>
          </div>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="shrink-0"
            >
              <RefreshCwIcon className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {items.map((item) => {
          const config = statusConfig[item.status];
          const StatusIcon = config.icon;

          return (
            <div
              key={item.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <StatusIcon className={cn('h-5 w-5 mt-0.5 shrink-0', config.colors)} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        config.badgeBg
                      )}
                    >
                      {config.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {item.lastChecked && <span>Last checked: {formatDate(item.lastChecked)}</span>}
                    {item.expiresAt && (
                      <span
                        className={cn(
                          new Date(item.expiresAt) < new Date() &&
                            'text-red-600 dark:text-red-400 font-medium'
                        )}
                      >
                        Expires: {formatDate(item.expiresAt)}
                      </span>
                    )}
                  </div>

                  {item.actionRequired && (
                    <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                      ⚠️ {item.actionRequired}
                    </p>
                  )}

                  {item.documentUrl && onViewDocument && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDocument(item)}
                      className="mt-2 text-primary hover:text-primary/80"
                    >
                      View Document
                      <ExternalLinkIcon className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No regulatory items to display
          </div>
        )}
      </div>
    </div>
  );
}

export default RegulatoryStatusPanel;
