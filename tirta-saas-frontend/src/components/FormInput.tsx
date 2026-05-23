import React, { forwardRef, useId } from 'react';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = 'left',
      fullWidth = true,
      className = '',
      id,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = !error && helperText ? `${inputId}-helper` : undefined;
    const describedBy = [props['aria-describedby'], errorId, helperId].filter(Boolean).join(' ') || undefined;

    const inputClassName = `block ${fullWidth ? 'w-full' : ''} px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
      error ? 'border-red-300 text-red-900' : 'border-gray-300'
    } ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''} ${
      props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
    } ${className}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputClassName}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />

          {icon && iconPosition === 'right' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    { label, error, helperText, fullWidth = true, className = '', id, required, ...props },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = !error && helperText ? `${textareaId}-helper` : undefined;
    const describedBy = [props['aria-describedby'], errorId, helperId].filter(Boolean).join(' ') || undefined;

    const textareaClassName = `block ${fullWidth ? 'w-full' : ''} px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
      error ? 'border-red-300 text-red-900' : 'border-gray-300'
    } ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={textareaClassName}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />

        {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
        )}
        {!error && helperText && (
        <p id={helperId} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      options,
      placeholder,
      className = '',
      id,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = !error && helperText ? `${selectId}-helper` : undefined;
    const describedBy = [props['aria-describedby'], errorId, helperId].filter(Boolean).join(' ') || undefined;

    const selectClassName = `block ${fullWidth ? 'w-full' : ''} px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
      error ? 'border-red-300 text-red-900' : 'border-gray-300'
    } ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          className={selectClassName}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

export interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;
    const errorId = error ? `${checkboxId}-error` : undefined;
    const helperId = !error && helperText ? `${checkboxId}-helper` : undefined;
    const describedBy = [props['aria-describedby'], errorId, helperId].filter(Boolean).join(' ') || undefined;

    return (
      <div>
        <div className="flex items-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${className}`}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />
          {label && (
            <label htmlFor={checkboxId} className="ml-2 block text-sm text-gray-900">
              {label}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';
