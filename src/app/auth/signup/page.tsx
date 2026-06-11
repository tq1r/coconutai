'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { AuthInput, AuthButton, AuthDivider, OAuthButton } from '@/components/AuthForm';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '', username: '', display_name: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.username) newErrors.username = 'Username is required';
    if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!formData.display_name) newErrors.display_name = 'Display name is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email, password: formData.password,
          username: formData.username, display_name: formData.display_name,
        }),
      });
      const data = await response.json();
      if (!response.ok) { setErrors({ general: data.error || 'Signup failed' }); return; }
      router.push('/dashboard');
    } catch {
      setErrors({ general: 'An unexpected error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the Coconut AI creator ecosystem"
      footerText="Already have an account?"
      footerLink={{ text: 'Sign in', href: '/auth/login' }}
    >
      <form onSubmit={handleSignup} className="space-y-4">
        <AuthInput label="Email" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email} />
        <AuthInput label="Username" type="text" placeholder="your_username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} error={errors.username} />
        <AuthInput label="Display Name" type="text" placeholder="Your Name" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} error={errors.display_name} />
        <AuthInput label="Password" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} error={errors.password} />
        <AuthInput label="Confirm Password" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} error={errors.confirmPassword} />
        {errors.general && <div className="text-rose-400 text-sm p-3 bg-rose-950/20 rounded-lg">{errors.general}</div>}
        <AuthButton type="submit" isLoading={isLoading}>Create Account</AuthButton>
      </form>
    </AuthLayout>
  );
}
