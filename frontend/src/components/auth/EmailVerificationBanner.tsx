'use client';

import { getVerificationStatus } from '@/lib/api/emailVerification';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { ResendVerificationButton } from './ResendVerificationButton';

export function EmailVerificationBanner() {
  const { data, isLoading } = useQuery({
    queryKey: ['emailVerificationStatus'],
    queryFn: getVerificationStatus,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Don't show anything while loading or if already verified
  if (isLoading || data?.emailVerified) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Email verification required
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p className="mb-2">
              Please verify your email address to access all features. Check your inbox for the
              verification link.
            </p>
            <ResendVerificationButton />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailVerifiedBadge() {
  const { data, isLoading } = useQuery({
    queryKey: ['emailVerificationStatus'],
    queryFn: getVerificationStatus,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading || !data?.emailVerified) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
      <CheckCircle className="h-3.5 w-3.5" />
      Verified
    </div>
  );
}
