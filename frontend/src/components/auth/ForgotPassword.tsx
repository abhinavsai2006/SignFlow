import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import MetaInput from '../ui/MetaInput';
import MetaButton from '../ui/MetaButton';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(response.data.message);
      
      // Auto redirect to reset link preview in dev mode
      if (response.data.resetToken) {
        setTimeout(() => {
          navigate(`/reset-password/${response.data.resetToken}`);
        }, 2500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-section-sm">
          <h1 className="text-display-lg text-ink-deep mb-xs tracking-tight">Recover Password</h1>
          <p className="text-subtitle-md text-slate">Enter your email and we'll send a password recovery token link.</p>
        </div>

        {error && (
          <div className="bg-critical/10 border border-critical-strong text-critical-strong px-md py-sm rounded-lg mb-xl text-body-sm-bold text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-bg/10 border border-success text-success px-md py-sm rounded-lg mb-xl text-body-sm-bold text-center">
            {success} Opening reset template...
          </div>
        )}

        <form onSubmit={handleRequest} className="space-y-xl">
          <MetaInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            disabled={isLoading || !!success}
            required
          />

          <MetaButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
            disabled={!email || !!success}
          >
            Send Link
          </MetaButton>
        </form>

        <p className="mt-section text-center text-body-md text-slate">
          Remember credentials?{' '}
          <Link to="/login" className="text-link-md text-meta-link hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
