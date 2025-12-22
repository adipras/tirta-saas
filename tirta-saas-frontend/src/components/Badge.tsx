import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  dot?: boolean;
  rounded?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800 border-gray-300',
  primary: 'bg-blue-100 text-blue-800 border-blue-300',
  secondary: 'bg-purple-100 text-purple-800 border-purple-300',
  success: 'bg-green-100 text-green-800 border-green-300',
  danger: 'bg-red-100 text-red-800 border-red-300',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  info: 'bg-cyan-100 text-cyan-800 border-cyan-300',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5 text-xs',
  sm: 'px-2.5 py-0.5 text-sm',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  primary: 'bg-blue-500',
  secondary: 'bg-purple-500',
  success: 'bg-green-500',
  danger: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-cyan-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false,
  rounded = false,
}) => {
  const roundedClass = rounded ? 'rounded-full' : 'rounded';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border ${variantStyles[variant]} ${sizeStyles[size]} ${roundedClass} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};

// Predefined status badges
export const StatusBadge: React.FC<{
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'completed' | 'cancelled';
  size?: BadgeSize;
}> = ({ status, size = 'sm' }) => {
  const statusConfig = {
    active: { variant: 'success' as BadgeVariant, label: 'Active', dot: true },
    inactive: { variant: 'default' as BadgeVariant, label: 'Inactive', dot: true },
    pending: { variant: 'warning' as BadgeVariant, label: 'Pending', dot: true },
    suspended: { variant: 'danger' as BadgeVariant, label: 'Suspended', dot: true },
    completed: { variant: 'success' as BadgeVariant, label: 'Completed', dot: false },
    cancelled: { variant: 'danger' as BadgeVariant, label: 'Cancelled', dot: false },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={config.dot} rounded>
      {config.label}
    </Badge>
  );
};

export const PaymentStatusBadge: React.FC<{
  status: 'paid' | 'unpaid' | 'partial' | 'overdue' | 'void';
  size?: BadgeSize;
}> = ({ status, size = 'sm' }) => {
  const statusConfig = {
    paid: { variant: 'success' as BadgeVariant, label: 'Paid', dot: true },
    unpaid: { variant: 'warning' as BadgeVariant, label: 'Unpaid', dot: true },
    partial: { variant: 'info' as BadgeVariant, label: 'Partial', dot: true },
    overdue: { variant: 'danger' as BadgeVariant, label: 'Overdue', dot: true },
    void: { variant: 'default' as BadgeVariant, label: 'Void', dot: false },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={config.dot} rounded>
      {config.label}
    </Badge>
  );
};
