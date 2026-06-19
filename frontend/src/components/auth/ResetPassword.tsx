import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import MetaInput from '../ui/MetaInput';
import MetaButton from '../ui/MetaButton';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(response.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset password link invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-section-sm">
          <h1 className="text-display-lg text-ink-deep mb-xs tracking-tight">Reset Password</h1>
          <p className="text-subtitle-md text-slate">Enter your new secure password credential below.</p>
        </div>

        {error && (
          <div className="bg-critical/10 border border-critical-strong text-critical-strong px-md py-sm rounded-lg mb-xl text-body-sm-bold text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-bg/10 border border-success text-success px-md py-sm rounded-lg mb-xl text-body-sm-bold text-center">
            {success} Redirecting to login...
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-xl">
          <MetaInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New secure password"
            disabled={isLoading || !!success}
            required
          />

          <MetaInput
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            disabled={isLoading || !!success}
            required
          />

          <MetaButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
            disabled={!password || !confirmPassword || !!success}
          >
            Save Password
          </MetaButton>
        </form>
      </div>
    </div>
  );
}
