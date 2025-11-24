'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface DashboardRouteGuardProps {
  children: React.ReactNode;
}

export default function DashboardRouteGuard({ children }: DashboardRouteGuardProps) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    // For now, just a placeholder - implement your auth check logic
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return <>{children}</>;
}
