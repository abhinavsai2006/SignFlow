import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`bg-hairline-soft/60 rounded-md animate-pulse ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`p-xxl bg-canvas border border-hairline-soft rounded-xxxl ${className}`}>
      <div className="flex items-start space-x-4 mb-xl">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-1/3 rounded-lg" />
          <Skeleton className="h-4 w-1/4 rounded-lg" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
        <Skeleton className="h-4 w-4/6 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`w-full overflow-hidden bg-canvas border border-hairline-soft rounded-xl ${className}`}>
      <div className="flex items-center justify-between p-lg border-b border-hairline-soft bg-surface-soft">
        <Skeleton className="h-5 w-1/4 rounded-lg" />
        <Skeleton className="h-5 w-1/6 rounded-lg" />
      </div>
      <div className="divide-y divide-hairline-soft">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-lg">
            <div className="flex items-center space-x-md w-1/2">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
