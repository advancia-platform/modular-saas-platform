/**
 * API Configuration
 * Centralized API endpoint configuration for frontend
 */

// Get API URL from environment or fallback to localhost
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_URL}/api/auth/login`,
  REGISTER: `${API_URL}/api/auth/register`,
  LOGOUT: `${API_URL}/api/auth/logout`,
  VERIFY_EMAIL: `${API_URL}/api/auth/verify-email`,
  FORGOT_PASSWORD: `${API_URL}/api/auth/forgot-password`,
  RESET_PASSWORD: `${API_URL}/api/auth/reset-password`,
  ME: `${API_URL}/api/auth/me`,
  
  // Payments
  PAYMENTS: `${API_URL}/api/payments`,
  PAYMENT_SESSION: (id: string) => `${API_URL}/api/payments/session/${id}`,
  STRIPE_WEBHOOK: `${API_URL}/api/payments/webhook`,
  
  // Crypto Payments
  CRYPTO_INVOICE: `${API_URL}/api/cryptomus/create-invoice`,
  CRYPTO_STATUS: (id: string) => `${API_URL}/api/cryptomus/status/${id}`,
  CRYPTO_HISTORY: `${API_URL}/api/cryptomus/history`,
  
  // Tokens
  TOKEN_WALLET: `${API_URL}/api/tokens/wallet`,
  TOKEN_BALANCE: `${API_URL}/api/tokens/balance`,
  TOKEN_TRANSFER: `${API_URL}/api/tokens/transfer`,
  TOKEN_WITHDRAW: `${API_URL}/api/tokens/withdraw`,
  TOKEN_CASHOUT: `${API_URL}/api/tokens/cashout`,
  TOKEN_HISTORY: `${API_URL}/api/tokens/history`,
  
  // Rewards
  REWARDS: `${API_URL}/api/rewards`,
  CLAIM_REWARD: (id: string) => `${API_URL}/api/rewards/claim/${id}`,
  USER_TIER: `${API_URL}/api/rewards/tier`,
  
  // Withdrawals
  WITHDRAWALS: `${API_URL}/api/withdrawals`,
  WITHDRAWAL_REQUEST: `${API_URL}/api/withdrawals/request`,
  
  // Admin
  ADMIN_USERS: `${API_URL}/api/admin/users`,
  ADMIN_APPROVE: (id: string) => `${API_URL}/api/admin/users/${id}/approve`,
  ADMIN_REJECT: (id: string) => `${API_URL}/api/admin/users/${id}/reject`,
  ADMIN_DASHBOARD: `${API_URL}/api/admin/dashboard`,
  
  // Security Admin
  BLOCKED_IPS: `${API_URL}/api/admin/security-management/blocked-ips`,
  BLOCK_IP: `${API_URL}/api/admin/security-management/block-ip`,
  UNBLOCK_IP: (id: string) => `${API_URL}/api/admin/security-management/unblock-ip/${id}`,
  SECURITY_ALERTS: `${API_URL}/api/admin/security-management/alerts`,
  FAILED_LOGINS: `${API_URL}/api/admin/security-management/failed-logins`,
  UNLOCK_ACCOUNT: `${API_URL}/api/admin/security-management/unlock-account`,
  
  // Transactions
  TRANSACTIONS: `${API_URL}/api/transactions`,
  
  // MedBeds
  MEDBEDS: `${API_URL}/api/medbeds`,
  MEDBEDS_BOOK: `${API_URL}/api/medbeds/book`,
};

/**
 * API request helper with authentication
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(endpoint, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

/**
 * WebSocket connection helper
 */
export function connectWebSocket(token?: string) {
  const url = token ? `${WS_URL}?token=${token}` : WS_URL;
  return new WebSocket(url);
}

export default {
  API_URL,
  WS_URL,
  API_ENDPOINTS,
  apiRequest,
  connectWebSocket,
};
