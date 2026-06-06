import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import MetaInput from '../ui/MetaInput';
import MetaButton from '../ui/MetaButton';

export default function EmailVerification() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Verification code must be 6 digits.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/verify-email', { code });
      setSuccess(response.data.message);
      
      // Update local storage verification status
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.isVerified = true;
      localStorage.setItem('user', JSON.stringify(user));

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-section-sm">
          <h1 className="text-display-lg text-ink-deep mb-xs tracking-tight">Verify Your Email</h1>
          <p className="text-subtitle-md text-slate">Enter the 6-digit code sent to your email to activate your account.</p>
        </div>

        {error && (
          <div className="bg-critical/10 border border-critical-strong text-critical-strong px-md py-sm rounded-lg mb-xl text-body-sm-bold text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-bg/10 border border-success text-success px-md py-sm rounded-lg mb-xl text-body-sm-bold text-center">
            {success} Redirecting...
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-xl">
          <MetaInput
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit verification code"
            className="text-center tracking-widest text-heading-md"
            disabled={isLoading || !!success}
          />

          <MetaButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
            disabled={code.length !== 6 || !!success}
          >
            Verify Account
          </MetaButton>
        </form>
      </div>
    </div>
  );
}
