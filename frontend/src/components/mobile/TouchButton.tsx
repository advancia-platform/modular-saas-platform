"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface TouchButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const variantStyles = {
  primary:
    "bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg",
  secondary:
    "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg",
  success:
    "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg",
  danger:
    "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg",
  warning:
    "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg",
  ghost:
    "bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100",
};

const sizeStyles = {
  sm: "min-h-[44px] px-4 py-2.5 text-sm",
  md: "min-h-[48px] px-6 py-3 text-base",
  lg: "min-h-[52px] px-8 py-3.5 text-lg",
  xl: "min-h-[56px] px-10 py-4 text-xl",
};

export default function TouchButton({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  ...props
}: TouchButtonProps) {
  const buttonClasses = `
    ${fullWidth ? "w-full" : "w-auto"}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    font-bold rounded-xl
    hover:shadow-xl active:scale-95
    transition-all duration-150
    touch-manipulation
    flex items-center justify-center gap-2 sm:gap-3
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
    ${className}
  `
    .trim()
    .replace(/\s+/g, " ");

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && (
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
          )}
          <span className="flex-1">{children}</span>
          {Icon && iconPosition === "right" && (
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
          )}
        </>
      )}
    </motion.button>
  );
}
