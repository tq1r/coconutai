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
    setError('');
    setLoading(true);
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
    <AuthLayout title="Sign In" subtitle="Welcome back to Coconut AI" footerText="Don't have an account?" footerLink={{ text: 'Sign up', href: '/auth/signup' }}>
      <form onSubmit={handleSubmit}>
        <AuthInput label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthInput label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-rose-400 text-xs mb-3">{error}</p>}
        <AuthButton isLoading={loading}>Sign In</AuthButton>
        <div className="mt-3 text-center">
          <Link href="/auth/reset-password" className="text-xs text-sand-400 hover:text-cyan-400 no-underline">Forgot password?</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
