import { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User } from 'lucide-react';
import MetaAvatar from '../ui/MetaAvatar';

interface UserMenuProps {
  user: any;
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center focus:outline-none rounded-circle ring-2 ring-transparent focus:ring-fb-blue transition-shadow"
      >
        <MetaAvatar name={user.name} size={40} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-xs w-64 bg-canvas rounded-xl shadow-[rgba(20,22,26,0.3)_0px_8px_24px_0px] border border-hairline-soft py-sm animate-fast z-50">
          <div className="px-xl py-md border-b border-hairline-soft mb-sm">
            <p className="text-body-md-bold text-ink-deep truncate">{user.name}</p>
            <p className="text-body-sm text-slate truncate">{user.email}</p>
          </div>
          
          <div className="px-sm">
            <button className="w-full flex items-center px-md py-sm text-body-md text-ink hover:bg-surface-soft rounded-lg transition-colors">
              <User className="w-4 h-4 mr-md text-steel" />
              Profile
            </button>
            <button className="w-full flex items-center px-md py-sm text-body-md text-ink hover:bg-surface-soft rounded-lg transition-colors">
              <Settings className="w-4 h-4 mr-md text-steel" />
              Settings
            </button>
          </div>
          
          <div className="mt-sm pt-sm px-sm border-t border-hairline-soft">
            <button 
              onClick={onLogout}
              className="w-full flex items-center px-md py-sm text-body-md text-critical hover:bg-critical/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-md" />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
