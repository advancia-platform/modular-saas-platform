"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface MobileCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  headerGradient?: string;
  className?: string;
  bodyClassName?: string;
  animated?: boolean;
  onClick?: () => void;
}

export default function MobileCard({
  children,
  title,
  subtitle,
  icon: Icon,
  headerGradient = "from-blue-500 via-purple-600 to-pink-600",
  className = "",
  bodyClassName = "",
  animated = true,
  onClick,
}: MobileCardProps) {
  const cardClasses = `
    bg-white dark:bg-gray-800
    rounded-2xl shadow-lg
    border border-gray-100 dark:border-gray-700
    overflow-hidden
    ${onClick ? "cursor-pointer active:scale-[0.99] hover:shadow-xl" : ""}
    transition-all duration-200
    touch-manipulation
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  const CardWrapper = animated ? motion.div : "div";
  const cardProps = animated
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        whileHover: onClick ? { scale: 1.01 } : {},
        whileTap: onClick ? { scale: 0.99 } : {},
      }
    : {};

  return (
    <CardWrapper
      className={cardClasses}
      onClick={onClick}
      {...(animated ? cardProps : {})}
    >
      {(title || subtitle || Icon) && (
        <div
          className={`bg-gradient-to-r ${headerGradient} px-4 sm:px-6 py-4 sm:py-5`}
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-white/80 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className={`p-4 sm:p-6 ${bodyClassName}`.trim()}>{children}</div>
    </CardWrapper>
  );
}
