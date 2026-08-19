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

    const inputClassName = `input-base ${
      error
        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10'
        : ''
    } ${
      icon ? (iconPosition === 'left' ? 'pl-9' : 'pr-9') : ''
    } ${
      props.disabled ? 'bg-surface-50 cursor-not-allowed opacity-60' : ''
    } ${className}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-surface-700">
            {label}
            {required && <span className="ml-1 text-danger-500">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-surface-400">{icon}</span>
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
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-surface-400">{icon}</span>
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="mt-1.5 text-[12px] text-danger-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-[12px] text-surface-400">
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

    const textareaClassName = `input-base resize-none ${
      error
        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10'
        : ''
    } ${
      props.disabled ? 'bg-surface-50 cursor-not-allowed opacity-60' : ''
    } ${className}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-[13px] font-medium text-surface-700">
            {label}
            {required && <span className="ml-1 text-danger-500">*</span>}
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
          <p id={errorId} className="mt-1.5 text-[12px] text-danger-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-[12px] text-surface-400">
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

    const selectClassName = `input-base appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%2394a3b8%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_0.5rem_center] bg-no-repeat pr-10 ${
      error
        ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10'
        : ''
    } ${
      props.disabled ? 'bg-surface-50 cursor-not-allowed opacity-60' : ''
    } ${className}`;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-[13px] font-medium text-surface-700">
            {label}
            {required && <span className="ml-1 text-danger-500">*</span>}
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
          <p id={errorId} className="mt-1.5 text-[12px] text-danger-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-[12px] text-surface-400">
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
            className={`h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500/20 focus:ring-offset-2 focus:ring-offset-white ${className}`}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            {...props}
          />
          {label && (
            <label htmlFor={checkboxId} className="ml-2 block text-[13px] text-surface-700">
              {label}
            </label>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-[12px] text-danger-600">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-[12px] text-surface-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';
