import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import MetaButton from '../ui/MetaButton';
import MetaInput from '../ui/MetaInput';

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', data);
      localStorage.setItem('token', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-[480px]">
        
        <div className="text-center mb-section-sm">
          <h1 className="text-display-lg text-ink-deep mb-xs tracking-tight">Create Account</h1>
          <p className="text-subtitle-md text-slate">Join us to start signing documents</p>
        </div>

        {error && (
          <div className="bg-critical/10 border border-critical-strong text-critical-strong px-md py-sm rounded-lg mb-xl text-body-sm-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-xl">
          <MetaInput
            {...register("name")}
            type="text"
            placeholder="Full Name"
            error={errors.name?.message}
          />

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
            Sign Up
          </MetaButton>
        </form>

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
