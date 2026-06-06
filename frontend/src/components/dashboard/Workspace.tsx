import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import MetaCard from '../ui/MetaCard';
import MetaInput from '../ui/MetaInput';
import MetaButton from '../ui/MetaButton';
import MetaBadge from '../ui/MetaBadge';
import { Trash2, UserPlus, Shield, Users, X, HardDrive, Activity, Lock } from 'lucide-react';
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
  
  // Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
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
      setSuccess('Member removed successfully');
      setTimeout(() => setSuccess(null), 3000);

      setWorkspaces(workspaces.map(w => w._id === response.data._id ? response.data : w));
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-xl max-w-[1200px]">
        <div className="space-y-sm">
          <div className="h-8 w-1/3 bg-hairline-soft/60 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-hairline-soft/60 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-sm">
          {[1,2,3].map(i => <div key={i} className="h-[140px] bg-canvas border border-hairline-soft rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const memberCount = activeWorkspace?.members.length || 0;
  const adminCount = activeWorkspace?.members.filter(m => m.role === 'Admin' || m.role === 'Owner').length || 0;
  
  // Fake capacity math
  const storageUsed = 1.2;
  const storageTotal = 5.0;
  const storagePct = (storageUsed / storageTotal) * 100;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className="space-y-xxl max-w-[1200px]"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-lg">
        <div>
          <h1 className="text-heading-lg font-bold text-ink-deep mb-xxs">Team Workspaces</h1>
          <p className="text-body-sm text-slate">Manage workspace access, invite colleagues, and configure role policies.</p>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex items-center -space-x-3">
            {activeWorkspace?.members.slice(0, 5).map((member, _i) => (
              <div key={member._id} className="w-10 h-10 rounded-full border-2 border-canvas bg-surface-soft flex items-center justify-center overflow-hidden z-10 hover:z-20 transition-all shadow-sm">
                <span className="text-body-sm-bold text-ink-deep">{member.userId.name.charAt(0)}</span>
              </div>
            ))}
            {memberCount > 5 && (
              <div className="w-10 h-10 rounded-full border-2 border-canvas bg-surface-soft flex items-center justify-center z-10 shadow-sm">
                <span className="text-body-xs-bold text-slate">+{memberCount - 5}</span>
              </div>
            )}
          </div>
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

      {/* KPI & Capacity Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-xl">
        <MetaCard variant="product-feature" className="!p-lg flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-md">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-fb-blue" />
              <span className="text-body-sm-bold text-ink-deep uppercase tracking-wider">Total Members</span>
            </div>
            <MetaBadge variant="success">Active</MetaBadge>
          </div>
          <p className="text-display-lg font-bold text-ink-deep">{memberCount}</p>
          <p className="text-body-xs text-slate mt-1">{adminCount} Admins configured</p>
        </MetaCard>

        <MetaCard variant="product-feature" className="!p-lg flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-md">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-oculus-purple" />
              <span className="text-body-sm-bold text-ink-deep uppercase tracking-wider">Storage Capacity</span>
            </div>
            <MetaBadge variant="warning">{storagePct.toFixed(0)}% Used</MetaBadge>
          </div>
          <div>
            <div className="flex justify-between text-body-xs font-bold text-slate mb-1">
              <span>{storageUsed} GB</span>
              <span>{storageTotal} GB</span>
            </div>
            <div className="w-full bg-hairline-soft rounded-full h-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${storagePct}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="bg-oculus-purple h-2 rounded-full"
              />
            </div>
          </div>
        </MetaCard>

        <MetaCard variant="product-feature" className="!p-lg flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-md">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-success" />
              <span className="text-body-sm-bold text-ink-deep uppercase tracking-wider">API Usage</span>
            </div>
            <MetaBadge variant="success">Healthy</MetaBadge>
          </div>
          <p className="text-display-lg font-bold text-ink-deep">342<span className="text-body-sm font-normal text-slate"> / 1000 calls</span></p>
          <p className="text-body-xs text-slate mt-1">Resets in 12 days</p>
        </MetaCard>
      </motion.div>

      {/* Role Panels */}
      <motion.div variants={itemVariants} className="space-y-xl">
        <h2 className="text-heading-md font-bold text-ink-deep border-b border-hairline-soft pb-sm">Access Management</h2>
        
        {['Owner', 'Admin', 'Member', 'Guest'].map((roleType) => {
          const roleMembers = activeWorkspace?.members.filter(m => m.role === roleType) || [];
          if (roleMembers.length === 0) return null;

          return (
            <MetaCard key={roleType} variant="checkout-summary" className="overflow-hidden">
              <div className="bg-surface-soft p-md border-b border-hairline-soft flex items-center gap-3">
                {roleType === 'Owner' && <Lock className="w-5 h-5 text-critical" />}
                {roleType === 'Admin' && <Shield className="w-5 h-5 text-attention" />}
                {(roleType === 'Member' || roleType === 'Guest') && <Users className="w-5 h-5 text-primary" />}
                <h3 className="text-body-md-bold text-ink-deep">{roleType}s</h3>
                <span className="bg-canvas px-2 py-0.5 rounded-full text-caption-bold text-slate border border-hairline-soft">{roleMembers.length}</span>
              </div>
              <div className="divide-y divide-hairline-soft">
                {roleMembers.map((member) => (
                  <div key={member._id} className="flex justify-between items-center p-md hover:bg-surface-soft/30 transition-colors">
                    <div className="flex items-center space-x-md">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                        {member.userId?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-body-md font-bold text-ink-deep flex items-center gap-2">
                          {member.userId?.name || 'User'}
                        </p>
                        <p className="text-body-xs text-slate">{member.userId?.email}</p>
                      </div>
                    </div>
                    {member.role !== 'Owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.userId._id)}
                        className="p-xs hover:bg-critical/10 rounded-circle text-slate hover:text-critical transition-colors group"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </MetaCard>
          );
        })}
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
