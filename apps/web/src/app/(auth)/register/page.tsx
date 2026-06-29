'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { AuthLayout } from '@/components/layout/auth-layout';
import { FormField } from '@/components/forms/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth.service';
import { getErrorMessage } from '@/lib/api-client';

const schema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await authService.register(data);
      login(res.data.token, res.data.user);
      router.push('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      title="Register your company"
      subtitle="Create your workspace and become the company admin"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Company Name" error={errors.companyName?.message}>
          <Input placeholder="Acme Corporation" {...register('companyName')} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" error={errors.firstName?.message}>
            <Input {...register('firstName')} />
          </FormField>
          <FormField label="Last Name" error={errors.lastName?.message}>
            <Input {...register('lastName')} />
          </FormField>
        </div>
        <FormField label="Work Email" error={errors.email?.message}>
          <Input type="email" placeholder="admin@company.com" {...register('email')} />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <PasswordInput placeholder="Min. 8 characters" {...register('password')} />
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Company'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-brand hover:text-brand-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
