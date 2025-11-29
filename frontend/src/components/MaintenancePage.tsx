'use client';

import { useEffect, useState } from 'react';

interface MaintenancePageProps {
  estimatedDowntime?: string;
  reason?: string;
  contactEmail?: string;
  showCountdown?: boolean;
  endTime?: Date;
}

export default function MaintenancePage({
  estimatedDowntime = '30 minutes',
  reason = 'scheduled maintenance',
  contactEmail = 'support@advancia.com',
  showCountdown = false,
  endTime,
}: MaintenancePageProps) {
  const [countdown, setCountdown] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showCountdown || !endTime) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        setCountdown('Returning shortly...');
        clearInterval(timer);
        // Auto-refresh after maintenance
        setTimeout(() => window.location.reload(), 10000);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown, endTime]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
            <svg
              className="w-12 h-12 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>

        {/* Main content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            We&apos;ll be right back
          </h1>

          <p className="text-lg text-gray-300 mb-6">
            We&apos;re currently performing {reason} to improve your experience.
          </p>

          {/* Countdown or estimated time */}
          {showCountdown && countdown ? (
            <div className="mb-8">
              <p className="text-sm text-gray-400 mb-2">Estimated time remaining</p>
              <div className="text-4xl md:text-5xl font-mono font-bold text-purple-400">
                {countdown}
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-sm text-gray-400 mb-2">Estimated downtime</p>
              <div className="text-2xl font-semibold text-purple-400">{estimatedDowntime}</div>
            </div>
          )}

          {/* Progress animation */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-8 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse w-2/3"></div>
          </div>

          {/* Status indicators */}
          <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-gray-400">API</p>
              <p className="text-yellow-400 font-medium">Updating</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-gray-400">Database</p>
              <p className="text-green-400 font-medium">Online</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-gray-400">Services</p>
              <p className="text-yellow-400 font-medium">Updating</p>
            </div>
          </div>

          {/* Contact */}
          <div className="text-gray-400 text-sm">
            <p>Need urgent assistance?</p>
            <a
              href={`mailto:${contactEmail}`}
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              {contactEmail}
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Advancia Pay Ledger. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper component that checks maintenance mode
 */
export function MaintenanceWrapper({ children }: { children: React.ReactNode }) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState<{
    endTime?: Date;
    reason?: string;
  }>({});

  useEffect(() => {
    // Check maintenance status from API
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/health/maintenance');
        const data = await res.json();
        setIsMaintenanceMode(data.maintenanceMode);
        if (data.maintenanceMode) {
          setMaintenanceConfig({
            endTime: data.endTime ? new Date(data.endTime) : undefined,
            reason: data.reason,
          });
        }
      } catch {
        // API is down, might be maintenance
        setIsMaintenanceMode(true);
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, []);

  if (isMaintenanceMode) {
    return (
      <MaintenancePage
        showCountdown={!!maintenanceConfig.endTime}
        endTime={maintenanceConfig.endTime}
        reason={maintenanceConfig.reason}
      />
    );
  }

  return <>{children}</>;
}
