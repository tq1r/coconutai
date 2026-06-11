'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/AuthLayout';
import { AuthInput, AuthButton } from '@/components/AuthForm';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();

      if (!response.ok) {
        setStatus(result.error || 'Unable to send reset instructions.');
        return;
      }

      setStatus('Check your email for password reset instructions.');
    } catch (error) {
      setStatus('An unexpected error occurred.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive a reset link"
      footerText="Remembered your password?"
      footerLink={{ text: 'Sign in', href: '/auth/login' }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {status && (
          <p className="text-sm text-neutral-300 bg-neutral-950/20 p-3 rounded-lg">{status}</p>
        )}

        <AuthButton type="submit" isLoading={isLoading}>
          Send Reset Instructions
        </AuthButton>
      </form>
    </AuthLayout>
  );
}
