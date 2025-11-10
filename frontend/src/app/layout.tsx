import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import LiveSupportScript from "@/components/LiveSupportScript";
import SystemFeedbackBanner from "@/components/SystemFeedbackBanner";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import ChatbotWidget from "@/components/ChatbotWidget";
import SilentModeProvider from "@/components/SilentModeProvider";
import SplashScreen from "@/components/SplashScreen";

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  // Allow zooming for accessibility - removed maximumScale restriction
};

export const metadata: Metadata = {
  title: "Advancia - Your Gateway to Financial Freedom",
  description:
    "Trade crypto, manage wealth, and grow your portfolio with bank-level security. Trusted by 500,000+ users worldwide.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", type: "image/svg+xml" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <SplashScreen />
        <ErrorBoundary>
          <ScrollToTop />
          <AuthProvider>
            <SilentModeProvider />
            <SystemFeedbackBanner />
            <LiveSupportScript />
            <ServiceWorkerRegistration />
            {children}
            <ChatbotWidget />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
