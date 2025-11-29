'use client';

import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with client-side components
const AIModelDashboard = dynamic(() => import('@/components/AIModelDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

export default function AIModelsPage() {
  return <AIModelDashboard />;
}
