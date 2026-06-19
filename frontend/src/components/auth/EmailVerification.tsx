import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import MetaInput from '../ui/MetaInput';
import MetaButton from '../ui/MetaButton';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(codeParam);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (codeParam && emailParam) {
      const autoVerify = async () => {
        setIsLoading(true);
        setError(null);
        try {
          await api.post('/auth/verify-email', { code: codeParam, email: emailParam });
          setSuccess(true);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Verification failed. Try again.');
        } finally {
          setIsLoading(false);
        }
      };
      autoVerify();
    }
  }, [codeParam, emailParam]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Email address is required.');
      return;
    }
    if (code.length < 6) {
      setError('Verification code must be 6 digits.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/verify-email', { code, email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-[480px] bg-surface-soft border border-hairline-soft rounded-2xl p-xl shadow-2xl text-center space-y-lg">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="space-y-sm">
            <h1 className="text-display-sm text-ink-deep font-bold tracking-tight">Email Verified Successfully</h1>
            <p className="text-body-md text-slate">Your account has been activated.</p>
            <p className="text-body-sm text-slate">Continue to Login</p>
          </div>
          <MetaButton
            onClick={() => navigate('/login')}
            variant="primary"
            className="w-full py-md"
          >
            Go To Login
          </MetaButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-section-sm">
          <h1 className="text-display-lg text-ink-deep mb-xs tracking-tight">Verify Your Email</h1>
          <p className="text-subtitle-md text-slate">Enter the email address and 6-digit code to activate your account.</p>
        </div>

        {error && (
          <div className="bg-critical/10 border border-critical-strong text-critical-strong px-md py-sm rounded-lg mb-xl text-body-sm-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-md">
          <MetaInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            disabled={isLoading}
            required
          />

          <MetaInput
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6-digit verification code"
            className="text-center tracking-widest text-heading-md font-mono"
            disabled={isLoading}
            maxLength={6}
            required
          />

          <MetaButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full mt-lg"
            disabled={code.length !== 6 || isLoading}
          >
            Verify Account
          </MetaButton>
        </form>
      </div>
    </div>
  );
}
