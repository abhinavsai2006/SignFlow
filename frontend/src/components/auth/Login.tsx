import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import MetaButton from '../ui/MetaButton';
import MetaInput from '../ui/MetaInput';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

import { useEffect } from 'react';

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
      Promise.resolve().then(() => setError(decodeURIComponent(errorParam)));
    }
  }, [navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', data);
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-xl">
          <MetaInput
            {...register("email")}
            type="email"
            placeholder="Email address"
            error={errors.email?.message}
          />

          <MetaInput
            {...register("password")}
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

        <div className="mt-xl grid grid-cols-2 gap-md pt-md border-t border-hairline-soft">
          <MetaButton
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || ''}/auth/google`}
            variant="secondary"
            className="w-full flex items-center justify-center font-bold"
          >
            Sign in with Google
          </MetaButton>
          <MetaButton
            onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || ''}/auth/github`}
            variant="secondary"
            className="w-full flex items-center justify-center font-bold"
          >
            Sign in with GitHub
          </MetaButton>
        </div>

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
