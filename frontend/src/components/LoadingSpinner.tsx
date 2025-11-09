"use client";

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "circle" | "triangle" | "both";
  message?: string;
}

export default function LoadingSpinner({ 
  size = "md", 
  variant = "both",
  message = "Loading..."
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24"
  };

  const containerSize = sizeClasses[size];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Shapes Container */}
        <div className={`relative ${containerSize} mx-auto mb-6`}>
          {/* Spinning Circle */}
          {(variant === "circle" || variant === "both") && (
            <motion.div
              className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-purple-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          )}

          {/* Spinning Triangle */}
          {(variant === "triangle" || variant === "both") && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: -360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div 
                className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-indigo-600"
                style={{
                  filter: "drop-shadow(0 0 10px rgba(79, 70, 229, 0.5))"
                }}
              />
            </motion.div>
          )}

          {/* Center Pulse */}
          <motion.div
            className="absolute inset-0 m-auto w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {message}
          </h3>
          <div className="flex items-center justify-center gap-1">
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              className="w-2 h-2 bg-blue-600 rounded-full"
            />
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              className="w-2 h-2 bg-purple-600 rounded-full"
            />
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              className="w-2 h-2 bg-indigo-600 rounded-full"
            />
          </div>
        </motion.div>

        {/* Shimmer Effect */}
        <motion.div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{ opacity: 0.5 }}
        />
      </div>
    </div>
  );
}
