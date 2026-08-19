import type { ButtonHTMLAttributes, ComponentType, SVGProps } from 'react';

type ActionIconTone = 'blue' | 'gray' | 'red' | 'green' | 'orange' | 'purple' | 'emerald' | 'brand';
type ActionIconVariant = 'outline' | 'ghost';

interface ActionIconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  tone?: ActionIconTone;
  variant?: ActionIconVariant;
}

const toneStyles: Record<ActionIconTone, { outline: string; ghost: string }> = {
  brand: {
    outline: 'border-brand-200 text-brand-600 hover:bg-brand-50',
    ghost: 'text-brand-600 hover:bg-brand-50 hover:text-brand-700',
  },
  blue: {
    outline: 'border-info-200 text-info-600 hover:bg-info-50',
    ghost: 'text-info-600 hover:bg-info-50 hover:text-info-700',
  },
  gray: {
    outline: 'border-surface-200 text-surface-500 hover:bg-surface-50',
    ghost: 'text-surface-500 hover:bg-surface-50 hover:text-surface-700',
  },
  red: {
    outline: 'border-danger-200 text-danger-600 hover:bg-danger-50',
    ghost: 'text-danger-600 hover:bg-danger-50 hover:text-danger-700',
  },
  green: {
    outline: 'border-success-200 text-success-600 hover:bg-success-50',
    ghost: 'text-success-600 hover:bg-success-50 hover:text-success-700',
  },
  orange: {
    outline: 'border-warning-200 text-warning-600 hover:bg-warning-50',
    ghost: 'text-warning-600 hover:bg-warning-50 hover:text-warning-700',
  },
  purple: {
    outline: 'border-purple-200 text-purple-600 hover:bg-purple-50',
    ghost: 'text-purple-600 hover:bg-purple-50 hover:text-purple-700',
  },
  emerald: {
    outline: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
    ghost: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
  },
};

export const ActionIconButton = ({
  icon: Icon,
  label,
  tone = 'blue',
  variant = 'outline',
  className = '',
  title,
  ...props
}: ActionIconButtonProps) => {
  const baseClassName =
    variant === 'outline'
      ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
      : 'inline-flex items-center justify-center rounded-lg p-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <button
      type="button"
      className={`${baseClassName} ${toneStyles[tone][variant]} ${className}`.trim()}
      aria-label={label}
      title={title ?? label}
      {...props}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
};
