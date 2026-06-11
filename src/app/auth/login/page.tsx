'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/AuthLayout';
import { AuthInput, AuthButton } from '@/components/AuthForm';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Redirect to dashboard on successful login
      router.push('/dashboard');
    } catch (err: any) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your Coconut AI workspace"
      footerText="Don't have an account?"
      footerLink={{ text: 'Sign up', href: '/auth/signup' }}
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error && !error.includes('password') ? error : ''}
        />

        <AuthInput
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="text-error text-sm p-3 bg-error/10 rounded-lg">{error}</div>}

        <AuthButton type="submit" isLoading={isLoading}>
          Sign In
        </AuthButton>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/auth/reset-password"
          className="text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors"
        >
          Forgot password?
        </Link>
      </div>
    </AuthLayout>
  );
}
