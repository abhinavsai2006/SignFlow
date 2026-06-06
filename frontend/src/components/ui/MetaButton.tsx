import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type MetaButtonVariant = 'primary' | 'buy-cta' | 'secondary' | 'ghost' | 'pill-tab' | 'icon-circular';

interface MetaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: MetaButtonVariant;
  children?: ReactNode;
  active?: boolean; // for pill-tab active state
  className?: string;
  isLoading?: boolean;
}

export default function MetaButton({
  variant = 'primary',
  children,
  active = false,
  className = '',
  isLoading = false,
  disabled,
  ...props
}: MetaButtonProps) {
  let baseStyles = 'focus:outline-none focus:ring-2 focus:ring-fb-blue focus:ring-offset-2 focus:ring-offset-canvas disabled:bg-disabled-text disabled:text-canvas disabled:border-transparent animate-fast inline-flex items-center justify-center font-bold ';

  switch (variant) {
    case 'primary':
      baseStyles += 'bg-ink-button text-on-ink-button hover:bg-charcoal text-button-md rounded-full py-[14px] px-[30px]';
      break;
    case 'buy-cta':
      baseStyles += 'bg-primary text-on-primary hover:bg-primary-deep text-button-md rounded-full py-[14px] px-[30px]';
      break;
    case 'secondary':
      baseStyles += 'bg-transparent text-ink-deep border-2 border-ink-deep hover:bg-surface-soft text-button-md rounded-full py-[12px] px-[28px]';
      break;
    case 'ghost':
      baseStyles += 'bg-transparent text-ink-deep border-2 border-hairline hover:bg-surface-soft hover:border-hairline-soft text-button-md rounded-full py-[10px] px-[22px]';
      break;
    case 'pill-tab':
      if (active) {
        baseStyles += 'bg-ink-deep text-canvas text-body-sm-bold rounded-full py-[8px] px-[16px]';
      } else {
        baseStyles += 'bg-canvas text-ink border border-hairline hover:bg-surface-soft text-body-sm-bold rounded-full py-[8px] px-[16px]';
      }
      break;
    case 'icon-circular':
      baseStyles += 'bg-canvas text-ink hover:bg-surface-soft rounded-circle w-[40px] h-[40px] flex items-center justify-center';
      break;
  }

  const finalClassName = `${baseStyles} ${className}`.trim();

  return (
    <button 
      className={finalClassName} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
