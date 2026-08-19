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
  default: 'bg-surface-100 text-surface-600 ring-1 ring-surface-200',
  primary: 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
  secondary: 'bg-purple-50 text-purple-700 ring-1 ring-purple-100',
  success: 'bg-success-50 text-success-700 ring-1 ring-success-100',
  danger: 'bg-danger-50 text-danger-700 ring-1 ring-danger-100',
  warning: 'bg-warning-50 text-warning-700 ring-1 ring-warning-100',
  info: 'bg-info-50 text-info-700 ring-1 ring-info-100',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5 text-[10px]',
  sm: 'px-2.5 py-0.5 text-[11px]',
  md: 'px-3 py-1 text-xs',
  lg: 'px-3.5 py-1.5 text-sm',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-400',
  primary: 'bg-brand-500',
  secondary: 'bg-purple-500',
  success: 'bg-success-500',
  danger: 'bg-danger-500',
  warning: 'bg-warning-500',
  info: 'bg-info-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  dot = false,
  rounded = false,
}) => {
  const roundedClass = rounded ? 'rounded-full' : 'rounded-md';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${variantStyles[variant]} ${sizeStyles[size]} ${roundedClass} ${className}`}
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
    active: { variant: 'success' as BadgeVariant, label: 'Aktif', dot: true },
    inactive: { variant: 'default' as BadgeVariant, label: 'Nonaktif', dot: true },
    pending: { variant: 'warning' as BadgeVariant, label: 'Menunggu', dot: true },
    suspended: { variant: 'danger' as BadgeVariant, label: 'Ditangguhkan', dot: true },
    completed: { variant: 'success' as BadgeVariant, label: 'Selesai', dot: false },
    cancelled: { variant: 'danger' as BadgeVariant, label: 'Dibatalkan', dot: false },
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
    paid: { variant: 'success' as BadgeVariant, label: 'Lunas', dot: true },
    unpaid: { variant: 'warning' as BadgeVariant, label: 'Belum Lunas', dot: true },
    partial: { variant: 'info' as BadgeVariant, label: 'Sebagian', dot: true },
    overdue: { variant: 'danger' as BadgeVariant, label: 'Jatuh Tempo', dot: true },
    void: { variant: 'default' as BadgeVariant, label: 'Dibatalkan', dot: false },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={config.dot} rounded>
      {config.label}
    </Badge>
  );
};
