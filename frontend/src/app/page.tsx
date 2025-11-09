"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './landing/page';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');

    if (token && userEmail) {
      // User is logged in - redirect to dashboard
      setIsLoggedIn(true);
      router.push('/dashboard');
    } else {
      // User is NOT logged in - show landing page
      setIsChecking(false);
    }
  }, [router]);

  // Show landing page for non-authenticated users
  if (!isChecking && !isLoggedIn) {
    return <LandingPage />;
  }

  // Show loading while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
      <div className="text-white text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl font-semibold">Loading...</p>
      </div>
    </div>
  );
}
