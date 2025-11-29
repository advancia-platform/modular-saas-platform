'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { createContext, FormEvent, ReactNode, useCallback, useContext, useState } from 'react';

// Form Context
interface FormContextValue {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  setValue: (name: string, value: unknown) => void;
  setError: (name: string, error: string) => void;
  setTouched: (name: string, touched: boolean) => void;
  handleBlur: (name: string) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context;
}

// Form Hook
export interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validate?: (values: T) => Record<string, string>;
  onSubmit: (values: T) => Promise<void> | void;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error when value changes
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const setError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const setFieldTouched = useCallback((name: string, isTouched: boolean) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
  }, []);

  const handleBlur = useCallback(
    (name: string) => {
      setFieldTouched(name, true);
    },
    [setFieldTouched]
  );

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {});
      setTouched(allTouched);

      // Validate
      const validationErrors = validate?.(values) || {};
      setErrors(validationErrors);

      if (Object.keys(validationErrors).some((key) => validationErrors[key])) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setError,
    setTouched: setFieldTouched,
    handleBlur,
    handleSubmit,
    reset,
  };
}

// Form Component
export interface FormProps<T extends Record<string, unknown>> {
  form: ReturnType<typeof useForm<T>>;
  children: ReactNode;
  className?: string;
}

export function Form<T extends Record<string, unknown>>({
  form,
  children,
  className,
}: FormProps<T>) {
  const contextValue: FormContextValue = {
    values: form.values,
    errors: form.errors,
    touched: form.touched,
    isSubmitting: form.isSubmitting,
    setValue: form.setValue,
    setError: form.setError,
    setTouched: form.setTouched,
    handleBlur: form.handleBlur,
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={form.handleSubmit} className={className}>
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Form Field Component
export interface FormFieldProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
  inputClassName?: string;
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  disabled,
  helperText,
  className,
  inputClassName,
}: FormFieldProps) {
  const { values, errors, touched, isSubmitting, setValue, handleBlur } = useFormContext();

  const value = values[name] as string | number | undefined;
  const error = touched[name] ? errors[name] : undefined;
  const isDisabled = disabled || isSubmitting;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value ?? ''}
          onChange={(e) => setValue(name, e.target.value)}
          onBlur={() => handleBlur(name)}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={4}
          className={cn(
            'w-full px-3 py-2 rounded-lg border transition-colors',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-white',
            'placeholder:text-gray-400',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            isDisabled && 'opacity-50 cursor-not-allowed',
            inputClassName
          )}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={(e) =>
            setValue(name, type === 'number' ? parseFloat(e.target.value) : e.target.value)
          }
          onBlur={() => handleBlur(name)}
          placeholder={placeholder}
          disabled={isDisabled}
          error={error}
          className={inputClassName}
        />
      )}

      {error && (
        <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <AlertCircleIcon className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

// Form Select Component
export interface FormSelectProps {
  name: string;
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

export function FormSelect({
  name,
  label,
  options,
  placeholder,
  required,
  disabled,
  helperText,
  className,
}: FormSelectProps) {
  const { values, errors, touched, isSubmitting, setValue, handleBlur } = useFormContext();

  const value = values[name] as string | undefined;
  const error = touched[name] ? errors[name] : undefined;
  const isDisabled = disabled || isSubmitting;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <Select
        id={name}
        name={name}
        value={value ?? ''}
        onChange={(val) => setValue(name, val)}
        onBlur={() => handleBlur(name)}
        options={options}
        placeholder={placeholder}
        disabled={isDisabled}
        error={error}
      />

      {error && (
        <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <AlertCircleIcon className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
    </div>
  );
}

// Form Checkbox Component
export interface FormCheckboxProps {
  name: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function FormCheckbox({ name, label, description, disabled, className }: FormCheckboxProps) {
  const { values, errors, touched, isSubmitting, setValue, handleBlur } = useFormContext();

  const checked = values[name] as boolean | undefined;
  const error = touched[name] ? errors[name] : undefined;
  const isDisabled = disabled || isSubmitting;

  return (
    <div className={className}>
      <Checkbox
        id={name}
        checked={checked ?? false}
        onChange={(isChecked) => setValue(name, isChecked)}
        onBlur={() => handleBlur(name)}
        label={label}
        description={description}
        disabled={isDisabled}
        error={error}
      />
    </div>
  );
}

// Form Actions Component
export interface FormActionsProps {
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  showCancel?: boolean;
  className?: string;
}

export function FormActions({
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  showCancel = true,
  className,
}: FormActionsProps) {
  const { isSubmitting } = useFormContext();

  return (
    <div className={cn('flex items-center justify-end gap-3', className)}>
      {showCancel && onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {cancelText}
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />}
        {submitText}
      </Button>
    </div>
  );
}

// Form Section Component
export interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div
      className={cn(
        'space-y-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {(title || description) && (
        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
          {title && <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>}
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Form Row Component (for horizontal layout)
export interface FormRowProps {
  children: ReactNode;
  className?: string;
}

export function FormRow({ children, className }: FormRowProps) {
  return <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>{children}</div>;
}

export default Form;
