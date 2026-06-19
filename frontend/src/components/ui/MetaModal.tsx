import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface MetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function MetaModal({ isOpen, onClose, title, children, footer }: MetaModalProps) {
  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-xl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ink-deep/60 backdrop-blur-sm animate-fast"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div 
        className="relative bg-canvas rounded-xxxl shadow-[rgba(20,22,26,0.3)_0px_8px_24px_0px] w-full max-w-[600px] max-h-[90vh] flex flex-col animate-base"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-xxl border-b border-hairline-soft shrink-0">
          <h2 className="text-heading-sm text-ink-deep">{title}</h2>
          <button 
            onClick={onClose}
            className="p-xs hover:bg-surface-soft rounded-circle text-ink transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-xxl overflow-y-auto">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="p-xxl border-t border-hairline-soft shrink-0 flex justify-end space-x-md">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
