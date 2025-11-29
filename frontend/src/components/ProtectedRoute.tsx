'use client';

import { useAuth, UserRole } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredRole?: 'admin' | 'user'; // Legacy support
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // Not authenticated
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
      // SUPER_ADMIN has access to everything
      if (user.role === 'SUPER_ADMIN' || allowedRoles.includes(user.role)) {
        setAuthorized(true);
      } else {
        // Redirect to dashboard if role not allowed
        router.push('/admin/dashboard');
      }
      return;
    }

    // Legacy requiredRole support
    if (requiredRole) {
      const isAdmin = ['admin', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(
        user.role
      );
      if (requiredRole === 'admin' && !isAdmin) {
        router.push('/dashboard');
        return;
      }
    }

    // No specific role required, just authentication
    setAuthorized(true);
  }, [authLoading, isAuthenticated, user, allowedRoles, requiredRole, router]);

  if (authLoading || !authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
