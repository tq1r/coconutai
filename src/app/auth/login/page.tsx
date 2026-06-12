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
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      router.push('/dashboard');
    } catch { setError('Connection error'); } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your Coconut AI account" footerText="Don't have an account?" footerLink={{ text: 'Sign up', href: '/auth/signup' }}>
      <form onSubmit={handleSubmit}>
        <AuthInput label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthInput label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex items-center justify-between mb-4">
          <Link href="/auth/reset-password" className="text-xs no-underline" style={{ color: 'var(--text-muted)' }}>Forgot password?</Link>
        </div>
        {error && <p className="text-coral-500 text-sm mb-3">{error}</p>}
        <AuthButton isLoading={loading}>Sign In</AuthButton>
      </form>
    </AuthLayout>
  );
}
