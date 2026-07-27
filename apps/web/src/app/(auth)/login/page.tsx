'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthLayout } from '@/components/layout/auth-layout';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FullPageLoader } from '@/components/shared/loading-state';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api-client';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await authService.login(data);
      login(res.data.token, {
        ...res.data.user,
        company: res.data.company,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isAuthenticated) {
    return <FullPageLoader />;
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your company workspace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <Link
          href="/forgot-password"
          className="mb-3 inline-block text-brand hover:text-brand-accent hover:underline"
        >
          Forgot password?
        </Link>
        <p className="text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-brand hover:text-brand-accent hover:underline">
            Register your company
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
