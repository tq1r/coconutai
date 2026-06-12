'use client';

import { useState, type FormEvent } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { AuthInput, AuthButton } from '@/components/AuthForm';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(''); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Request failed'); return; }
      setMessage(data.message || 'Check your inbox for reset instructions.');
    } catch {
      setError('Connection error. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email and we'll send you recovery instructions" footerText="Remember your password?" footerLink={{ text: 'Sign in', href: '/auth/login' }}>
      <form onSubmit={handleSubmit}>
        <AuthInput label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        {message && <p className="text-sm mb-3" style={{ color: 'var(--accent)' }}>{message}</p>}
        {error && <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>{error}</p>}
        <AuthButton isLoading={loading}>Send Reset Link</AuthButton>
      </form>
    </AuthLayout>
  );
}
