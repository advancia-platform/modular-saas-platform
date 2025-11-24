/**
 * Example: Secure Login Component
 *
 * Demonstrates:
 * - Input sanitization
 * - Secure token storage
 * - CSRF protection
 * - XSS prevention
 */

'use client';

import { useAuth, useSafeInput } from '@/hooks/useSecurity';
import { InputSecurity } from '@/lib/security';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SecureLogin() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { sanitize, sanitizeEmail } = useSafeInput();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sanitize inputs (XSS prevention)
      const safeEmail = sanitizeEmail(email);
      const safePassword = sanitize(password);

      // 2. Validate inputs
      if (!safeEmail || !InputSecurity.isValidEmail(safeEmail)) {
        setError('Invalid email address');
        setLoading(false);
        return;
      }

      if (!safePassword || safePassword.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }

      // 3. Make secure API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // CSRF token if needed
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({
          email: safeEmail,
          password: safePassword,
        }),
        credentials: 'include', // Include cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // 4. Store token securely
      if (data.token) {
        login(data.token, data.expiresIn || 3600);

        // Clear form
        setEmail('');
        setPassword('');

        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Secure Login</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="current-password"
            disabled={loading}
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <a href="/register" className="text-blue-600 hover:underline">
          Don't have an account? Register
        </a>
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm">
        <p className="font-semibold text-green-800">🔒 Security Features:</p>
        <ul className="mt-2 space-y-1 text-green-700 text-xs">
          <li>✅ XSS protection via input sanitization</li>
          <li>✅ Secure token storage (encrypted sessionStorage)</li>
          <li>✅ CSRF token included in requests</li>
          <li>✅ Password minimum length validation</li>
          <li>✅ Email format validation</li>
        </ul>
      </div>
    </div>
  );
}

// Helper function to get CSRF token from cookie/meta tag
function getCsrfToken(): string {
  // Method 1: From meta tag
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content') || '';
  }

  // Method 2: From cookie
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match && match[1] ? decodeURIComponent(match[1]) : '';
}
