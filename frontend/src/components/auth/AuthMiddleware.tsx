'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Handle authentication check here
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  return children;
}