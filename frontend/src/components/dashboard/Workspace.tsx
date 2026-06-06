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
      <div className="text-center py-xxl text-slate text-body-md">
        Loading workspace settings...
      </div>
    );
  }

  return (
    <div className="space-y-xl max-w-[800px]">
      <div>
        <h1 className="text-heading-lg font-bold text-ink-deep mb-xxs">Team Workspaces</h1>
        <p className="text-body-sm text-slate">Manage workspace access, invite colleagues, and configure role policies.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
        <div className="md:col-span-2">
          <MetaCard variant="product-feature" className="space-y-xl">
            <div className="flex justify-between items-center">
              <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">
                {activeWorkspace?.name || 'Workspace Members'}
              </h3>
            </div>
            
            <div className="space-y-md">
              {activeWorkspace?.members.map((member) => (
                <div key={member._id} className="flex justify-between items-center p-md bg-surface-soft border border-hairline-soft rounded-xl">
                  <div>
                    <p className="text-body-md font-bold text-ink-deep">
                      {member.userId?.name || 'User'}
                    </p>
                    <p className="text-body-xs text-slate">{member.userId?.email}</p>
                  </div>
                  <div className="flex items-center space-x-md">
                    <MetaBadge variant={member.role === 'Owner' || member.role === 'Admin' ? 'success' : 'attention'}>
                      {member.role}
                    </MetaBadge>
                    {member.role !== 'Owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.userId._id)}
                        className="p-xs hover:bg-canvas rounded-circle text-slate hover:text-critical transition-colors"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {activeWorkspace?.members.length === 0 && (
                <p className="text-body-sm text-slate">No members configured.</p>
              )}
            </div>
          </MetaCard>
        </div>

        <div className="md:col-span-1">
          <MetaCard variant="icon-feature" className="space-y-xl">
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
                  className="w-full px-md py-xs bg-canvas border border-hairline-soft rounded-full text-body-sm font-bold text-ink-deep outline-none focus:border-fb-blue"
                >
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                  <option value="Guest">Guest</option>
                </select>
              </div>
              <MetaButton variant="buy-cta" type="submit" className="w-full flex items-center justify-center">
                <UserPlus className="w-4 h-4 mr-2" /> Invite Member
              </MetaButton>
            </form>
          </MetaCard>
        </div>
      </div>
    </div>
  );
}
