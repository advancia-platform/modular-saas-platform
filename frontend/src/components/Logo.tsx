'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'light' | 'dark' | 'gradient';
  useSvg?: boolean;
}

export default function Logo({
  size = 'md',
  showText = true,
  variant = 'gradient',
  useSvg = true,
}: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-lg', container: 'w-8 h-8', full: { w: 150, h: 30 } },
    md: { icon: 40, text: 'text-xl', container: 'w-10 h-10', full: { w: 200, h: 40 } },
    lg: { icon: 48, text: 'text-2xl', container: 'w-12 h-12', full: { w: 250, h: 50 } },
  };

  // Use SVG logo files
  if (useSvg) {
    if (showText) {
      // Full logo with text
      const logoSrc = variant === 'dark' ? '/logo-full-dark.svg' : '/logo-full.svg';
      return (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src={logoSrc}
            alt="Advancia Pay Ledger"
            width={sizes[size].full.w}
            height={sizes[size].full.h}
            priority
          />
        </motion.div>
      );
    } else {
      // Icon only
      return (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Image
            src="/logo-icon.svg"
            alt="Advancia"
            width={sizes[size].icon}
            height={sizes[size].icon}
            priority
          />
        </motion.div>
      );
    }
  }

  // Fallback to CSS-based logo
  const variants = {
    light: 'bg-white text-blue-600 border-blue-200',
    dark: 'bg-slate-900 text-white border-slate-700',
    gradient:
      'bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white border-transparent',
  };

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo Icon */}
      <div
        className={`${sizes[size].container} ${variants[variant]} border-2 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden`}
      >
        {/* Stylized A */}
        <span className="font-bold text-xl">A</span>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <motion.span
            className={`${sizes[size].text} font-black tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            ADVANCIA
          </motion.span>
          <motion.span
            className={`${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'} font-semibold tracking-wider text-slate-600`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            PAYLEDGER
          </motion.span>
        </div>
      )}
    </motion.div>
  );
}
