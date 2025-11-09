"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RequireRoleProps {
  roles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Client-side role-based access control component
 * Redirects to login if not authenticated, or to /403 if wrong role
 */
export default function RequireRole({
  roles = ["USER"],
  children,
  fallback = null,
}: RequireRoleProps) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("token");
          router.push("/auth/login");
          return;
        }

        const user = await response.json();

        // Check if user has required role
        if (user?.role && roles.includes(user.role)) {
          setAuthorized(true);
        } else {
          router.push("/403");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [roles, router]);

  if (loading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}

