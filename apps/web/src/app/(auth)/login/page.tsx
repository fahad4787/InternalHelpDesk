'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/auth-layout';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api-client';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
  companySlug: z.string().min(1, 'Company slug is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await authService.login(data);
      login(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your company workspace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Company Slug" error={errors.companySlug?.message}>
          <Input placeholder="acme-corp" {...register('companySlug')} />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="you@company.com" {...register('email')} />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <Input type="password" placeholder="••••••••" {...register('password')} />
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      <div className="mt-6 space-y-2 text-center text-sm">
        <Link href="/forgot-password" className="text-brand hover:text-brand-accent hover:underline">
          Forgot password?
        </Link>
        <p className="text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand hover:text-brand-accent hover:underline">
            Register your company
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
