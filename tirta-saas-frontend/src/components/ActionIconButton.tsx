import type { ButtonHTMLAttributes, ComponentType, SVGProps } from 'react';

type ActionIconTone = 'blue' | 'gray' | 'red' | 'green' | 'orange' | 'purple' | 'emerald';
type ActionIconVariant = 'outline' | 'ghost';

interface ActionIconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'> {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  tone?: ActionIconTone;
  variant?: ActionIconVariant;
}

const toneStyles: Record<ActionIconTone, { outline: string; ghost: string }> = {
  blue: {
    outline: 'border-blue-200 text-blue-600 hover:bg-blue-50',
    ghost: 'text-blue-600 hover:bg-blue-50 hover:text-blue-800',
  },
  gray: {
    outline: 'border-gray-200 text-gray-600 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-50 hover:text-gray-800',
  },
  red: {
    outline: 'border-red-200 text-red-600 hover:bg-red-50',
    ghost: 'text-red-600 hover:bg-red-50 hover:text-red-800',
  },
  green: {
    outline: 'border-green-200 text-green-600 hover:bg-green-50',
    ghost: 'text-green-600 hover:bg-green-50 hover:text-green-800',
  },
  orange: {
    outline: 'border-orange-200 text-orange-600 hover:bg-orange-50',
    ghost: 'text-orange-600 hover:bg-orange-50 hover:text-orange-800',
  },
  purple: {
    outline: 'border-purple-200 text-purple-600 hover:bg-purple-50',
    ghost: 'text-purple-600 hover:bg-purple-50 hover:text-purple-800',
  },
  emerald: {
    outline: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
    ghost: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800',
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
      ? 'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'
      : 'inline-flex items-center justify-center rounded-lg p-2.5 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <button
      type="button"
      className={`${baseClassName} ${toneStyles[tone][variant]} ${className}`.trim()}
      aria-label={label}
      title={title ?? label}
      {...props}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
};
