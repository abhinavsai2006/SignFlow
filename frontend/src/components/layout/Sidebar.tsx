import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, Clock, CheckCircle, Settings, 
  Layers, CreditCard, ShieldCheck 
} from 'lucide-react';

interface SidebarProps {
  user: any;
  workspaces: any[];
  activeWorkspace: any;
  onSelectWorkspace: (workspace: any) => void;
}

export default function Sidebar({ user, workspaces, activeWorkspace, onSelectWorkspace }: SidebarProps) {
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
    <aside className="hidden md:flex flex-col w-[260px] h-[calc(100vh-64px)] bg-canvas border-r border-hairline-soft sticky top-[64px] overflow-y-auto">
      {/* Workspace Selector */}
      <div className="p-md border-b border-hairline-soft mb-sm">
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

      <div className="flex-1 px-md space-y-xs">
        <p className="px-md mb-sm text-caption-bold text-slate uppercase tracking-wider">Navigation</p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center px-md py-[10px] rounded-lg text-body-md transition-colors animate-fast ${
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
      </div>

      <div className="p-xl border-t border-hairline-soft">
        <NavLink
          to="/settings"
          className={({ isActive }) => 
            `flex items-center px-md py-[10px] rounded-lg text-body-md transition-colors animate-fast ${
              isActive 
                ? 'bg-surface-soft text-ink-deep font-bold' 
                : 'text-ink hover:bg-surface-soft'
            }`
          }
        >
          <Settings className="w-5 h-5 mr-md text-steel" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
