import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { User } from "next-auth"

// Get NextAuth secret (supports Base64 encoded)
function getNextAuthSecret(): string {
  if (process.env.NEXTAUTH_SECRET_BASE64) {
    return Buffer.from(process.env.NEXTAUTH_SECRET_BASE64, 'base64').toString('utf8');
  }
  return process.env.NEXTAUTH_SECRET || '';
}

const authOptions: NextAuthOptions = {
  secret: getNextAuthSecret(),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call backend API
          const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const apiUrl = `${base.replace(/\/$/, '')}/api`;
          const apiKey = process.env.NEXT_PUBLIC_API_KEY || 'development-key';

          const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          });

          if (!response.ok) {
            console.error('Login failed:', response.status);
            return null;
          }

          const data = await response.json();

          if (data.user && data.token) {
            return {
              id: data.user.id,
              email: data.user.email,
              name: data.user.firstName && data.user.lastName 
                ? `${data.user.firstName} ${data.user.lastName}`.trim()
                : data.user.username || data.user.email,
              accessToken: data.token
            };
          }

          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User | null }) {
      if (user) {
        token.id = user.id
        // Store access token from backend
        const userWithToken = user as User & { accessToken?: string }
        if (userWithToken.accessToken) {
          token.accessToken = userWithToken.accessToken
        }
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        const userWithId = session.user as typeof session.user & { id?: string; accessToken?: string }
        userWithId.id = typeof token.id === "string" ? token.id : undefined
        // Include access token in session for API calls
        if (token.accessToken) {
          userWithId.accessToken = token.accessToken as string
        }
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
