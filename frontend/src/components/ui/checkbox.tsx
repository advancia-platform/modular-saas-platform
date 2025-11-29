'use client';

import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
import * as React from 'react';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  description?: string;
  error?: string;
  onChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, checked, onChange, ...props }, ref) => {
    const checkboxId = id || React.useId();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={checkboxId}
            checked={checked}
            onChange={handleChange}
            className="sr-only peer"
            ref={ref}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error ? `${checkboxId}-error` : description ? `${checkboxId}-description` : undefined
            }
            {...props}
          />
          <div
            className={cn(
              'h-5 w-5 rounded border-2 border-gray-300 bg-white transition-colors',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
              'peer-checked:border-primary peer-checked:bg-primary',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              error && 'border-red-500 dark:border-red-400',
              className
            )}
          >
            <CheckIcon
              className={cn(
                'h-4 w-4 text-white opacity-0 transition-opacity',
                checked && 'opacity-100'
              )}
              strokeWidth={3}
            />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                htmlFor={checkboxId}
                className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none"
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={`${checkboxId}-description`}
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                {description}
              </p>
            )}
            {error && (
              <p
                id={`${checkboxId}-error`}
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
