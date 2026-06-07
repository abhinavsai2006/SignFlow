import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import MetaButton from '../ui/MetaButton';
import MetaInput from '../ui/MetaInput';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type Step = 'register' | 'check-email';

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>('register');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/register', data);
      setRegisteredEmail(data.email);
      setStep('check-email');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/resend-verification', { email: registeredEmail });
      setError('A new verification email link has been sent.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'check-email') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
        <div className="w-full max-w-[480px] bg-surface-soft border border-hairline-soft rounded-2xl p-xl shadow-2xl text-center space-y-lg">
          <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              <rect x="2" y="4" width="20" height="16" rx="2" />
            </svg>
          </div>
          <div className="space-y-sm">
            <h1 className="text-display-sm text-ink-deep font-bold tracking-tight">Verify your email</h1>
            <p className="text-body-md text-slate">
              We have sent a verification link to:<br />
              <span className="text-ink-deep font-bold">{registeredEmail}</span>
            </p>
            <p className="text-body-xs text-slate-500">
              Please click the link in the email to activate your account. Once verified, you can sign in to your dashboard.
            </p>
          </div>

          {error && (
            <div className={`border px-md py-sm rounded-lg text-body-xs font-bold text-center ${
              error.includes('sent') || error.includes('resent') || error.includes('link')
                ? 'bg-success/15 border-success text-success'
                : 'bg-critical/15 border-critical text-critical'
            }`}>
              {error}
            </div>
          )}

          <div className="space-y-sm pt-md border-t border-hairline-soft">
            <MetaButton
              onClick={handleResendEmail}
              disabled={isLoading}
              variant="secondary"
              className="w-full py-md"
            >
              {isLoading ? 'Sending...' : 'Resend Verification Link'}
            </MetaButton>

            <button
              onClick={() => { setStep('register'); setError(null); }}
              className="text-body-sm text-slate hover:text-ink-deep transition-colors w-full text-center mt-2 cursor-pointer"
            >
              ← Back to registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-[480px]">

        <div className="text-center mb-section-sm">
          <h1 className="text-display-lg text-ink-deep mb-xs tracking-tight">Create Account</h1>
          <p className="text-subtitle-md text-slate">Join SignFlow — start signing documents</p>
        </div>

        {error && (
          <div className="bg-critical/10 border border-critical-strong text-critical-strong px-md py-sm rounded-lg mb-xl text-body-sm-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
          <MetaInput
            {...register('name')}
            type="text"
            placeholder="Full Name"
            error={errors.name?.message}
          />

          <MetaInput
            {...register('email')}
            type="email"
            placeholder="Email address"
            error={errors.email?.message}
          />

          <MetaInput
            {...register('password')}
            type="password"
            placeholder="Password (min. 6 characters)"
            error={errors.password?.message}
          />

          <MetaButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            className="w-full"
          >
            Create Account
          </MetaButton>
        </form>

        <div className="mt-xl pt-md border-t border-hairline-soft">
          <MetaButton
            onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL || ''}/auth/google`; }}
            variant="secondary"
            className="w-full flex items-center justify-center gap-sm font-bold"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </MetaButton>
        </div>

        <p className="mt-section text-center text-body-md text-slate">
          Already have an account?{' '}
          <Link to="/login" className="text-link-md text-meta-link hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
