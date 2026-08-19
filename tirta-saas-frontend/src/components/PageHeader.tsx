import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const PageHeader = ({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) => {
  return (
    <div className="mb-6 space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[13px] text-surface-400">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-surface-300">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="text-surface-500 hover:text-brand-600 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-surface-700 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-surface-900 sm:text-2xl">{title}</h1>
          {subtitle && (
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-surface-400">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[fit-content]">
            <div className="flex flex-wrap items-center gap-2">
              {actions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
