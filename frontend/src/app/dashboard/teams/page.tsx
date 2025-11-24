'use client';

import DashboardRouteGuard from '@/components/auth/DashboardRouteGuard';
import TeamsDashboard from '@/components/dashboard/TeamsDashboard';
import { Suspense } from 'react';

export default function TeamsPage() {
  return (
    <DashboardRouteGuard>
      <Suspense
        fallback={
          <div className="container mx-auto py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <TeamsDashboard />
      </Suspense>
    </DashboardRouteGuard>
  );
}
