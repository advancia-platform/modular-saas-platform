'use client';

import DashboardRouteGuard from '@/components/auth/DashboardRouteGuard';
import { Suspense } from 'react';

// TODO: Create ProjectsDashboard component
const ProjectsDashboard = () => {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your projects and track progress across teams
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-gray-200 p-12 text-center">
        <h3 className="text-lg font-medium text-gray-900">Projects Dashboard</h3>
        <p className="mt-2 text-sm text-gray-500">
          Projects dashboard component coming soon. This will display all your projects, their
          status, team members, and allow you to create new projects.
        </p>
      </div>
    </div>
  );
};

export default function ProjectsPage() {
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
        <ProjectsDashboard />
      </Suspense>
    </DashboardRouteGuard>
  );
}
