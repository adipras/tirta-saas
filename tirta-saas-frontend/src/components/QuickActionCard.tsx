import type { ComponentType, SVGProps } from 'react';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type QuickActionTone = 'blue' | 'indigo' | 'cyan' | 'green' | 'yellow';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: IconComponent;
  onClick: () => void;
  tone?: QuickActionTone;
}

const toneClasses: Record<QuickActionTone, { icon: string; hover: string }> = {
  blue: {
    icon: 'bg-blue-50 text-blue-700',
    hover: 'hover:border-blue-300 hover:bg-blue-50/60',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-700',
    hover: 'hover:border-indigo-300 hover:bg-indigo-50/60',
  },
  cyan: {
    icon: 'bg-cyan-50 text-cyan-700',
    hover: 'hover:border-cyan-300 hover:bg-cyan-50/60',
  },
  green: {
    icon: 'bg-green-50 text-green-700',
    hover: 'hover:border-green-300 hover:bg-green-50/60',
  },
  yellow: {
    icon: 'bg-amber-50 text-amber-700',
    hover: 'hover:border-amber-300 hover:bg-amber-50/60',
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
      className={`flex min-h-36 flex-col items-start rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition duration-150 ${classes.hover} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:min-h-40 sm:p-5`}
    >
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${classes.icon}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-sm font-semibold text-gray-900 sm:text-base">{title}</p>
        <p className="text-sm leading-6 text-gray-500">{description}</p>
      </div>
    </button>
  );
};

export default QuickActionCard;
