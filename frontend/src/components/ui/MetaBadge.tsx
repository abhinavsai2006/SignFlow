import type { ReactNode } from 'react';

export type MetaBadgeVariant = 'success' | 'attention' | 'warning' | 'critical' | 'neutral';

interface MetaBadgeProps {
  variant: MetaBadgeVariant;
  children: ReactNode;
  className?: string;
}

export default function MetaBadge({ variant, children, className = '' }: MetaBadgeProps) {
  let baseStyles = 'inline-flex items-center justify-center text-caption-bold rounded-full py-[4px] px-[10px] ';

  switch (variant) {
    case 'success':
      baseStyles += 'bg-success text-canvas';
      break;
    case 'attention':
      baseStyles += 'bg-attention text-canvas';
      break;
    case 'warning':
      baseStyles += 'bg-warning text-ink-deep';
      break;
    case 'critical':
      baseStyles += 'bg-critical text-canvas';
      break;
    case 'neutral':
      baseStyles += 'bg-surface-soft text-slate border border-hairline-soft';
      break;
  }

  return (
    <span className={`${baseStyles} ${className}`.trim()}>
      {children}
    </span>
  );
}
