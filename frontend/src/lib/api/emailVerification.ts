/**
 * Email Verification API Client
 * Handles email verification and resend requests
 */

import { api } from './client';

export interface VerificationStatusResponse {
  success: boolean;
  emailVerified: boolean;
  verifiedAt: string | null;
}

export interface SendVerificationResponse {
  success: boolean;
  message: string;
  verificationLink?: string; // Only in development
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

/**
 * Send email verification link to current user
 */
export const sendVerificationEmail = async (): Promise<SendVerificationResponse> => {
  const res = await api.post('/api/email/send-verification');
  return res.data;
};

/**
 * Resend email verification link
 * Rate limited: 5 requests per 15 minutes
 */
export const resendVerificationEmail = async (): Promise<SendVerificationResponse> => {
  const res = await api.post('/api/email/verification/resend');
  return res.data;
};

/**
 * Verify email address using token from URL
 */
export const verifyEmail = async (token: string): Promise<VerifyEmailResponse> => {
  const res = await api.get(`/api/email/verify?token=${token}`);
  return res.data;
};

/**
 * Check if current user's email is verified
 */
export const getVerificationStatus = async (): Promise<VerificationStatusResponse> => {
  const res = await api.get('/api/email/verification-status');
  return res.data;
};
