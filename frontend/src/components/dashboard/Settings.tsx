import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import MetaCard from '../ui/MetaCard';
import MetaInput from '../ui/MetaInput';
import MetaButton from '../ui/MetaButton';

export default function Settings() {
  const { user } = useOutletContext<{ user: any }>();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setStatusMessage(null);
    
    // Simulate updating API (will link to backend auth later)
    setTimeout(() => {
      setIsUpdating(false);
      setStatusMessage('Profile updated successfully (Simulated)');
    }, 1000);
  };

  return (
    <div className="space-y-xl max-w-[600px]">
      <div>
        <h1 className="text-heading-lg font-bold text-ink-deep mb-xxs">Account Settings</h1>
        <p className="text-body-sm text-slate">Manage your user profile and security credentials.</p>
      </div>

      {statusMessage && (
        <div className="bg-primary/10 border border-primary text-primary-deep px-md py-sm rounded-lg text-body-sm-bold text-center">
          {statusMessage}
        </div>
      )}

      <MetaCard variant="product-feature">
        <form onSubmit={handleUpdateProfile} className="space-y-xl">
          <div>
            <label className="block text-body-sm-bold text-ink-deep mb-xs">Email Address</label>
            <MetaInput value={user?.email} disabled className="bg-surface-soft opacity-60 cursor-not-allowed" />
            <p className="text-caption text-slate mt-xxs">Email address cannot be changed.</p>
          </div>

          <div>
            <label className="block text-body-sm-bold text-ink-deep mb-xs">Display Name</label>
            <MetaInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
          </div>

          <div className="border-t border-hairline-soft pt-xl space-y-xl">
            <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider">Change Password</h3>
            <div>
              <label className="block text-body-sm-bold text-ink-deep mb-xs">New Password</label>
              <MetaInput 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="At least 6 characters" 
              />
            </div>
            <div>
              <label className="block text-body-sm-bold text-ink-deep mb-xs">Confirm New Password</label>
              <MetaInput 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Confirm password" 
              />
            </div>
          </div>

          <div className="flex justify-end pt-xl">
            <MetaButton variant="buy-cta" type="submit" isLoading={isUpdating}>
              Save Changes
            </MetaButton>
          </div>
        </form>
      </MetaCard>
    </div>
  );
}
