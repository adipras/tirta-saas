import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-xl font-semibold text-gray-900 sm:text-2xl">{title}</h1>
        {subtitle && (
          <p className="max-w-3xl text-sm leading-6 text-gray-500">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:w-auto sm:max-w-full sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
