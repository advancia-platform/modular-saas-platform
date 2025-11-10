"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

// Helper to decode JWT and check expiration
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true; // Invalid token format
  }
}

/**
 * AdminRouteGuard - Protects admin routes from regular users
 * Redirects non-admin users to dashboard with error message
 * Automatically refreshes expired tokens via apiClient interceptor
 */
export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      // Allow access to login page without checking
      if (pathname === '/admin/login') {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userEmail = localStorage.getItem('userEmail');
        const userRole = localStorage.getItem('userRole');

        if (!token || !userEmail) {
          // Not logged in - redirect to admin login
          router.push('/admin/login');
          return;
        }

        // Quick role check (client-side optimization)
        if (userRole !== 'ADMIN') {
          alert('Access Denied: Admin privileges required');
          router.push('/dashboard');
          return;
        }

        // Check token expiration
        if (isTokenExpired(token)) {
          console.log('Token expired, will attempt refresh via API call...');
          // Token expired - the apiClient interceptor will handle refresh
          // Just proceed with the API call
        }

        // Verify admin access with backend (this will auto-refresh if needed)
        const response = await adminApi.getDashboardStats();
        
        if (response.status === 200) {
          // User is admin and token is valid
          setIsAuthorized(true);
          setIsChecking(false);
        }
      } catch (error: unknown) {
        console.error('Admin access check failed:', error);
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 403) {
            // User is NOT admin - redirect to dashboard
            alert('Access Denied: Admin privileges required');
            router.push('/dashboard');
            return;
          }
        }
        
        // Other error (token refresh failed, network error, etc.)
        // The apiClient interceptor will handle redirects if refresh fails
        localStorage.clear();
        router.push('/admin/login');
      }
    };

    checkAdminAccess();
  }, [router, pathname]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Only render children if authorized
  return isAuthorized ? <>{children}</> : null;
}
