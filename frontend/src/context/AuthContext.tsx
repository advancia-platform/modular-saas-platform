'use client';

import { jwtDecode } from 'jwt-decode';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Role definitions matching backend RBAC
export type UserRole =
  | 'SUPER_ADMIN'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'READ_ONLY'
  | 'admin'
  | 'user';

export interface AuthUser {
  id: string;
  email?: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (token: string, refreshToken?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canAccess: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  hasRole: () => false,
  canAccess: () => false,
});

interface JWTPayload {
  id?: string;
  sub?: string;
  userId?: string;
  email?: string;
  role?: UserRole;
  userRole?: UserRole;
  firstName?: string;
  lastName?: string;
  exp?: number;
  iat?: number;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Decode token and extract user info
  const decodeToken = useCallback((token: string): AuthUser | null => {
    try {
      const decoded = jwtDecode<JWTPayload>(token);

      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.warn('Token expired');
        return null;
      }

      return {
        id: decoded.id || decoded.sub || decoded.userId || '',
        email: decoded.email,
        role: decoded.role || decoded.userRole || 'user',
        firstName: decoded.firstName,
        lastName: decoded.lastName,
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userData = decodeToken(token);
      if (userData) {
        setUser(userData);
      } else {
        // Invalid or expired token, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
  }, [decodeToken]);

  // Login function
  const login = useCallback(
    (token: string, refreshToken?: string) => {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      const userData = decodeToken(token);
      setUser(userData);
    },
    [decodeToken]
  );

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Check if user has a specific role
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role);
    },
    [user]
  );

  // Check if user can access based on required roles
  const canAccess = useCallback(
    (requiredRoles: UserRole[]): boolean => {
      if (!user) return false;
      // SUPER_ADMIN has access to everything
      if (user.role === 'SUPER_ADMIN') return true;
      return requiredRoles.includes(user.role);
    },
    [user]
  );

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role permission helpers
export const ROLE_PERMISSIONS = {
  // SUPER_ADMIN → Full analytics suite + settings + all actions
  SUPER_ADMIN: [
    'dashboard',
    'users',
    'payments',
    'ledger',
    'settings',
    'analytics',
    'crypto',
    'manage_users',
    'manage_ledger',
    'manage_settings',
    'view_charts',
    'all',
  ],
  // FINANCE_ADMIN → Revenue + Payment Split + Ledger (no settings)
  FINANCE_ADMIN: [
    'dashboard',
    'payments',
    'ledger',
    'analytics',
    'crypto',
    'manage_ledger',
    'view_charts',
  ],
  // SUPPORT_ADMIN → User management only
  SUPPORT_ADMIN: ['dashboard', 'users', 'tickets', 'manage_users'],
  // READ_ONLY → Charts only, no actions
  READ_ONLY: ['dashboard', 'analytics', 'view_charts'],
  // Legacy admin role (full access)
  admin: [
    'dashboard',
    'users',
    'payments',
    'ledger',
    'settings',
    'analytics',
    'crypto',
    'manage_users',
    'manage_ledger',
    'manage_settings',
    'view_charts',
    'all',
  ],
  user: ['dashboard'],
} as const;

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return (
    (permissions as readonly string[]).includes('all') ||
    (permissions as readonly string[]).includes(permission)
  );
}
