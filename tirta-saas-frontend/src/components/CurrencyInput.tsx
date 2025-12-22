import React, { useState, useEffect } from 'react';

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  locale?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  min?: number;
  max?: number;
  required?: boolean;
  name?: string;
  id?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency = 'IDR',
  locale = 'id-ID',
  placeholder = '0',
  disabled = false,
  className = '',
  error,
  min = 0,
  max,
  required = false,
  name,
  id,
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value, isFocused]);

  const formatCurrency = (num: number): string => {
    if (num === 0) return '';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const parseCurrency = (str: string): number => {
    const cleaned = str.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = parseCurrency(inputValue);

    if (max !== undefined && numericValue > max) {
      return;
    }

    if (numericValue < min) {
      return;
    }

    setDisplayValue(inputValue);
    onChange(numericValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value === 0) {
      setDisplayValue('');
    } else {
      setDisplayValue(value.toString());
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = parseCurrency(displayValue);
    onChange(numericValue);
    setDisplayValue(formatCurrency(numericValue));
  };

  const baseClassName = `block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
    error ? 'border-red-300' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

  return (
    <div className={className}>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        id={id}
        className={baseClassName}
        inputMode="numeric"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export interface CurrencyDisplayProps {
  value: number;
  currency?: string;
  locale?: string;
  className?: string;
  showZero?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  value,
  currency = 'IDR',
  locale = 'id-ID',
  className = '',
  showZero = true,
}) => {
  if (value === 0 && !showZero) {
    return <span className={className}>-</span>;
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return <span className={className}>{formatted}</span>;
};
