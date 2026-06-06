import type { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

type MetaSearchProps = InputHTMLAttributes<HTMLInputElement>;

export default function MetaSearch({ className = '', ...props }: MetaSearchProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-lg w-4 h-4 text-steel" />
      <input
        type="text"
        className="w-full h-[40px] pl-[44px] pr-lg bg-surface-soft text-ink text-body-sm placeholder:text-steel rounded-full focus:outline-none focus:ring-2 focus:ring-fb-blue transition-colors animate-fast"
        {...props}
      />
    </div>
  );
}
