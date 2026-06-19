import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface MetaAccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function MetaAccordion({ title, children, defaultOpen = false }: MetaAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-canvas rounded-xl p-xl border border-hairline-soft mb-md last:mb-0">
      <button 
        className="w-full flex justify-between items-center text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-subtitle-lg text-ink-deep">{title}</span>
        <ChevronDown 
          className={`w-5 h-5 text-steel transition-transform animate-slow ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <div 
        className={`overflow-hidden transition-all animate-slow ${isOpen ? 'max-h-[1000px] opacity-100 mt-base' : 'max-h-0 opacity-0 mt-0'}`}
      >
        <div className="text-body-md text-ink">
          {children}
        </div>
      </div>
    </div>
  );
}
