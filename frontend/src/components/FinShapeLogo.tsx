"use client";

import { motion } from "framer-motion";

interface FinShapeLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-4xl",
};

export default function FinShapeLogo({
  size = "md",
  animated = true,
  showText = true,
  className = "",
}: FinShapeLogoProps) {
  const logoVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
      },
    },
  };

  const shapeVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  };

  const textVariants = {
    initial: { x: -20, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        delay: 0.5,
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      className={`flex items-center gap-3 ${className}`}
      variants={animated ? logoVariants : undefined}
      initial={animated ? "initial" : undefined}
      animate={animated ? "animate" : undefined}
      whileHover={animated ? "hover" : undefined}
    >
      {/* Logo Icon */}
      <div className={`relative ${sizeClasses[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer hexagon */}
          <motion.path
            d="M50 5 L85 27.5 L85 72.5 L50 95 L15 72.5 L15 27.5 Z"
            stroke="url(#gradient1)"
            strokeWidth="3"
            fill="none"
            variants={animated ? shapeVariants : undefined}
            initial={animated ? "initial" : undefined}
            animate={animated ? "animate" : undefined}
          />

          {/* Inner geometric shapes - Financial chart inspired */}
          <motion.path
            d="M30 70 L40 55 L50 60 L60 40 L70 45"
            stroke="url(#gradient2)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={animated ? shapeVariants : undefined}
            initial={animated ? "initial" : undefined}
            animate={animated ? "animate" : undefined}
          />

          {/* Currency symbol - Dollar/Crypto inspired */}
          <motion.g
            variants={animated ? shapeVariants : undefined}
            initial={animated ? "initial" : undefined}
            animate={animated ? "animate" : undefined}
          >
            <path
              d="M50 25 L50 75"
              stroke="url(#gradient3)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M42 32 C42 28 45 25 50 25 C55 25 58 28 58 32 C58 36 55 38 50 38"
              stroke="url(#gradient3)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M50 62 C55 62 58 65 58 69 C58 73 55 75 50 75 C45 75 42 73 42 69"
              stroke="url(#gradient3)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="gradient3" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Glow effect */}
        {animated && (
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      {/* Logo Text */}
      {showText && (
        <motion.div
          className="flex flex-col"
          variants={animated ? textVariants : undefined}
          initial={animated ? "initial" : undefined}
          animate={animated ? "animate" : undefined}
        >
          <span
            className={`font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent ${textSizeClasses[size]}`}
          >
            FinShape
          </span>
          <span className="text-xs text-gray-500 -mt-1">
            Crypto Trading Platform
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
