import { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import MetaCard from '../ui/MetaCard';
import MetaInput from '../ui/MetaInput';
import MetaButton from '../ui/MetaButton';
import MetaBadge from '../ui/MetaBadge';
import { 
  User, Shield, Bell, Briefcase, CreditCard, List, 
  Save, LogOut, Smartphone, Settings as SettingsIcon, CheckSquare, RefreshCw, UserPlus
} from 'lucide-react';

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

export default function Settings() {
  const { user, handleLogout, activeWorkspace } = useOutletContext<{ 
    user: any; 
    handleLogout: () => void; 
    activeWorkspace: any; 
  }>();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const setActiveTab = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  // State values
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Notifications toggles
  const [notifyViewed, setNotifyViewed] = useState(true);
  const [notifySigned, setNotifySigned] = useState(true);
  const [notifyCompleted, setNotifyCompleted] = useState(true);

  // Workspace settings (embedded)
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceType | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Member');
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // Sync state with user context on load
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Load workspace details if tab is workspace
  useEffect(() => {
    if (activeTab === 'workspace' && activeWorkspace?._id) {
      const fetchWorkspaceDetails = async () => {
        setIsWorkspaceLoading(true);
        try {
          const res = await api.get('/workspaces');
          const found = res.data.find((w: any) => w._id === activeWorkspace._id);
          if (found) {
            setWorkspaceInfo(found);
          }
        } catch (err) {
          console.error('[Settings] Failed to fetch workspace details:', err);
        } finally {
          setIsWorkspaceLoading(false);
        }
      };
      fetchWorkspaceDetails();
    }
  }, [activeTab, activeWorkspace]);

  // Load audit logs if tab is audit logs
  useEffect(() => {
    if (activeTab === 'audit') {
      const fetchAuditLogs = async () => {
        setIsAuditLoading(true);
        try {
          const res = await api.get('/docs'); // Get all documents audit events
          const docs = res.data.documents || res.data;
          
          // Flatten audit logs from documents
          const allAudits: any[] = [];
          docs.forEach((d: any) => {
            if (d.auditLogs) {
              d.auditLogs.forEach((log: any) => {
                allAudits.push({
                  ...log,
                  documentName: d.filename,
                  documentId: d._id
                });
              });
            }
          });
          
          // Sort by date desc
          allAudits.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setAuditLogs(allAudits.slice(0, 30)); // Show recent 30 events
        } catch (err) {
          console.error('[Settings] Failed to load audit logs:', err);
        } finally {
          setIsAuditLoading(false);
        }
      };
      fetchAuditLogs();
    }
  }, [activeTab]);

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
    { id: 'account', label: 'Account Settings', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Sessions', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'workspace', label: 'Workspace Info', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing & Subscriptions', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <List className="w-4 h-4" /> },
  ];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setStatusMessage(null);
    setError(null);
    
    try {
      if (name !== user?.name) {
        await api.put('/auth/me', { name });
      }

      if (password) {
        if (!currentPassword) {
          throw new Error('Current password is required to set a new password');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await api.post('/auth/change-password', { 
          currentPassword, 
          newPassword: password 
        });
      }

      setStatusMessage('Settings updated successfully');
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Update failed');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !workspaceInfo) return;
    setIsUpdating(true);
    try {
      const res = await api.post(`/workspaces/${workspaceInfo._id}/members`, {
        email: inviteEmail.trim(),
        role: inviteRole
      });
      setWorkspaceInfo(res.data);
      setInviteEmail('');
      setStatusMessage('Team member invited successfully');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to invite team member');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!workspaceInfo) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const res = await api.delete(`/workspaces/${workspaceInfo._id}/members/${memberUserId}`);
      setWorkspaceInfo(res.data);
      setStatusMessage('Team member removed successfully');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove team member');
      setTimeout(() => setError(null), 3000);
    }
  };

  const fadeVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-lg">
      <div>
        <h1 className="text-heading-lg font-bold text-ink-deep mb-xs">Settings</h1>
        <p className="text-body-sm text-slate">Manage your user profile, security preferences, and team workspace details.</p>
      </div>

      <AnimatePresence>
        {statusMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-success/10 border border-success text-success px-md py-sm rounded-lg text-body-sm-bold text-center">
            {statusMessage}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-critical/10 border border-critical text-critical px-md py-sm rounded-lg text-body-sm-bold text-center">
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-xl">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-md py-sm rounded-xl font-bold text-body-sm transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-fb-blue text-white shadow-md' 
                  : 'text-slate hover:bg-surface-soft hover:text-ink-deep'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={fadeVariants}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && (
                <div className="space-y-xl">
                  <MetaCard variant="checkout-summary" className="overflow-hidden">
                    <div className="p-lg border-b border-hairline-soft bg-surface-soft">
                      <h2 className="text-heading-md font-bold text-ink-deep">Profile Information</h2>
                      <p className="text-body-sm text-slate">Update your account details and public identity.</p>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="p-lg space-y-md">
                      <div className="flex items-center gap-md mb-lg">
                        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-display-sm shadow-inner">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-body-sm font-bold text-ink-deep">{user?.name || 'User'}</p>
                          <p className="text-body-xs text-slate">{user?.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                        <div>
                          <label className="block text-body-xs-bold font-bold text-slate uppercase tracking-wider mb-xs">Full Name</label>
                          <MetaInput 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="John Doe" 
                          />
                        </div>
                        <div>
                          <label className="block text-body-xs-bold font-bold text-slate uppercase tracking-wider mb-xs">Email Address</label>
                          <MetaInput 
                            type="email" 
                            value={user?.email || ''} 
                            disabled 
                            className="bg-surface-soft text-slate cursor-not-allowed"
                          />
                          <p className="text-body-xs text-slate mt-1">Contact support to change your email.</p>
                        </div>
                      </div>
                      <div className="pt-md border-t border-hairline-soft flex justify-end">
                        <MetaButton type="submit" variant="buy-cta" disabled={isUpdating}>
                          {isUpdating ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                        </MetaButton>
                      </div>
                    </form>
                  </MetaCard>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-xl">
                  <MetaCard variant="checkout-summary" className="overflow-hidden">
                    <div className="p-lg border-b border-hairline-soft bg-surface-soft">
                      <h2 className="text-heading-md font-bold text-ink-deep">Account Configurations</h2>
                      <p className="text-body-sm text-slate">Configure default settings and account actions.</p>
                    </div>
                    <div className="p-lg space-y-md">
                      <div>
                        <h3 className="text-body-sm-bold font-bold text-ink-deep mb-xs">Default Signing Flow</h3>
                        <p className="text-body-xs text-slate mb-sm">Select the default order when sending documents to multiple signers.</p>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-xs font-medium text-ink-deep cursor-pointer">
                            <input type="radio" name="signingOrder" defaultChecked className="accent-fb-blue" />
                            Parallel (Sign in any order)
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium text-ink-deep cursor-pointer">
                            <input type="radio" name="signingOrder" className="accent-fb-blue" />
                            Sequential (Sign in specific order)
                          </label>
                        </div>
                      </div>

                      <div className="pt-md border-t border-hairline-soft">
                        <h3 className="text-body-sm-bold text-critical font-bold mb-xs">Danger Zone</h3>
                        <p className="text-body-xs text-slate mb-sm">Permanently delete your account and all associated documents. This action is irreversible.</p>
                        <MetaButton 
                          type="button" 
                          variant="ghost" 
                          className="text-critical hover:bg-critical/10 border border-critical/20"
                          onClick={() => alert('Account deletion must be processed via support@signflow.abhinavsai.com')}
                        >
                          Delete Account
                        </MetaButton>
                      </div>
                    </div>
                  </MetaCard>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-xl">
                  <MetaCard variant="checkout-summary" className="overflow-hidden">
                    <div className="p-lg border-b border-hairline-soft bg-surface-soft">
                      <h2 className="text-heading-md font-bold text-ink-deep">Change Password</h2>
                      <p className="text-body-sm text-slate">Update your password to keep your account secure.</p>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="p-lg space-y-md">
                      <div>
                        <label className="block text-body-xs-bold font-bold text-slate uppercase tracking-wider mb-xs">Current Password</label>
                        <MetaInput 
                          type="password" 
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)} 
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                        <div>
                          <label className="block text-body-xs-bold font-bold text-slate uppercase tracking-wider mb-xs">New Password</label>
                          <MetaInput 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                          />
                        </div>
                        <div>
                          <label className="block text-body-xs-bold font-bold text-slate uppercase tracking-wider mb-xs">Confirm New Password</label>
                          <MetaInput 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                          />
                        </div>
                      </div>
                      <div className="pt-md border-t border-hairline-soft flex justify-end">
                        <MetaButton type="submit" variant="buy-cta" disabled={isUpdating}>
                          {isUpdating ? 'Updating...' : 'Update Password'}
                        </MetaButton>
                      </div>
                    </form>
                  </MetaCard>

                  <MetaCard variant="checkout-summary" className="overflow-hidden">
                    <div className="p-lg border-b border-hairline-soft bg-surface-soft">
                      <h2 className="text-heading-md font-bold text-ink-deep">Active Sessions</h2>
                      <p className="text-body-sm text-slate">Manage your active sessions and devices.</p>
                    </div>
                    <div className="p-lg">
                      <div className="flex items-center justify-between p-md bg-surface-soft rounded-xl mb-md">
                        <div className="flex items-center gap-4">
                          <Smartphone className="w-8 h-8 text-slate" />
                          <div>
                            <p className="font-bold text-ink-deep">Current Session</p>
                            <p className="text-body-sm text-slate">Windows • Chrome • IP: 127.0.0.1</p>
                          </div>
                        </div>
                        <MetaBadge variant="success">Active Now</MetaBadge>
                      </div>
                      
                      <MetaButton variant="ghost" className="text-critical hover:bg-critical/10 hover:text-critical border border-critical/20" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" /> Logout All Other Devices
                      </MetaButton>
                    </div>
                  </MetaCard>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-xl">
                  <MetaCard variant="checkout-summary" className="overflow-hidden">
                    <div className="p-lg border-b border-hairline-soft bg-surface-soft">
                      <h2 className="text-heading-md font-bold text-ink-deep">Email Preferences</h2>
                      <p className="text-body-sm text-slate">Toggle email notifications for signing events.</p>
                    </div>
                    <div className="p-lg space-y-md">
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 text-xs font-medium text-ink-deep cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notifyViewed} 
                            onChange={(e) => setNotifyViewed(e.target.checked)} 
                            className="h-4 w-4 rounded border-hairline-soft accent-fb-blue" 
                          />
                          <div>
                            <span className="block font-bold">Document Viewed</span>
                            <span className="text-[10px] text-slate font-normal">Notify me when a recipient opens my document share link.</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 text-xs font-medium text-ink-deep cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notifySigned} 
                            onChange={(e) => setNotifySigned(e.target.checked)} 
                            className="h-4 w-4 rounded border-hairline-soft accent-fb-blue" 
                          />
                          <div>
                            <span className="block font-bold">Document Signed</span>
                            <span className="text-[10px] text-slate font-normal">Notify me when a recipient signs an assigned placeholder.</span>
                          </div>
                        </label>
                        <label className="flex items-center gap-3 text-xs font-medium text-ink-deep cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={notifyCompleted} 
                            onChange={(e) => setNotifyCompleted(e.target.checked)} 
                            className="h-4 w-4 rounded border-hairline-soft accent-fb-blue" 
                          />
                          <div>
                            <span className="block font-bold">Document Completed & Finalized</span>
                            <span className="text-[10px] text-slate font-normal">Notify me and all signers when a document is fully signed.</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </MetaCard>
                </div>
              )}

              {activeTab === 'workspace' && (
                <div className="space-y-xl">
                  {isWorkspaceLoading ? (
                    <div className="py-20 flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fb-blue"></div>
                    </div>
                  ) : workspaceInfo ? (
                    <>
                      <MetaCard variant="checkout-summary" className="overflow-hidden">
                        <div className="p-lg border-b border-hairline-soft bg-surface-soft">
                          <h2 className="text-heading-md font-bold text-ink-deep">Workspace Information</h2>
                          <p className="text-body-sm text-slate">Manage your team workspace and members.</p>
                        </div>
                        <div className="p-lg space-y-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                            <div>
                              <label className="block text-body-xs-bold font-bold text-slate uppercase tracking-wider mb-xs">Workspace Name</label>
                              <MetaInput type="text" value={workspaceInfo.name} disabled className="bg-surface-soft text-slate" />
                            </div>
                            <div>
                              <label className="block text-body-xs-bold font-bold text-slate uppercase tracking-wider mb-xs">Workspace ID</label>
                              <MetaInput type="text" value={workspaceInfo._id} disabled className="bg-surface-soft text-slate font-mono text-xs" />
                            </div>
                          </div>
                        </div>
                      </MetaCard>

                      <MetaCard variant="checkout-summary" className="overflow-hidden">
                        <div className="p-lg border-b border-hairline-soft bg-surface-soft">
                          <h2 className="text-heading-md font-bold text-ink-deep">Team Members</h2>
                          <p className="text-body-sm text-slate">Add or manage permissions of workspace members.</p>
                        </div>
                        <div className="p-lg space-y-lg">
                          {/* Invite Form */}
                          <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                              <MetaInput 
                                type="email" 
                                placeholder="member@example.com" 
                                value={inviteEmail} 
                                onChange={(e) => setInviteEmail(e.target.value)} 
                                required 
                              />
                            </div>
                            <div className="w-full sm:w-36">
                              <select 
                                value={inviteRole} 
                                onChange={(e) => setInviteRole(e.target.value)} 
                                className="w-full h-11 bg-white border border-hairline-soft rounded-xl px-4 text-xs font-bold text-ink-deep focus:outline-none focus:border-fb-blue"
                              >
                                <option value="Member">Member</option>
                                <option value="Admin">Admin</option>
                                <option value="Guest">Guest</option>
                              </select>
                            </div>
                            <MetaButton type="submit" variant="buy-cta" disabled={isUpdating}>
                              <UserPlus className="w-4 h-4 mr-2" /> Invite
                            </MetaButton>
                          </form>

                          {/* Members list */}
                          <div className="border border-hairline-soft rounded-xl overflow-hidden divide-y divide-hairline-soft bg-white">
                            {workspaceInfo.members.map((m) => {
                              const isOwner = m.role === 'Owner';
                              const isSelf = m.userId?._id === user?._id;
                              return (
                                <div key={m._id} className="flex items-center justify-between p-md text-xs hover:bg-surface-soft/50 transition">
                                  <div className="min-w-0 pr-2">
                                    <p className="font-bold text-ink-deep truncate">{m.userId?.name || 'Pending User'}</p>
                                    <p className="text-slate text-[10px] truncate">{m.userId?.email || 'Unknown Email'}</p>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                      isOwner 
                                        ? 'bg-fb-blue/10 text-fb-blue border-fb-blue/20' 
                                        : m.role === 'Admin' 
                                        ? 'bg-success/10 text-success border-success/20'
                                        : 'bg-slate-500/10 text-slate border-slate-500/20'
                                    }`}>
                                      {m.role}
                                    </span>
                                    {!isOwner && !isSelf && (
                                      <button 
                                        onClick={() => handleRemoveMember(m.userId._id)}
                                        className="p-1 text-slate hover:text-critical hover:bg-critical/10 rounded transition"
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </MetaCard>
                    </>
                  ) : (
                    <div className="p-xl text-center text-slate">
                      Select or create a workspace to see members management details.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-xl">
                  <MetaCard variant="checkout-summary" className="overflow-hidden">
                    <div className="p-lg border-b border-hairline-soft bg-surface-soft flex justify-between items-center">
                      <div>
                        <h2 className="text-heading-md font-bold text-ink-deep">Current Plan</h2>
                        <p className="text-body-sm text-slate">View subscription status, usage quotas, and pricing.</p>
                      </div>
                      <MetaBadge variant="success">Enterprise Active</MetaBadge>
                    </div>
                    <div className="p-lg space-y-md">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                        <div className="bg-surface-soft border border-hairline-soft rounded-xl p-md text-center">
                          <p className="text-[10px] font-bold text-slate uppercase tracking-wider mb-xs">Pricing Plan</p>
                          <p className="text-heading-lg font-bold text-ink-deep">$49 <span className="text-xs text-slate">/mo</span></p>
                          <p className="text-[10px] text-slate-500 mt-1">Enterprise Subscription</p>
                        </div>
                        <div className="bg-surface-soft border border-hairline-soft rounded-xl p-md text-center">
                          <p className="text-[10px] font-bold text-slate uppercase tracking-wider mb-xs">Signing Documents</p>
                          <p className="text-heading-lg font-bold text-ink-deep">Unlimited</p>
                          <p className="text-[10px] text-slate-500 mt-1">No monthly usage cap</p>
                        </div>
                        <div className="bg-surface-soft border border-hairline-soft rounded-xl p-md text-center">
                          <p className="text-[10px] font-bold text-slate uppercase tracking-wider mb-xs">Team Members</p>
                          <p className="text-heading-lg font-bold text-ink-deep">Unlimited</p>
                          <p className="text-[10px] text-slate-500 mt-1">Invite whole company</p>
                        </div>
                      </div>

                      <div className="pt-md border-t border-hairline-soft">
                        <h3 className="text-body-sm-bold font-bold text-ink-deep mb-xs">Recent Billing Invoices</h3>
                        <div className="border border-hairline-soft rounded-xl overflow-hidden divide-y divide-hairline-soft bg-white text-xs">
                          <div className="flex justify-between p-md hover:bg-surface-soft/30 transition">
                            <div>
                              <p className="font-bold text-ink-deep">INV-2026-003</p>
                              <p className="text-slate text-[10px]">June 01, 2026</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-ink-deep">$49.00</p>
                              <p className="text-success text-[10px] font-bold">Paid</p>
                            </div>
                          </div>
                          <div className="flex justify-between p-md hover:bg-surface-soft/30 transition">
                            <div>
                              <p className="font-bold text-ink-deep">INV-2026-002</p>
                              <p className="text-slate text-[10px]">May 01, 2026</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-ink-deep">$49.00</p>
                              <p className="text-success text-[10px] font-bold">Paid</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </MetaCard>
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-xl">
                  <MetaCard variant="checkout-summary" className="overflow-hidden">
                    <div className="p-lg border-b border-hairline-soft bg-surface-soft flex justify-between items-center">
                      <div>
                        <h2 className="text-heading-md font-bold text-ink-deep">Recent Account Audit Logs</h2>
                        <p className="text-body-sm text-slate">Audit trail and history of critical security and signature events.</p>
                      </div>
                      <MetaButton variant="ghost" type="button" className="text-xs" onClick={() => setActiveTab('audit')}>
                        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reload
                      </MetaButton>
                    </div>
                    
                    {isAuditLoading ? (
                      <div className="py-20 flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fb-blue"></div>
                      </div>
                    ) : auditLogs.length === 0 ? (
                      <div className="p-xl flex flex-col items-center justify-center text-center text-slate">
                        <CheckSquare className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="font-bold">No Recent Logs Found</p>
                        <p className="text-xs">Audit events will populate when you upload, view, or sign documents.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-hairline-soft">
                        {auditLogs.map((log, index) => (
                          <div key={log._id || index} className="p-md text-xs hover:bg-surface-soft/50 transition flex justify-between items-center">
                            <div>
                              <p className="font-bold text-ink-deep">{log.action}</p>
                              <p className="text-slate text-[10px]">Doc: {log.documentName || 'Document Reference'}</p>
                              <p className="text-slate-500 text-[9px] font-mono">IP: {log.ipAddress} | {log.userAgent}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </MetaCard>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
