import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
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

  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [emailStatus, setEmailStatus] = useState<any | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const fetchEmailStatus = useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const res = await api.get('/email/status');
      setEmailStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch email status', err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchEmailStatus());
  }, [fetchEmailStatus]);

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

  const handleSendTestEmail = async () => {
    setIsTestingEmail(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await api.post('/email/test');
      if (res.data.success) {
        setTestResult(res.data);
        // Refresh email status logs after a short delay to fetch the new log
        setTimeout(fetchEmailStatus, 1000);
      } else {
        setTestError(res.data.message || 'Verification failed.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.providerError || err.response?.data?.message || err.message || 'Request failed';
      setTestError(errMsg);
    } finally {
      setIsTestingEmail(false);
    }
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

      {/* Email Integration & Status Dashboard */}
      <MetaCard variant="product-feature" className="space-y-lg">
        <div>
          <h3 className="text-body-sm-bold font-bold text-slate uppercase tracking-wider mb-xxs">Email Service Integration</h3>
          <p className="text-body-xs text-slate">Monitor your Resend email delivery configuration and audit test logs.</p>
        </div>

        {isLoadingStatus ? (
          <div className="text-body-sm text-slate py-md text-center">Loading email status...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md bg-surface-soft p-md rounded-xl border border-hairline-soft text-body-sm">
            <div className="space-y-xxs">
              <span className="text-[10px] text-slate font-bold uppercase tracking-wider block">Configuration Mode</span>
              <span className={`inline-block px-sm py-0.5 text-xs font-bold rounded-full ${
                emailStatus?.configurationStatus === 'Fully Configured' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>
                {emailStatus?.configurationStatus || 'Demo Mode'}
              </span>
            </div>
            <div className="space-y-xxs">
              <span className="text-[10px] text-slate font-bold uppercase tracking-wider block">Domain Status</span>
              <span className="text-ink-deep font-mono font-bold text-xs">{emailStatus?.domainStatus || 'Sandbox'}</span>
            </div>
            <div className="space-y-xxs">
              <span className="text-[10px] text-slate font-bold uppercase tracking-wider block">Authorized Sender</span>
              <span className="text-ink-deep font-mono text-xs">{emailStatus?.senderInfo || 'onboarding@resend.dev'}</span>
            </div>
            <div className="space-y-xxs">
              <span className="text-[10px] text-slate font-bold uppercase tracking-wider block">Connection status</span>
              <span className={`inline-block px-sm py-0.5 text-xs font-bold rounded-full ${
                emailStatus?.emailService === 'Connected' ? 'bg-success/10 text-success' : 'bg-critical/10 text-critical'
              }`}>
                {emailStatus?.emailService || 'Offline'}
              </span>
            </div>
          </div>
        )}

        {testResult && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-md rounded-xl space-y-xxs text-body-sm font-sans">
            <p className="text-body-sm-bold font-bold text-emerald-800">✓ Test Email Sent Successfully</p>
            <div className="grid grid-cols-1 gap-xxs font-mono text-xs pt-xs">
              <div><span className="font-sans text-slate text-[10px] font-bold uppercase tracking-wider block">Recipient</span> {testResult.recipient}</div>
              <div><span className="font-sans text-slate text-[10px] font-bold uppercase tracking-wider block">Message ID</span> {testResult.messageId}</div>
            </div>
          </div>
        )}

        {testError && (
          <div className="bg-red-50 border border-red-200 text-red-950 p-md rounded-xl space-y-xxs text-body-sm font-sans">
            <p className="text-body-sm-bold font-bold text-red-800">✗ Email Dispatch Failed</p>
            <p className="text-xs font-mono break-all mt-xs bg-white/50 p-sm rounded border border-red-100">{testError}</p>
          </div>
        )}

        {/* Test email action button */}
        <div className="flex items-center justify-between pt-md border-t border-hairline-soft">
          <span className="text-caption text-slate">Sends verification test to: <span className="font-mono font-bold text-ink-deep">mndabhinavsai@gmail.com</span></span>
          <MetaButton 
            variant="primary" 
            onClick={handleSendTestEmail} 
            isLoading={isTestingEmail}
          >
            Send Test Email
          </MetaButton>
        </div>

        {/* Test Email Logs Table */}
        {emailStatus?.testEmailLogs && emailStatus.testEmailLogs.length > 0 && (
          <div className="space-y-sm pt-md border-t border-hairline-soft">
            <span className="text-body-xs font-bold text-slate uppercase tracking-wider block">Recent Dispatch Logs</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-xs">
                <thead>
                  <tr className="border-b border-hairline-soft text-slate font-bold">
                    <th className="pb-xs">Recipient</th>
                    <th className="pb-xs">Timestamp</th>
                    <th className="pb-xs">Status</th>
                    <th className="pb-xs">Message ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft/40">
                  {emailStatus.testEmailLogs.map((log: any) => (
                    <tr key={log._id} className="text-ink">
                      <td className="py-sm font-mono">{log.recipient}</td>
                      <td className="py-sm">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-sm">
                        <span className={`inline-block px-xs py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'Delivered' || log.status === 'Opened' || log.status === 'Clicked' ? 'bg-success/15 text-success' : 'bg-critical/15 text-critical'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-sm font-mono text-[10px] truncate max-w-[150px]" title={log.messageId}>{log.messageId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </MetaCard>
    </div>
  );
}
