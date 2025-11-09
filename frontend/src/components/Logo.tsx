"use client";

import { motion } from "framer-motion";
import { Wallet, Shield, Zap } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "light" | "dark" | "gradient";
}

export default function Logo({ size = "md", showText = true, variant = "gradient" }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg", container: "w-8 h-8" },
    md: { icon: 32, text: "text-xl", container: "w-10 h-10" },
    lg: { icon: 40, text: "text-2xl", container: "w-12 h-12" },
  };

  const variants = {
    light: "bg-white text-blue-600 border-blue-200",
    dark: "bg-slate-900 text-white border-slate-700",
    gradient: "bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white border-transparent",
  };

  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo Icon */}
      <div className={`${sizes[size].container} ${variants[variant]} border-2 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden`}>
        {/* Animated background shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Triple icon stack for fintech feel */}
        <div className="relative flex items-center justify-center">
          <Wallet size={sizes[size].icon * 0.6} className="absolute opacity-30 -translate-x-1" />
          <Shield size={sizes[size].icon * 0.7} className="absolute opacity-50" />
          <Zap size={sizes[size].icon * 0.5} className="relative z-10" />
        </div>
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
            className={`${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"} font-semibold tracking-wider text-slate-600`}
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
