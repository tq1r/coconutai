'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { AuthInput, AuthButton } from '@/components/AuthForm';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); return; }
      router.push('/dashboard');
    } catch { setError('Connection error'); } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Start building with AI-powered Roblox tools" footerText="Already have an account?" footerLink={{ text: 'Sign in', href: '/auth/login' }}>
      <form onSubmit={handleSubmit}>
        <AuthInput label="Username" type="text" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <AuthInput label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthInput label="Password" type="password" placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-rose-400 text-xs mb-3">{error}</p>}
        <AuthButton isLoading={loading}>Create Account</AuthButton>
      </form>
    </AuthLayout>
  );
}
