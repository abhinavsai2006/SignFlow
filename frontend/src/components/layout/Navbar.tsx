import { Bell, Menu } from 'lucide-react';
import MetaSearch from '../ui/MetaSearch';
import MetaButton from '../ui/MetaButton';
import UserMenu from './UserMenu';

interface NavbarProps {
  user: any;
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Navbar({ user, onMenuClick, onLogout }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 w-full h-[64px] bg-canvas border-b border-hairline-soft px-xl flex items-center justify-between">
      {/* Left section: Hamburger (Mobile) + Logo */}
      <div className="flex items-center space-x-md">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-xs hover:bg-surface-soft rounded-circle text-ink transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center">
          <span className="text-heading-sm font-bold tracking-tight text-ink-deep">SignFlow <span className="text-primary">AI</span></span>
        </div>
      </div>

      {/* Middle section: Search (Desktop) */}
      <div className="hidden md:flex flex-1 max-w-[400px] mx-xl">
        <MetaSearch placeholder="Search documents..." className="w-full" />
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center space-x-md">
        <MetaButton variant="icon-circular" className="hidden sm:flex" aria-label="Notifications">
          <Bell className="w-5 h-5 text-ink" />
        </MetaButton>
        
        {user && (
          <UserMenu user={user} onLogout={onLogout} />
        )}
      </div>
    </nav>
  );
}
