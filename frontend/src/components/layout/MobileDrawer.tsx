import { NavLink } from 'react-router-dom';
import { 
  X, LayoutDashboard, FileText, Clock, CheckCircle, Settings,
  Layers, CreditCard, ShieldCheck 
} from 'lucide-react';

interface MobileDrawerProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  workspaces: any[];
  activeWorkspace: any;
  onSelectWorkspace: (workspace: any) => void;
}

export default function MobileDrawer({ 
  user, isOpen, onClose, workspaces, activeWorkspace, onSelectWorkspace 
}: MobileDrawerProps) {
  const isAdmin = user?.role === 'Admin' || user?.email?.includes('admin') || user?.email === 'owner@signflow.ai';

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: FileText, label: 'All Documents', path: '/documents' },
    { icon: Clock, label: 'Pending Signatures', path: '/pending' },
    { icon: CheckCircle, label: 'Completed', path: '/completed' },
    { icon: Layers, label: 'Workspaces', path: '/workspaces' },
    { icon: CreditCard, label: 'Billing & Plans', path: '/billing' },
  ];

  if (isAdmin) {
    navItems.push({ icon: ShieldCheck, label: 'Admin Panel', path: '/admin' });
  }

  return (
    <div className={`md:hidden fixed inset-0 z-50 transition-opacity animate-base ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-deep/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className={`absolute top-0 left-0 bottom-0 w-[280px] bg-canvas shadow-xl transform transition-transform animate-base ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-[64px] flex items-center justify-between px-xl border-b border-hairline-soft">
          <span className="text-heading-sm font-bold tracking-tight text-ink-deep">SignFlow</span>
          <button onClick={onClose} className="p-xs hover:bg-surface-soft rounded-circle text-ink transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="py-md px-md border-b border-hairline-soft">
          <label className="block text-[10px] font-bold text-slate uppercase tracking-wider mb-xxs px-xs">Active Workspace</label>
          <select
            value={activeWorkspace?._id || 'personal'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'personal') {
                onSelectWorkspace(null);
              } else {
                const found = workspaces.find((w: any) => w._id === val);
                if (found) onSelectWorkspace(found);
              }
            }}
            className="w-full px-md py-xs bg-surface-soft border border-hairline-soft rounded-lg text-body-sm font-bold text-ink-deep outline-none cursor-pointer focus:border-primary"
          >
            <option value="personal">Personal Files</option>
            {workspaces.map((w: any) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="py-xl px-md space-y-xs overflow-y-auto h-[calc(100vh-140px)]">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => 
                `flex items-center px-md py-[12px] rounded-lg text-body-md transition-colors ${
                  isActive 
                    ? 'bg-surface-soft text-ink-deep font-bold border-l-4 border-primary' 
                    : 'text-ink hover:bg-surface-soft'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-md" />
              {item.label}
            </NavLink>
          ))}

          <div className="pt-xl mt-xl border-t border-hairline-soft space-y-xs">
            <NavLink
              to="/settings"
              onClick={onClose}
              className="flex items-center px-md py-[12px] rounded-lg text-body-md text-ink hover:bg-surface-soft transition-colors"
            >
              <Settings className="w-5 h-5 mr-md text-steel" />
              Settings
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
