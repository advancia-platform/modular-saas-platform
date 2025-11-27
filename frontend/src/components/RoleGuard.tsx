'use client';

import { useEffect, useState } from 'react';

interface RoleGuardProps {
  roles: ('ADMIN' | 'AUDITOR' | 'USER')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Role-based access control component
 * Shows children only if user has one of the required roles
 */
export default function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          setUserRole(user.role || 'USER');
        } else {
          setUserRole(null);
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  if (loading) {
    return fallback || null;
  }

  if (!userRole || !roles.includes(userRole as 'ADMIN' | 'AUDITOR' | 'USER')) {
    return fallback || null;
  }

  return <>{children}</>;
}
