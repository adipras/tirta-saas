import type { ComponentType, SVGProps } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type QuickActionTone = 'blue' | 'indigo' | 'cyan' | 'green' | 'yellow' | 'purple';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: IconComponent;
  onClick: () => void;
  tone?: QuickActionTone;
}

const toneClasses: Record<QuickActionTone, { icon: string; iconText: string }> = {
  blue: {
    icon: 'bg-brand-50 ring-1 ring-brand-100',
    iconText: 'text-brand-600',
  },
  indigo: {
    icon: 'bg-indigo-50 ring-1 ring-indigo-100',
    iconText: 'text-indigo-600',
  },
  cyan: {
    icon: 'bg-cyan-50 ring-1 ring-cyan-100',
    iconText: 'text-cyan-600',
  },
  green: {
    icon: 'bg-success-50 ring-1 ring-success-100',
    iconText: 'text-success-600',
  },
  yellow: {
    icon: 'bg-warning-50 ring-1 ring-warning-100',
    iconText: 'text-warning-600',
  },
  purple: {
    icon: 'bg-purple-50 ring-1 ring-purple-100',
    iconText: 'text-purple-600',
  },
};

const QuickActionCard = ({
  title,
  description,
  icon: Icon,
  onClick,
  tone = 'blue',
}: QuickActionCardProps) => {
  const classes = toneClasses[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[160px] flex-col items-start rounded-xl border border-surface-200/80 bg-white p-5 text-left shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-surface-300/80 hover:bg-surface-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${classes.icon} transition-transform duration-200 group-hover:scale-105`}>
        <Icon className={`h-5 w-5 ${classes.iconText}`} />
      </div>
      <div className="mt-4 flex-1 space-y-1.5">
        <p className="text-[13px] font-semibold text-surface-900">{title}</p>
        <p className="text-[13px] leading-relaxed text-surface-400">{description}</p>
      </div>
      <div className="mt-3 flex items-center gap-1 text-[12px] font-medium text-brand-600 opacity-0 transition-all duration-200 group-hover:opacity-100">
        Buka
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </button>
  );
};

export default QuickActionCard;
