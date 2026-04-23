import type { ComponentType, SVGProps } from 'react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type DashboardStatTone = 'blue' | 'yellow' | 'cyan' | 'green' | 'purple';

interface DashboardStatCardProps {
  title: string;
  value: string;
  helper?: string;
  subtitle?: string;
  icon: IconComponent;
  tone?: DashboardStatTone;
}

const toneClasses: Record<DashboardStatTone, { icon: string; surface: string }> = {
  blue: {
    icon: 'bg-blue-600 text-white',
    surface: 'bg-blue-50 text-blue-700',
  },
  yellow: {
    icon: 'bg-amber-500 text-white',
    surface: 'bg-amber-50 text-amber-700',
  },
  cyan: {
    icon: 'bg-cyan-600 text-white',
    surface: 'bg-cyan-50 text-cyan-700',
  },
  green: {
    icon: 'bg-green-600 text-white',
    surface: 'bg-green-50 text-green-700',
  },
  purple: {
    icon: 'bg-purple-600 text-white',
    surface: 'bg-purple-50 text-purple-700',
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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {value}
          </p>
          {helper && (
            <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes.surface}`}>
              {helper}
            </p>
          )}
        </div>
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${classes.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {subtitle && (
        <p className="mt-3 text-sm leading-6 text-gray-500">{subtitle}</p>
      )}
    </div>
  );
};

export default DashboardStatCard;
