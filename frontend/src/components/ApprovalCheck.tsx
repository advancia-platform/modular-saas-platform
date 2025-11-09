"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ApprovalCheckProps {
  children: React.ReactNode;
}

/**
 * ApprovalCheck - Redirects unapproved users to pending page
 */
export default function ApprovalCheck({ children }: ApprovalCheckProps) {
  const router = useRouter();
  const [isApproved, setIsApproved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkApproval = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch('http://localhost:4000/api/auth/check-approval', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.rejected) {
            // User was rejected
            alert(`Account Rejected: ${data.reason || 'Please contact support'}`);
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            router.push('/auth/login');
          } else if (!data.approved) {
            // User pending approval
            router.push('/pending-approval');
          } else {
            // User approved
            setIsApproved(true);
            setIsChecking(false);
          }
        } else if (response.status === 403) {
          const data = await response.json();
          if (data.error === 'Account pending approval') {
            router.push('/pending-approval');
          } else {
            router.push('/auth/login');
          }
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error checking approval:', error);
        setIsChecking(false);
      }
    };

    checkApproval();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (isApproved) {
    return <>{children}</>;
  }

  return null;
}
