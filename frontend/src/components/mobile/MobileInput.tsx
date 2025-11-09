"use client";
import { InputHTMLAttributes, forwardRef } from "react";
import { LucideIcon } from "lucide-react";

interface MobileInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
  helperText?: string;
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ label, error, icon: Icon, helperText, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={props.id}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </label>
        )}

        <input
          ref={ref}
          className={`
            w-full min-h-[48px] px-4 py-3 text-base
            bg-white dark:bg-gray-900
            border-2 ${
              error ? "border-red-500" : "border-gray-200 dark:border-gray-700"
            }
            rounded-xl
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:ring-4 ${
              error
                ? "focus:ring-red-100 dark:focus:ring-red-900"
                : "focus:ring-blue-100 dark:focus:ring-blue-900"
            }
            focus:border-${error ? "red" : "blue"}-500
            transition-all duration-200
            touch-manipulation
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `
            .trim()
            .replace(/\s+/g, " ")}
          {...props}
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = "MobileInput";

export default MobileInput;
