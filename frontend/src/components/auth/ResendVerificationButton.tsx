'use client';

import { resendVerificationEmail } from '@/lib/api/emailVerification';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ResendVerificationButtonProps {
  className?: string;
}

export function ResendVerificationButton({ className = '' }: ResendVerificationButtonProps) {
  const [message, setMessage] = useState<string | null>(null);

  const { mutate, isLoading } = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: (data) => {
      setMessage(data.message || 'Verification email resent');
      toast.success('Verification email sent! Check your inbox.');
    },
    onError: (error: any) => {
      const apiMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Failed to resend verification email';
      setMessage(apiMessage);
      toast.error(apiMessage);
    },
  });

  const handleClick = () => {
    setMessage(null);
    mutate();
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {isLoading ? 'Sending...' : 'Resend verification email'}
      </button>

      {message && (
        <p className="text-xs text-gray-600 animate-fade-in">
          {message}
        </p>
      )}
    </div>
  );
}
