import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import MetaCard from '../ui/MetaCard';
import MetaInput from '../ui/MetaInput';
import MetaButton from '../ui/MetaButton';
import MetaBadge from '../ui/MetaBadge';
import { Trash2, UserPlus } from 'lucide-react';

interface Member {
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  role: 'Owner' | 'Admin' | 'Member' | 'Guest';
  _id: string;
}

interface WorkspaceType {
  _id: string;
  name: string;
  ownerId: any;
  members: Member[];
}

export default function Workspace() {
  const [workspaces, setWorkspaces] = useState<WorkspaceType[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Member');
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/workspaces');
      
      let wList = response.data;
      if (wList.length === 0) {
        // Create default workspace if none exists
        await api.post('/workspaces', { name: 'My Team Workspace' });
        const fetchRes = await api.get('/workspaces');
        wList = fetchRes.data;
      }

      setWorkspaces(wList);
      if (wList.length > 0) {
        setActiveWorkspace(wList[0]);
      }
    } catch (err: any) {
      console.error('Failed to load workspaces:', err);
      setError(err.response?.data?.message || 'Error loading workspaces');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchWorkspaces());
  }, [fetchWorkspaces]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !activeWorkspace) return;
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post(`/workspaces/${activeWorkspace._id}/members`, {
        email: newEmail.trim(),
        role: newRole
      });
      
      setActiveWorkspace(response.data);
      setNewEmail('');
      setSuccess(`Successfully invited ${newEmail} as ${newRole}!`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Update workspaces list state
      setWorkspaces(workspaces.map(w => w._id === response.data._id ? response.data : w));
    } catch (err: any) {
      console.error('Failed to invite member:', err);
      setError(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!activeWorkspace) return;
    setError(null);
    setSuccess(null);

    try {
      const response = await api.delete(`/workspaces/${activeWorkspace._id}/members/${memberUserId}`);
      setActiveWorkspace(response.data);
      setSuccess('Member removed successfully');
      setTimeout(() => setSuccess(null), 3000);

      // Update workspaces list state
      setWorkspaces(workspaces.map(w => w._id === response.data._id ? response.data : w));
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-xl max-w-[1000px]">
        <div className="space-y-sm">
          <div className="h-8 w-1/3 bg-hairline-soft/60 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-hairline-soft/60 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-sm">
          {[1,2,3,4].map(i => <div key={i} className="h-[110px] bg-canvas border border-hairline-soft rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
          <div className="lg:col-span-2">
            <div className="h-[400px] bg-canvas border border-hairline-soft rounded-xl animate-pulse" />
          </div>
          <div className="lg:col-span-1">
            <div className="h-[300px] bg-canvas border border-hairline-soft rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Calculate some fake analytics based on members
  const memberCount = activeWorkspace?.members.length || 0;
  const adminCount = activeWorkspace?.members.filter(m => m.role === 'Admin' || m.role === 'Owner').length || 0;

  return (
    <div className="space-y-xxl max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-lg">
        <div>
          <h1 className="text-heading-lg font-bold text-ink-deep mb-xxs">Team Workspaces</h1>
          <p className="text-body-sm text-slate">Manage workspace access, invite colleagues, and configure role policies.</p>
        </div>
        <div className="flex items-center -space-x-3">
          {activeWorkspace?.members.slice(0, 5).map((member, _i) => (
            <div key={member._id} className="w-10 h-10 rounded-full border-2 border-canvas bg-surface-soft flex items-center justify-center overflow-hidden z-10 hover:z-20 transition-all">
              <span className="text-body-sm-bold text-ink-deep">{member.userId.name.charAt(0)}</span>
            </div>
          ))}
          {memberCount > 5 && (
            <div className="w-10 h-10 rounded-full border-2 border-canvas bg-surface-soft flex items-center justify-center z-10">
              <span className="text-body-xs-bold text-slate">+{memberCount - 5}</span>
            </div>
          )}
        </div>
      </div>

      {success && (
        <div className="bg-success-bg/10 border border-success text-success px-md py-sm rounded-lg text-body-sm-bold text-center">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-critical/10 border border-critical text-critical px-md py-sm rounded-lg text-body-sm-bold text-center">
          {error}
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
        <MetaCard variant="product-feature" className="!p-md h-[110px]">
          <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Total Members</span>
          <p className="text-heading-lg font-bold mt-2 text-ink-deep">{memberCount}</p>
        </MetaCard>
        <MetaCard variant="product-feature" className="!p-md h-[110px]">
          <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Admins</span>
          <p className="text-heading-lg font-bold mt-2 text-ink-deep">{adminCount}</p>
        </MetaCard>
        <MetaCard variant="product-feature" className="!p-md h-[110px]">
          <span className="text-[11px] font-bold text-slate uppercase tracking-wider">Storage Used</span>
          <p className="text-heading-lg font-bold mt-2 text-ink-deep">1.2 GB</p>
        </MetaCard>
        <MetaCard variant="product-feature" className="!p-md h-[110px]">
          <span className="text-[11px] font-bold text-slate uppercase tracking-wider">API Calls</span>
          <p className="text-heading-lg font-bold mt-2 text-ink-deep">342<span className="text-body-xs font-normal text-slate">/mo</span></p>
        </MetaCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        <div className="lg:col-span-2 space-y-xl">
          <MetaCard variant="product-feature" className="space-y-xl">
            <div className="flex justify-between items-center border-b border-hairline-soft pb-md">
              <h3 className="text-body-sm-bold font-bold text-ink-deep uppercase tracking-wider">
                {activeWorkspace?.name || 'Workspace Members'}
              </h3>
            </div>
            
            <div className="space-y-sm">
              {activeWorkspace?.members.map((member) => (
                <div key={member._id} className="flex justify-between items-center py-md border-b border-hairline-soft last:border-0 hover:bg-surface-soft/50 transition-colors px-sm -mx-sm rounded-lg">
                  <div className="flex items-center space-x-md">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {member.userId?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-body-md font-bold text-ink-deep">
                        {member.userId?.name || 'User'}
                      </p>
                      <p className="text-body-xs text-slate">{member.userId?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-md">
                    <MetaBadge variant={member.role === 'Owner' || member.role === 'Admin' ? 'success' : 'attention'}>
                      {member.role}
                    </MetaBadge>
                    {member.role !== 'Owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.userId._id)}
                        className="p-xs hover:bg-surface-soft rounded-circle text-slate hover:text-critical transition-colors"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {activeWorkspace?.members.length === 0 && (
                <p className="text-body-sm text-slate py-lg text-center">No members configured.</p>
              )}
            </div>
          </MetaCard>

          {/* Activity Feed Placeholder */}
          <MetaCard variant="product-feature" className="space-y-lg">
            <h3 className="text-body-sm-bold font-bold text-ink-deep uppercase tracking-wider border-b border-hairline-soft pb-md">Recent Workspace Activity</h3>
            <div className="space-y-md">
              <div className="flex items-start space-x-sm">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-body-sm text-ink"><span className="font-bold">Abhinav Sai</span> updated workspace settings</p>
                  <p className="text-caption text-slate">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-sm">
                <div className="w-2 h-2 mt-2 rounded-full bg-success shrink-0" />
                <div>
                  <p className="text-body-sm text-ink"><span className="font-bold">John Doe</span> joined the workspace as Member</p>
                  <p className="text-caption text-slate">1 day ago</p>
                </div>
              </div>
            </div>
          </MetaCard>
        </div>

        <div className="lg:col-span-1 space-y-xl">
          <MetaCard variant="icon-feature" className="space-y-xl sticky top-24">
            <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Invite Member</h3>
            <form onSubmit={handleInvite} className="space-y-md">
              <div>
                <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Email Address</label>
                <MetaInput 
                  type="email" 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  placeholder="name@company.com" 
                  required
                />
              </div>
              <div>
                <label className="block text-body-xs-bold font-bold text-ink-deep mb-xxs">Role</label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none focus:border-fb-blue transition-colors"
                >
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>
              <MetaButton variant="buy-cta" type="submit" className="w-full flex items-center justify-center">
                <UserPlus className="w-4 h-4 mr-2" /> Send Invitation
              </MetaButton>
            </form>
          </MetaCard>
        </div>
      </div>
    </div>
  );
}
