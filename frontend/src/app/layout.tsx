import AuthProvider from '@/components/AuthProvider';
import ChatbotWidget from '@/components/ChatbotWidget';
import ErrorBoundary from '@/components/ErrorBoundary';
import LiveSupportScript from '@/components/LiveSupportScript';
import OrganizationJsonLd from '@/components/OrganizationJsonLd';
import ScrollToTop from '@/components/ScrollToTop';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import SilentModeProvider from '@/components/SilentModeProvider';
import SplashScreen from '@/components/SplashScreen';
import SystemFeedbackBanner from '@/components/SystemFeedbackBanner';
import TrustpilotInvitation from '@/components/TrustpilotInvitation';
import { AuthProvider as RBACAuthProvider } from '@/context/AuthContext';
import type { Metadata, Viewport } from 'next';
import './globals.css';
// import dynamic from "next/dynamic";

// Dynamically import AdvanciaAIWidget to avoid SSR issues
// const AdvanciaAIWidget = dynamic(() => import("@/components/AdvanciaAIWidget"), {
//   ssr: false,
//   loading: () => null,
// });

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  // Allow zooming for accessibility - removed maximumScale restriction
};

export const metadata: Metadata = {
  title: 'Advancia - Your Gateway to Financial Freedom',
  description:
    'Trade crypto, manage wealth, and grow your portfolio with bank-level security. Trusted by 500,000+ users worldwide.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.svg', type: 'image/svg+xml' }],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <OrganizationJsonLd />
        <SplashScreen />
        <ErrorBoundary>
          <ScrollToTop />
          <AuthProvider>
            <RBACAuthProvider>
              <SilentModeProvider />
              <SystemFeedbackBanner />
              <LiveSupportScript />
              <TrustpilotInvitation />
              <ServiceWorkerRegistration />
              {children}
              <ChatbotWidget />
              {/* Advancia AI chat widget - temporarily disabled for build testing */}
              {/* <AdvanciaAIWidget /> */}
            </RBACAuthProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
