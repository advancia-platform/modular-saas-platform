'use client';

import { verifyEmail } from '@/lib/api/emailVerification';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [countdown, setCountdown] = useState(5);

  const { mutate, isLoading, isSuccess, isError, error } = useMutation({
    mutationFn: (token: string) => verifyEmail(token),
  });

  useEffect(() => {
    if (token) {
      mutate(token);
    }
  }, [token, mutate]);

  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (isSuccess && countdown === 0) {
      router.push('/dashboard');
    }
  }, [isSuccess, countdown, router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-6">
            No verification token provided. Please check your email for the correct link.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {isLoading && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}

        {isSuccess && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-4">
              Your email has been successfully verified. You can now access all features.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting to dashboard in {countdown} seconds...
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard Now
            </button>
          </>
        )}

        {isError && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">
              {(error as any)?.response?.data?.error ||
                'Invalid or expired verification token. Please request a new verification email.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
