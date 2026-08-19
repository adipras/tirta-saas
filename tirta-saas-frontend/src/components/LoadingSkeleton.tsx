import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  circle = false,
  count = 1,
}) => {
  const baseClass = 'animate-pulse bg-surface-100';
  const shapeClass = circle ? 'rounded-full' : 'rounded-lg';

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    height: height ? (typeof height === 'number' ? `${height}px` : height) : '1rem',
  };

  if (count === 1) {
    return <div className={`${baseClass} ${shapeClass} ${className}`} style={style} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`${baseClass} ${shapeClass} ${className}`} style={style} />
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 border-b border-surface-100 bg-surface-50/80 p-4">
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton key={index} height={12} className="flex-1" />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-surface-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton key={colIndex} height={16} className="flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card p-5 space-y-4">
      <Skeleton height={16} width="60%" />
      <Skeleton height={12} count={3} className="space-y-2" />
      <div className="flex gap-2">
        <Skeleton height={32} width={80} />
        <Skeleton height={32} width={80} />
      </div>
    </div>
  );
};

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl p-3">
          <Skeleton circle width={36} height={36} />
          <div className="flex-1 space-y-2">
            <Skeleton height={14} width="70%" />
            <Skeleton height={10} width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div className="card p-5 space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton height={12} width={100} />
          <Skeleton height={36} />
        </div>
      ))}
      <div className="flex gap-2 justify-end pt-2">
        <Skeleton height={36} width={80} />
        <Skeleton height={36} width={80} />
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card p-5 space-y-3">
            <Skeleton height={12} width="60%" />
            <Skeleton height={28} width="80%" />
            <Skeleton height={10} width="40%" />
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="card p-5 space-y-4">
        <Skeleton height={16} width="40%" />
        <Skeleton height={280} />
      </div>

      {/* Table Section */}
      <div className="card p-5 space-y-4">
        <Skeleton height={16} width="30%" />
        <TableSkeleton rows={5} cols={4} />
      </div>
    </div>
  );
};
