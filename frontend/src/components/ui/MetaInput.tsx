import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface MetaInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const MetaInput = forwardRef<HTMLInputElement, MetaInputProps>(
  ({ error, className = '', ...props }, ref) => {
    let baseStyles = 'w-full h-[44px] px-md bg-canvas text-ink text-body-md rounded-lg focus:outline-none transition-colors animate-fast ';

    if (error) {
      baseStyles += 'border border-critical-strong';
    } else {
      baseStyles += 'border border-hairline focus:border-2 focus:border-fb-blue';
    }

    return (
      <div className="w-full space-y-xs">
        <input 
          ref={ref}
          className={`${baseStyles} ${className}`.trim()}
          {...props}
        />
        {error && <p className="text-caption text-critical-strong">{error}</p>}
      </div>
    );
  }
);

MetaInput.displayName = 'MetaInput';
export default MetaInput;
