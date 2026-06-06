import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import api from '../../utils/api';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!token || !storedUser) {
        handleLogout();
        return;
      }

      try {
        // Validate token with backend /me endpoint
        const response = await api.get('/auth/me');
        setUser(response.data);
        
        // Fetch workspaces
        const wsResponse = await api.get('/workspaces');
        setWorkspaces(wsResponse.data);
        
        const storedActiveId = localStorage.getItem('activeWorkspaceId');
        if (storedActiveId) {
          const found = wsResponse.data.find((w: any) => w._id === storedActiveId);
          if (found) {
            setActiveWorkspace(found);
          }
        }
        
        setIsValidating(false);
      } catch (err) {
        console.error('Auth check failed:', err);
        handleLogout();
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSelectWorkspace = (workspace: any) => {
    setActiveWorkspace(workspace);
    if (workspace) {
      localStorage.setItem('activeWorkspaceId', workspace._id);
    } else {
      localStorage.removeItem('activeWorkspaceId');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeWorkspaceId');
    navigate('/login');
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-canvas text-ink-deep flex flex-col justify-center items-center">
        <p className="text-subtitle-md text-slate animate-pulse font-bold">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink-deep flex flex-col">
      <Navbar 
        user={user} 
        onMenuClick={() => setIsMobileMenuOpen(true)} 
        onLogout={handleLogout} 
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          user={user}
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onSelectWorkspace={handleSelectWorkspace}
        />
        <MobileDrawer 
          user={user}
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onSelectWorkspace={handleSelectWorkspace}
        />

        <main className="flex-1 overflow-y-auto px-xl py-section w-full bg-surface-soft">
          <div className="max-w-[1280px] mx-auto w-full">
            <Outlet context={{ user, handleLogout, activeWorkspace, workspaces, handleSelectWorkspace }} />
          </div>
        </main>
      </div>
    </div>
  );
}
