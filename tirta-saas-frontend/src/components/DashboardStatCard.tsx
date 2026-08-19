import type { ComponentType, SVGProps } from 'react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type DashboardStatTone = 'blue' | 'yellow' | 'cyan' | 'green' | 'purple' | 'red';

interface DashboardStatCardProps {
  title: string;
  value: string;
  helper?: string;
  subtitle?: string;
  icon: IconComponent;
  tone?: DashboardStatTone;
}

const toneClasses: Record<DashboardStatTone, { icon: string; iconText: string; badge: string }> = {
  blue: {
    icon: 'bg-brand-50 ring-1 ring-brand-100',
    iconText: 'text-brand-600',
    badge: 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
  },
  yellow: {
    icon: 'bg-warning-50 ring-1 ring-warning-100',
    iconText: 'text-warning-600',
    badge: 'bg-warning-50 text-warning-700 ring-1 ring-warning-100',
  },
  cyan: {
    icon: 'bg-cyan-50 ring-1 ring-cyan-100',
    iconText: 'text-cyan-600',
    badge: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100',
  },
  green: {
    icon: 'bg-success-50 ring-1 ring-success-100',
    iconText: 'text-success-600',
    badge: 'bg-success-50 text-success-700 ring-1 ring-success-100',
  },
  purple: {
    icon: 'bg-purple-50 ring-1 ring-purple-100',
    iconText: 'text-purple-600',
    badge: 'bg-purple-50 text-purple-700 ring-1 ring-purple-100',
  },
  red: {
    icon: 'bg-danger-50 ring-1 ring-danger-100',
    iconText: 'text-danger-600',
    badge: 'bg-danger-50 text-danger-700 ring-1 ring-danger-100',
  },
};

const DashboardStatCard = ({
  title,
  value,
  helper,
  subtitle,
  icon: Icon,
  tone = 'blue',
}: DashboardStatCardProps) => {
  const classes = toneClasses[tone];

  return (
    <div className="group rounded-xl border border-surface-200/80 bg-white p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-surface-300/80">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-surface-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-surface-900 sm:text-3xl">
            {value}
          </p>
          {helper && (
            <p className={`mt-3 inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${classes.badge}`}>
              {helper}
            </p>
          )}
        </div>
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${classes.icon}`}>
          <Icon className={`h-5 w-5 ${classes.iconText}`} />
        </div>
      </div>

      {subtitle && (
        <p className="mt-3 text-[13px] leading-relaxed text-surface-400">{subtitle}</p>
      )}
    </div>
  );
};

export default DashboardStatCard;
