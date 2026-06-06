import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import MetaCard from '../ui/MetaCard';
import MetaInput from '../ui/MetaInput';
import MetaButton from '../ui/MetaButton';
import MetaBadge from '../ui/MetaBadge';
import { Trash2, UserPlus, Shield, Users, X, HardDrive, Activity, Lock, FileText, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Member');
  
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [docStats, setDocStats] = useState({ total: 0, pending: 0, completed: 0 });

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/workspaces');
      
      let wList = response.data;
      if (wList.length === 0) {
        await api.post('/workspaces', { name: 'My Team Workspace' });
        const fetchRes = await api.get('/workspaces');
        wList = fetchRes.data;
      }

      setWorkspaces(wList);
      if (wList.length > 0) {
        setActiveWorkspace(wList[0]);
        // fetch stats
        const docsRes = await api.get('/docs', { params: { workspaceId: wList[0]._id, limit: 1000 }});
        const docs = docsRes.data.documents || docsRes.data;
        const total = docs.length;
        const pending = docs.filter((d: any) => d.status === 'Pending').length;
        const completed = docs.filter((d: any) => d.status === 'Signed').length;
        setDocStats({ total, pending, completed });
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
      setIsInviteModalOpen(false);
      setSuccess(`Successfully invited ${newEmail} as ${newRole}!`);
      setTimeout(() => setSuccess(null), 3000);
      
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
      setSuccess('Member removed successfully.');
      setTimeout(() => setSuccess(null), 3000);
      setWorkspaces(workspaces.map(w => w._id === response.data._id ? response.data : w));
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const memberCount = activeWorkspace?.members.length || 0;
  const adminCount = activeWorkspace?.members.filter(m => m.role === 'Admin' || m.role === 'Owner').length || 0;
  
  const storageUsed = 2.4;
  const storageTotal = 15;
  const storagePct = (storageUsed / storageTotal) * 100;

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 }}}} className="space-y-xl max-w-7xl mx-auto w-full">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-lg">
        <div>
          <h1 className="text-heading-lg font-bold text-ink-deep mb-xxs">Workspace Overview</h1>
          <p className="text-body-sm text-slate">Manage your team, track usage, and oversee workspace security.</p>
        </div>
        <div className="flex items-center gap-md">
          <MetaButton variant="buy-cta" onClick={() => setIsInviteModalOpen(true)} className="flex items-center">
            <UserPlus className="w-4 h-4 mr-2" /> Invite Member
          </MetaButton>
        </div>
      </motion.div>

      {/* Notifications */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-success-bg/10 border border-success text-success px-md py-sm rounded-lg text-body-sm-bold text-center">
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-critical/10 border border-critical text-critical px-md py-sm rounded-lg text-body-sm-bold text-center">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-xl">
        <MetaCard variant="product-feature" className="!p-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-md">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-fb-blue" />
              <span className="text-body-sm-bold text-ink-deep uppercase tracking-wider">Members</span>
            </div>
            <MetaBadge variant="success">Active</MetaBadge>
          </div>
          <p className="text-display-lg font-bold text-ink-deep">{memberCount}</p>
        </MetaCard>

        <MetaCard variant="product-feature" className="!p-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-md">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="text-body-sm-bold text-ink-deep uppercase tracking-wider">Documents</span>
            </div>
          </div>
          <p className="text-display-lg font-bold text-ink-deep">{docStats.total}</p>
        </MetaCard>

        <MetaCard variant="product-feature" className="!p-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-md">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-attention" />
              <span className="text-body-sm-bold text-ink-deep uppercase tracking-wider">Pending</span>
            </div>
          </div>
          <p className="text-display-lg font-bold text-ink-deep">{docStats.pending}</p>
        </MetaCard>

        <MetaCard variant="product-feature" className="!p-lg flex flex-col justify-between">
          <div className="flex justify-between items-center mb-md">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-oculus-purple" />
              <span className="text-body-sm-bold text-ink-deep uppercase tracking-wider">Storage</span>
            </div>
            <MetaBadge variant="warning">{storagePct.toFixed(0)}%</MetaBadge>
          </div>
          <div>
            <div className="flex justify-between text-body-xs font-bold text-slate mb-1">
              <span>{storageUsed} GB</span>
              <span>{storageTotal} GB</span>
            </div>
            <div className="w-full bg-hairline-soft rounded-full h-2 overflow-hidden">
              <div className="bg-oculus-purple h-2 rounded-full" style={{ width: `${storagePct}%` }} />
            </div>
          </div>
        </MetaCard>
      </motion.div>

      {/* Team Members Table */}
      <motion.div variants={itemVariants}>
        <h2 className="text-heading-md font-bold text-ink-deep mb-md">Team Members</h2>
        <MetaCard variant="checkout-summary" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-soft border-b border-hairline-soft text-body-xs-bold text-slate uppercase tracking-wider">
                  <th className="p-md">Name</th>
                  <th className="p-md">Role</th>
                  <th className="p-md">Status</th>
                  <th className="p-md">Last Active</th>
                  <th className="p-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {activeWorkspace?.members.map(member => (
                  <tr key={member._id} className="hover:bg-surface-soft/30 transition-colors">
                    <td className="p-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {member.userId?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-body-sm font-bold text-ink-deep">{member.userId?.name || 'User'}</p>
                          <p className="text-body-xs text-slate">{member.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-md">
                      <div className="flex items-center gap-2">
                        {member.role === 'Owner' && <Lock className="w-4 h-4 text-critical" />}
                        {member.role === 'Admin' && <Shield className="w-4 h-4 text-attention" />}
                        {(member.role === 'Member' || member.role === 'Guest') && <Users className="w-4 h-4 text-primary" />}
                        <span className="text-body-sm text-ink-deep">{member.role}</span>
                      </div>
                    </td>
                    <td className="p-md">
                      <MetaBadge variant="success">Active</MetaBadge>
                    </td>
                    <td className="p-md text-body-sm text-slate">
                      Just now
                    </td>
                    <td className="p-md text-right">
                      {member.role !== 'Owner' && (
                        <button onClick={() => handleRemoveMember(member.userId._id)} className="p-2 text-slate hover:text-critical hover:bg-critical/10 rounded-full transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MetaCard>
      </motion.div>

      {/* Activity Feed & Usage Analytics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        <div>
          <h2 className="text-heading-md font-bold text-ink-deep mb-md">Usage Analytics</h2>
          <MetaCard variant="product-feature" className="!p-lg h-64 flex items-center justify-center">
            <p className="text-slate">Analytics visualizations will appear here when sufficient data is collected.</p>
          </MetaCard>
        </div>
        <div>
          <h2 className="text-heading-md font-bold text-ink-deep mb-md">Activity Feed</h2>
          <MetaCard variant="checkout-summary" className="!p-lg h-64 overflow-y-auto space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full text-primary mt-1"><Activity className="w-4 h-4" /></div>
              <div>
                <p className="text-body-sm text-ink-deep"><span className="font-bold">You</span> logged in</p>
                <p className="text-body-xs text-slate">Just now</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-success/10 rounded-full text-success mt-1"><FileText className="w-4 h-4" /></div>
              <div>
                <p className="text-body-sm text-ink-deep"><span className="font-bold">Team</span> completed 3 documents</p>
                <p className="text-body-xs text-slate">2 hours ago</p>
              </div>
            </div>
          </MetaCard>
        </div>
      </motion.div>

      {/* Invitation Modal */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-ink-deep/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-canvas rounded-xxxl shadow-2xl border border-hairline-soft overflow-hidden"
            >
              <div className="flex items-center justify-between p-lg border-b border-hairline-soft bg-surface-soft">
                <h3 className="text-heading-sm font-bold text-ink-deep">Invite Member</h3>
                <button onClick={() => setIsInviteModalOpen(false)} className="p-xs text-slate hover:text-ink-deep bg-canvas rounded-full shadow-sm hover:shadow transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleInvite} className="p-xl space-y-lg">
                <div>
                  <label className="block text-body-xs-bold font-bold text-slate uppercase tracking-wider mb-xs">Email Address</label>
                  <MetaInput 
                    type="email" 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    placeholder="colleague@company.com" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-body-xs-bold font-bold text-slate uppercase tracking-wider mb-xs">Access Role</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-lg py-sm bg-canvas border border-hairline-soft rounded-xl text-body-md font-bold text-ink-deep outline-none focus:border-fb-blue focus:ring-2 focus:ring-fb-blue/20 transition-all"
                  >
                    <option value="Admin">Admin (Full Access)</option>
                    <option value="Member">Member (Edit Access)</option>
                    <option value="Guest">Guest (View Only)</option>
                  </select>
                </div>
                
                <div className="bg-surface-soft p-md rounded-xl flex items-start gap-3 mt-md">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-body-xs text-slate">Invitations will be sent via email. They will receive an automated link to join <span className="font-bold text-ink-deep">{activeWorkspace?.name}</span>.</p>
                </div>

                <div className="flex gap-md pt-md border-t border-hairline-soft">
                  <MetaButton variant="ghost" type="button" onClick={() => setIsInviteModalOpen(false)} className="w-full justify-center">
                    Cancel
                  </MetaButton>
                  <MetaButton variant="buy-cta" type="submit" className="w-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                    <UserPlus className="w-4 h-4 mr-2" /> Send Invite
                  </MetaButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
