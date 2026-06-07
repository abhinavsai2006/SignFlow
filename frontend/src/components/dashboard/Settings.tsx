import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import MetaCard from '../ui/MetaCard';
import MetaInput from '../ui/MetaInput';
import MetaButton from '../ui/MetaButton';
import MetaBadge from '../ui/MetaBadge';
import { 
  User, Shield, Bell, Briefcase, CreditCard, Code, List, 
  Save, LogOut, Smartphone, AlertTriangle 
} from 'lucide-react';

export default function Settings() {
  const { user, handleLogout } = useOutletContext<{ user: any, handleLogout: () => void }>();
  const [activeTab, setActiveTab] = useState('general');

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const tabs = [
    { id: 'general', label: 'General', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'workspace', label: 'Workspace', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'api', label: 'API Keys', icon: <Code className="w-4 h-4" /> },
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

      setStatusMessage('Profile updated successfully');
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

  const fadeVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-lg">
      <div>
        <h1 className="text-heading-lg font-bold text-ink-deep mb-xs">Settings</h1>
        <p className="text-body-sm text-slate">Manage your account preferences, security, and workspace configurations.</p>
      </div>

      <AnimatePresence>
        {statusMessage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-success-bg/10 border border-success text-success px-md py-sm rounded-lg text-body-sm-bold text-center">
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
              {activeTab === 'general' && (
                <div className="space-y-xl">
                  <MetaCard variant="checkout-summary" className="overflow-hidden">
                    <div className="p-lg border-b border-hairline-soft bg-surface-soft">
                      <h2 className="text-heading-md font-bold text-ink-deep">Profile Information</h2>
                      <p className="text-body-sm text-slate">Update your account details and public profile.</p>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="p-lg space-y-md">
                      <div className="flex items-center gap-md mb-lg">
                        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-display-sm shadow-inner">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <MetaButton variant="ghost" type="button">Change Avatar</MetaButton>
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
                          <p className="text-body-xs text-slate mt-1">Contact support to change your primary email.</p>
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

              {activeTab === 'security' && (
                <div className="space-y-xl">
                  <MetaCard variant="checkout-summary" className="overflow-hidden">
                    <div className="p-lg border-b border-hairline-soft bg-surface-soft">
                      <h2 className="text-heading-md font-bold text-ink-deep">Change Password</h2>
                      <p className="text-body-sm text-slate">Ensure your account is using a long, random password to stay secure.</p>
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
                            <p className="text-body-sm text-slate">Windows • Chrome • IP: 192.168.1.1</p>
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

              {(activeTab === 'notifications' || activeTab === 'workspace' || activeTab === 'billing' || activeTab === 'api' || activeTab === 'audit') && (
                <div className="space-y-xl">
                  <MetaCard variant="checkout-summary" className="p-xl flex flex-col items-center justify-center text-center h-64">
                    <div className="w-16 h-16 rounded-full bg-surface-soft flex items-center justify-center mb-md">
                      <AlertTriangle className="w-8 h-8 text-slate" />
                    </div>
                    <h2 className="text-heading-md font-bold text-ink-deep mb-2">Section Coming Soon</h2>
                    <p className="text-body-sm text-slate max-w-sm">
                      We are currently rolling out the completely redesigned {activeTab} section. Check back in a few days.
                    </p>
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
