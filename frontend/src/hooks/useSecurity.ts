/**
 * React Hook for Frontend Security
 *
 * Provides easy-to-use security utilities for React components
 */

import { InputSecurity, TokenManager, initializeSecurity } from '@/lib/security';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook to initialize security on app mount
 */
export function useSecurityInit(config?: {
  allowedScriptDomains?: string[];
  enableClickjackingProtection?: boolean;
  enableTokenLeakageProtection?: boolean;
}) {
  useEffect(() => {
    initializeSecurity(config);
  }, []);
}

/**
 * Hook for safe input handling
 */
export function useSafeInput() {
  const sanitize = useCallback((input: string): string => {
    return InputSecurity.sanitizeInput(input);
  }, []);

  const sanitizeHTML = useCallback((html: string, allowedTags?: string[]): string => {
    return InputSecurity.sanitizeHTML(html, allowedTags);
  }, []);

  const sanitizeURL = useCallback((url: string): string | null => {
    return InputSecurity.sanitizeURL(url);
  }, []);

  const escapeHTML = useCallback((text: string): string => {
    return InputSecurity.escapeHTML(text);
  }, []);

  const sanitizeEmail = useCallback((email: string): string => {
    return email.toLowerCase().trim();
  }, []);

  return {
    sanitize,
    sanitizeHTML,
    sanitizeURL,
    escapeHTML,
    sanitizeEmail,
  };
}

/**
 * Hook for JWT token management
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const token = TokenManager.getToken();
    setIsAuthenticated(!!token && !TokenManager.isTokenExpired());
    setIsLoading(false);
  }, []);

  const login = useCallback((token: string, expiresIn?: number) => {
    TokenManager.setToken(token, expiresIn);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    TokenManager.clearTokens();
    setIsAuthenticated(false);
  }, []);

  const getToken = useCallback((): string | null => {
    return TokenManager.getToken();
  }, []);

  const refreshToken = useCallback((newToken: string, expiresIn?: number) => {
    TokenManager.setToken(newToken, expiresIn);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    getToken,
    refreshToken,
  };
}

/**
 * Hook for secure API calls with automatic token injection
 */
export function useSecureAPI() {
  const getHeaders = useCallback((additionalHeaders?: Record<string, string>) => {
    const token = TokenManager.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }, []);

  const secureFetch = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      // Validate URL
      const sanitizedURL = InputSecurity.sanitizeURL(url);
      if (!sanitizedURL) {
        throw new Error('Invalid URL');
      }

      // Add authorization header
      const headers = getHeaders(options?.headers as Record<string, string>);

      // Make request
      const response = await fetch(sanitizedURL, {
        ...options,
        headers,
      });

      // Check for token refresh in response
      const newToken = response.headers.get('X-New-Token');
      if (newToken) {
        TokenManager.setToken(newToken);
      }

      // Handle 401 (token expired)
      if (response.status === 401) {
        TokenManager.clearTokens();
        // Redirect to login or emit event
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }

      return response;
    },
    [getHeaders]
  );

  return {
    secureFetch,
    getHeaders,
  };
}

/**
 * Hook to monitor security events
 */
export function useSecurityMonitor() {
  const [violations, setViolations] = useState<any[]>([]);

  useEffect(() => {
    const handleAuthExpired = () => {
      console.warn('Authentication expired');
      // Handle logout or redirect
    };

    const handleCSPViolation = (e: Event) => {
      const violation = e as SecurityPolicyViolationEvent;
      setViolations((prev) => [
        ...prev,
        {
          type: 'csp',
          directive: violation.violatedDirective,
          blockedURI: violation.blockedURI,
          timestamp: new Date(),
        },
      ]);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    document.addEventListener('securitypolicyviolation', handleCSPViolation);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, []);

  return { violations };
}

/**
 * Hook for safe external link handling
 */
export function useSafeLink() {
  const openSafeLink = useCallback((url: string, target: string = '_blank') => {
    const sanitizedURL = InputSecurity.sanitizeURL(url);

    if (!sanitizedURL) {
      console.error('Unsafe URL blocked:', url);
      return;
    }

    // Open with noopener noreferrer
    const link = document.createElement('a');
    link.href = sanitizedURL;
    link.target = target;
    link.rel = 'noopener noreferrer';
    link.click();
  }, []);

  return { openSafeLink };
}

/**
 * Component wrapper for safe HTML rendering
 */
export function useSafeHTML(html: string, allowedTags?: string[]) {
  const [safeHTML, setSafeHTML] = useState('');

  useEffect(() => {
    const sanitized = InputSecurity.sanitizeHTML(html, allowedTags);
    setSafeHTML(sanitized);
  }, [html, allowedTags]);

  return safeHTML;
}
