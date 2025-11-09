"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * AdminRouteGuard - Protects admin routes from regular users
 * Redirects non-admin users to dashboard with error message
 */
export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userEmail = localStorage.getItem('userEmail');

        if (!token || !userEmail) {
          // Not logged in - redirect to login
          router.push('/auth/login');
          return;
        }

        // Check if user is admin by calling backend
        const response = await fetch('http://localhost:4000/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          // User is admin
          setIsAuthorized(true);
          setIsChecking(false);
        } else if (response.status === 403) {
          // User is NOT admin - redirect to dashboard
          alert('Access Denied: Admin privileges required');
          router.push('/dashboard');
        } else {
          // Token invalid or expired - redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        alert('Unable to verify admin access. Please try again.');
        router.push('/dashboard');
      }
    };

    checkAdminAccess();
  }, [router]);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Show children only if authorized
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Return null while redirecting
  return null;
}
