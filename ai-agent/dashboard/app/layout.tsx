import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Cybersecurity Agent Dashboard",
  description:
    "Real-time monitoring and control dashboard for AI-powered cybersecurity agent",
  keywords: [
    "cybersecurity",
    "AI",
    "monitoring",
    "dashboard",
    "threat detection",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground`}
      >
        <div className="flex flex-col min-h-screen">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        AI
                      </span>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold">Cybersecurity Agent</h1>
                      <p className="text-xs text-muted-foreground">
                        Real-time Monitoring Dashboard
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>System Operational</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Week 4: Integration & Monitoring
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>AI Cybersecurity Agent v1.0.0</div>
                <div>Powered by Microsoft Agent Framework & OpenAI</div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
