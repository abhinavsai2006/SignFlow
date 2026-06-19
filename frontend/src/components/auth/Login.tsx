import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import MetaButton from '../ui/MetaButton';
import MetaInput from '../ui/MetaInput';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [otp, setOtp] = useState('');

  // Handle Google OAuth callback (token passed via URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const user = params.get('user');
    const errorParam = params.get('error');

    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', decodeURIComponent(user));
      navigate('/dashboard');
    } else if (errorParam) {
      setTimeout(() => {
        setError(decodeURIComponent(errorParam));
      }, 0);
    }
  }, [navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', data);

      if (response.data.requiresOtp) {
        setRequiresOtp(true);
        setTempEmail(data.email);
        setIsLoading(false);
        return;
      }

      // Direct login success (no OTP required)
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify({
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        isVerified: response.data.isVerified,
      }));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/verify-login-otp', { email: tempEmail, otp });
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify({
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        isVerified: response.data.isVerified,
      }));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid verification code');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-[480px]">

        <div className="text-center mb-section-sm">
          <h1 className="text-display-lg text-ink-deep mb-xs tracking-tight">Welcome Back</h1>
          <p className="text-subtitle-md text-slate">Sign in to access your documents</p>
        </div>

        {error && (
          <div className="bg-critical/10 border border-critical-strong text-critical-strong px-md py-sm rounded-lg mb-xl text-body-sm-bold text-center">
            {error}
          </div>
        )}

        {!requiresOtp ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-md">
            <MetaInput
              {...register('email')}
              type="email"
              placeholder="name@company.com"
              error={errors.email?.message}
            />

            <MetaInput
              {...register('password')}
              type="password"
              placeholder="Password"
              error={errors.password?.message}
            />

            <MetaButton
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full"
            >
              Sign In
            </MetaButton>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-md">
            <div className="text-center mb-md">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <p className="text-body-md text-ink-deep font-medium">Check your email</p>
              <p className="text-body-sm text-slate mt-xs">
                We sent a 6-digit code to <span className="text-ink-deep font-semibold">{tempEmail}</span>
              </p>
            </div>
            <MetaInput
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="text-center text-heading-lg tracking-widest font-mono"
            />
            <MetaButton
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full"
            >
              Verify & Sign In
            </MetaButton>
            <button
              type="button"
              onClick={() => { setRequiresOtp(false); setOtp(''); setError(null); }}
              className="w-full text-center text-body-sm text-slate hover:text-ink-deep transition-colors"
            >
              ← Back to sign in
            </button>
          </form>
        )}

        {!requiresOtp && (
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
        )}

        <p className="mt-xl text-center text-body-md text-slate">
          <Link to="/forgot-password" className="text-meta-link hover:underline">
            Forgot password?
          </Link>
        </p>

        <p className="mt-md text-center text-body-md text-slate">
          Don't have an account?{' '}
          <Link to="/register" className="text-link-md text-meta-link hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
