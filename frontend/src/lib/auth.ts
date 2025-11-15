import type { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
// Custom authentication service for static export
export const auth = {
  async signIn(credentials: { email: string; password: string }) {
    try {
      const base = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      ).replace(/\/$/, "");
      const response = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      return data;
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  },

  async signOut() {
    localStorage.removeItem("token");
    window.location.href = "/auth/login";
  },

  async getSession() {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const base = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      ).replace(/\/$/, "");
      const response = await fetch(`${base}/api/auth/session`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
      });

      if (!response.ok) {
        throw new Error("Session invalid");
      }

      const data = await response.json();
      return data;
    } catch {
      localStorage.removeItem("token");
      return null;
    }
  },
};
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim();
        const password = credentials?.password;
        if (!email || !password)
          throw new Error("Email and password are required");
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";
        const res = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "x-api-key": apiKey } : {}),
          },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Invalid credentials");
        const user = data?.user as
          | (User & {
              username?: string;
              firstName?: string;
              lastName?: string;
            })
          | undefined;
        return {
          id: user?.id || email,
          email: user?.email || email,
          name:
            (
              (user?.firstName || "") +
              (user?.lastName ? ` ${user?.lastName}` : "")
            ).trim() ||
            user?.username ||
            email,
          accessToken: data?.token,
        } as any;
      },
    }),
  ],
  pages: { signIn: "/auth/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        if (u.accessToken) token.accessToken = u.accessToken;
        if (u.id) token.userId = u.id;
        if (u.email) token.email = u.email;
        if (u.name) token.name = u.name;
      }
      return token as any;
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any)?.accessToken;
      if (session.user) {
        (session.user as any).id = (token as any)?.userId;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

// Admin middleware for API routes
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface JWTPayload {
  userId: string;
  email?: string;
  role?: string;
  type: string;
  active?: boolean;
}

/**
 * Middleware to verify JWT token and check admin role for API routes
 */
export async function requireAdmin(
  request: NextRequest
): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return null;
    }

    // Verify JWT token
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Check if user has admin role
    if (payload.role !== "ADMIN") {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Admin auth error:", error);
    return null;
  }
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(message = "Forbidden: Admins only") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Helper to create auth error response
 */
export function authErrorResponse(message = "Authentication required") {
  return NextResponse.json({ error: message }, { status: 401 });
}
