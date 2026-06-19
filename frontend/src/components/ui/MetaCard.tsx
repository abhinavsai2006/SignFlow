import type { ReactNode } from 'react';

export type MetaCardVariant = 'product-feature' | 'icon-feature' | 'checkout-summary' | 'why-buy-tile';

interface MetaCardProps {
  variant?: MetaCardVariant;
  children: ReactNode;
  className?: string;
}

export default function MetaCard({ variant = 'product-feature', children, className = '' }: MetaCardProps) {
  let baseStyles = '';

  switch (variant) {
    case 'product-feature':
      baseStyles = 'bg-canvas rounded-xxxl p-xxl border border-hairline-soft';
      break;
    case 'icon-feature':
      baseStyles = 'bg-canvas rounded-xl p-xl border border-hairline-soft';
      break;
    case 'checkout-summary':
      baseStyles = 'bg-canvas rounded-xl p-xl border border-hairline-soft shadow-[rgba(20,22,26,0.3)_0px_1px_4px_0px]';
      break;
    case 'why-buy-tile':
      baseStyles = 'bg-canvas rounded-xl py-xxl px-xl border border-hairline-soft';
      break;
  }

  return (
    <div className={`${baseStyles} ${className}`.trim()}>
      {children}
    </div>
  );
}
