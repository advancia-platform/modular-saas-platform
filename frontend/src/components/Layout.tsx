'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import Footer from './Footer';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  className?: string;
  /** Show header navigation */
  showHeader?: boolean;
  /** Show footer */
  showFooter?: boolean;
  /** Max width variant */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Center content vertically */
  centerVertically?: boolean;
  /** Add padding to content */
  padded?: boolean;
  /** Background variant */
  background?: 'default' | 'gradient' | 'dots' | 'grid';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const backgroundClasses = {
  default: 'bg-gray-50 dark:bg-gray-900',
  gradient:
    'bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
  dots: 'bg-gray-50 dark:bg-gray-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] bg-[size:20px_20px]',
  grid: 'bg-gray-50 dark:bg-gray-900 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#374151_1px,transparent_1px),linear-gradient(to_bottom,#374151_1px,transparent_1px)] bg-[size:40px_40px]',
};

export default function Layout({
  children,
  className,
  showHeader = true,
  showFooter = true,
  maxWidth = 'xl',
  centerVertically = false,
  padded = true,
  background = 'default',
}: LayoutProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for dark mode via class or media query
    const checkDarkMode = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(hasDarkClass || prefersDark);
    };
    checkDarkMode();

    // Listen for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col transition-colors duration-300',
        backgroundClasses[background]
      )}
    >
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Header */}
      {showHeader && <Header />}

      {/* Main content area */}
      <main
        id="main-content"
        className={cn('flex-1', centerVertically && 'flex items-center justify-center', className)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname || 'default'}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'w-full mx-auto',
              maxWidthClasses[maxWidth],
              padded && 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8'
            )}
          >
            {mounted ? children : <LayoutSkeleton />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {showFooter && <Footer />}

      {/* Theme-aware background overlay for dark mode */}
      {mounted && isDarkMode && (
        <div className="fixed inset-0 -z-10 pointer-events-none bg-gradient-to-t from-gray-900/50 to-transparent" />
      )}
    </div>
  );
}

// Loading skeleton for initial render
function LayoutSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3" />
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Export named variant for admin pages
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Layout showHeader={false} showFooter={false} maxWidth="full" padded={false}>
      {children}
    </Layout>
  );
}

// Export named variant for auth pages
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Layout
      showHeader={false}
      showFooter={false}
      maxWidth="sm"
      centerVertically
      background="gradient"
    >
      {children}
    </Layout>
  );
}

// Export named variant for dashboard pages
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Layout maxWidth="2xl" background="dots">
      {children}
    </Layout>
  );
}
