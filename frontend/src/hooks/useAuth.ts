'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface User {
  id?: string;
  name?: string;
  email?: string;
  role: 'ADMIN' | 'AUDITOR' | 'USER';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      const sessionUser = session.user as any;

      // Map session user to our User interface
      let role: 'ADMIN' | 'AUDITOR' | 'USER' = 'USER';

      // Determine role based on various checks
      if (
        sessionUser.role === 'admin' ||
        sessionUser.email === 'admin@advancia.com' ||
        sessionUser.email?.includes('admin')
      ) {
        role = 'ADMIN';
      } else if (
        sessionUser.role === 'auditor' ||
        sessionUser.email?.includes('auditor')
      ) {
        role = 'AUDITOR';
      } else if (sessionUser.role) {
        // If there's a specific role set, use it
        role = sessionUser.role.toUpperCase() as 'ADMIN' | 'AUDITOR' | 'USER';
      }

      setUser({
        id: sessionUser.id || sessionUser.sub,
        name: sessionUser.name,
        email: sessionUser.email,
        role,
      });
    } else {
      setUser(null);
    }

    setLoading(false);
  }, [session, status]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
