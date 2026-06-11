'use client';

import { useState, type FormEvent } from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import { AuthInput, AuthButton } from '@/components/AuthForm';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    // Simulate password reset
    await new Promise((r) => setTimeout(r, 1000));
    setMessage('If that email exists, you\'ll receive reset instructions.');
    setLoading(false);
  };

  return (
    <AuthLayout title="Reset Password" subtitle="We'll send you recovery instructions" footerText="Remember your password?" footerLink={{ text: 'Sign in', href: '/auth/login' }}>
      <form onSubmit={handleSubmit}>
        <AuthInput label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        {message && <p className="text-green-400 text-xs mb-3">{message}</p>}
        <AuthButton isLoading={loading}>Send Reset Link</AuthButton>
      </form>
    </AuthLayout>
  );
}
